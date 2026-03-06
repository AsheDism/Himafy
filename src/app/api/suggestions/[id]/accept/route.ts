import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get the suggestion and verify ownership via session
  const { data: suggestion } = await supabase
    .from("suggestions")
    .select("*, suggestion_sessions!inner(user_id)")
    .eq("id", id)
    .single();

  if (!suggestion) {
    return NextResponse.json({ error: "Suggestion not found" }, { status: 404 });
  }

  const session = suggestion.suggestion_sessions as unknown as { user_id: string };
  if (session.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Mark as selected
  const { error } = await supabase
    .from("suggestions")
    .update({ is_selected: true })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Update session status
  await supabase
    .from("suggestion_sessions")
    .update({ status: "accepted", updated_at: new Date().toISOString() })
    .eq("id", suggestion.session_id);

  return NextResponse.json({ data: { success: true } });
}
