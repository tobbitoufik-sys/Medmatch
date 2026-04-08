import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const GMAIL_OAUTH_STATE_COOKIE = "doctor_gmail_oauth_state";

type GoogleTokenResponse = {
  access_token?: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
  error?: string;
  error_description?: string;
};

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");
  const cookieStore = await cookies();
  const expectedState = cookieStore.get(GMAIL_OAUTH_STATE_COOKIE)?.value;

  cookieStore.delete(GMAIL_OAUTH_STATE_COOKIE);

  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(
      new URL("/dashboard/doctor/application-email?gmail=error", request.url)
    );
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      new URL("/dashboard/doctor/application-email?gmail=error", request.url)
    );
  }

  const redirectUri = new URL("/dashboard/doctor/gmail/callback", request.url).toString();
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code"
    }).toString()
  });

  const tokenJson = (await tokenResponse.json()) as GoogleTokenResponse;

  if (!tokenResponse.ok || !tokenJson.access_token) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[gmail-oauth] token exchange failed", {
        status: tokenResponse.status,
        body: tokenJson
      });
    }

    return NextResponse.redirect(
      new URL("/dashboard/doctor/application-email?gmail=error", request.url)
    );
  }

  const { data: existingConnection } = await supabase
    .from("doctor_gmail_connections")
    .select("id, refresh_token")
    .eq("doctor_user_id", user.id)
    .maybeSingle();

  const expiresAt =
    typeof tokenJson.expires_in === "number"
      ? new Date(Date.now() + tokenJson.expires_in * 1000).toISOString()
      : null;

  const { error: upsertError } = await supabase.from("doctor_gmail_connections").upsert(
    {
      id: existingConnection?.id,
      doctor_user_id: user.id,
      provider: "google",
      access_token: tokenJson.access_token,
      refresh_token: tokenJson.refresh_token ?? existingConnection?.refresh_token ?? null,
      token_type: tokenJson.token_type ?? null,
      scope: tokenJson.scope ?? null,
      expires_at: expiresAt
    },
    {
      onConflict: "doctor_user_id"
    }
  );

  if (upsertError) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[gmail-oauth] connection persist failed", {
        message: upsertError.message
      });
    }

    return NextResponse.redirect(
      new URL("/dashboard/doctor/application-email?gmail=error", request.url)
    );
  }

  return NextResponse.redirect(
    new URL("/dashboard/doctor/application-email?gmail=connected", request.url)
  );
}
