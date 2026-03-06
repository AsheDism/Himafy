import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { generateWithFallback } from "@/lib/ai/factory";
import { getImageUrl } from "@/lib/utils/unsplash";
import { fetchFreeSlots, fetchFeedbackContext } from "@/lib/ai/context";

const requestSchema = z.object({
  sessionId: z.string().uuid(),
  categorySlug: z.string().min(1),
  userTags: z.array(z.string()),
  excludeTitles: z.array(z.string()).default([]),
  index: z.number().int().min(0).max(4),
  variationHint: z.string().optional(),
});

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

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { sessionId, categorySlug, userTags, excludeTitles, index, variationHint } = parsed.data;

  // Fetch free slots and feedback in parallel
  const [freeSlots, feedbackContext] = await Promise.all([
    fetchFreeSlots(supabase, user.id),
    fetchFeedbackContext(supabase, user.id),
  ]);

  // Generate 1 suggestion
  let result;
  try {
    result = await generateWithFallback({
      categorySlug,
      userTags,
      count: 1,
      excludeTitles: excludeTitles.length > 0 ? excludeTitles : undefined,
      freeSlots: freeSlots.length > 0 ? freeSlots : undefined,
      feedbackContext: feedbackContext.totalFeedbacks > 0 ? feedbackContext : undefined,
      variationHint,
    });
  } catch (error) {
    console.error(`AI suggest-one[${index}] failed:`, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "AI提案の生成に失敗しました" },
      { status: 500 }
    );
  }

  const s = result.suggestions[0];
  if (!s) {
    return NextResponse.json(
      { error: "提案を生成できませんでした" },
      { status: 500 }
    );
  }

  // Fetch image
  const imageUrl = await getImageUrl(s.imageSearchQuery);

  // Save to DB
  const { data: suggestion, error: sugError } = await supabase
    .from("suggestions")
    .insert({
      session_id: sessionId,
      attempt_number: 1,
      title: s.title,
      description: s.description,
      estimated_duration_min: s.estimatedDurationMin,
      location: s.location,
      address: s.address,
      nearest_station: s.nearestStation,
      image_url: imageUrl,
      ai_provider: result.provider,
      ai_model: result.model,
      ai_raw_response: JSON.parse(JSON.stringify(s)),
    })
    .select()
    .single();

  if (sugError) {
    return NextResponse.json({ error: sugError.message }, { status: 500 });
  }

  return NextResponse.json({ data: { suggestion, index } });
}
