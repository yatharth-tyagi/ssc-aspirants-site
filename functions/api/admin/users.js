// Admin: list students and reset a student's password.
// (The middleware already checked that the person asking is logged in as an admin.)
import { json, ensureTables, publicUser, hashPassword, sameOrigin, tempPassword } from "../../_lib/auth.js";

export async function onRequestGet({ request, env }) {
  await ensureTables(env.DB);
  const q = (new URL(request.url).searchParams.get("q") || "").trim().toLowerCase().slice(0, 60);
  const like = "%" + q.replace(/[%_]/g, "") + "%";
  const rows = (await env.DB.prepare("SELECT * FROM users WHERE (?1 = '' OR lower(email) LIKE ?2 OR lower(name) LIKE ?2) ORDER BY created DESC LIMIT 200").bind(q, like).all()).results || [];
  const c = await env.DB.prepare("SELECT COUNT(*) AS n, SUM(CASE WHEN created > ?1 THEN 1 ELSE 0 END) AS week FROM users").bind(Date.now() - 7 * 864e5).first();
  return json({ total: c.n || 0, week: c.week || 0, users: rows.map(u => ({ ...publicUser(u), created: u.created, last: u.last })) });
}

export async function onRequestPost({ request, env }) {
  if (!sameOrigin(request)) return json({ error: "Bad request" }, 403);
  let b; try { b = await request.json(); } catch (e) { return json({ error: "Bad request" }, 400); }
  const u = await env.DB.prepare("SELECT * FROM users WHERE id = ?1").bind(Number(b.id) || 0).first();
  if (!u) return json({ error: "Student not found" }, 404);
  if (b.action === "reset") {
    const temp = tempPassword(), { salt, hash } = await hashPassword(temp);
    await env.DB.batch([
      env.DB.prepare("UPDATE users SET pass = ?2, salt = ?3 WHERE id = ?1").bind(u.id, hash, salt),
      env.DB.prepare("DELETE FROM sessions WHERE user = ?1").bind(u.id)
    ]);
    return json({ ok: true, temp });
  }
  return json({ error: "Bad request" }, 400);
}
