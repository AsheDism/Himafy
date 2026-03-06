import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: categories, error: catError } = await supabase
    .from("tag_categories")
    .select("*")
    .order("display_order");

  if (catError) {
    return NextResponse.json({ error: catError.message }, { status: 500 });
  }

  const { data: tags, error: tagError } = await supabase
    .from("tags")
    .select("*")
    .order("display_name");

  if (tagError) {
    return NextResponse.json({ error: tagError.message }, { status: 500 });
  }

  return NextResponse.json({ data: { categories, tags } });
}
