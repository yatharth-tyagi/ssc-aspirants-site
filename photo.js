// Student profile photo (shown in the round icon at the top).
// The page shrinks the picture to 256×256 before sending, so it stays small.
import { json, ensureTables, sameOrigin } from "../../_lib/auth.js";
const MAX = 150 * 1024;

export async function onRequestGet({ env, data }) {
  if (!data.user || !data.user.photo) return new Response(null, { status: 404 });
  const bytes = Uint8Array.from(atob(data.user.photo), c => c.charCodeAt(0));
  return new Response(bytes, { headers: { "Content-Type": "image/jpeg", "Cache-Control": "private, max-age=31536000" } });
}

export async function onRequestPost({ request, env, data }) {
  if (!sameOrigin(request)) return json({ error: "Bad request" }, 403);
  if (!data.user) return json({ error: "Please log in as a student." }, 401);
  let b; try { b = await request.json(); } catch (e) { return json({ error: "Bad request" }, 400); }
  const m = /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/.exec(String(b.photo || ""));
  if (!m) return json({ error: "Please choose a picture (JPG or PNG)." }, 400);
  if (m[1].length * 0.75 > MAX) return json({ error: "That picture is too big." }, 400);
  const head = atob(m[1].slice(0, 8));
  if (head.charCodeAt(0) !== 0xFF || head.charCodeAt(1) !== 0xD8) return json({ error: "That file isn't a picture." }, 400);
  await ensureTables(env.DB);
  const v = Date.now();
  await env.DB.prepare("UPDATE users SET photo = ?2, photo_v = ?3 WHERE id = ?1").bind(data.user.id, m[1], v).run();
  return json({ ok: true, photo: v });
}

export async function onRequestDelete({ request, env, data }) {
  if (!sameOrigin(request)) return json({ error: "Bad request" }, 403);
  if (!data.user) return json({ error: "Please log in as a student." }, 401);
  await env.DB.prepare("UPDATE users SET photo = NULL, photo_v = NULL WHERE id = ?1").bind(data.user.id).run();
  return json({ ok: true });
}
