// ADMIN login (only from /admin-login). Student accounts can't log in here.
// The owner logs in with ADMIN_EMAIL + ADMIN_PASSWORD (both set in Cloudflare).
// Team admins are added by the owner on the Admin team page.
import { json, ensureTables, hashPassword, same, startSession, publicAdmin, cleanEmail, sameOrigin, isOwner, tooMany, addFail, clearFails } from "../../_lib/auth.js";

export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ error: "The database isn't connected yet." }, 503);
  if (!sameOrigin(request)) return json({ error: "Bad request" }, 403);
  let b; try { b = await request.json(); } catch (e) { return json({ error: "Bad request" }, 400); }
  const email = cleanEmail(b.email), password = String(b.password || "");
  if (!email || !password) return json({ error: "Enter your admin email and password." }, 400);

  if (!env.ADMIN_EMAIL) return json({ error: "Cloudflare doesn't have ADMIN_EMAIL yet. Add it as a secret for Production, then Retry deployment." }, 503);
  await ensureTables(env.DB);
  const key = "admin:" + email;
  if (await tooMany(env, key)) return json({ error: "Too many wrong tries. Please wait 15 minutes." }, 429);

  let a = await env.DB.prepare("SELECT * FROM admins WHERE email = ?1").bind(email).first(), ok = false;
  if (isOwner(env, email)) {
    if (!env.ADMIN_PASSWORD) return json({ error: "Add ADMIN_PASSWORD in Cloudflare settings first (manual Step 9.2)." }, 503);
    ok = same(await sha(password.trim()), await sha(String(env.ADMIN_PASSWORD).trim()));
    if (ok && !a) {
      const r = await env.DB.prepare("INSERT INTO admins (email, name, created) VALUES (?1, ?2, ?3)").bind(email, "Owner", Date.now()).run();
      a = { id: r.meta.last_row_id, email, name: "Owner" };
    }
  } else if (a && a.pass) ok = same((await hashPassword(password, a.salt)).hash, a.pass);
  else await hashPassword(password);

  if (!ok) { await addFail(env, key); return json({ error: "Wrong admin email or password." }, 401); }
  await clearFails(env, key);
  const set = await startSession(env, a.id, "admin");
  return json({ admin: publicAdmin(env, a) }, 200, { "Set-Cookie": set });
}
const sha = async s => [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)))].map(b => b.toString(16).padStart(2, "0")).join("");
