// Saved (bookmarked) questions of the logged-in student – kept in the account, so they show on every device.
// GET  /api/me/saved            → { saved: [{ test, q, created }] }
// GET  /api/me/saved?test=ID    → only that test
// POST /api/me/saved { test, q, on }  → save (on: true) or remove (on: false)
import { json } from "../../_lib/auth.js";
let ready = false;
async function table(DB) {
  if (ready) return;
  await DB.prepare("CREATE TABLE IF NOT EXISTS saved (user INTEGER NOT NULL, test TEXT NOT NULL, q INTEGER NOT NULL, created INTEGER NOT NULL, PRIMARY KEY (user, test, q))").run();
  ready = true;
}
const cleanTest = t => String(t || "").replace(/[^a-z0-9_-]/gi, "").slice(0, 80);
export async function onRequestGet({ request, env, data }) {
  if (!env.DB || !data.user) return json({ error: "Please log in" }, 401);
  try {
    await table(env.DB);
    const test = cleanTest(new URL(request.url).searchParams.get("test"));
    const r = test ? await env.DB.prepare("SELECT test, q, created FROM saved WHERE user = ?1 AND test = ?2 ORDER BY q").bind(data.user.id, test).all()
      : await env.DB.prepare("SELECT test, q, created FROM saved WHERE user = ?1 ORDER BY created DESC LIMIT 3000").bind(data.user.id).all();
    return json({ saved: r.results || [] });
  } catch (e) { return json({ saved: [] }); }
}
export async function onRequestPost({ request, env, data }) {
  if (!env.DB || !data.user) return json({ error: "Please log in" }, 401);
  let b; try { b = await request.json(); } catch (e) { return json({ error: "Bad request" }, 400); }
  const test = cleanTest(b.test), q = Math.floor(Number(b.q));
  if (!test || !(q >= 0 && q < 2000)) return json({ error: "Bad request" }, 400);
  await table(env.DB);
  if (b.on) await env.DB.prepare("INSERT OR IGNORE INTO saved (user, test, q, created) VALUES (?1, ?2, ?3, ?4)").bind(data.user.id, test, q, Date.now()).run();
  else await env.DB.prepare("DELETE FROM saved WHERE user = ?1 AND test = ?2 AND q = ?3").bind(data.user.id, test, q).run();
  return json({ ok: true });
}
