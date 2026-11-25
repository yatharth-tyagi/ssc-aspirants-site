// Who is logged in? Used by every page for the account menu.
// user = the student account, admin = the admin account (they are separate logins).
import { json, currentUser, currentAdmin, publicUser, publicAdmin } from "../../_lib/auth.js";
export async function onRequestGet({ request, env }) {
  const [u, a] = await Promise.all([currentUser(request, env), currentAdmin(request, env)]);
  return json({ user: u ? publicUser(u) : null, admin: a ? publicAdmin(env, a) : null }, u || a ? 200 : 401);
}
