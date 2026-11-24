// Cloudflare Pages Function – saves each test score and returns rank and percentile.
// Runs at /api/attempts on the live site. Needs a D1 database bound with the name DB
// (Cloudflare → Workers & Pages → project → Settings → Bindings → D1 database → DB).
// Stored: the test id, the score and which student took it (for their "My results" page).

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
});

export async function onRequestPost({ request, env, data }) {
  if (!env.DB) return json({ error: "Database not connected yet" }, 503);
  let b;
  try { b = await request.json(); } catch (e) { return json({ error: "Bad request" }, 400); }
  const test = String(b.test || "").replace(/[^a-z0-9_-]/gi, "").slice(0, 80);
  const score = Number(b.score), max = Number(b.max);
  if (!test || !Number.isFinite(score) || !Number.isFinite(max) || max <= 0 || max > 1000 || score > max || score < -max)
    return json({ error: "Bad request" }, 400);

  await env.DB.prepare("CREATE TABLE IF NOT EXISTS attempts (id INTEGER PRIMARY KEY AUTOINCREMENT, test TEXT NOT NULL, score REAL NOT NULL, created INTEGER NOT NULL, user INTEGER, max REAL)").run();
  await env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_attempts_test_score ON attempts (test, score)").run();
  const user = data && data.user ? data.user.id : null;
  const add = () => env.DB.prepare("INSERT INTO attempts (test, score, created, user, max) VALUES (?1, ?2, ?3, ?4, ?5)").bind(test, score, Date.now(), user, max).run();
  try { await add(); }
  catch (e) { // table made by the older version: add the two new columns once
    for (const col of ["user INTEGER", "max REAL"]) { try { await env.DB.prepare("ALTER TABLE attempts ADD COLUMN " + col).run(); } catch (x) {} }
    await add();
  }

  const r = await env.DB.prepare(
    "SELECT COUNT(*) AS total, SUM(CASE WHEN score > ?2 THEN 1 ELSE 0 END) AS above, " +
    "SUM(CASE WHEN score < ?2 THEN 1 ELSE 0 END) AS below, MAX(score) AS top, AVG(score) AS avg FROM attempts WHERE test = ?1"
  ).bind(test, score).first();

  const total = r.total || 1, above = r.above || 0, below = r.below || 0;
  return json({
    rank: above + 1,                                            // 1 + how many scored more
    total,
    percentile: total > 1 ? (below / (total - 1)) * 100 : 100,  // % of other students who scored less
    top: r.top, avg: r.avg
  });
}

export async function onRequestGet({ request, env }) {
  if (!env.DB) return json({ error: "Database not connected yet" }, 503);
  const test = (new URL(request.url).searchParams.get("test") || "").replace(/[^a-z0-9_-]/gi, "").slice(0, 80);
  if (!test) return json({ error: "Bad request" }, 400);
  try {
    const r = await env.DB.prepare("SELECT COUNT(*) AS total, MAX(score) AS top, AVG(score) AS avg FROM attempts WHERE test = ?1").bind(test).first();
    return json(r);
  } catch (e) { return json({ total: 0 }); }
}
