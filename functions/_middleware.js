// Runs before EVERY request on the site.
// - Students must log in (on /login) to see any page, test, note or data file.
// - The admin page needs an ADMIN login, made only on /admin-login. A student account never works there.
// - Pictures, styles and the two login pages stay open (the login pages need them).
// If the database isn't connected yet, the site stays open and only the admin pages are closed.
import { currentUser, currentAdmin, json, safeNext } from "./_lib/auth.js";

const OPEN = [/^\/login(\.html)?\/?$/, /^\/admin-login(\.html)?\/?$/, /^\/api\/auth\//, /^\/assets\/(?!uploads\/)/, /^\/favicon/, /^\/robots\.txt$/];
// drafts of notes are only for admins
const ADMIN_FILES = [/^\/data\/docs\//];
// data files that can hold things scheduled for later: hidden from students until their time
const SCHEDULED = { "/data/tests.js": "TESTS", "/data/notes.js": "NOTES", "/data/subjects.js": "SUBJECTS", "/data/live-tests.js": "LIVE_TESTS", "/data/daily.js": "DAILY" };
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
