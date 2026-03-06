import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { listEvents } from "@/lib/calendar/google-calendar";
import { calculateFreeSlots } from "@/lib/calendar/free-time";
import { refreshAccessToken } from "@/lib/calendar/google-auth";

async function getValidAccessToken(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data: token } = await supabase
    .from("calendar_tokens")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!token) return null;

  // Refresh if expired or expiring within 10 minutes
  const expiresAt = new Date(token.expires_at);
  const needsRefresh = expiresAt.getTime() - Date.now() < 10 * 60 * 1000;

  if (needsRefresh) {
    try {
      const credentials = await refreshAccessToken(token.refresh_token);
      const newExpiresAt = credentials.expiry_date
        ? new Date(credentials.expiry_date).toISOString()
        : new Date(Date.now() + 3600 * 1000).toISOString();

      await supabase
        .from("calendar_tokens")
        .update({
          access_token: credentials.access_token!,
          expires_at: newExpiresAt,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      return credentials.access_token!;
    } catch {
      return null;
    }
  }

  return token.access_token;
}

export async function GET(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get("date"); // YYYY-MM-DD

  const accessToken = await getValidAccessToken(supabase, user.id);
  if (!accessToken) {
    return NextResponse.json(
      { error: "Calendar not connected" },
      { status: 400 }
    );
  }

  // Default to today
  const targetDate = dateParam ? new Date(dateParam + "T00:00:00+09:00") : new Date();

  const dayStart = new Date(targetDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(targetDate);
  dayEnd.setHours(23, 59, 59, 999);

  try {
    const events = await listEvents(
      accessToken,
      dayStart.toISOString(),
      dayEnd.toISOString()
    );

    const freeSlots = calculateFreeSlots(events, targetDate);

    return NextResponse.json({
      data: {
        events: events.map((e) => ({
          id: e.id,
          summary: e.summary,
          start: e.start?.dateTime || e.start?.date,
          end: e.end?.dateTime || e.end?.date,
        })),
        freeSlots: freeSlots.map((s) => ({
          start: s.start.toISOString(),
          end: s.end.toISOString(),
          durationMin: Math.round(
            (s.end.getTime() - s.start.getTime()) / (1000 * 60)
          ),
        })),
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch calendar events" },
      { status: 500 }
    );
  }
}
