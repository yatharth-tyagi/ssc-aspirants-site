// Forgot password, step 1: email a 6-digit code (valid 10 minutes).
// Needs RESEND_API_KEY in Cloudflare (free Resend account, 100 emails a day).
// The answer is always the same, so nobody can find out which emails have accounts.
import { json, ensureTables, cleanEmail, okEmail, sameOrigin, sha256 } from "../../_lib/auth.js";

export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ error: "Login isn't set up yet." }, 503);
  if (!env.RESEND_API_KEY) return json({ error: "Forgot password isn't switched on yet. Please message us on Instagram." }, 503);
  if (!sameOrigin(request)) return json({ error: "Bad request" }, 403);
  let b; try { b = await request.json(); } catch (e) { return json({ error: "Bad request" }, 400); }
  const email = cleanEmail(b.email);
  if (!okEmail(email)) return json({ error: "Please enter a valid email address." }, 400);
  await ensureTables(env.DB);
  await env.DB.prepare("CREATE TABLE IF NOT EXISTS resets (email TEXT PRIMARY KEY, code TEXT NOT NULL, expires INTEGER NOT NULL, tries INTEGER NOT NULL DEFAULT 0, sent INTEGER NOT NULL DEFAULT 0, first INTEGER NOT NULL)").run();
  const now = Date.now(), done = { ok: true, message: "If this email has an account, a 6-digit code has been sent. Check your inbox and spam folder." };
  const u = await env.DB.prepare("SELECT id, name FROM users WHERE email = ?1").bind(email).first();
  if (!u) return json(done);
  const old = await env.DB.prepare("SELECT * FROM resets WHERE email = ?1").bind(email).first();
  const fresh = !old || now - old.first > 3600e3;
  if (!fresh && old.sent >= 3) return json({ error: "Too many codes asked for. Please wait an hour and try again." }, 429);
  if (old && now - (old.expires - 600e3) < 45e3) return json({ error: "Please wait a minute before asking for another code." }, 429);
  const code = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1000000).padStart(6, "0");
  await env.DB.prepare("INSERT OR REPLACE INTO resets (email, code, expires, tries, sent, first) VALUES (?1, ?2, ?3, 0, ?4, ?5)")
    .bind(email, await sha256(email + ":" + code), now + 600e3, fresh ? 1 : old.sent + 1, fresh ? now : old.first).run();
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST", headers: { Authorization: "Bearer " + env.RESEND_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: env.MAIL_FROM || "SSCAspirants_Official <noreply@sscaspirants-official.in>", to: [email],
      subject: `${code} is your SSCAspirants_Official code`,
      text: `Hi ${u.name},\n\nYour code to reset your password is: ${code}\n\nIt works for 10 minutes. If you didn't ask for this, you can ignore this email.\n\nSSCAspirants_Official`,
      html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #E9E2D2;border-radius:12px"><h2 style="color:#141B38;margin:0 0 12px">SSCAspirants_Official</h2><p>Hi ${String(u.name).replace(/[<>&"]/g, "")},</p><p>Your code to reset your password is:</p><p style="font-size:32px;font-weight:700;letter-spacing:8px;color:#1F3A93;margin:16px 0">${code}</p><p>It works for <b>10 minutes</b>. If you didn't ask for this, you can ignore this email.</p><p style="color:#888;font-size:12px">No excuses. Only selection.</p></div>`
    })
  });
  if (!r.ok) return json({ error: "Could not send the email right now. Please try again later." }, 502);
  return json(done);
}
