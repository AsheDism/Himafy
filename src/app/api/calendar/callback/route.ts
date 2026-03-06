import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { exchangeCode } from "@/lib/calendar/google-auth";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state"); // user_id

  if (!code || !state) {
    return NextResponse.redirect(`${origin}/settings?error=missing_params`);
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.id !== state) {
    return NextResponse.redirect(`${origin}/settings?error=unauthorized`);
  }

  try {
    const tokens = await exchangeCode(code);

    if (!tokens.access_token || !tokens.refresh_token) {
      return NextResponse.redirect(
        `${origin}/settings?error=token_exchange_failed`
      );
    }

    const expiresAt = tokens.expiry_date
      ? new Date(tokens.expiry_date).toISOString()
      : new Date(Date.now() + 3600 * 1000).toISOString();

    await supabase.from("calendar_tokens").upsert(
      {
        user_id: user.id,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_type: tokens.token_type || "Bearer",
        expires_at: expiresAt,
        scope: tokens.scope || "",
      },
      { onConflict: "user_id" }
    );

    return NextResponse.redirect(`${origin}/settings?calendar=connected`);
  } catch {
    return NextResponse.redirect(
      `${origin}/settings?error=calendar_auth_failed`
    );
  }
}
