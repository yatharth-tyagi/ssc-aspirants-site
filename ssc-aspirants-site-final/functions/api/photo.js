// A student's photo for the leaderboard (only for logged-in visitors).
export async function onRequestGet({ request, env }) {
  const u = Number(new URL(request.url).searchParams.get("u")) || 0;
  try { const r = await env.DB.prepare("SELECT photo FROM users WHERE id = ?1").bind(u).first();
    if (!r || !r.photo) return new Response(null, { status: 404 });
    return new Response(Uint8Array.from(atob(r.photo), c => c.charCodeAt(0)), { headers: { "Content-Type": "image/jpeg", "Cache-Control": "private, max-age=31536000" } });
  } catch (e) { return new Response(null, { status: 404 }); }
}
