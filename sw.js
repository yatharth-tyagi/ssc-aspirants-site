// SSCAspirants_Official – app helper (service worker).
// Makes repeat visits fast and lets pages, notes and pictures open on weak internet.
// Pages and data: try the internet first (fresh content), use the saved copy if it is slow or offline.
// Styles, scripts, pictures and fonts: use the saved copy at once and refresh it in the background.
// Never saved: /api/ (logins, results, payments) and admin / editor pages.
const V = "ssc-v2";
const CORE = ["home.html", "notes.html", "courses.html", "mock-tests.html", "assets/site.css", "assets/site.js", "assets/logo.png", "assets/logo-mark.png", "assets/favicon.png", "offline.html"];
self.addEventListener("install", e => { e.waitUntil(caches.open(V).then(c => c.addAll(CORE).catch(() => {})).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
const NO = /\/api\/|admin|docs-editor|slide-editor|test\.html/;
const fresh = (req, ms) => new Promise(ok => {
  let done = false; const t = setTimeout(() => { if (!done) caches.match(req).then(r => { if (r && !done) { done = true; ok(r); } }); }, ms);
  fetch(req).then(r => { if (r.ok) { const cp = r.clone(); caches.open(V).then(c => c.put(req, cp)); } if (!done) { done = true; clearTimeout(t); ok(r); } })
    .catch(() => caches.match(req).then(r => { if (!done) { done = true; clearTimeout(t); ok(r || caches.match("offline.html")); } }));
});
self.addEventListener("fetch", e => {
  const req = e.request; if (req.method !== "GET") return;
  const u = new URL(req.url);
  if (u.origin === location.origin && NO.test(u.pathname)) return;
  const same = u.origin === location.origin, font = /fonts\.(googleapis|gstatic)\.com$/.test(u.hostname), cdn = u.hostname === "cdn.jsdelivr.net";
  if (!same && !font && !cdn) return;
  if (same && (req.mode === "navigate" || /\/data\//.test(u.pathname))) { e.respondWith(fresh(req, 3500)); return; }
  e.respondWith(caches.match(req).then(hit => {
    const net = fetch(req).then(r => { if (r.ok || r.type === "opaque") { const cp = r.clone(); caches.open(V).then(c => c.put(req, cp)); } return r; }).catch(() => hit);
    return hit || net;
  }));
});
