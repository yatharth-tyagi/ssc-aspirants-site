// Google sends the student back here. We check it really came from Google, then log them in
// (making a new account the first time).
import { ensureTables, startSession, readCookie, cookie, safeNext, same, cleanName } from "../../_lib/auth.js";

const fail = (origin, msg) => new Response(null, { status: 302, headers: { Location: origin + "/login?error=" + encodeURIComponent(msg), "Set-Cookie": cookie("gstate", "", 0) } });
const b64url = s => atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4));

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url), origin = url.origin;
  if (!env.DB || !env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) return fail(origin, "Google sign-in isn't set up yet.");
  const [state, next] = (readCookie(request, "gstate") || "|").split("|");
  if (!state || !same(state, url.searchParams.get("state") || "")) return fail(origin, "Sign-in took too long. Please try again.");
  const code = url.searchParams.get("code");
  if (!code) return fail(origin, "Google sign-in was cancelled.");

  // swap the code for the student's details, straight from Google
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ code, client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET, redirect_uri: origin + "/api/auth/google-callback", grant_type: "authorization_code" })
  });
  if (!r.ok) return fail(origin, "Google sign-in failed. Please try again.");
  let p;
  try { p = JSON.parse(new TextDecoder().decode(Uint8Array.from(b64url((await r.json()).id_token.split(".")[1]), c => c.charCodeAt(0)))); }
  catch (e) { return fail(origin, "Google sign-in failed. Please try again."); }
  if (p.aud !== env.GOOGLE_CLIENT_ID || !["accounts.google.com", "https://accounts.google.com"].includes(p.iss) || p.exp * 1000 < Date.now() || !p.email || p.email_verified === false)
    return fail(origin, "Google sign-in failed. Please try again.");

  await ensureTables(env.DB);
  const email = String(p.email).toLowerCase();
  let u = await env.DB.prepare("SELECT * FROM users WHERE google = ?1 OR email = ?2 ORDER BY google = ?1 DESC").bind(p.sub, email).first();
  if (u && !u.google) {
    // First Google sign-in for an email that registered with a password. Google has proved who owns
    // this email, but we never checked whoever set that password, so it is removed (and old logins ended).
    // The student can add a new password from My account.
    await env.DB.batch([
      env.DB.prepare("UPDATE users SET google = ?2, pass = NULL, salt = NULL WHERE id = ?1").bind(u.id, p.sub),
      env.DB.prepare("DELETE FROM sessions WHERE user = ?1").bind(u.id)
    ]);
  }
  if (!u) {
    const res = await env.DB.prepare("INSERT INTO users (email, name, google, role, created) VALUES (?1, ?2, ?3, 'student', ?4)")
      .bind(email, cleanName(p.name) || email.split("@")[0], p.sub, Date.now()).run();
    u = { id: res.meta.last_row_id };
  }
  const set = await startSession(env, u.id);
  const h = new Headers({ Location: origin + safeNext(next), "Cache-Control": "no-store" });
  h.append("Set-Cookie", set); h.append("Set-Cookie", cookie("gstate", "", 0));
  return new Response(null, { status: 302, headers: h });
}
