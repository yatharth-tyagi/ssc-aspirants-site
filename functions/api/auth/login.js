// Student login with email and password. After 8 wrong tries, that email waits 15 minutes.
import { json, ensureTables, hashPassword, same, startSession, publicUser, cleanEmail, sameOrigin, tooMany, addFail, clearFails } from "../../_lib/auth.js";

export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ error: "Login isn't set up yet." }, 503);
  if (!sameOrigin(request)) return json({ error: "Bad request" }, 403);
  let b; try { b = await request.json(); } catch (e) { return json({ error: "Bad request" }, 400); }
  const email = cleanEmail(b.email), password = String(b.password || "");
  if (!email || !password) return json({ error: "Enter your email and password." }, 400);

  await ensureTables(env.DB);
  if (await tooMany(env, email)) return json({ error: "Too many wrong tries. Please wait 15 minutes and try again." }, 429);
  const u = await env.DB.prepare("SELECT * FROM users WHERE email = ?1").bind(email).first();
  let ok = false;
  if (u && u.pass) ok = same((await hashPassword(password, u.salt)).hash, u.pass);
  else await hashPassword(password); // same time whether or not the email exists
  if (!ok) {
    await addFail(env, email);
    if (u && !u.pass) return json({ error: "This email signs in with Google. Use \"Continue with Google\"." }, 401);
    return json({ error: "Wrong email or password." }, 401);
  }
  await clearFails(env, email);
  const set = await startSession(env, u.id);
  return json({ user: publicUser(u) }, 200, { "Set-Cookie": set });
}
