import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { suggestionRequestSchema } from "@/lib/validators/suggestion";

/**
 * Creates a session and returns user tags + session ID.
 * The frontend then fires 3 parallel suggest-one calls.
 */
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

  // Fetch user tags and variation hints in parallel
  const [userTagsResult, hintsResult] = await Promise.all([
    supabase
      .from("user_tags")
      .select("tags(slug, display_name)")
      .eq("user_id", user.id),
    supabase
      .from("variation_hints" as never)
      .select("hint") as unknown as Promise<{ data: { hint: string }[] | null }>,
  ]);

  const tagNames = (userTagsResult.data || [])
    .map((ut) => {
      const tag = ut.tags as unknown as { slug: string; display_name: string } | null;
      return tag?.display_name;
    })
    .filter(Boolean) as string[];

  // Pick random hints (shuffle and take count)
  const allHints = (hintsResult.data || []).map((h) => h.hint);
  const count = parsed.data.count;
  const shuffled = allHints.sort(() => Math.random() - 0.5);
  const variationHints = shuffled.slice(0, count);

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

  return NextResponse.json({
    data: {
      session,
      userTags: tagNames,
      variationHints,
    },
  });
}
