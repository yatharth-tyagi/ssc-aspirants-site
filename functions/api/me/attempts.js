// "My results" on the account page: the logged-in student's own test attempts.
import { json } from "../../_lib/auth.js";
export async function onRequestGet({ env, data }) {
  if (!data.user) return json({ attempts: [] });
  try {
    const rows = (await env.DB.prepare("SELECT test, score, max, created FROM attempts WHERE user = ?1 ORDER BY created DESC LIMIT 50").bind(data.user.id).all()).results || [];
    return json({ attempts: rows });
  } catch (e) { return json({ attempts: [] }); }
}
