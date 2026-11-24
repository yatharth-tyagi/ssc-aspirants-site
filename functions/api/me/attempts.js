// "My results": the logged-in student's own test attempts.
// ?full=1 also returns the answers and percentile, so test cards can show correct / wrong / skipped for each attempt.
import { json } from "../../_lib/auth.js";
export async function onRequestGet({ request, env, data }) {
  if (!data.user) return json({ attempts: [] });
  const full = !!request && new URL(request.url).searchParams.get("full") === "1";
  try {
    const rows = (await env.DB.prepare(`SELECT test, score, max, created, n, rank, total${full ? ", pct, ans" : ""} FROM attempts WHERE user = ?1 ORDER BY created DESC LIMIT ${full ? 1000 : 50}`).bind(data.user.id).all()).results || [];
    if (full) rows.forEach(r => { try { r.ans = r.ans ? JSON.parse(r.ans) : null; } catch (e) { r.ans = null; } });
    return json({ attempts: rows });
  } catch (e) { return json({ attempts: [] }); }
}
