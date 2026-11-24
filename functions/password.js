// Change or set your password (Google users can add one too).
import { json, currentUser, hashPassword, same, sameOrigin } from "../../_lib/auth.js";
export async function onRequestPost({ request, env }) {
  if (!sameOrigin(request)) return json({ error: "Bad request" }, 403);
  const u = await currentUser(request, env);
  if (!u) return json({ error: "Please log in" }, 401);
  let b; try { b = await request.json(); } catch (e) { return json({ error: "Bad request" }, 400); }
  const cur = String(b.current || ""), pw = String(b.password || "");
  if (u.pass && !same((await hashPassword(cur.slice(0, 128), u.salt)).hash, u.pass)) return json({ error: "Your current password is wrong." }, 401);
  if (pw.length < 8 || pw.length > 128) return json({ error: "New password must be at least 8 characters." }, 400);
  const { salt, hash } = await hashPassword(pw);
  await env.DB.prepare("UPDATE users SET pass = ?2, salt = ?3 WHERE id = ?1").bind(u.id, hash, salt).run();
  return json({ ok: true });
}
