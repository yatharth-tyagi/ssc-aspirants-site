// Runs before EVERY request on the site.
// - Students must log in (on /login) to see any page, test, note or data file.
// - The admin page needs an ADMIN login, made only on /admin-login. A student account never works there.
// - Pictures, styles and the two login pages stay open (the login pages need them).
// If the database isn't connected yet, the site stays open and only the admin pages are closed.
import { currentUser, currentAdmin, json, safeNext } from "./_lib/auth.js";

const OPEN = [/^\/login(\.html)?\/?$/, /^\/admin-login(\.html)?\/?$/, /^\/api\/auth\//, /^\/assets\/(?!uploads\/)/, /^\/favicon/, /^\/robots\.txt$/,
  /^\/(privacy|terms|contact)(\.html)?\/?$/, /^\/data\/(site|exams)\.js$/];
// drafts of notes are only for admins
const ADMIN_FILES = [/^\/data\/docs\//];
// data files that can hold things scheduled for later: hidden from students until their time
const SCHEDULED = { "/data/tests.js": "TESTS", "/data/notes.js": "NOTES", "/data/subjects.js": "SUBJECTS", "/data/live-tests.js": "LIVE_TESTS", "/data/daily.js": "DAILY" };
// Visitors who are NOT logged in may open these pages. What they see inside is limited below:
// notes marked Free in full, every other note only as a short preview, and only tests marked Free.
const GUEST_PAGES = [/^\/(note|test|solutions)(\.html)?\/?$/, /^\/assets\/uploads\/[^/]+\.(png|jpe?g|gif|webp)$/i]; // pictures used inside free notes and tests
const GUEST_DATA = { "/data/notes.js": "NOTES", "/data/tests.js": "TESTS", "/data/subjects.js": "SUBJECTS" };
const ADMIN = [...ADMIN_FILES, /^\/admin(\.html)?\/?$/, /^\/admin-team(\.html)?\/?$/, /^\/slide-editor(\.html)?\/?$/, /^\/docs-editor(\.html)?\/?$/, /^\/api\/admin\//, /^\/api\/gh\//];

const page = (title, text, status) => new Response(
  `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>` +
  `<body style="font:16px/1.6 system-ui;background:#F8F5EE;color:#1E2433;display:grid;place-items:center;min-height:100vh;margin:0;padding:20px">` +
  `<div style="max-width:440px;background:#fff;border:1px solid #E9E2D2;border-radius:16px;padding:28px;text-align:center">` +
  `<img src="/assets/logo.png" alt="" width="72" height="72"><h1 style="font-size:1.3rem">${title}</h1><p>${text}</p>` +
  `<p><a href="/" style="color:#1F3A93;font-weight:600">Go to home</a></p></div>`,
  { status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
const go = (url, to) => Response.redirect(new URL(to, url.origin).toString(), 302);

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);
  const path = url.pathname;
  const isApi = path.startsWith("/api/");
  const isAdmin = ADMIN.some(r => r.test(path));

  if (!env.DB) {
    if (isAdmin) return isApi ? json({ error: "Database not connected yet" }, 503)
      : page("Admin is closed", "The login database isn't connected yet. Follow Part 9 of the manual.", 503);
    return next();
  }

  // already logged in → the login page sends you on
  if (/^\/login/.test(path) && await currentUser(request, env)) return go(url, safeNext(url.searchParams.get("next")));
  if (/^\/admin-login/.test(path) && await currentAdmin(request, env)) return go(url, safeNext(url.searchParams.get("next") || "/admin"));
  if (OPEN.some(r => r.test(path))) return next();

  const admin = await currentAdmin(request, env);
  if (isAdmin) {
    if (!admin) return isApi ? json({ error: "Admin login needed" }, 401) : go(url, "/admin-login?next=" + encodeURIComponent(path + url.search));
  } else {
    const user = await currentUser(request, env);
    if (!user && !admin && !isApi) {
      if (GUEST_DATA[path]) { const res = await next(); return guestData(res, GUEST_DATA[path]); }
      if (/^\/data\/slides\/[\w-]+\.json$/.test(path) && await freeDeck(env, url, path)) return noStore(await next());
      if (GUEST_PAGES.some(r => r.test(path))) return noStore(await next());
    }
    if (!user && !admin) return isApi ? json({ error: "Please log in" }, 401) : go(url, "/login?next=" + encodeURIComponent(path + url.search));
    context.data.user = user;
  }
  context.data.admin = admin;

  const res = await next();
  if (!admin && SCHEDULED[path] && res.ok) { try { return await hideScheduled(res.clone(), SCHEDULED[path]); } catch (e) { /* file not in the expected shape: send as it is */ } }
  // logged-in pages must not be kept in shared caches
  const out = new Response(res.body, res);
  if (!/^\/assets\//.test(path)) out.headers.set("Cache-Control", "private, no-cache");
  return out;
}

const noStore = res => { const out = new Response(res.body, res); out.headers.set("Cache-Control", "private, no-cache"); return out; };
const readData = (text, name) => { const mark = "window." + name + " = ", i = text.indexOf(mark); if (i < 0) throw new Error("shape");
  return { head: text.slice(0, i), data: JSON.parse(text.slice(i + mark.length).trim().replace(/;\s*$/, "")) }; };

// The first part of a note (about a third, at most ~3000 letters), cut after a whole paragraph or heading.
function cutHtml(h) {
  h = String(h || ""); const total = h.replace(/<[^>]*>/g, "").length;
  const want = Math.min(Math.max(300, total * 0.3), 3000, total * 0.5);
  let t = 0, i = 0;
  while (i < h.length && t < want) { if (h[i] === "<") { const j = h.indexOf(">", i); i = j < 0 ? h.length : j + 1; } else { t++; i++; } }
  const m = /<\/(p|h[1-6]|ul|ol|table|blockquote|li|div)>/gi; m.lastIndex = i; const r = m.exec(h);
  return h.slice(0, r ? r.index + r[0].length : i);
}
const preview = n => {
  const out = { subject: n.subject, title: n.title, read: n.read, exams: n.exams, intro: n.intro, locked: true };
  if (n.html) out.html = cutHtml(n.html);
  else if (n.phases && n.phases.length) out.phases = [{ ...n.phases[0], items: (n.phases[0].items || []).slice(0, 2) }];
  return out;
};
// What a visitor who is not logged in gets from a data file. If anything goes wrong they get nothing (never the full file).
async function guestData(res, name) {
  const now = Date.now(), later = o => o && o.publishAt && +o.publishAt > now;
  let out = name === "SUBJECTS" ? [] : {}, text = "";
  try {
    if (!res.ok) throw new Error("missing");
    text = await res.text();
    const { data } = readData(text, name);
    if (name === "NOTES") for (const k in data) { const n = data[k]; if (!later(n)) out[k] = n.free ? n : preview(n); }
    if (name === "TESTS") for (const k in data) { const t = data[k]; if (t && t.free && !later(t)) out[k] = t; }
    if (name === "SUBJECTS") out = data.map(s => ({ ...s, chapters: s.chapters.map(c => later(c) ? { ...c, ready: false } : c) }));
  } catch (e) {
    // the chapter list holds no notes, so if it can't be read it is sent as it is; notes and tests are never sent unread
    if (name === "SUBJECTS" && text) return new Response("window.SSC_GUEST = true;\n" + text, { status: 200, headers: { "Content-Type": "application/javascript; charset=utf-8", "Cache-Control": "private, no-cache" } });
  }
  return new Response("window.SSC_GUEST = true;\nwindow." + name + " = " + JSON.stringify(out) + ";\n",
    { status: 200, headers: { "Content-Type": "application/javascript; charset=utf-8", "Cache-Control": "private, no-cache" } });
}
// Slides open to visitors only when they belong to a note marked Free.
async function freeDeck(env, url, path) {
  try {
    if (!env.ASSETS) return false;
    const r = await env.ASSETS.fetch(new Request(new URL("/data/notes.js", url.origin)));
    if (!r.ok) return false;
    const id = path.slice("/data/slides/".length, -5), { data } = readData(await r.text(), "NOTES"), now = Date.now();
    return Object.values(data).some(n => n && n.free && n.deck === id && !(n.publishAt && +n.publishAt > now));
  } catch (e) { return false; }
}

// Removes anything whose publishAt time hasn't come yet (admins still see everything).
async function hideScheduled(res, name) {
  const text = await res.text(), mark = "window." + name + " = ", i = text.indexOf(mark);
  if (i < 0) throw new Error("shape");
  const body = text.slice(i + mark.length).trim().replace(/;\s*$/, "");
  const data = JSON.parse(body), now = Date.now(), later = o => o && o.publishAt && +o.publishAt > now;
  let out = data;
  if (name === "TESTS" || name === "NOTES") { out = {}; for (const k in data) if (!later(data[k])) out[k] = data[k]; }
  if (name === "LIVE_TESTS") out = data.filter(x => !later(x));
  if (name === "SUBJECTS") out = data.map(s => ({ ...s, chapters: s.chapters.map(c => later(c) ? { ...c, ready: false } : c) }));
  if (name === "DAILY") { const today = new Date(now + 5.5 * 3600e3).toISOString().slice(0, 10); out = {}; for (const d in data) if (d <= today) out[d] = data[d]; }
  return new Response(text.slice(0, i) + mark + JSON.stringify(out) + ";\n", { status: 200, headers: { "Content-Type": "application/javascript; charset=utf-8", "Cache-Control": "private, no-cache" } });
}
