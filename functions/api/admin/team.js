// Admin team: the owner adds or removes admins and resets their passwords.
// Admin accounts are separate from student accounts.
import { json, ensureTables, publicAdmin, isOwner, hashPassword, sameOrigin, cleanEmail, okEmail, cleanName, tempPassword } from "../../_lib/auth.js";

export async function onRequestGet({ env }) {
  await ensureTables(env.DB);
  const rows = (await env.DB.prepare("SELECT * FROM admins ORDER BY created").all()).results || [];
  if (env.ADMIN_EMAIL && !rows.some(a => isOwner(env, a.email))) rows.unshift({ id: 0, email: String(env.ADMIN_EMAIL).trim().toLowerCase(), name: "Owner", created: 0 });
  return json({ admins: rows.map(a => ({ ...publicAdmin(env, a), created: a.created, last: a.last })) });
}

export async function onRequestPost({ request, env, data }) {
  if (!sameOrigin(request)) return json({ error: "Bad request" }, 403);
  if (!isOwner(env, data.admin.email)) return json({ error: "Only the owner can change the admin team." }, 403);
  await ensureTables(env.DB);
  let b; try { b = await request.json(); } catch (e) { return json({ error: "Bad request" }, 400); }

  if (b.action === "add") {
    const name = cleanName(b.name), email = cleanEmail(b.email);
    if (name.length < 2) return json({ error: "Enter the admin's name." }, 400);
    if (!okEmail(email)) return json({ error: "Enter a valid email." }, 400);
    if (isOwner(env, email)) return json({ error: "That's the owner's email." }, 400);
    if (await env.DB.prepare("SELECT id FROM admins WHERE email = ?1").bind(email).first()) return json({ error: "This person is already an admin." }, 409);
    const temp = tempPassword(), { salt, hash } = await hashPassword(temp);
    await env.DB.prepare("INSERT INTO admins (email, name, pass, salt, created) VALUES (?1, ?2, ?3, ?4, ?5)").bind(email, name, hash, salt, Date.now()).run();
    return json({ ok: true, temp });
  }
  const a = await env.DB.prepare("SELECT * FROM admins WHERE id = ?1").bind(Number(b.id) || 0).first();
  if (!a) return json({ error: "Admin not found" }, 404);
  if (isOwner(env, a.email)) return json({ error: "The owner can't be changed here. Change ADMIN_PASSWORD in Cloudflare." }, 400);
  if (b.action === "remove") {
    await env.DB.batch([env.DB.prepare("DELETE FROM admin_sessions WHERE user = ?1").bind(a.id), env.DB.prepare("DELETE FROM admins WHERE id = ?1").bind(a.id)]);
    return json({ ok: true });
  }
  if (b.action === "reset") {
    const temp = tempPassword(), { salt, hash } = await hashPassword(temp);
    await env.DB.batch([env.DB.prepare("UPDATE admins SET pass = ?2, salt = ?3 WHERE id = ?1").bind(a.id, hash, salt), env.DB.prepare("DELETE FROM admin_sessions WHERE user = ?1").bind(a.id)]);
    return json({ ok: true, temp });
  }
  return json({ error: "Bad request" }, 400);
}
