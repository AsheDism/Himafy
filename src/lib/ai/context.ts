import { createClient } from "@/lib/supabase/server";
import { listEvents } from "@/lib/calendar/google-calendar";
import { calculateFreeSlots } from "@/lib/calendar/free-time";
import { refreshAccessToken } from "@/lib/calendar/google-auth";
import type { FreeSlot, FeedbackContext } from "./provider";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

async function getValidAccessToken(
  supabase: SupabaseClient,
  userId: string
): Promise<string | null> {
  const { data: token } = await supabase
    .from("calendar_tokens")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!token) return null;

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

export async function fetchFreeSlots(
  supabase: SupabaseClient,
  userId: string
): Promise<FreeSlot[]> {
  try {
    const accessToken = await getValidAccessToken(supabase, userId);
    if (!accessToken) return [];

    const now = new Date();
    const dayEnd = new Date(now);
    dayEnd.setHours(23, 59, 59, 999);

    const events = await listEvents(
      accessToken,
      now.toISOString(),
      dayEnd.toISOString()
    );

    const slots = calculateFreeSlots(events, now);
    return slots.map((s) => ({
      start: s.start.toISOString(),
      end: s.end.toISOString(),
      durationMin: Math.round(
        (s.end.getTime() - s.start.getTime()) / (1000 * 60)
      ),
    }));
  } catch {
    return [];
  }
}

export async function fetchFeedbackContext(
  supabase: SupabaseClient,
  userId: string
): Promise<FeedbackContext> {
  const { data: feedbacks } = await supabase
    .from("feedback")
    .select("satisfaction, suggestions(title)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (!feedbacks || feedbacks.length === 0) {
    return { highRated: [], lowRated: [], avgSatisfaction: null, totalFeedbacks: 0 };
  }

  const highRated: string[] = [];
  const lowRated: string[] = [];
  let sum = 0;

  for (const fb of feedbacks) {
    sum += fb.satisfaction;
    const suggestion = fb.suggestions as unknown as { title: string } | null;
    const title = suggestion?.title;
    if (!title) continue;
    if (fb.satisfaction >= 4) highRated.push(title);
    else if (fb.satisfaction <= 2) lowRated.push(title);
  }

  return {
    highRated: highRated.slice(0, 5),
    lowRated: lowRated.slice(0, 5),
    avgSatisfaction: sum / feedbacks.length,
    totalFeedbacks: feedbacks.length,
  };
}
