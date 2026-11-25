// Log out: deletes this session.
import { json, endSession } from "../../_lib/auth.js";
export async function onRequestPost({ request, env }) {
  return json({ ok: true }, 200, { "Set-Cookie": await endSession(request, env) });
}
