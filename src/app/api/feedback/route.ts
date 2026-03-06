import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { feedbackSchema } from "@/lib/validators/feedback";

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
  const parsed = feedbackSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("feedback")
    .upsert(
      {
        user_id: user.id,
        suggestion_id: parsed.data.suggestionId,
        satisfaction: parsed.data.satisfaction,
        comment: parsed.data.comment ?? null,
      },
      { onConflict: "user_id,suggestion_id" }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
