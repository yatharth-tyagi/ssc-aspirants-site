// Admin: passes the admin page's saves on to GitHub, using the secret GITHUB_TOKEN kept in
// Cloudflare settings. The key never reaches anyone's browser.
// (The middleware already checked that the person asking is an admin.)
import { json, sameOrigin } from "../../_lib/auth.js";

export async function onRequest({ request, env, params }) {
  if (!env.GITHUB_TOKEN) return json({ message: "Add the GITHUB_TOKEN secret in Cloudflare (manual Part 9)." }, 503);
  if (!["GET", "PUT", "DELETE"].includes(request.method)) return json({ message: "Not allowed" }, 405);
  if (request.method !== "GET" && !sameOrigin(request)) return json({ message: "Bad request" }, 403);
  let parts = [].concat(params.path || []);
  if (parts[0] === "repo" && parts.length === 1) parts = []; // the repository itself
  if (request.method === "DELETE" && parts[0] !== "contents") return json({ message: "Not allowed" }, 403);
  if (parts.length && (parts[0] !== "contents" || parts.some(p => p === ".." || p === ""))) return json({ message: "Not allowed" }, 403);

  const owner = env.GITHUB_OWNER || "yatharth-tyagi", repo = env.GITHUB_REPO || "ssc-aspirants-site";
  const src = new URL(request.url);
  const target = `https://api.github.com/repos/${owner}/${repo}${parts.length ? "/" + parts.map(encodeURIComponent).join("/") : ""}${src.search}`;
  const r = await fetch(target, {
    method: request.method,
    headers: {
      Authorization: "Bearer " + env.GITHUB_TOKEN, "User-Agent": "ssc-aspirants-admin", "X-GitHub-Api-Version": "2022-11-28",
      Accept: request.headers.get("Accept") || "application/vnd.github+json",
      ...(request.method !== "GET" ? { "Content-Type": "application/json" } : {})
    },
    body: request.method !== "GET" ? await request.text() : undefined
  });
  return new Response(r.body, { status: r.status, headers: { "Content-Type": r.headers.get("Content-Type") || "application/json", "Cache-Control": "no-store" } });
}
