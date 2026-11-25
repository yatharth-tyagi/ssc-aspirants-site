// Forgot password, step 2: check the 6-digit code and set the new password (then log in).
// 5 wrong codes and the code stops working.
import { json, ensureTables, cleanEmail, sameOrigin, sha256, same, hashPassword, startSession, publicUser } from "../../_lib/auth.js";

export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ error: "Login isn't set up yet." }, 503);
  if (!sameOrigin(request)) return json({ error: "Bad request" }, 403);
  let b; try { b = await request.json(); } catch (e) { return json({ error: "Bad request" }, 400); }
  const email = cleanEmail(b.email), code = String(b.code || "").replace(/\D/g, ""), pw = String(b.password || "");
  if (code.length !== 6) return json({ error: "Enter the 6-digit code from the email." }, 400);
  if (pw.length < 8 || pw.length > 128) return json({ error: "New password must be at least 8 characters." }, 400);
  await ensureTables(env.DB);
  let row = null;
  try { row = await env.DB.prepare("SELECT * FROM resets WHERE email = ?1").bind(email).first(); } catch (e) {}
  if (!row || row.expires < Date.now() || row.tries >= 5) return json({ error: "This code has expired. Please ask for a new one." }, 400);
  if (!same(await sha256(email + ":" + code), row.code)) {
    await env.DB.prepare("UPDATE resets SET tries = tries + 1 WHERE email = ?1").bind(email).run();
    return json({ error: row.tries + 1 >= 5 ? "Too many wrong codes. Please ask for a new one." : "That code is not right. Please check the email." }, 400);
  }
  const u = await env.DB.prepare("SELECT * FROM users WHERE email = ?1").bind(email).first();
  if (!u) return json({ error: "This code has expired. Please ask for a new one." }, 400);
  const { salt, hash } = await hashPassword(pw);
  await env.DB.batch([
    env.DB.prepare("UPDATE users SET pass = ?2, salt = ?3 WHERE id = ?1").bind(u.id, hash, salt),
    env.DB.prepare("DELETE FROM sessions WHERE user = ?1").bind(u.id),
    env.DB.prepare("DELETE FROM resets WHERE email = ?1").bind(email),
    env.DB.prepare("DELETE FROM fails WHERE email = ?1").bind(email)
  ]);
  const set = await startSession(env, u.id);
  return json({ user: publicUser({ ...u, pass: hash }) }, 200, { "Set-Cookie": set });
}
