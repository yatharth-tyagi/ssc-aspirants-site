// Shared login helpers for all server files (Cloudflare Pages Functions).
// There are TWO separate kinds of account:
//   students – sign up on /login (email + password or Google); stored in "users"
//   admins   – log in only on /admin-login; stored in "admins". Students can't log in there.
// Passwords are never stored: only a salted PBKDF2 hash.
// A login session is a random token in a cookie; the database keeps only its SHA-256 hash.

const DAYS = { student: 30, admin: 7 };
const KIND = {
  student: { cookie: "sid", sessions: "sessions", table: "users" },
  admin: { cookie: "asid", sessions: "admin_sessions", table: "admins" }
};

export const json = (data, status = 200, headers = {}) => new Response(JSON.stringify(data), {
  status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...headers }
});

const enc = new TextEncoder();
const hex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
export const randomHex = (n = 32) => hex(crypto.getRandomValues(new Uint8Array(n)));
export const sha256 = async s => hex(await crypto.subtle.digest("SHA-256", enc.encode(s)));

export async function hashPassword(password, saltHex) {
  const salt = saltHex || randomHex(16);
  const key = await crypto.subtle.importKey("raw", enc.encode(String(password).slice(0, 128)), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: enc.encode(salt), iterations: 100000 }, key, 256);
  return { salt, hash: hex(bits) };
}
// compare without leaking timing
export function same(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

let ready = false;
export async function ensureTables(DB) {
  if (ready) return;
  await DB.batch([
    DB.prepare("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL UNIQUE, name TEXT NOT NULL, pass TEXT, salt TEXT, google TEXT UNIQUE, role TEXT NOT NULL DEFAULT 'student', created INTEGER NOT NULL, last INTEGER, photo TEXT, photo_v INTEGER)"),
    DB.prepare("CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, user INTEGER NOT NULL, expires INTEGER NOT NULL)"),
    DB.prepare("CREATE TABLE IF NOT EXISTS admins (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL UNIQUE, name TEXT NOT NULL, pass TEXT, salt TEXT, created INTEGER NOT NULL, last INTEGER)"),
    DB.prepare("CREATE TABLE IF NOT EXISTS admin_sessions (token TEXT PRIMARY KEY, user INTEGER NOT NULL, expires INTEGER NOT NULL)"),
    DB.prepare("CREATE TABLE IF NOT EXISTS fails (email TEXT NOT NULL, t INTEGER NOT NULL)")
  ]);
  // tables made by the first login version: add the photo columns once
  for (const col of ["photo TEXT", "photo_v INTEGER"]) { try { await DB.prepare("ALTER TABLE users ADD COLUMN " + col).run(); } catch (e) {} }
  ready = true;
}

// the site owner = ADMIN_EMAIL in Cloudflare settings; logs in with ADMIN_PASSWORD
export const isOwner = (env, email) => !!env.ADMIN_EMAIL && String(env.ADMIN_EMAIL).trim().toLowerCase() === String(email).toLowerCase();
export const publicUser = u => ({ id: u.id, name: u.name, email: u.email, google: !!u.google, password: !!u.pass, photo: u.photo_v || 0 });
export const publicAdmin = (env, a) => ({ id: a.id, name: a.name, email: a.email, owner: isOwner(env, a.email) });

export function readCookie(request, name) {
  const c = request.headers.get("Cookie") || "";
  for (const part of c.split(/;\s*/)) { const i = part.indexOf("="); if (i > 0 && part.slice(0, i) === name) return decodeURIComponent(part.slice(i + 1)); }
  return "";
}
export const cookie = (name, value, maxAge) => `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;

export async function startSession(env, id, kind = "student") {
  const k = KIND[kind], token = randomHex(32), now = Date.now();
  await env.DB.batch([
    env.DB.prepare(`INSERT INTO ${k.sessions} (token, user, expires) VALUES (?1, ?2, ?3)`).bind(await sha256(token), id, now + DAYS[kind] * 864e5),
    env.DB.prepare(`UPDATE ${k.table} SET last = ?2 WHERE id = ?1`).bind(id, now),
    env.DB.prepare(`DELETE FROM ${k.sessions} WHERE expires < ?1`).bind(now)
  ]);
  return cookie(k.cookie, token, DAYS[kind] * 86400);
}

export async function currentUser(request, env, kind = "student") {
  if (!env.DB) return null;
  const k = KIND[kind], token = readCookie(request, k.cookie);
  if (!token || token.length !== 64) return null;
  try {
    return (await env.DB.prepare(`SELECT u.* FROM ${k.sessions} s JOIN ${k.table} u ON u.id = s.user WHERE s.token = ?1 AND s.expires > ?2`)
      .bind(await sha256(token), Date.now()).first()) || null;
  } catch (e) { return null; } // tables not made yet
}
export const currentAdmin = (request, env) => currentUser(request, env, "admin");

export async function endSession(request, env, kind = "student") {
  const k = KIND[kind], token = readCookie(request, k.cookie);
  if (token && env.DB) { try { await env.DB.prepare(`DELETE FROM ${k.sessions} WHERE token = ?1`).bind(await sha256(token)).run(); } catch (e) {} }
  return cookie(k.cookie, "", 0);
}

// 8 wrong tries → wait 15 minutes (counted per email, separately for admin logins)
const WINDOW = 15 * 60 * 1000, LIMIT = 8;
export async function tooMany(env, key) {
  await env.DB.prepare("DELETE FROM fails WHERE t < ?1").bind(Date.now() - WINDOW).run();
  const f = await env.DB.prepare("SELECT COUNT(*) AS n FROM fails WHERE email = ?1").bind(key).first();
  return (f.n || 0) >= LIMIT;
}
export const addFail = (env, key) => env.DB.prepare("INSERT INTO fails (email, t) VALUES (?1, ?2)").bind(key, Date.now()).run();
export const clearFails = (env, key) => env.DB.prepare("DELETE FROM fails WHERE email = ?1").bind(key).run();

export const tempPassword = () => Array.from(crypto.getRandomValues(new Uint8Array(10)), x => "abcdefghjkmnpqrstuvwxyz23456789"[x % 31]).join("");
// only allow going back to a page on this site
export const safeNext = n => (typeof n === "string" && /^\/(?![\/\\])/.test(n) ? n : "/");
export const cleanEmail = e => String(e || "").trim().toLowerCase();
export const okEmail = e => e.length <= 120 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
export const cleanName = n => String(n || "").replace(/[<>]/g, "").replace(/\s+/g, " ").trim().slice(0, 60);
// forms must come from this site (blocks other sites from posting on someone's behalf)
export function sameOrigin(request) {
  const o = request.headers.get("Origin");
  return !o || o === new URL(request.url).origin;
}
