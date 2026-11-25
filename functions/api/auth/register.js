// New student account: name, email, password.
import { json, ensureTables, hashPassword, startSession, publicUser, cleanEmail, okEmail, cleanName, sameOrigin } from "../../_lib/auth.js";

export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ error: "Login isn't set up yet." }, 503);
  if (!sameOrigin(request)) return json({ error: "Bad request" }, 403);
  let b; try { b = await request.json(); } catch (e) { return json({ error: "Bad request" }, 400); }
  const name = cleanName(b.name), email = cleanEmail(b.email), password = String(b.password || "");
  if (name.length < 2) return json({ error: "Please enter your name." }, 400);
  if (!okEmail(email)) return json({ error: "Please enter a valid email address." }, 400);
  if (password.length < 8 || password.length > 128) return json({ error: "Password must be at least 8 characters." }, 400);

  await ensureTables(env.DB);
  const old = await env.DB.prepare("SELECT pass, google FROM users WHERE email = ?1").bind(email).first();
  if (old) return json({ error: old.pass ? "An account with this email already exists. Please log in." : "This email signs in with Google. Use \"Continue with Google\"." }, 409);

  const { salt, hash } = await hashPassword(password);
  const r = await env.DB.prepare("INSERT INTO users (email, name, pass, salt, role, created) VALUES (?1, ?2, ?3, ?4, 'student', ?5)")
    .bind(email, name, hash, salt, Date.now()).run();
  const id = r.meta.last_row_id;
  const set = await startSession(env, id);
  return json({ user: publicUser({ id, email, name, pass: hash }) }, 200, { "Set-Cookie": set });
}
