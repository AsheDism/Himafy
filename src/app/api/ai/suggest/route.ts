import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { suggestionRequestSchema } from "@/lib/validators/suggestion";
import { generateWithFallback } from "@/lib/ai/factory";
import { getImageUrls } from "@/lib/utils/unsplash";
import { fetchFreeSlots, fetchFeedbackContext } from "@/lib/ai/context";

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
  const parsed = suggestionRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  // Fetch user tags, free slots, and feedback in parallel
  const [userTagsResult, freeSlots, feedbackContext] = await Promise.all([
    supabase
      .from("user_tags")
      .select("tags(slug, display_name)")
      .eq("user_id", user.id),
    fetchFreeSlots(supabase, user.id),
    fetchFeedbackContext(supabase, user.id),
  ]);

  const tagNames = (userTagsResult.data || [])
    .map((ut) => {
      const tag = ut.tags as unknown as { slug: string; display_name: string } | null;
      return tag?.display_name;
    })
    .filter(Boolean) as string[];

  // Generate suggestions via AI
  let result;
  try {
    result = await generateWithFallback({
      categorySlug: parsed.data.categorySlug,
      userTags: tagNames,
      count: parsed.data.count,
      freeSlots: freeSlots.length > 0 ? freeSlots : undefined,
      feedbackContext: feedbackContext.totalFeedbacks > 0 ? feedbackContext : undefined,
    });
  } catch (error) {
    console.error("AI generation failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "AI提案の生成に失敗しました" },
      { status: 500 }
    );
  }

  if (!result.suggestions || result.suggestions.length === 0) {
    return NextResponse.json(
      { error: "提案を生成できませんでした。もう一度お試しください。" },
      { status: 500 }
    );
  }

  // Create session
  const { data: session, error: sessionError } = await supabase
    .from("suggestion_sessions")
    .insert({
      user_id: user.id,
      category_slug: parsed.data.categorySlug,
      target_time_start: parsed.data.targetTimeStart ?? null,
      target_time_end: parsed.data.targetTimeEnd ?? null,
    })
    .select()
    .single();

  if (sessionError || !session) {
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }

  // Fetch images for suggestions (with category fallback)
  const imageUrls = await getImageUrls(
    result.suggestions.map((s) => s.imageSearchQuery),
    parsed.data.categorySlug
  );

  // Save suggestions
  const rows = result.suggestions.map((s, i) => ({
    session_id: session.id,
    attempt_number: 1,
    title: s.title,
    description: s.description,
    estimated_duration_min: s.estimatedDurationMin,
    location: s.location,
    address: s.address,
    nearest_station: s.nearestStation,
    image_url: imageUrls[i],
    budget_min: s.budgetMin,
    budget_max: s.budgetMax,
    ai_provider: result.provider,
    ai_model: result.model,
    ai_raw_response: JSON.parse(JSON.stringify(s)),
  }));

  const { data: suggestions, error: sugError } = await supabase
    .from("suggestions")
    .insert(rows)
    .select();

  if (sugError) {
    return NextResponse.json({ error: sugError.message }, { status: 500 });
  }

  return NextResponse.json({
    data: {
      session,
      suggestions,
    },
  });
}
