// Cloudflare Pages Function – saves each test attempt and returns rank, percentile and attempt history.
// Runs at /api/attempts. Needs the D1 database bound as DB.
//
// Ranking rule (like Testbook): only each student's FIRST attempt counts for the official rank.
// A 2nd or 3rd attempt is compared with everyone else's first attempts ("your rank would be …").
// Each attempt stores its own number (1st, 2nd, 3rd…) and the rank it got at that time.

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
});

let ready = false;
async function tables(DB) {
  if (ready) return;
  await DB.prepare("CREATE TABLE IF NOT EXISTS attempts (id INTEGER PRIMARY KEY AUTOINCREMENT, test TEXT NOT NULL, score REAL NOT NULL, created INTEGER NOT NULL, user INTEGER, max REAL)").run();
  // columns added later (tables made by older versions get them here, once)
  for (const col of ["user INTEGER", "max REAL", "n INTEGER", "rank INTEGER", "total INTEGER", "pct REAL", "ans TEXT", "tm TEXT"]) { try { await DB.prepare("ALTER TABLE attempts ADD COLUMN " + col).run(); } catch (e) {} }
  await DB.prepare("CREATE INDEX IF NOT EXISTS idx_attempts_test_score ON attempts (test, score)").run();
  await DB.prepare("CREATE INDEX IF NOT EXISTS idx_attempts_user ON attempts (user, test)").run();
  ready = true;
}

// rank of a score among other students' first attempts
async function rankFor(DB, test, score, user) {
  const r = await DB.prepare(
    "SELECT COUNT(*) AS others, SUM(CASE WHEN score > ?2 THEN 1 ELSE 0 END) AS above, SUM(CASE WHEN score < ?2 THEN 1 ELSE 0 END) AS below, " +
    "MAX(score) AS top, AVG(score) AS avg FROM attempts WHERE test = ?1 AND (n = 1 OR n IS NULL) AND (?3 IS NULL OR user IS NULL OR user <> ?3)"
  ).bind(test, score, user).first();
  const total = (r.others || 0) + 1, below = r.below || 0;
  return {
    rank: (r.above || 0) + 1, total,
    percentile: total > 1 ? (below / (total - 1)) * 100 : 100,
    top: Math.max(r.top == null ? score : r.top, score),
    avg: ((r.avg || 0) * (r.others || 0) + score) / total
  };
}

// per question, from students' 1st attempts: how many picked each option, average time,
// and the topper's answer and time (for "Topper vs You" on the Solutions page)
async function stats(DB, test, nq) {
  const rows = (await DB.prepare("SELECT ans, tm, score FROM attempts WHERE test = ?1 AND (n = 1 OR n IS NULL) AND ans IS NOT NULL ORDER BY id DESC LIMIT 3000").bind(test).all()).results || [];
  const dist = Array.from({ length: nq }, () => [0, 0, 0, 0, 0, 0]); // A–E, skipped
  const tSum = Array(nq).fill(0), tCnt = Array(nq).fill(0); let top = null;
  rows.forEach(r => { let a, t = null; try { a = JSON.parse(r.ans); if (r.tm) t = JSON.parse(r.tm); } catch (e) { return; }
    for (let i = 0; i < nq; i++) { const v = a[i]; dist[i][v == null || v < 0 || v > 4 ? 5 : v]++; if (t && t[i] > 0) { tSum[i] += +t[i]; tCnt[i]++; } }
    if (!top || r.score > top.score) top = { score: r.score, a, t }; });
  return { attempts: rows.length, dist, avgT: tSum.map((x, i) => tCnt[i] ? Math.round(x / tCnt[i]) : null),
    topAns: top ? top.a.slice(0, nq) : null, topT: top && top.t ? top.t.slice(0, nq) : null, topScore: top ? top.score : null };
}

export async function onRequestPost({ request, env, data }) {
  if (!env.DB) return json({ error: "Database not connected yet" }, 503);
  let b;
  try { b = await request.json(); } catch (e) { return json({ error: "Bad request" }, 400); }
  const test = String(b.test || "").replace(/[^a-z0-9_-]/gi, "").slice(0, 80);
  const score = Number(b.score), max = Number(b.max);
  if (!test || !Number.isFinite(score) || !Number.isFinite(max) || max <= 0 || max > 1000 || score > max || score < -max)
    return json({ error: "Bad request" }, 400);
  const tm = Array.isArray(b.times) && b.times.length <= 500 ? JSON.stringify(b.times.map(v => Math.max(0, Math.min(99999, Math.round(+v) || 0)))) : null;
  const ans = Array.isArray(b.answers) && b.answers.length <= 500 ? JSON.stringify(b.answers.map(v => (Number.isInteger(v) && v >= 0 && v <= 4 ? v : null))) : null;

  await tables(env.DB);
  const user = data && data.user ? data.user.id : null;
  const prev = user ? (await env.DB.prepare("SELECT COUNT(*) AS c FROM attempts WHERE test = ?1 AND user = ?2").bind(test, user).first()).c || 0 : 0;
  const n = prev + 1;
  const R = await rankFor(env.DB, test, score, user);
  await env.DB.prepare("INSERT INTO attempts (test, score, created, user, max, n, rank, total, pct, ans, tm) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)")
    .bind(test, score, Date.now(), user, max, n, R.rank, R.total, R.percentile, ans, tm).run();

  const history = user ? ((await env.DB.prepare("SELECT n, score, max, rank, total, pct, created FROM attempts WHERE test = ?1 AND user = ?2 ORDER BY created").bind(test, user).all()).results || []) : [];
  const S = b.answers ? await stats(env.DB, test, Math.min(b.answers.length, 500)) : null;
  return json({ attempt: n, official: n === 1, ...R, history, stats: S });
}

export async function onRequestGet({ request, env, data }) {
  if (!env.DB) return json({ error: "Database not connected yet" }, 503);
  const test = (new URL(request.url).searchParams.get("test") || "").replace(/[^a-z0-9_-]/gi, "").slice(0, 80);
  if (!test) return json({ error: "Bad request" }, 400);
  try {
    await tables(env.DB);
    const user = data && data.user ? data.user.id : null;
    const done = user ? (await env.DB.prepare("SELECT COUNT(*) AS c FROM attempts WHERE test = ?1 AND user = ?2").bind(test, user).first()).c || 0 : 0;
    const r = await env.DB.prepare("SELECT COUNT(*) AS total, MAX(score) AS top, AVG(score) AS avg FROM attempts WHERE test = ?1 AND (n = 1 OR n IS NULL)").bind(test).first();
    const q = Number(new URL(request.url).searchParams.get("stats")) || 0;
    return json({ ...r, myAttempts: done, stats: q > 0 ? await stats(env.DB, test, Math.min(q, 500)) : undefined });
  } catch (e) { return json({ total: 0, myAttempts: 0 }); }
}
