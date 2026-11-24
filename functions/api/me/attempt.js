// One of my attempts (answers and times) for the Solutions page.
import { json } from "../../_lib/auth.js";
export async function onRequestGet({ request, env, data }) {
  if (!env.DB || !data.user) return json({ error: "Please log in" }, 401);
  const u = new URL(request.url), test = (u.searchParams.get("test") || "").replace(/[^a-z0-9_-]/gi, "").slice(0, 80), n = Number(u.searchParams.get("n")) || 0;
  try {
    const r = await env.DB.prepare(`SELECT n, score, max, rank, total, pct, ans, tm, created FROM attempts WHERE test = ?1 AND user = ?2 ${n ? "AND n = ?3" : ""} ORDER BY created DESC LIMIT 1`)
      .bind(...(n ? [test, data.user.id, n] : [test, data.user.id])).first();
    if (!r) return json({ error: "Not found" }, 404);
    return json({ ...r, ans: r.ans ? JSON.parse(r.ans) : null, tm: r.tm ? JSON.parse(r.tm) : null });
  } catch (e) { return json({ error: "Not found" }, 404); }
}
