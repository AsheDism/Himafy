import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calendarEventSchema } from "@/lib/validators/calendar";
import { createEvent } from "@/lib/calendar/google-calendar";
import { refreshAccessToken } from "@/lib/calendar/google-auth";

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = calendarEventSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  // Get token
  const { data: token } = await supabase
    .from("calendar_tokens")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!token) {
    return NextResponse.json(
      { error: "Calendar not connected" },
      { status: 400 }
    );
  }

  let accessToken = token.access_token;

  // Refresh if needed
  const expiresAt = new Date(token.expires_at);
  if (expiresAt.getTime() - Date.now() < 10 * 60 * 1000) {
    try {
      const credentials = await refreshAccessToken(token.refresh_token);
      accessToken = credentials.access_token!;
      await supabase
        .from("calendar_tokens")
        .update({
          access_token: accessToken,
          expires_at: credentials.expiry_date
            ? new Date(credentials.expiry_date).toISOString()
            : new Date(Date.now() + 3600 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);
    } catch {
      return NextResponse.json(
        { error: "Token refresh failed" },
        { status: 401 }
      );
    }
  }

  try {
    const event = await createEvent(accessToken, parsed.data);

    // If suggestionId provided, update the suggestion with calendar_event_id
    const suggestionId = body.suggestionId;
    if (suggestionId) {
      await supabase
        .from("suggestions")
        .update({ calendar_event_id: event.id })
        .eq("id", suggestionId);
    }

    return NextResponse.json({ data: { eventId: event.id } });
  } catch {
    return NextResponse.json(
      { error: "Failed to create calendar event" },
      { status: 500 }
    );
  }
}
