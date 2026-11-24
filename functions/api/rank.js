// Rank calculator.
// GET  /api/rank?url=<SSC answer-key link>  → the answer-key page (only SSC's digialm / ssc.gov.in pages), read in the browser
// GET  /api/rank?exam=cgl&tier=t1           → how many students used the calculator, and my saved entry
// POST /api/rank { exam, tier, score, max, date, shift, cat }  → saves my marks and returns overall / shift / category rank
import { json } from "../_lib/auth.js";
let ready = false;
async function table(DB) {
  if (ready) return;
  await DB.prepare("CREATE TABLE IF NOT EXISTS rankcalc (user INTEGER NOT NULL, exam TEXT NOT NULL, tier TEXT NOT NULL, score REAL NOT NULL, max REAL, cat TEXT, date TEXT, shift TEXT, created INTEGER NOT NULL, PRIMARY KEY (user, exam, tier))").run();
  await DB.prepare("CREATE INDEX IF NOT EXISTS idx_rankcalc ON rankcalc (exam, tier, score)").run();
  ready = true;
}
const okHost = h => /(^|\.)cbexams\.com$/i.test(h) || /(^|\.)digialm\.com$/i.test(h) || /(^|\.)ssc\.gov\.in$/i.test(h) || /(^|\.)ssc\.nic\.in$/i.test(h);
const clean = (v, n) => String(v || "").replace(/[^\w .:/-]/g, "").slice(0, n);
const CATS = ["UR", "OBC", "EWS", "SC", "ST"];

// ---- reading SSC's answer-key page ----
// The server only passes SSC's page through (no reading on the server, so it stays within Cloudflare's free CPU limit).
// The browser reads the page; for new SSC sheets (cbexams.com, one PART per page) it asks for the other PARTs through POST below.
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
async function pass(url, form, cookie) {
  let t; try { t = new URL(url); } catch (e) { return json({ error: "This is not a valid link." }, 400); }
  if (!/^https?:$/.test(t.protocol) || !okHost(t.hostname)) return json({ error: "Please paste the answer-key link from SSC's website (it has cbexams.com or digialm.com in it)." }, 400);
  const h = { "User-Agent": UA, Accept: "text/html,application/xhtml+xml", "Accept-Language": "en-IN,en;q=0.9" };
  if (cookie) h.Cookie = String(cookie).slice(0, 2000);
  if (form) { h["Content-Type"] = "application/x-www-form-urlencoded"; h.Referer = t.toString(); h.Origin = t.origin; }
  let r = null;
  for (let i = 0; i < 2 && !r; i++) { try { r = await fetch(t.toString(), { method: form ? "POST" : "GET", headers: h, body: form || undefined, redirect: "follow" }); } catch (e) { if (i) return json({ error: "Could not reach SSC's website right now. Please try again in a minute, or upload the saved page." }, 502); } }
  if (!r.ok) return json({ error: "SSC's page did not open (" + r.status + "). The link may have expired – open it on SSC's site to check, or upload the saved page." }, 502);
  const sc = r.headers.get("set-cookie") || "";
  return new Response(r.body, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-SSC-Cookie": sc.split(/,(?=\s*[\w.-]+=)/).map(c => c.split(";")[0].trim()).filter(Boolean).join("; ").slice(0, 2000) } });
}

export async function onRequestGet({ request, env, data }) {
  if (!data.user) return json({ error: "Please log in" }, 401);
  const u = new URL(request.url), link = u.searchParams.get("url");
  if (link) return pass(link);
  if (!env.DB) return json({ count: 0 });
  await table(env.DB);
  const exam = clean(u.searchParams.get("exam"), 20), tier = clean(u.searchParams.get("tier"), 10) || "t1";
  const c = await env.DB.prepare("SELECT COUNT(*) AS n FROM rankcalc WHERE exam = ?1 AND tier = ?2").bind(exam, tier).first();
  const mine = await env.DB.prepare("SELECT score, max, cat, date, shift, created FROM rankcalc WHERE user = ?1 AND exam = ?2 AND tier = ?3").bind(data.user.id, exam, tier).first();
  return json({ count: c ? c.n : 0, mine: mine || null });
}

export async function onRequestPost({ request, env, data }) {
  if (!env.DB || !data.user) return json({ error: "Please log in" }, 401);
  let b; try { b = await request.json(); } catch (e) { return json({ error: "Bad request" }, 400); }
  if (b.proxy) return pass(b.proxy.url, String(b.proxy.form || "").slice(0, 4e6), b.proxy.cookie);
  const exam = clean(b.exam, 20), tier = clean(b.tier, 10) || "t1", score = Number(b.score), max = Number(b.max) || null;
  const cat = CATS.includes(b.cat) ? b.cat : "UR", date = clean(b.date, 20), shift = clean(b.shift, 30);
  if (!exam || !isFinite(score) || score < -1000 || score > 2000) return json({ error: "Bad request" }, 400);
  await table(env.DB);
  await env.DB.prepare("INSERT INTO rankcalc (user, exam, tier, score, max, cat, date, shift, created) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9) ON CONFLICT (user, exam, tier) DO UPDATE SET score = ?4, max = ?5, cat = ?6, date = ?7, shift = ?8, created = ?9")
    .bind(data.user.id, exam, tier, score, max, cat, date, shift, Date.now()).run();
  const q = async (extra, args) => env.DB.prepare(`SELECT COUNT(*) AS total, SUM(CASE WHEN score > ?3 THEN 1 ELSE 0 END) AS above, SUM(CASE WHEN score < ?3 THEN 1 ELSE 0 END) AS below FROM rankcalc WHERE exam = ?1 AND tier = ?2 ${extra}`).bind(exam, tier, score, ...args).first();
  const pack = r => ({ rank: (r.above || 0) + 1, total: r.total || 1, percentile: r.total > 1 ? (r.below || 0) / (r.total - 1) * 100 : 100 });
  const all = pack(await q("", [])), cr = pack(await q("AND cat = ?4", [cat]));
  const sh = date ? pack(await q("AND date = ?4 AND shift = ?5", [date, shift])) : null;
  return json({ overall: all, category: cr, shift: sh, cat });
}
