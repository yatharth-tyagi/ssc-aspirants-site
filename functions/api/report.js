// A student reports a mistake in a question. Admins see these in the admin panel → Reports.
import { json, sameOrigin } from "../_lib/auth.js";

export async function onRequestPost({ request, env, data }) {
  if (!env.DB) return json({ error: "Database not connected yet" }, 503);
  if (!sameOrigin(request)) return json({ error: "Bad request" }, 403);
  let b; try { b = await request.json(); } catch (e) { return json({ error: "Bad request" }, 400); }
  const test = String(b.test || "").replace(/[^a-z0-9_-]/gi, "").slice(0, 80);
  const q = Number(b.q), why = String(b.why || "").slice(0, 60), text = String(b.text || "").trim().slice(0, 600);
  if (!test || !Number.isInteger(q) || q < 0 || q > 500 || (!why && !text)) return json({ error: "Please say what is wrong." }, 400);
  await env.DB.prepare("CREATE TABLE IF NOT EXISTS reports (id INTEGER PRIMARY KEY AUTOINCREMENT, test TEXT NOT NULL, q INTEGER NOT NULL, why TEXT, text TEXT, user INTEGER, created INTEGER NOT NULL)").run();
  const user = data && data.user ? data.user.id : null;
  if (user) {
    const c = await env.DB.prepare("SELECT COUNT(*) AS n FROM reports WHERE user = ?1 AND created > ?2").bind(user, Date.now() - 864e5).first();
    if ((c.n || 0) >= 30) return json({ error: "You have sent many reports today. Please try tomorrow." }, 429);
  }
  await env.DB.prepare("INSERT INTO reports (test, q, why, text, user, created) VALUES (?1, ?2, ?3, ?4, ?5, ?6)").bind(test, q, why, text, user, Date.now()).run();
  return json({ ok: true });
}
