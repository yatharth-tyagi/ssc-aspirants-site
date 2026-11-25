// Daily quiz results and streaks. Only the first try of each day counts.
import { json, sameOrigin } from "../_lib/auth.js";
const make = DB => DB.prepare("CREATE TABLE IF NOT EXISTS daily (user INTEGER NOT NULL, day TEXT NOT NULL, score INTEGER NOT NULL, total INTEGER NOT NULL, created INTEGER NOT NULL, PRIMARY KEY (user, day))").run();
const today = () => new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10); // India time
const prev = d => new Date(new Date(d + "T00:00:00Z").getTime() - 864e5).toISOString().slice(0, 10);
async function stats(DB, user) {
  const days = ((await DB.prepare("SELECT day, score, total FROM daily WHERE user = ?1 ORDER BY day DESC LIMIT 400").bind(user).all()).results || []);
  const set = new Set(days.map(d => d.day)); let streak = 0, d = today(); if (!set.has(d)) d = prev(d);
  while (set.has(d)) { streak++; d = prev(d); }
  let best = 0, run = 0, last = null; [...set].sort().forEach(x => { run = last && prev(x) === last ? run + 1 : 1; best = Math.max(best, run); last = x; });
  return { streak, best, played: days.length, doneToday: set.has(today()), recent: days.slice(0, 14) };
}
export async function onRequestGet({ env, data }) {
  if (!env.DB || !data.user) return json({ streak: 0, best: 0, played: 0, doneToday: false, recent: [] });
  await make(env.DB); return json(await stats(env.DB, data.user.id));
}
export async function onRequestPost({ request, env, data }) {
  if (!env.DB) return json({ error: "Database not connected yet" }, 503);
  if (!sameOrigin(request)) return json({ error: "Bad request" }, 403);
  if (!data.user) return json({ error: "Please log in as a student." }, 401);
  let b; try { b = await request.json(); } catch (e) { return json({ error: "Bad request" }, 400); }
  const day = String(b.day || ""), score = Math.round(+b.score), total = Math.round(+b.total);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || day > today() || !(total > 0 && total <= 100) || !(score >= 0 && score <= total)) return json({ error: "Bad request" }, 400);
  await make(env.DB);
  await env.DB.prepare("INSERT OR IGNORE INTO daily (user, day, score, total, created) VALUES (?1, ?2, ?3, ?4, ?5)").bind(data.user.id, day, score, total, Date.now()).run();
  const mine = await env.DB.prepare("SELECT score FROM daily WHERE user = ?1 AND day = ?2").bind(data.user.id, day).first();
  const all = await env.DB.prepare("SELECT COUNT(*) AS n, SUM(CASE WHEN score > ?2 THEN 1 ELSE 0 END) AS above FROM daily WHERE day = ?1").bind(day, mine ? mine.score : score).first();
  return json({ ...(await stats(env.DB, data.user.id)), rank: (all.above || 0) + 1, players: all.n || 1 });
}
