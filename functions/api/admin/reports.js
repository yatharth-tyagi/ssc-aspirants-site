// Admin: questions reported by students. (The middleware already checked the admin login.)
import { json, sameOrigin } from "../../_lib/auth.js";
const make = DB => DB.prepare("CREATE TABLE IF NOT EXISTS reports (id INTEGER PRIMARY KEY AUTOINCREMENT, test TEXT NOT NULL, q INTEGER NOT NULL, why TEXT, text TEXT, user INTEGER, created INTEGER NOT NULL)").run();

export async function onRequestGet({ env }) {
  await make(env.DB);
  const rows = (await env.DB.prepare("SELECT r.*, u.name AS uname, u.email AS uemail FROM reports r LEFT JOIN users u ON u.id = r.user ORDER BY r.created DESC LIMIT 300").all()).results || [];
  return json({ reports: rows.map(r => ({ id: r.id, test: r.test, q: r.q, why: r.why, text: r.text, created: r.created, by: r.uname ? `${r.uname} (${r.uemail})` : "" })) });
}
export async function onRequestPost({ request, env }) {
  if (!sameOrigin(request)) return json({ error: "Bad request" }, 403);
  let b; try { b = await request.json(); } catch (e) { return json({ error: "Bad request" }, 400); }
  await make(env.DB);
  if (b.action === "delete") { await env.DB.prepare("DELETE FROM reports WHERE id = ?1").bind(Number(b.id) || 0).run(); return json({ ok: true }); }
  return json({ error: "Bad request" }, 400);
}
