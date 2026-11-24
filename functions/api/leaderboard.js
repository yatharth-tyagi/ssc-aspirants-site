// Leaderboard: top students of a test (1st attempts only), with name and photo.
import { json } from "../_lib/auth.js";
export async function onRequestGet({ request, env, data }) {
  if (!env.DB) return json({ error: "Database not connected yet" }, 503);
  const test = (new URL(request.url).searchParams.get("test") || "").replace(/[^a-z0-9_-]/gi, "").slice(0, 80);
  if (!test) return json({ error: "Bad request" }, 400);
  try {
    const rows = (await env.DB.prepare(
      "SELECT a.user, a.score, a.max, a.created, u.name, u.photo_v FROM attempts a JOIN users u ON u.id = a.user WHERE a.test = ?1 AND a.n = 1 ORDER BY a.score DESC, a.created ASC LIMIT 100"
    ).bind(test).all()).results || [];
    const me = data && data.user ? data.user.id : null;
    const total = (await env.DB.prepare("SELECT COUNT(*) AS c FROM attempts WHERE test = ?1 AND (n = 1 OR n IS NULL)").bind(test).first()).c || 0;
    let mine = null;
    if (me) { const m = await env.DB.prepare("SELECT score, max FROM attempts WHERE test = ?1 AND user = ?2 AND n = 1").bind(test, me).first();
      if (m) { const above = (await env.DB.prepare("SELECT COUNT(*) AS c FROM attempts WHERE test = ?1 AND (n = 1 OR n IS NULL) AND score > ?2").bind(test, m.score).first()).c || 0; mine = { rank: above + 1, score: m.score, max: m.max }; } }
    // same score = same rank
    let last = null, rank = 0;
    const list = rows.map((r, i) => { if (r.score !== last) { rank = i + 1; last = r.score; } return { rank, name: r.name, photo: r.photo_v ? `/api/photo?u=${r.user}&v=${r.photo_v}` : "", score: r.score, max: r.max, me: r.user === me }; });
    return json({ total, list, mine });
  } catch (e) { return json({ total: 0, list: [], mine: null }); }
}
