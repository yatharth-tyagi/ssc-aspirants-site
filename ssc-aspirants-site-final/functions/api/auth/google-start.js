// "Continue with Google" – sends the student to Google's sign-in page.
import { json, randomHex, cookie, safeNext } from "../../_lib/auth.js";
export async function onRequestGet({ request, env }) {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) return json({ error: "Google sign-in isn't set up yet." }, 503);
  const url = new URL(request.url);
  const state = randomHex(16);
  const next = safeNext(url.searchParams.get("next") || "/");
  const g = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  g.search = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID, redirect_uri: url.origin + "/api/auth/google-callback",
    response_type: "code", scope: "openid email profile", state, prompt: "select_account"
  }).toString();
  return new Response(null, { status: 302, headers: { Location: g.toString(), "Set-Cookie": cookie("gstate", state + "|" + next, 600), "Cache-Control": "no-store" } });
}
