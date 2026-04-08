import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const GOOGLE_GMAIL_COMPOSE_SCOPE = "https://www.googleapis.com/auth/gmail.compose";
const GMAIL_OAUTH_STATE_COOKIE = "doctor_gmail_oauth_state";

export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.redirect(
      new URL("/dashboard/doctor/application-email?gmail=error", request.url)
    );
  }

  const redirectUri = new URL("/dashboard/doctor/gmail/callback", request.url).toString();
  const state = crypto.randomUUID();
  const cookieStore = await cookies();

  cookieStore.set({
    name: GMAIL_OAUTH_STATE_COOKIE,
    value: state,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10
  });

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", GOOGLE_GMAIL_COMPOSE_SCOPE);
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "consent");
  authUrl.searchParams.set("include_granted_scopes", "true");
  authUrl.searchParams.set("state", state);

  return NextResponse.redirect(authUrl);
}
