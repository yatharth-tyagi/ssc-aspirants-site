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
// New SSC sheets (sscexams.cbexams.com …/ViewCandResponse.aspx) are ASP.NET pages that show one PART at a time;
// the other PARTs come from pressing the "Click Here for PART-B" buttons, i.e. posting the form back with its hidden fields.
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const attr = (tag, name) => { const m = new RegExp("\\b" + name + "\\s*=\\s*(\"([^\"]*)\"|'([^']*)'|([^\\s>]+))", "i").exec(tag); return m ? (m[2] ?? m[3] ?? m[4] ?? "") : null; };
const unesc = v => String(v).replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#x27;/g, "'");
async function get(url, cookie, body) {
  const h = { "User-Agent": UA, Accept: "text/html,application/xhtml+xml", "Accept-Language": "en-IN,en;q=0.9" };
  if (cookie) h.Cookie = cookie;
  if (body) { h["Content-Type"] = "application/x-www-form-urlencoded"; h.Referer = url; h.Origin = new URL(url).origin; }
  let r, tries = 0;
  while (true) {
    try { r = await fetch(url, { method: body ? "POST" : "GET", headers: h, body, redirect: "follow" }); if (r.ok || tries >= 1) break; } catch (e) { if (tries >= 1) throw e; }
    tries++; await new Promise(ok => setTimeout(ok, 700));
  }
  if (!r.ok) throw new Error("SSC's page did not open (" + r.status + "). The link may have expired – try uploading the saved page instead.");
  const html = await r.text(); if (html.length > 8e6) throw new Error("SSC's page is too big.");
  const sc = r.headers.get("set-cookie"); const ck = sc ? sc.split(/,(?=\s*[\w.-]+=)/).map(c => c.split(";")[0].trim()).join("; ") : "";
  return { html, cookie: [cookie, ck].filter(Boolean).join("; ") };
}
async function fetchSheet(t) {
  const first = await get(t.toString());
  const html = first.html, pages = [html];
  const form = /<form\b[^>]*>/i.exec(html);
  if (!form || !/PART[\s-]?[A-Z0-9]/i.test(html)) return pages;              // old style page: everything is on one page
  const action = new URL(unesc(attr(form[0], "action") || t.pathname + t.search), t).toString();
  const hidden = [], buttons = [];
  (html.match(/<input\b[^>]*>/gi) || []).forEach(tag => {
    const type = (attr(tag, "type") || "").toLowerCase(), name = attr(tag, "name"), value = unesc(attr(tag, "value") || "");
    if (!name) return;
    if (type === "hidden") hidden.push([name, value]);
    else if (type === "submit" && !/\bdisabled\b/i.test(tag) && /PART[\s-]?[A-Z0-9]+/i.test(value)) buttons.push([name, value]);
  });
  const seen = new Set();
  const todo = buttons.filter(([, v]) => { const k = /PART[\s-]?([A-Z0-9]+)/i.exec(v)[1].toUpperCase(); if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, 8);
  const more = await Promise.all(todo.map(([n, v]) => {
    const body = new URLSearchParams([...hidden, [n, v]]).toString();
    return get(action, first.cookie, body).then(x => x.html).catch(() => null);
  }));
  more.forEach(h => { if (h) pages.push(h); });
  return pages;
}

export async function onRequestGet({ request, env, data }) {
  if (!data.user) return json({ error: "Please log in" }, 401);
  const u = new URL(request.url), link = u.searchParams.get("url");
  if (link) {
    let t; try { t = new URL(link); } catch (e) { return json({ error: "This is not a valid link." }, 400); }
    if (t.protocol !== "https:" && t.protocol !== "http:") return json({ error: "This is not a valid link." }, 400);
    if (!okHost(t.hostname)) return json({ error: "Please paste the answer-key link from SSC's website (it has cbexams.com or digialm.com in it)." }, 400);
    try {
      const pages = await fetchSheet(t);
      if (!pages.length) return json({ error: "SSC's page did not open. The link may have expired – try uploading the saved page instead." }, 502);
      return json({ html: pages[0], pages });
    } catch (e) { return json({ error: e.message && e.message.startsWith("SSC") ? e.message : "Could not reach SSC's website right now. Please try again, or upload the saved page." }, 502); }
  }
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
