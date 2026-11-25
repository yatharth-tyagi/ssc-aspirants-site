// Notes progress of the logged-in student: which chapters were opened and which are finished.
// GET  /api/me/progress                     → { progress: [{ chapter, done, seen }] }
// POST /api/me/progress { chapter, done? }  → remembers the visit; done: true / false marks the chapter
import { json } from "../../_lib/auth.js";
let ready = false;
async function table(DB) {
  if (ready) return;
  await DB.prepare("CREATE TABLE IF NOT EXISTS progress (user INTEGER NOT NULL, chapter TEXT NOT NULL, done INTEGER NOT NULL DEFAULT 0, seen INTEGER NOT NULL, PRIMARY KEY (user, chapter))").run();
  ready = true;
}
export async function onRequestGet({ env, data }) {
  if (!env.DB || !data.user) return json({ error: "Please log in" }, 401);
  try { await table(env.DB);
    const r = await env.DB.prepare("SELECT chapter, done, seen FROM progress WHERE user = ?1 ORDER BY seen DESC LIMIT 2000").bind(data.user.id).all();
    return json({ progress: r.results || [] });
  } catch (e) { return json({ progress: [] }); }
}
export async function onRequestPost({ request, env, data }) {
  if (!env.DB || !data.user) return json({ error: "Please log in" }, 401);
  let b; try { b = await request.json(); } catch (e) { return json({ error: "Bad request" }, 400); }
  const ch = String(b.chapter || "").replace(/[^a-z0-9_-]/gi, "").slice(0, 80); if (!ch) return json({ error: "Bad request" }, 400);
  await table(env.DB);
  const now = Date.now();
  if (b.done === undefined) await env.DB.prepare("INSERT INTO progress (user, chapter, done, seen) VALUES (?1, ?2, 0, ?3) ON CONFLICT (user, chapter) DO UPDATE SET seen = ?3").bind(data.user.id, ch, now).run();
  else await env.DB.prepare("INSERT INTO progress (user, chapter, done, seen) VALUES (?1, ?2, ?3, ?4) ON CONFLICT (user, chapter) DO UPDATE SET done = ?3, seen = ?4").bind(data.user.id, ch, b.done ? 1 : 0, now).run();
  return json({ ok: true });
}
