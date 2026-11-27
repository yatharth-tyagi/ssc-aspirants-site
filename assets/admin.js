// SSCAspirants_Official – admin page.
// Saves straight into the website's files on GitHub (data/*.js and assets/uploads/).
// Cloudflare Pages publishes every saved change in about a minute.
(function () {
  const E = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const $ = id => document.getElementById(id);
  const LIBS = {
    xlsx: "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js",
    mammoth: "https://cdn.jsdelivr.net/npm/mammoth@1.8.0/mammoth.browser.min.js"
  };
  const load = src => new Promise((ok, no) => { const s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = () => no(new Error("Could not load " + src)); document.head.appendChild(s); });
  function safeHtml(html) {
    const doc = new DOMParser().parseFromString(html || "", "text/html");
    doc.querySelectorAll("script,iframe,object,embed,style,link,meta,form,base").forEach(x => x.remove());
    doc.querySelectorAll("*").forEach(el => [...el.attributes].forEach(at => { const v = at.value.trim().toLowerCase();
      if (at.name.startsWith("on") || ((at.name === "href" || at.name === "src") && (v.startsWith("javascript:") || (v.startsWith("data:") && !v.startsWith("data:image/"))))) el.removeAttribute(at.name); }));
    return doc.body.innerHTML;
  }
  const slug = t => String(t).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "item";

  // ---------- status messages ----------
  let stT;
  function say(msg, kind = "info", keep) {
    const st = $("status"); st.className = "status show " + kind; st.textContent = msg;
    clearTimeout(stT); if (!keep) stT = setTimeout(() => st.classList.remove("show"), kind === "err" ? 9000 : 5000);
  }

  // ---------- GitHub (through the site's own server) ----------
  // You log in as an admin; the server adds the secret GitHub key, so no key is needed here.
  const cfg = { brn: "main" };
  const api = path => "/api/gh" + (path || "/repo");
  const H = (extra = {}) => ({ Accept: "application/vnd.github+json", ...extra });
  async function gh(path, opt = {}) {
    const r = await fetch(api(path), { cache: "no-store", credentials: "same-origin", ...opt, headers: H(opt.headers) });
    if (!r.ok) { const t = await r.text(); let m = t; try { m = JSON.parse(t || "{}").message || JSON.parse(t).error || t; } catch (x) {} const e = new Error(r.status + " " + m); e.status = r.status; throw e; }
    return r;
  }
  const b64FromBytes = bytes => { let s = ""; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); return btoa(s); };
  const b64FromText = t => b64FromBytes(new TextEncoder().encode(t));
  async function sha(path) {
    try { const r = await gh(`/contents/${path}?ref=${encodeURIComponent(cfg.brn)}&meta=1`); return (await r.json()).sha; }
    catch (e) { if (e.status === 404) return null; throw e; }
  }
  async function readText(path) {
    try { const r = await gh(`/contents/${path}?ref=${encodeURIComponent(cfg.brn)}`, { headers: { Accept: "application/vnd.github.raw+json" } }); return await r.text(); }
    catch (e) { if (e.status === 404) return null; throw e; }
  }
  async function writeB64(path, b64, message) {
    const body = { message, content: b64, branch: cfg.brn }, s = await sha(path);
    if (s) body.sha = s;
    await gh(`/contents/${path}`, { method: "PUT", body: JSON.stringify(body), headers: { "Content-Type": "application/json" } });
  }
  async function removeFile(path, message) {
    const s = await sha(path); if (!s) return;
    await gh(`/contents/${path}`, { method: "DELETE", body: JSON.stringify({ message, sha: s, branch: cfg.brn }), headers: { "Content-Type": "application/json" } });
  }
  // data files look like:  window.NAME = {...};
  async function readData(path, name, fallback) {
    const code = await readText(path);
    if (code == null) return fallback;
    const w = {}; new Function("window", code)(w);
    return w[name] === undefined ? fallback : w[name];
  }
  const writeData = (path, name, value, note) =>
    writeB64(path, b64FromText(`// ${note}\n// Saved from the admin page on ${new Date().toISOString().slice(0, 10)}.\nwindow.${name} = ${JSON.stringify(value, null, 1)};\n`), `Admin: update ${path}`);

  // ---------- data ----------
  const D = { NOTES: {}, SUBJECTS: [], TESTS: {}, LIVE: [], NEWS: [], EXAMS: [], TOPICS: {}, SITE: {}, DAILY: {}, INSTR: { general: "", exams: {} }, COURSES: [], JOBS: [] };
  const FILES = {
    NOTES: ["data/notes.js", "NOTES", "All notes content."],
    SUBJECTS: ["data/subjects.js", "SUBJECTS", "Subjects and chapters. ready: true shows a chapter on the site."],
    TESTS: ["data/tests.js", "TESTS", "Tests made in the admin page. Each opens at test.html?id=<id>."],
    LIVE: ["data/live-tests.js", "LIVE_TESTS", "Tests shown in Live tests on the Home page."],
    NEWS: ["data/whats-new.js", "WHATS_NEW", "What's new on the Home page, newest first."],
    EXAMS: ["data/exams.js", "EXAMS", "One entry per exam. Each exam has its own page (e.g. ssc-cgl.html) built from this data. hide: true hides it from the lists."],
    TOPICS: ["data/topics.js", "TOPICS", "Subject-wise (topic-wise) tests for each section. A topic with a link opens that test."],
    DAILY: ["data/daily.js", "DAILY", "Daily quiz: one entry per date (YYYY-MM-DD). Students only see dates up to today."],
    JOBS: ["data/jobs.js", "JOBS", "Jobs update (Admin → Jobs). Open to everyone. cat: job | admit | result | key | date. Dates are YYYY-MM-DD. links: [[label, url]] – official websites only."],
    COURSES: ["data/courses.js", "COURSES", "Courses (Admin → Courses). A course has chapters; each chapter has lessons. type: subject | full. price 0 = free. Lessons with free: true are a free demo. Lesson kinds: video { vid } · live { when, link, vid } · notes { note } · pdf { pdf } · test { test }."],
    INSTR: ["data/instructions.js", "INSTRUCTIONS", "Test instructions shown before every test (Admin → Instructions). general: every exam; exams.<exam id>: extra notes. {exam} {test} {minutes} {questions} {marks} {plus} {minus} {sections} are filled in for each test."],
    SITE: ["data/site.js", "SITE", "Website texts, pictures, menu and sections changed from the admin page (✎ Edit page and Admin → Website)."]
  };
  // date-time box ⇄ time stamp
  const whenVal = id => { const v = $(id).value; return v ? new Date(v).getTime() : null; };
  const whenSet = (id, t) => { $(id).value = t ? new Date(t - new Date(t).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ""; };
  const whenText = t => t && t > Date.now() ? ` · <span class="pill soon">Goes live ${new Date(t).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</span>` : "";
  const save = k => writeData(FILES[k][0], FILES[k][1], D[k], FILES[k][2]);

  // ---------- who is logged in: owner/admin = everything, teacher = only notes for their subjects ----------
  let ME = null;
  const isTeacher = () => !!(ME && ME.role === "teacher");
  const mySubs = () => (ME && ME.subjects) || [];
  const meReady = fetch("/api/admin/me").then(r => r.json()).then(d => { ME = d.admin || null; return ME; }).catch(() => null);

  // ---------- tabs ----------
  let connected = false;
  const tabs = [...document.querySelectorAll("#atabs [data-t]")];
  function openTab(t) {
    if (!connected && t !== "connect") t = "connect";
    if (isTeacher() && !teacherTabs().includes(t)) t = "notes";
    tabs.forEach(b => b.setAttribute("aria-selected", b.dataset.t === t));
    document.querySelectorAll("[data-p]").forEach(p => p.hidden = p.dataset.p !== t);
  }
  tabs.forEach(b => b.addEventListener("click", () => openTab(b.dataset.t)));
  const teacherTabs = () => ["connect", "notes", "tests", "courses", "doubts", ...(ME && ME.canInstr ? ["instr"] : [])];
  const lockTabs = () => tabs.forEach(b => { b.disabled = !connected && b.dataset.t !== "connect"; b.hidden = isTeacher() && !teacherTabs().includes(b.dataset.t); });
  lockTabs(); openTab("connect");

  // ---------- connect (runs by itself when the page opens) ----------
  async function connect() {
    say("Loading your website data…", "info", true);
    await meReady;
    if (isTeacher()) { const tl = document.querySelector('.adminbar a[href="admin-team.html"]'); if (tl) tl.hidden = true; $("nDel").hidden = true; }
    try {
      const repo = await (await gh("")).json();
      if (repo.permissions && !repo.permissions.push) throw new Error("The GITHUB_TOKEN in Cloudflare can't save. Give it Contents: Read and write.");
      const [n, s, t, l, w] = await Promise.all([
        readData("data/notes.js", "NOTES", {}), readData("data/subjects.js", "SUBJECTS", window.SUBJECTS || []),
        readData("data/tests.js", "TESTS", {}), readData("data/live-tests.js", "LIVE_TESTS", []), readData("data/whats-new.js", "WHATS_NEW", [])]);
      Object.assign(D, { NOTES: n, SUBJECTS: s, TESTS: t, LIVE: l, NEWS: w });
      const [ex, tp, si] = await Promise.all([readData("data/exams.js", "EXAMS", window.EXAMS || []), readData("data/topics.js", "TOPICS", window.TOPICS || {}), readData("data/site.js", "SITE", {})]);
      Object.assign(D, { EXAMS: ex, TOPICS: tp, SITE: si || {}, DAILY: (await readData("data/daily.js", "DAILY", {})) || {} });
      D.COURSES = (await readData("data/courses.js", "COURSES", window.COURSES || [])) || [];
      D.JOBS = (await readData("data/jobs.js", "JOBS", window.JOBS || [])) || [];
      D.INSTR = (await readData("data/instructions.js", "INSTRUCTIONS", window.INSTRUCTIONS || null)) || { general: "", exams: {} }; if (!D.INSTR.exams) D.INSTR.exams = {};
      connected = true; lockTabs();
      $("connInfo").textContent = `Connected to ${repo.full_name}. ${Object.keys(n).length} notes chapters, ${Object.keys(t).length} tests, ${l.length} live tests loaded.`;
      fillSubjects(); nbShow(false); fillInstr(); drawTests(); if (window.AdminCourses) AdminCourses.init(); if (window.AdminExtras) AdminExtras.init(); if (window.AdminJobs) AdminJobs.init(); drawLive(); drawNews();
      if (isTeacher()) { lockTabs(); say(mySubs().length ? "Ready. You can make notes for: " + D.SUBJECTS.filter(s => mySubs().includes(s.id)).map(s => s.name).join(", ") + "." : "No subject is given to you yet. Ask the owner.", mySubs().length ? "ok" : "err", !mySubs().length); }
      else say("Ready. You can add notes and tests.", "ok");
      if (!$("atabs").querySelector('[aria-selected="true"]:not([data-t="connect"])')) openTab("notes");
    } catch (e) {
      $("connInfo").textContent = "";
      say(e.status === 401 || e.status === 403 ? "Please log in on the admin login page." : "Could not load: " + e.message, "err");
    }
  }
  $("connectBtn").addEventListener("click", connect);
  setTimeout(connect, 0);

  // ---------- who is logged in + admin log out ----------
  meReady.then(a => { if (a) $("whoAdmin").textContent = "Logged in as " + a.name + (a.owner ? " (owner)" : a.role === "teacher" ? " (teacher)" : "") + " · " + a.email; });
  $("aLogout").addEventListener("click", async () => { try { await fetch("/api/auth/admin-logout", { method: "POST" }); } catch (e) {} location.href = "admin-login.html"; });

  // =====================================================================
  // NOTES
  // =====================================================================
  const toBody = n => (n.phases || []).map(p => `## ${p.h}\n` + p.items.map(it =>
    `### ${[it.yr, it.t, it.s].filter((x, i) => x || i < 2).join(" | ")}\n` + it.pts.map(x => "- " + x).join("\n")).join("\n\n")).join("\n\n");
  function parseBody(text) {
    const phases = []; let ph = null, it = null;
    text.split(/\r?\n/).forEach(raw => {
      const l = raw.trim(); if (!l) return;
      if (l.startsWith("## ")) { ph = { h: l.slice(3).trim(), items: [] }; phases.push(ph); it = null; return; }
      if (!ph) { ph = { h: "Notes", items: [] }; phases.push(ph); }
      if (l.startsWith("### ")) { const [yr, t, s] = l.slice(4).split("|").map(x => x.trim()); it = { yr: yr || "", t: t || "", s: s || "", pts: [] }; ph.items.push(it); return; }
      if (!it) { it = { yr: "", t: "", s: "", pts: [] }; ph.items.push(it); }
      it.pts.push(l.replace(/^[-•*]\s*/, ""));
    });
    return phases;
  }
  const toTable = n => n.table ? [(n.tableHead || []).filter(Boolean).join(" | "), ...n.table.map(r => r.slice(0, (n.tableHead || []).filter(Boolean).length).join(" | "))].join("\n") : "";
  function parseTable(text) {
    const rows = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean).map(l => l.split("|").map(x => x.trim()));
    return rows.length > 1 ? { tableHead: rows[0], table: rows.slice(1) } : { tableHead: [], table: null };
  }
  const toQuiz = qz => (qz || []).map(q => [q.section ? "Section: " + q.section : null, q.q, ...q.opts.map((o, i) => (i === q.a ? "*" : "") + o), q.why ? "Why: " + q.why : null, q.tag ? "Tag: " + q.tag : null].filter(Boolean).join("\n")).join("\n\n");
  function parseQuiz(text) {
    const out = [], errs = []; let section = "";
    text.split(/\r?\n\s*\r?\n/).forEach((block, bi) => {
      let lines = block.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      if (!lines.length) return;
      while (lines.length && /^section\s*:/i.test(lines[0])) { section = lines[0].replace(/^section\s*:/i, "").trim(); lines = lines.slice(1); }
      if (!lines.length) return;
      const q = { q: lines[0], opts: [], a: -1, why: "", tag: "" };
      if (section) q.section = section;
      lines.slice(1).forEach(l => {
        if (/^why\s*:/i.test(l)) q.why = l.replace(/^why\s*:/i, "").trim();
        else if (/^tag\s*:/i.test(l)) q.tag = l.replace(/^tag\s*:/i, "").trim();
        else { if (l.startsWith("*")) q.a = q.opts.length; q.opts.push(l.replace(/^\*\s*/, "").replace(/^[A-Da-d][).]\s+/, "")); }
      });
      if (q.opts.length < 2 || q.a < 0) errs.push(`Question ${bi + 1} ("${q.q.slice(0, 40)}…") needs at least 2 options and one marked with *`);
      else { if (!q.tag) delete q.tag; if (!q.section) delete q.section; out.push(q); }
    });
    return { list: out, errs };
  }

  // ---------- notes browser: Exam → Subject → Chapter (same look as the students' Notes page) ----------
  // which subjects belong to an exam, from the section names in its pattern
  const SEC_SUBS = [[/awareness|knowledge|general studies/i, ["polity", "history", "geography", "economy", "science"]], [/math|quant|numer|arithmetic/i, ["maths"]], [/reason|intelligence/i, ["reasoning"]], [/english/i, ["english"]]];
  const MAPPED = new Set(SEC_SUBS.flatMap(x => x[1]));
  const mineOnly = list => list.filter(s => !isTeacher() || mySubs().includes(s.id));
  function subsForExam(ex) {
    const secs = [...(ex.pattern || []), ...(ex.tiers || []).flatMap(t => t.pattern || [])].map(r => String(r[0]));
    const ids = new Set(); SEC_SUBS.forEach(([re, list]) => { if (secs.some(s => re.test(s))) list.forEach(i => ids.add(i)); });
    let out = D.SUBJECTS.filter(s => ids.has(s.id) || !MAPPED.has(s.id));
    if (!ids.size) out = D.SUBJECTS.slice();
    return mineOnly(out);
  }
  let nbExam = null, nbSub = null;
  const crumb = (parts) => parts.map(([label, go], i) => go ? `<button type="button" data-nb="${go}">${E(label)}</button>` : `<b>${E(label)}</b>`).join(" <span>›</span> ");
  const exOf = id => D.EXAMS.find(x => x.id === id);
  function nbExams() {
    nbExam = nbSub = null;
    $("nbCrumb").innerHTML = crumb([["Notes"]]);
    const list = D.EXAMS.filter(x => !x.hide && subsForExam(x).length);
    $("nbBody").innerHTML = `<h3 style="margin:0 0 12px;font:700 1.15rem Poppins,sans-serif">Choose your exam</h3><div class="nb-exams">${list.map(x =>
      `<button type="button" class="nb-exam" data-nbex="${E(x.id)}"><span class="ic" style="background:${E(x.color || "var(--pri)")}">${E(x.short || x.name)}</span><span><b>${E(x.name)}</b><small>${subsForExam(x).length} subjects · ${E(x.level || "")}</small></span></button>`).join("")}</div>`
      + (list.length ? "" : `<div class="mt-empty">No subject is given to you yet. Ask the owner.</div>`);
  }
  function nbSubjects() {
    const ex = exOf(nbExam); if (!ex) return nbExams();
    const subs = subsForExam(ex); if (!subs.some(s => s.id === nbSub)) nbSub = (subs[0] || {}).id;
    $("nbCrumb").innerHTML = crumb([["Notes", "exams"], [ex.name]]);
    const s = subs.find(x => x.id === nbSub); if (!s) { $("nbBody").innerHTML = ""; return; }
    const ready = c => !!D.NOTES[c.id], n = s.chapters.filter(ready).length;
    $("nbBody").innerHTML = `<div class="notes-wrap"><nav class="card nb-subs" aria-label="Subjects">${subs.map(x => `<button type="button" data-nbsub="${E(x.id)}" aria-pressed="${x.id === nbSub}">${E(x.name)}<span>${E(x.hi || "")}</span><span>${x.chapters.filter(ready).length} of ${x.chapters.length} ready</span></button>`).join("")}</nav>
      <div class="nb-chaps"><div class="sec-head" style="margin:0;display:block"><h2>${E(s.name)}</h2><p style="margin:2px 0 0">${n} of ${s.chapters.length} chapters ready</p></div>
      ${s.chapters.map((c, i) => { const r = ready(c), tags = r ? (D.NOTES[c.id].exams || []).join(", ") : "";
        return `<div class="row"><span class="num">${String(i + 1).padStart(2, "0")}</span><span class="t"><b>${E(c.title)}</b><span>${E(c.sub || "")}</span>${tags ? `<span class="tags">For: ${E(tags)}</span>` : ""}</span>
        <span class="act">${r ? `<span class="pill ok">Published</span><a class="btn btn-out btn-sm" href="note.html?id=${encodeURIComponent(c.id)}" target="_blank" rel="noopener">👁 Student view</a><button class="btn btn-pri btn-sm" type="button" data-nbch="${E(c.id)}">✎ Edit</button>`
          : `<span class="pill soon">Coming soon</span><button class="btn btn-pri btn-sm" type="button" data-nbch="${E(c.id)}">✎ Write notes</button>`}</span></div>`; }).join("")}
      <button type="button" class="nb-new" data-nbch="__new">＋ Add a new chapter to ${E(s.name)}</button></div></div>`;
  }
  function nbShow(editor) {
    $("nBrowse").hidden = editor; $("nEditor").hidden = !editor;
    if (!editor) { setFs(false); if (nbExam) nbSubjects(); else nbExams(); }
  }
  function nbOpen(cid) {
    const ex = exOf(nbExam), s = D.SUBJECTS.find(x => x.id === nbSub); if (!s) return;
    $("nSub").value = s.id; fillChapters(cid);
    if (cid === "__new" && ex && !$("nExams").value.trim()) $("nExams").value = ex.name;
    const c = s.chapters.find(x => x.id === cid);
    $("nbCrumb2").innerHTML = crumb([["Notes", "exams"], [ex ? ex.name : "Exam", "subs"], [s.name, "subs"], [c ? c.title : "New chapter"]]);
    nbShow(true); $("nEditor").scrollIntoView({ block: "start", behavior: "smooth" });
  }
  document.addEventListener("click", e => {
    const go = e.target.closest("[data-nb]"); if (go) { if (go.dataset.nb === "exams") nbExam = null; nbShow(false); return; }
    const ex = e.target.closest("[data-nbex]"); if (ex) { nbExam = ex.dataset.nbex; nbSub = null; nbSubjects(); return; }
    const sb = e.target.closest("[data-nbsub]"); if (sb) { nbSub = sb.dataset.nbsub; nbSubjects(); return; }
    const ch = e.target.closest("[data-nbch]"); if (ch) nbOpen(ch.dataset.nbch);
  });

  // shared with assets/admin-courses.js
  window.AdminAPI = { D, save, say, E, slug, isTeacher, mySubs, me: () => ME, writeB64, b64FromBytes, confirmBox: m => confirmBox(m) };

  // ---------- test instructions ----------
  const IOK = /^(H3|H4|P|UL|OL|LI|B|STRONG|I|EM|U|S|BR|MARK|SUB|SUP|DIV|SPAN)$/;
  const cleanI = h => { const d = new DOMParser().parseFromString("<div>" + (h || "") + "</div>", "text/html"), r = d.body.firstChild;
    (function w(el) { [...el.children].forEach(n => { if (!IOK.test(n.tagName)) { if (/^(SCRIPT|STYLE|IFRAME|OBJECT|EMBED|IMG|SVG|FORM|INPUT|LINK|META)$/.test(n.tagName)) { n.remove(); return; } w(n); n.replaceWith(...n.childNodes); return; }
      [...n.attributes].forEach(x => n.removeAttribute(x.name)); w(n); }); })(r); return r.innerHTML.replace(/<span>|<\/span>/g, ""); };
  let iKey = "general";
  function fillInstr() {
    $("iExam").innerHTML = `<option value="general">Common – all exams</option>` + D.EXAMS.filter(x => !x.hide).map(x => `<option value="${E(x.id)}">${E(x.name)} – extra notes</option>`).join("");
    $("iExam").value = iKey; loadInstr();
  }
  const loadInstr = () => { iKey = $("iExam").value; $("iEdit").innerHTML = cleanI(iKey === "general" ? D.INSTR.general : D.INSTR.exams[iKey] || ""); };
  $("iExam").addEventListener("change", loadInstr);
  $("iBar").addEventListener("mousedown", e => { if (e.target.closest("button")) e.preventDefault(); });
  $("iBar").addEventListener("click", e => { const b = e.target.closest("[data-ic]"); if (!b) return; const c = b.dataset.ic; $("iEdit").focus();
    if (c === "h3" || c === "p") document.execCommand("formatBlock", false, "<" + c + ">");
    else if (c === "mark") { const s = getSelection(); if (s.rangeCount && !s.isCollapsed) { const m = document.createElement("mark"); try { m.appendChild(s.getRangeAt(0).extractContents()); s.getRangeAt(0).insertNode(m); } catch (er) {} } }
    else document.execCommand(c); });
  $("iSave").addEventListener("click", async () => {
    const h = cleanI($("iEdit").innerHTML).trim();
    if (iKey === "general") D.INSTR.general = h; else if (h) D.INSTR.exams[iKey] = h; else delete D.INSTR.exams[iKey];
    try { say("Saving instructions…", "info", true); await save("INSTR"); say("Instructions saved. Students see them in about a minute.", "ok"); }
    catch (e) { say(e.status === 403 ? "Not allowed: ask the owner to let you edit test instructions." : "Could not save: " + e.message, "err"); }
  });

  // ---------- chapter picker ----------
  let nCid = "", docLoaded = false, pptLoaded = false, nTab = "doc", pQs = [], pOpen = -1;
  function fillSubjects() {
    $("nSub").innerHTML = D.SUBJECTS.filter(s => !isTeacher() || mySubs().includes(s.id)).map(s => `<option value="${E(s.id)}">${E(s.name)}</option>`).join("");
    fillChapters();
  }
  function fillChapters(keep) {
    const s = D.SUBJECTS.find(x => x.id === $("nSub").value) || (isTeacher() ? null : D.SUBJECTS[0]); if (!s) { $("nChap").innerHTML = ""; return; }
    $("nChap").innerHTML = s.chapters.map((c, i) => `<option value="${E(c.id)}">${i + 1}. ${E(c.title)}${D.NOTES[c.id] ? " ✓" : ""}</option>`).join("") + `<option value="__new">+ New chapter</option>`;
    if (keep) $("nChap").value = keep;
    loadChapter();
  }
  const ytId = u => { u = String(u || "").trim(); const m = /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/|v\/))([\w-]{11})/.exec(u); return m ? m[1] : /^[\w-]{11}$/.test(u) ? u : ""; };
  function drawVideo() { const id = ytId($("vUrl").value); $("vPrev").innerHTML = id ? `<iframe src="https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1" title="Video preview" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>` : ($("vUrl").value.trim() ? `<p class="bad-t" style="margin:0">This doesn't look like a YouTube link.</p>` : ""); paintStatus(); }
  $("vUrl").addEventListener("input", drawVideo);
  $("vDel").addEventListener("click", () => { $("vUrl").value = ""; $("vTitle").value = ""; drawVideo(); });
  function loadChapter(userPick) {
    const s = D.SUBJECTS.find(x => x.id === $("nSub").value), cid = $("nChap").value;
    const c = s && s.chapters.find(x => x.id === cid), n = D.NOTES[cid] || {};
    nCid = cid === "__new" ? "" : cid;
    $("nTitle").value = n.title || (c ? c.title : ""); $("nDesc").value = c ? c.sub || "" : "";
    $("nRead").value = n.read || ""; $("nExams").value = (n.exams || []).join(", "); $("nIntro").value = n.intro || "";
    $("nPdf").checked = !!n.pdf; whenSet("nWhen", n.publishAt); $("nDel").hidden = !D.NOTES[cid] || isTeacher();
    $("nDet").open = cid === "__new"; $("nDetInfo").textContent = cid === "__new" ? "– type the new chapter's title here" : "";
    $("vUrl").value = n.video ? "https://www.youtube.com/watch?v=" + n.video.id : ""; $("vTitle").value = n.video ? n.video.title || "" : ""; drawVideo();
    pQs = JSON.parse(JSON.stringify(n.quiz || [])); pOpen = -1; drawP();
    $("nView").href = nCid ? "note.html?id=" + encodeURIComponent(nCid) : "notes.html";
    docLoaded = pptLoaded = false; $("docFrame").src = "about:blank"; $("pptFrame").src = "about:blank";
    openNt(nTab, userPick ? true : undefined); paintStatus();
  }
  $("nSub").addEventListener("change", () => fillChapters());
  $("nChap").addEventListener("change", () => loadChapter(true));
  $("nTitle").addEventListener("input", paintStatus);

  // ---------- Doc / PPT / Video / Practice tabs ----------
  // Doc and PPT editors open in full screen; "Exit full screen" goes back to the normal view
  function setFs(on) {
    document.querySelectorAll(".nt-ed").forEach(p => p.classList.toggle("fs", on && !p.hidden));
    document.body.classList.toggle("nt-fs", on && (nTab === "doc" || nTab === "ppt"));
    document.querySelectorAll("[data-chtitle]").forEach(x => x.textContent = $("nTitle").value || "New chapter");
  }
  document.addEventListener("click", e => { const g = e.target.closest("[data-ntgo]"); if (g) { const t = g.dataset.ntgo; openNt(t, t === "doc" || t === "ppt"); return; } const f = e.target.closest("[data-fs]"); if (f) setFs(f.dataset.fs === "1"); if (e.target.closest("[data-fspub]")) $("nSave").click(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && document.body.classList.contains("nt-fs")) setFs(false); });
  function openNt(t, full) {
    nTab = t;
    document.querySelectorAll("#ntabs [data-nt]").forEach(b => b.setAttribute("aria-selected", b.dataset.nt === t));
    document.querySelectorAll("[data-np]").forEach(p => p.hidden = p.dataset.np !== t);
    const n = D.NOTES[nCid] || {};
    if (t === "doc" && !docLoaded) { docLoaded = true; $("docFrame").src = "docs-editor.html?embed=1" + (nCid ? "&ch=" + encodeURIComponent(nCid) : ""); }
    if (t === "ppt" && !pptLoaded) { pptLoaded = true; $("pptFrame").src = "slide-editor.html?embed=1" + (n.deck ? "&id=" + encodeURIComponent(n.deck) : "&title=" + encodeURIComponent($("nTitle").value || "Slides")); }
    if (full !== undefined) setFs(full && (t === "doc" || t === "ppt")); else setFs(document.body.classList.contains("nt-fs") && (t === "doc" || t === "ppt"));
  }
  $("ntabs").addEventListener("click", e => { const b = e.target.closest("[data-nt]"); if (b) openNt(b.dataset.nt, true); });
  function paintStatus() {
    const n = D.NOTES[nCid] || {}, mark = (id, on, txt) => { $(id).textContent = on ? txt : "Not added"; $(id).className = on ? "ok" : ""; };
    mark("stDoc", n.html || (n.phases || []).length, "✓ Added"); mark("stPpt", n.deck, "✓ Added");
    mark("stVid", ytId($("vUrl").value), "✓ Added"); mark("stPra", pQs.length, `✓ ${pQs.length} question${pQs.length === 1 ? "" : "s"}`);
  }
  const frameApi = f => { try { return f.contentWindow && f.contentWindow.SSCEmbed; } catch (e) { return null; } };

  // ---------- practice questions: question → options → solution → next ----------
  const pProblem = q => !q.q.trim() ? "has no question text" : q.opts.some(o => !o.trim()) ? "has an empty option" : q.a < 0 ? "has no correct answer ticked" : "";
  function pBody(q, i) {
    const img = (v, k) => v ? `<span class="thumb"><img src="${E(/^https:/.test(v) ? v : "assets/uploads/" + v)}" alt=""><button class="ibtn" type="button" data-pimgdel="${k}">✕</button></span>` : `<button class="ibtn im" type="button" data-pimg="${k}">🖼 Picture</button>`;
    return `<div class="qc-b">
      <label class="f2">Question ${i + 1}<textarea data-pf="q" placeholder="Type the question">${E(q.q)}</textarea></label><div>${img(q.img, "q")}</div>
      <div class="f2" style="font-weight:600;font-size:.88rem">Options <small class="muted" style="font-weight:400">– tick the correct one</small></div>
      ${q.opts.map((o, k) => `<div class="opt2${q.a === k ? " ok" : ""}"><input type="radio" name="pans${i}" data-pans="${k}" ${q.a === k ? "checked" : ""} aria-label="Option ${L(k)} is correct"><span class="L">${L(k)}</span>
        <input type="text" data-popt="${k}" value="${E(o)}" placeholder="Option ${L(k)}"><span></span>${q.opts.length > 2 ? `<button class="ibtn" type="button" data-podel="${k}" title="Remove option">✕</button>` : ""}</div>`).join("")}
      ${q.opts.length < 5 ? `<div><button class="ibtn" type="button" data-poadd>＋ Add option</button></div>` : ""}
      <label class="f2">Solution<textarea data-pf="why" placeholder="Explain the answer">${E(q.why || "")}</textarea></label><div>${img(q.wimg, "w")}</div>
      <div class="bar"><button class="btn btn-pri btn-sm" type="button" data-pnext>Save &amp; add next question</button><button class="btn btn-out btn-sm" type="button" data-pdone>Done</button></div></div>`;
  }
  function drawP() {
    $("pList").innerHTML = pQs.length ? pQs.map((q, i) => `<div class="qc${i === pOpen ? " open" : ""}" data-pi="${i}">
      <div class="qc-h" data-ptoggle><span class="qc-n">${i + 1}</span><span class="qc-t">${E(q.q || "(empty question)")}</span>
      <span class="qc-a"><button type="button" data-pmv="-1" title="Move up" ${i ? "" : "disabled"}>↑</button><button type="button" data-pmv="1" title="Move down" ${i < pQs.length - 1 ? "" : "disabled"}>↓</button><button type="button" class="del" data-pqdel title="Delete">🗑</button></span></div>
      ${i === pOpen ? pBody(q, i) : ""}</div>`).join("") : `<div class="mt-empty">No practice questions yet. Press ＋ Add question.</div>`;
    paintStatus();
  }
  function pAdd() { pQs.push({ q: "", opts: ["", "", "", ""], a: -1, why: "" }); pOpen = pQs.length - 1; drawP(); const c = $("pList").querySelector(".qc.open"); if (c) { c.scrollIntoView({ block: "start", behavior: "smooth" }); c.querySelector("textarea").focus(); } }
  $("pAdd").addEventListener("click", pAdd);
  $("pList").addEventListener("input", e => { const c = e.target.closest("[data-pi]"); if (!c) return; const q = pQs[+c.dataset.pi], t = e.target;
    if (t.dataset.pf) { q[t.dataset.pf] = t.value; if (t.dataset.pf === "q") c.querySelector(".qc-t").textContent = t.value || "(empty question)"; }
    if (t.dataset.popt != null) q.opts[+t.dataset.popt] = t.value; });
  $("pList").addEventListener("change", e => { const t = e.target; if (t.dataset.pans == null) return; const c = t.closest("[data-pi]"); pQs[+c.dataset.pi].a = +t.dataset.pans; c.querySelectorAll(".opt2").forEach((o, k) => o.classList.toggle("ok", k === +t.dataset.pans)); });
  $("pList").addEventListener("click", async e => {
    const c = e.target.closest("[data-pi]"); if (!c) return; const i = +c.dataset.pi, q = pQs[i];
    if (e.target.closest(".qc-a")) { const mv = e.target.closest("[data-pmv]");
      if (mv) { const j = i + +mv.dataset.pmv; [pQs[i], pQs[j]] = [pQs[j], pQs[i]]; pOpen = pOpen === i ? j : pOpen === j ? i : pOpen; drawP(); }
      if (e.target.closest("[data-pqdel]") && confirmBox(`Delete practice question ${i + 1}?`)) { pQs.splice(i, 1); pOpen = -1; drawP(); } return; }
    if (e.target.closest("[data-ptoggle]")) { pOpen = pOpen === i ? -1 : i; drawP(); return; }
    if (e.target.closest("[data-poadd]")) { q.opts.push(""); drawP(); return; }
    const od = e.target.closest("[data-podel]"); if (od) { const k = +od.dataset.podel; q.opts.splice(k, 1); if (q.a === k) q.a = -1; else if (q.a > k) q.a--; drawP(); return; }
    const im = e.target.closest("[data-pimg]"); if (im) { const name = await pickImage(); if (!name) return; if (im.dataset.pimg === "q") q.img = name; else q.wimg = name; drawP(); return; }
    const imd = e.target.closest("[data-pimgdel]"); if (imd) { if (imd.dataset.pimgdel === "q") delete q.img; else delete q.wimg; drawP(); return; }
    if (e.target.closest("[data-pnext]")) { const p = pProblem(q); if (p) return say(`Question ${i + 1} ${p}.`, "err"); pAdd(); return; }
    if (e.target.closest("[data-pdone]")) { const p = pProblem(q); if (p) say(`Question ${i + 1} ${p}.`, "err"); pOpen = -1; drawP(); }
  });

  // ---------- publish the whole chapter ----------
  $("nSave").addEventListener("click", async () => {
    const s = D.SUBJECTS.find(x => x.id === $("nSub").value); if (!s) return;
    if (isTeacher() && !mySubs().includes(s.id)) return say("You can only publish notes for your own subject.", "err");
    const title = $("nTitle").value.trim(); if (!title) { $("nDet").open = true; $("nTitle").focus(); return say("Give the chapter a title (Chapter details).", "err"); }
    for (let i = 0; i < pQs.length; i++) { const p = pProblem(pQs[i]); if (p) { openNt("practice"); pOpen = i; drawP(); return say(`Practice question ${i + 1} ${p}.`, "err"); } }
    const vid = ytId($("vUrl").value); if ($("vUrl").value.trim() && !vid) { openNt("video"); return say("The YouTube link is not right.", "err"); }
    let cid = $("nChap").value;
    if (cid === "__new") { const same = s.chapters.find(c => !D.NOTES[c.id] && (c.id === slug(title) || c.title.toLowerCase() === title.toLowerCase())); if (same) cid = same.id; }
    if (cid === "__new") { cid = slug(title); let k = 2; const all = D.SUBJECTS.flatMap(x => x.chapters.map(c => c.id)); while (all.includes(cid)) cid = slug(title) + "-" + k++; }
    const old = D.NOTES[cid] || {};
    const note = { subject: s.id, title, read: $("nRead").value.trim() || "10 min read", exams: $("nExams").value.split(",").map(x => x.trim()).filter(Boolean), intro: $("nIntro").value.trim() };
    const doc = docLoaded && frameApi($("docFrame")), ppt = pptLoaded && frameApi($("pptFrame"));
    if (docLoaded && !(doc && doc.ready)) return say("The Doc editor is still loading – try again in a moment.", "err");
    if (pptLoaded && !(ppt && ppt.ready)) return say("The PPT editor is still loading – try again in a moment.", "err");
    // document: from the Doc editor if it was opened, otherwise keep what is published
    if (doc) { if (!doc.empty()) note.html = doc.html(); }
    else { ["html", "phases", "tableTitle", "tableHead", "table", "tricks"].forEach(k => { if (old[k] !== undefined) note[k] = old[k]; }); }
    if (vid) note.video = { id: vid, title: $("vTitle").value.trim() };
    if (pQs.length) note.quiz = pQs.map(q => { const c = { ...q }; ["img", "wimg", "tag", "why"].forEach(k => { if (!c[k]) delete c[k]; }); return c; });
    if ($("nPdf").checked) note.pdf = true;
    const nw = whenVal("nWhen"); if (nw && nw > Date.now()) note.publishAt = nw;
    try {
      say("Publishing… saving slides", "info", true);
      if (ppt) { if (!ppt.empty()) note.deck = (ppt.dirty() || !old.deck) ? await ppt.save({ title, subject: s.id, chapter: cid, pdf: !!note.pdf }) : old.deck; }
      else if (old.deck) note.deck = old.deck;
      if (!note.html && !(note.phases || []).length && !note.deck && !note.video && !note.quiz) return say("Add something first: a document, slides, a video or practice questions.", "err");
      let c = s.chapters.find(x => x.id === cid);
      if (!c) { c = { id: cid, title, sub: $("nDesc").value.trim() }; s.chapters.push(c); }
      c.title = title; c.sub = $("nDesc").value.trim() || c.sub || ""; c.ready = true;
      if (note.publishAt) c.publishAt = note.publishAt; else delete c.publishAt;
      D.NOTES[cid] = note;
      say("Publishing… (1 of 2)", "info", true); await save("NOTES");
      say("Publishing… (2 of 2)", "info", true); await save("SUBJECTS");
      if (doc) doc.saved();
      const keepTab = nTab, wasDoc = docLoaded, wasPpt = pptLoaded;
      fillChapters(cid); if (wasDoc) openNt("doc"); if (wasPpt) openNt("ppt"); openNt(keepTab);
      { const ex = exOf(nbExam); $("nbCrumb2").innerHTML = crumb([["Notes", "exams"], [ex ? ex.name : "Exam", "subs"], [s.name, "subs"], [title]]); }
      say(`Published "${title}". Live in about a minute at note.html?id=${cid}`, "ok");
    } catch (e) { say(e.status === 403 ? "Not allowed: you can only change notes of your own subject." : e.status === 409 ? "Someone else changed the notes just now. Press Reload data on Status, then publish again." : "Could not publish: " + e.message, "err"); }
  });

  $("nDel").addEventListener("click", async () => {
    const cid = $("nChap").value; if (!D.NOTES[cid]) return;
    if (!confirmBox(`Delete the notes for "${D.NOTES[cid].title}"? The chapter stays in the list as "Coming soon".`)) return;
    delete D.NOTES[cid];
    D.SUBJECTS.forEach(s => s.chapters.forEach(c => { if (c.id === cid) c.ready = false; }));
    try { await save("NOTES"); await save("SUBJECTS"); fillChapters(cid); say("Chapter notes deleted.", "ok"); }
    catch (e) { say("Could not delete: " + e.message, "err"); }
  });
  // window.confirm is blocked in some previews; fall back to allowing the action there
  function confirmBox(msg) { try { return window.confirm(msg); } catch (e) { return true; } }

  // =====================================================================
  // MOCK TESTS (Exam → Tier → Type)
  // =====================================================================
  const TYPES = ["Full mock test", "Section-wise test", "Subject-wise test", "Chapter test", "PYQ paper"];
  const examById = id => D.EXAMS.find(x => x.id === id);
  const tiersOf = id => id === "all" ? [] : window.SSCTiers(examById(id));
  const examName = id => id === "all" ? "All SSC exams" : (examById(id) || {}).name || id;
  const L = k => String.fromCharCode(65 + k);
  let editing = null, tQs = [], tSecs = [], openQ = -1, qLang = "en", autoTitle = "";

  // ---------- list, grouped like the website ----------
  function fillFilters() {
    const v = $("mfExam").value;
    $("mfExam").innerHTML = `<option value="">All exams</option>` + D.EXAMS.map(x => `<option value="${E(x.id)}">${E(x.name)}</option>`).join("") + `<option value="all">All SSC exams (common)</option>`;
    $("mfExam").value = v; fillTierFilter();
    if (!$("mfType").options.length) $("mfType").innerHTML = `<option value="">All types</option>` + TYPES.map(t => `<option>${t}</option>`).join("");
  }
  function fillTierFilter() {
    const T = tiersOf($("mfExam").value), v = $("mfTier").value;
    $("mfTier").innerHTML = `<option value="">All tiers</option>` + T.map(t => `<option value="${E(t.id)}">${E(t.name)}</option>`).join("");
    $("mfTier").value = T.some(t => t.id === v) ? v : ""; $("mfTier").disabled = T.length < 2;
  }
  ["mfExam", "mfTier", "mfType"].forEach(k => $(k).addEventListener("change", () => { if (k === "mfExam") fillTierFilter(); drawTests(); }));
  function drawTests() {
    fillFilters();
    const fe = $("mfExam").value, ft = $("mfTier").value, fy = $("mfType").value;
    const all = Object.entries(D.TESTS).filter(([, t]) => !isTeacher() || mySubs().includes(t.subject));
    const exams = [...D.EXAMS.map(x => x.id), "all"].filter(id => !fe || id === fe);
    let html = "";
    exams.forEach(eid => {
      const mine = all.filter(([, t]) => t.exam === eid); if (!mine.length && fe !== eid) return;
      const ex = examById(eid), T = eid === "all" ? [{ id: "t1", name: "All tiers" }] : tiersOf(eid);
      const inner = T.filter(tr => !ft || tr.id === ft).map(tr => {
        const tl = mine.filter(([, t]) => eid === "all" || (t.tier || "t1") === tr.id);
        const types = TYPES.filter(y => !fy || y === fy).map(y => { const l = tl.filter(([, t]) => t.type === y); return l.length ? `<div class="mt-type"><h5>${y} · ${l.length}</h5><div class="list">${l.map(testItem).join("")}</div></div>` : ""; }).join("");
        return types || T.length > 1 ? `<div class="mt-tier">${T.length > 1 ? `<h4>${E(tr.name)}</h4>` : ""}${types || `<div class="mt-empty">No tests here yet.</div>`}</div>` : "";
      }).join("");
      html += `<div class="mt-ex"><h3 style="background:${ex ? ex.color : "linear-gradient(135deg,#475467,#1E2433)"}">${E(examName(eid))} <span>${mine.length} test${mine.length === 1 ? "" : "s"}</span></h3>${inner || `<div class="mt-tier"><div class="mt-empty">No tests here yet. Press ＋ New test.</div></div>`}</div>`;
    });
    $("tList").innerHTML = html || `<div class="mt-empty">No tests yet. Press ＋ New test to make your first one.</div>`;
  }
  const testItem = ([id, t]) => `<div class="item"><span class="t"><b>${E(t.title)}</b><span>${t.questions.length} questions · ${t.minutes} min · +${t.plus}/−${t.minus}${t.section ? " · " + E(t.section) : ""}${t.year ? " · " + E(t.year) + (t.shift ? " " + E(t.shift) : "") : ""}${whenText(t.publishAt)}</span></span>
      <a class="btn btn-out btn-sm" href="test.html?id=${encodeURIComponent(id)}" target="_blank" rel="noopener">Open</a>
      <button class="btn btn-out btn-sm" type="button" data-edit="${E(id)}">Edit</button><button class="btn btn-out btn-sm" type="button" data-copy="${E(id)}">Copy</button><button class="btn btn-del btn-sm" type="button" data-del="${E(id)}">Delete</button></div>`;
  $("tList").addEventListener("click", async e => {
    const ed = e.target.closest("[data-edit]"), cp = e.target.closest("[data-copy]"), del = e.target.closest("[data-del]");
    if (ed) { edTo(tEdHome); loadTest(ed.dataset.edit); }
    if (cp) { edTo(tEdHome); loadTest(cp.dataset.copy); editing = null; $("tTitle").value += " (copy)"; $("tFormTitle").textContent = "New test (copy)"; $("tOpen").hidden = true; }
    if (del) { const id = del.dataset.del; if (!confirmBox(`Delete the test "${D.TESTS[id].title}"? Students' old results stay saved.`)) return;
      delete D.TESTS[id]; const hadLive = D.LIVE.some(l => l.link === "test.html?id=" + id); D.LIVE = D.LIVE.filter(l => l.link !== "test.html?id=" + id);
      try { await save("TESTS"); if (hadLive && !isTeacher()) await save("LIVE"); drawTests(); drawLive(); if (editing === id) closeEd(); say("Test deleted.", "ok"); } catch (er) { say("Could not delete: " + er.message, "err"); } }
  });

  // ---------- step 1: where it goes ----------
  function fillExamSel() { $("tExam").innerHTML = D.EXAMS.map(x => `<option value="${E(x.id)}">${E(x.name)}</option>`).join("") + `<option value="all">All SSC exams (common)</option>`; }
  function fillTierSel(keep) {
    const T = tiersOf($("tExam").value);
    $("tTier").innerHTML = T.map(t => `<option value="${E(t.id)}">${E(t.name)}</option>`).join("");
    if (keep && T.some(t => t.id === keep)) $("tTier").value = keep;
    $("tTierW").hidden = T.length < 2; fillSecPick(); presetInfo();
  }
  const curTier = () => tiersOf($("tExam").value).find(t => t.id === $("tTier").value) || tiersOf($("tExam").value)[0];
  function fillSecPick(keep) {
    const tr = curTier(), names = tr ? tr.pattern.map(r => r[0]) : [];
    $("tSecPick").innerHTML = names.map(n => `<option>${E(n)}</option>`).join("") + `<option value="__other">Other…</option>`;
    if (keep) { if (!names.includes(keep)) $("tSecPick").insertAdjacentHTML("afterbegin", `<option>${E(keep)}</option>`); $("tSecPick").value = keep; }
  }
  function typeUi() { const ty = $("tType").value; $("tSecPickW").hidden = ty !== "Section-wise test"; $("tYearW").hidden = $("tShiftW").hidden = ty !== "PYQ paper"; presetInfo(); }
  function presetInfo() { const tr = curTier(); $("tPresetInfo").textContent = tr ? `${examName($("tExam").value)} ${tr.name}: ${tr.pattern.reduce((a, r) => a + (+r[1] || 0), 0)} questions · ${tr.minutes} min · +${tr.plus} / −${tr.minus}` : "Pick an exam to use its pattern"; $("tPreset").disabled = !tr; }
  const rePreset = () => { if (!editing && !tQs.length && curTier()) $("tPreset").click(); };
  $("tExam").addEventListener("change", () => { fillTierSel(); rePreset(); });
  $("tTier").addEventListener("change", () => { fillSecPick(); presetInfo(); rePreset(); });
  $("tType").addEventListener("change", () => { typeUi(); rePreset(); });
  $("tSecPick").addEventListener("change", () => { if ($("tSecPick").value === "__other") { const n = prompt("Section name"); if (n) fillSecPick(n.trim()); else fillSecPick(); } rePreset(); });

  // ---------- step 2: pattern ----------
  $("tPreset").addEventListener("click", () => {
    const tr = curTier(); if (!tr) return;
    const ty = $("tType").value;
    $("tPlus").value = tr.plus; $("tMinus").value = tr.minus;
    if (ty === "Section-wise test") { const r = tr.pattern.find(x => x[0] === $("tSecPick").value) || tr.pattern[0];
      tSecs = [{ name: r[0], minutes: +r[3] || Math.max(10, Math.round(r[1] * 0.6)), n: +r[1] || 0 }]; $("tMin").value = tSecs[0].minutes; $("tSect").checked = false; }
    else if (ty === "Full mock test" || ty === "PYQ paper") { tSecs = tr.pattern.map(r => ({ name: r[0], minutes: +r[3] || 0, n: +r[1] || 0 })); $("tMin").value = tr.minutes; $("tSect").checked = tSecs.every(s => s.minutes > 0) && tSecs.length > 1; }
    else { $("tMin").value = Math.max(10, Math.round((tQs.length || 25) * 0.6)); }
    if (!$("tTitle").value.trim() || $("tTitle").value === autoTitle) { const n = Object.values(D.TESTS).filter(t => t.exam === $("tExam").value && (t.tier || "t1") === tr.id && t.type === ty).length + 1;
      $("tTitle").value = `${examName($("tExam").value)} ${tr.name} – ${ty === "Full mock test" ? "Full Mock " + n : ty === "Section-wise test" ? $("tSecPick").value + " – Sectional " + n : ty === "PYQ paper" ? "PYQ " + ($("tYear").value || "") : ty + " " + n}`; autoTitle = $("tTitle").value; }
    drawSecs(); drawQs(); say("Exam pattern filled in. Check it, then add questions.", "ok");
  });
  function drawSecs() {
    $("tSecs").innerHTML = tSecs.length ? `<div class="mt-sec hd"><span>Section</span><span>Minutes</span><span>Questions</span><span></span></div>` + tSecs.map((s, i) => `<div class="mt-sec" data-si="${i}"><input data-k="name" value="${E(s.name)}" aria-label="Section name"><input data-k="minutes" type="number" min="0" value="${s.minutes || ""}" aria-label="Minutes"><input data-k="n" type="number" min="0" value="${s.n || ""}" aria-label="Planned questions"><button type="button" data-sdel title="Remove section">✕</button></div>`).join("")
      : `<p class="muted" style="margin:0">No sections – all questions in one part. Use ⚡ Use exam pattern or ＋ Add section.</p>`;
  }
  $("tSecs").addEventListener("input", e => { const row = e.target.closest("[data-si]"); if (!row) return; const s = tSecs[+row.dataset.si], k = e.target.dataset.k;
    if (k === "name") { const old = s.name; s.name = e.target.value; tQs.forEach(q => { if (q.section === old) q.section = s.name; }); } else s[k] = +e.target.value || 0; drawProg(); });
  $("tSecs").addEventListener("click", e => { const b = e.target.closest("[data-sdel]"); if (!b) return; tSecs.splice(+b.closest("[data-si]").dataset.si, 1); drawSecs(); drawQs(); });
  $("tSecAdd").addEventListener("click", () => { tSecs.push({ name: "Section " + (tSecs.length + 1), minutes: 15, n: 25 }); drawSecs(); drawQs(); });

  // ---------- step 3: questions ----------
  const secNames = () => tSecs.length ? tSecs.map(s => s.name) : ["General"];
  function drawProg() {
    $("tCount").textContent = `· ${tQs.length} added`;
    $("tSecProg").innerHTML = tSecs.length > 0 ? tSecs.map(s => { const n = tQs.filter(q => q.section === s.name).length; return `<span class="${s.n && n >= s.n ? "full" : ""}">${E(s.name)}: ${n}${s.n ? " / " + s.n : ""}</span>`; }).join("") : "";
  }
  const imgTag = (v, k) => v ? `<span class="thumb"><img src="${E(/^https:/.test(v) ? v : "assets/uploads/" + v)}" alt=""><button class="ibtn" type="button" data-imgdel="${k}">✕</button></span>` : `<button class="ibtn im" type="button" data-img="${k}">🖼 Picture</button>`;
  function qBody(q, i) {
    const hi = qLang === "hi", qt = hi ? q.qh || "" : q.q, ot = hi ? q.optsh || [] : q.opts, wt = hi ? q.whyh || "" : q.why || "";
    return `<div class="qc-b">
      <div class="qc-row"><label class="f2">Section<select data-f="section">${secNames().map(n => `<option${n === (q.section || "General") ? " selected" : ""}>${E(n)}</option>`).join("")}${q.section && !secNames().includes(q.section) ? `<option selected>${E(q.section)}</option>` : ""}</select></label>
        <label class="f2">Topic (optional)<input type="text" data-f="topic" value="${E(q.topic || "")}" placeholder="e.g. Algebra"></label></div>
      <div class="lang2" role="group" aria-label="Language"><button type="button" data-lang="en" aria-pressed="${!hi}">English</button><button type="button" data-lang="hi" aria-pressed="${hi}">हिन्दी</button></div>
      <label class="f2">${hi ? "प्रश्न (Hindi question)" : "Question"}<textarea data-f="${hi ? "qh" : "q"}" placeholder="${hi ? "प्रश्न यहाँ लिखें" : "Type the question"}">${E(qt)}</textarea></label>
      ${hi ? "" : `<div>${imgTag(q.img, "q")}</div>`}
      <div class="f2" style="font-weight:600;font-size:.88rem">Options <small class="muted" style="font-weight:400">– tick the correct one</small></div>
      ${q.opts.map((o, k) => `<div class="opt2${q.a === k ? " ok" : ""}"><input type="radio" name="ans${i}" data-ans="${k}" ${q.a === k ? "checked" : ""} aria-label="Option ${L(k)} is correct"><span class="L">${L(k)}</span>
        <input type="text" data-opt="${k}" value="${E(ot[k] || "")}" placeholder="${hi ? "विकल्प " : "Option "}${L(k)}">${hi ? "" : imgTag((q.oimg || [])[k], "o" + k)}${q.opts.length > 2 ? `<button class="ibtn" type="button" data-odel="${k}" title="Remove option">✕</button>` : ""}</div>`).join("")}
      ${q.opts.length < 5 && !hi ? `<div><button class="ibtn" type="button" data-oadd>＋ Add option</button></div>` : ""}
      <label class="f2">${hi ? "हल (Hindi solution)" : "Solution"}<textarea data-f="${hi ? "whyh" : "why"}" placeholder="${hi ? "हल यहाँ लिखें" : "Explain the answer"}">${E(wt)}</textarea></label>
      ${hi ? "" : `<div>${imgTag(q.wimg, "w")}</div>`}
      <div class="bar"><button class="btn btn-pri btn-sm" type="button" data-next>Save &amp; add next question</button><button class="btn btn-out btn-sm" type="button" data-done>Done</button></div></div>`;
  }
  function drawQs() {
    drawProg();
    $("qList").innerHTML = tQs.length ? tQs.map((q, i) => `<div class="qc${i === openQ ? " open" : ""}" data-qi="${i}">
      <div class="qc-h" data-toggle><span class="qc-n">${i + 1}</span><span class="qc-t"><small>${E(q.section || "General")}</small>${E(q.q || "(empty question)")}</span>
      <span class="qc-a"><button type="button" data-mv="-1" title="Move up" ${i ? "" : "disabled"}>↑</button><button type="button" data-mv="1" title="Move down" ${i < tQs.length - 1 ? "" : "disabled"}>↓</button><button type="button" data-dup title="Copy">⧉</button><button type="button" class="del" data-qdel title="Delete">🗑</button></span></div>
      ${i === openQ ? qBody(q, i) : ""}</div>`).join("") : `<div class="mt-empty">No questions yet. Press ＋ Add question, upload Excel/Word, or pick from the Question bank.</div>`;
  }
  const blankQ = sec => ({ section: sec || (tSecs.length ? tSecs[Math.max(0, tSecs.findIndex(s => tQs.filter(q => q.section === s.name).length < (s.n || 1e9)))].name : "General"), q: "", opts: ["", "", "", ""], a: -1, why: "" });
  function addQ() { tQs.push(blankQ(openQ >= 0 && tQs[openQ] ? tQs[openQ].section : null)); openQ = tQs.length - 1; qLang = "en"; drawQs(); const c = $("qList").querySelector(".qc.open"); if (c) { c.scrollIntoView({ block: "start", behavior: "smooth" }); c.querySelector("textarea").focus(); } }
  $("qAdd").addEventListener("click", addQ); $("qAdd2").addEventListener("click", addQ);
  $("qList").addEventListener("input", e => {
    const c = e.target.closest("[data-qi]"); if (!c) return; const q = tQs[+c.dataset.qi], t = e.target;
    if (t.dataset.f) { q[t.dataset.f] = t.value; if (t.dataset.f === "q") c.querySelector(".qc-t").lastChild.textContent = t.value || "(empty question)"; if (t.dataset.f === "section") { c.querySelector(".qc-t small").textContent = t.value; drawProg(); } }
    if (t.dataset.opt != null) { const k = +t.dataset.opt; if (qLang === "hi") { q.optsh = q.optsh || q.opts.map(() => ""); q.optsh[k] = t.value; } else q.opts[k] = t.value; }
    if (t.dataset.ans != null) { q.a = +t.dataset.ans; c.querySelectorAll(".opt2").forEach((o, k) => o.classList.toggle("ok", k === q.a)); }
  });
  $("qList").addEventListener("change", e => { const t = e.target; if (t.dataset.ans != null) { const c = t.closest("[data-qi]"); tQs[+c.dataset.qi].a = +t.dataset.ans; c.querySelectorAll(".opt2").forEach((o, k) => o.classList.toggle("ok", k === +t.dataset.ans)); } });
  const qProblem = q => !q.q.trim() ? "has no question text" : q.opts.filter(o => o.trim()).length < q.opts.length ? "has an empty option" : q.a < 0 ? "has no correct answer ticked" : "";
  $("qList").addEventListener("click", async e => {
    const c = e.target.closest("[data-qi]"); if (!c) return; const i = +c.dataset.qi, q = tQs[i];
    if (e.target.closest(".qc-a")) {
      const mv = e.target.closest("[data-mv]");
      if (mv) { const j = i + +mv.dataset.mv; [tQs[i], tQs[j]] = [tQs[j], tQs[i]]; openQ = openQ === i ? j : openQ === j ? i : openQ; drawQs(); }
      if (e.target.closest("[data-dup]")) { tQs.splice(i + 1, 0, JSON.parse(JSON.stringify(q))); openQ = i + 1; drawQs(); }
      if (e.target.closest("[data-qdel]") && confirmBox(`Delete question ${i + 1}?`)) { tQs.splice(i, 1); openQ = -1; drawQs(); }
      return;
    }
    if (e.target.closest("[data-toggle]")) { openQ = openQ === i ? -1 : i; drawQs(); return; }
    const lg = e.target.closest("[data-lang]"); if (lg) { qLang = lg.dataset.lang; drawQs(); return; }
    if (e.target.closest("[data-oadd]")) { q.opts.push(""); if (q.optsh) q.optsh.push(""); if (q.oimg) q.oimg.push(""); drawQs(); return; }
    const od = e.target.closest("[data-odel]"); if (od) { const k = +od.dataset.odel; q.opts.splice(k, 1); if (q.optsh) q.optsh.splice(k, 1); if (q.oimg) q.oimg.splice(k, 1); if (q.a === k) q.a = -1; else if (q.a > k) q.a--; drawQs(); return; }
    const im = e.target.closest("[data-img]"); if (im) { const k = im.dataset.img, name = await pickImage(); if (!name) return;
      if (k === "q") q.img = name; else if (k === "w") q.wimg = name; else { q.oimg = q.oimg || q.opts.map(() => ""); q.oimg[+k.slice(1)] = name; } drawQs(); return; }
    const imd = e.target.closest("[data-imgdel]"); if (imd) { const k = imd.dataset.imgdel; if (k === "q") delete q.img; else if (k === "w") delete q.wimg; else if (q.oimg) { q.oimg[+k.slice(1)] = ""; if (!q.oimg.some(Boolean)) delete q.oimg; } drawQs(); return; }
    if (e.target.closest("[data-next]")) { const p = qProblem(q); if (p) return say(`Question ${i + 1} ${p}.`, "err"); addQ(); return; }
    if (e.target.closest("[data-done]")) { const p = qProblem(q); if (p) say(`Question ${i + 1} ${p}.`, "err"); openQ = -1; drawQs(); }
  });
  // pictures go straight to assets/uploads/ on the website
  function pickImage() {
    return new Promise(ok => { const inp = document.createElement("input"); inp.type = "file"; inp.accept = "image/*";
      inp.onchange = async () => { const f = inp.files[0]; if (!f) return ok(null);
        if (f.size > 5e6) { say("Picture is too big (over 5 MB).", "err"); return ok(null); }
        const name = Date.now().toString(36) + "-" + f.name.toLowerCase().replace(/[^a-z0-9.\-]+/g, "-").slice(-50);
        try { say("Uploading picture…", "info", true); await writeB64("assets/uploads/" + name, b64FromBytes(new Uint8Array(await f.arrayBuffer())), "Admin: picture " + name); say("Picture added.", "ok"); ok(name); }
        catch (er) { say("Could not upload: " + er.message, "err"); ok(null); } };
      inp.click(); });
  }
  window.SSCAdminPickImage = pickImage;

  // ---------- bulk upload: Excel / CSV ----------
  const mergeQs = (list, what) => {
    if (!list.length) return;
    const add = !tQs.length || confirmBox(`Add the ${list.length} ${what} questions after your ${tQs.length} questions?\n\nCancel = replace all questions.`);
    tQs = add ? tQs.concat(list) : list; openQ = -1;
    list.forEach(q => { if (q.section && !tSecs.some(s => s.name === q.section) && !(tSecs.length === 0 && q.section === "General")) tSecs.push({ name: q.section, minutes: 0, n: 0 }); });
    drawSecs(); drawQs();
  };
  $("qXls").addEventListener("click", () => $("tFile").click());
  $("tFile").addEventListener("change", async e => {
    const f = e.target.files[0]; if (!f) return; e.target.value = "";
    try {
      say("Reading the file…", "info", true);
      if (!window.XLSX) await load(LIBS.xlsx);
      const wb = XLSX.read(await f.arrayBuffer());
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" });
      const pick = (r, k) => { const key = Object.keys(r).find(x => x.trim().toLowerCase() === k); return key ? String(r[key]).trim() : ""; };
      const out = [], bad = [];
      rows.forEach((r, i) => {
        const opts = ["a", "b", "c", "d", "e"].map(k => pick(r, k)).filter(Boolean);
        const ans = pick(r, "answer").toUpperCase().replace(/[^A-E]/g, "");
        const q = { q: pick(r, "question"), opts, a: ans ? ans.charCodeAt(0) - 65 : -1, why: pick(r, "explanation") || pick(r, "solution") };
        const sec = pick(r, "section"); if (sec) q.section = sec;
        const qh = pick(r, "question (hindi)"), oh = ["a", "b", "c", "d", "e"].map(k => pick(r, k + " (hindi)")).filter(Boolean);
        if (qh) { q.qh = qh; if (oh.length === opts.length) q.optsh = oh; const wh = pick(r, "explanation (hindi)") || pick(r, "solution (hindi)"); if (wh) q.whyh = wh; }
        const topic = pick(r, "topic"); if (topic) q.topic = topic;
        const im = k => { const v = pick(r, k); return !v ? "" : /^https:\/\//i.test(v) ? v : v.toLowerCase().replace(/[^a-z0-9.\-]+/g, "-"); };
        if (im("question image")) q.img = im("question image");
        const oi = ["a", "b", "c", "d", "e"].slice(0, opts.length).map(k => im(k + " image")); if (oi.some(Boolean)) q.oimg = oi;
        if (im("solution image")) q.wimg = im("solution image");
        if (!q.q || opts.length < 2 || q.a < 0 || q.a >= opts.length) bad.push(i + 2); else out.push(q);
      });
      mergeQs(out, "Excel");
      say(bad.length ? `${out.length} questions added. Skipped rows ${bad.slice(0, 10).join(", ")} (missing question, options or answer).` : `${out.length} questions added from Excel.`, bad.length ? "err" : "ok");
    } catch (err) { say("Could not read the file: " + err.message, "err"); }
  });
  $("tTpl").addEventListener("click", () => {
    const csv = "Section,Topic,Question,A,B,C,D,Answer,Explanation,Question (Hindi),A (Hindi),B (Hindi),C (Hindi),D (Hindi),Explanation (Hindi),Question image,A image,B image,C image,D image,Solution image\n" +
      'General Awareness,Polity – British Acts,Which Act introduced dyarchy in the provinces?,Indian Councils Act 1909,Government of India Act 1919,Government of India Act 1935,Charter Act 1853,B,"The 1919 Act split provincial subjects into transferred and reserved.",प्रांतों में द्वैध शासन किस अधिनियम ने शुरू किया?,भारतीय परिषद अधिनियम 1909,भारत सरकार अधिनियम 1919,भारत सरकार अधिनियम 1935,चार्टर अधिनियम 1853,"1919 के अधिनियम ने प्रांतीय विषयों को हस्तांतरित और आरक्षित में बाँटा।",,,,,,\n' +
      'Quantitative Aptitude,Algebra,"If $x + \\frac{1}{x} = 3$, find $x^2 + \\frac{1}{x^2}$",7,9,11,5,A,"Square both sides: $x^2 + 2 + \\frac{1}{x^2} = 9$, so the answer is 7.",,,,,,,,,,,,\n';
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv" })); a.download = "ssc-test-template.csv"; a.click();
  });

  // ---------- bulk upload: Word ----------
  function parseWordQs(text) {
    const out = []; let sec = "", q = null, field = null;
    const push = () => { if (q && q.q) out.push(q); q = null; field = null; };
    text.split(/\r?\n/).map(l => l.trim()).forEach(l => {
      if (!l) return;
      let m;
      if ((m = /^section\s*[:\-–]\s*(.+)$/i.exec(l))) { push(); sec = m[1].trim(); return; }
      if ((m = /^(?:q(?:uestion)?\.?\s*)?(\d+)\s*[.):]\s*(.+)$/i.exec(l)) && !/^\(?[a-e][).]/i.test(l)) { push(); q = { q: m[2], opts: [], a: -1, why: "" }; if (sec) q.section = sec; field = "q"; return; }
      if (!q) { q = { q: l, opts: [], a: -1, why: "" }; if (sec) q.section = sec; field = "q"; return; }
      if ((m = /^\(?([a-e])[).]\s*hindi\s*:\s*(.+)$/i.exec(l))) { q.optsh = q.optsh || []; q.optsh[m[1].toLowerCase().charCodeAt(0) - 97] = m[2]; return; }
      if ((m = /^(\*)?\s*\(?([a-e])[).]\s*(.+)$/i.exec(l)) && field !== "why") {
        // several options on one line: (a) 7 (b) 9 (c) 11 (d) 5
        const parts = (m[1] ? "" : l).split(/\s*\(([a-e])\)\s*/i).filter(Boolean);
        if (!m[1] && parts.length > 2 && parts.length % 2 === 0) { for (let k = 0; k < parts.length; k += 2) q.opts.push(parts[k + 1].replace(/\s*\*$/, "")); }
        else { if (m[1] || /\*$/.test(m[3])) q.a = q.opts.length; q.opts.push(m[3].replace(/\s*\*$/, "").replace(/\s*\((correct|right)\)$/i, "")); }
        field = "opt"; return; }
      if ((m = /^(?:ans(?:wer)?|correct(?: answer)?)\s*[.:\-–]?\s*\(?([a-e])\)?/i.exec(l))) { q.a = m[1].toLowerCase().charCodeAt(0) - 97; field = null; return; }
      if ((m = /^(?:sol(?:ution)?|explanation|why|exp)\s*[.:\-–]\s*(.*)$/i.exec(l))) { q.why = m[1]; field = "why"; return; }
      if ((m = /^topic\s*[:\-–]\s*(.+)$/i.exec(l))) { q.topic = m[1]; return; }
      if ((m = /^hindi\s*[:\-–]\s*(.+)$/i.exec(l))) { q.qh = m[1]; return; }
      if ((m = /^(?:hindi solution|हल)\s*[:\-–]\s*(.+)$/i.exec(l))) { q.whyh = m[1]; return; }
      if (field === "q") q.q += "\n" + l; else if (field === "why") q.why += (q.why ? "\n" : "") + l;
    });
    push();
    const ok = [], bad = [];
    out.forEach((q, i) => { if (q.optsh && q.optsh.length !== q.opts.length) delete q.optsh; if (q.opts.length >= 2 && q.a >= 0 && q.a < q.opts.length) ok.push(q); else bad.push(i + 1); });
    return { ok, bad };
  }
  $("qDoc").addEventListener("click", () => $("tDocx").click());
  $("qDocHelp").addEventListener("click", () => $("docHelp").hidden = !$("docHelp").hidden);
  $("tDocx").addEventListener("change", async e => {
    const f = e.target.files[0]; if (!f) return; e.target.value = "";
    try { say("Reading the Word file…", "info", true);
      if (!window.mammoth) await load(LIBS.mammoth);
      const res = await mammoth.extractRawText({ arrayBuffer: await f.arrayBuffer() });
      const r = parseWordQs(res.value);
      if (!r.ok.length) return say("No questions found. Press “? Word format” to see how to write them.", "err");
      mergeQs(r.ok, "Word");
      say(r.bad.length ? `${r.ok.length} questions added. Questions ${r.bad.slice(0, 10).join(", ")} were skipped (need options and an answer).` : `${r.ok.length} questions added from Word.`, r.bad.length ? "err" : "ok");
    } catch (err) { say("Could not read the Word file: " + err.message, "err"); }
  });

  // ---------- question bank ----------
  let bankRows = [];
  $("qBank").addEventListener("click", () => {
    const ids = Object.keys(D.TESTS).filter(id => id !== editing);
    if (!ids.length) return say("No earlier tests yet. The question bank fills up as you publish tests.", "info");
    $("bTest").innerHTML = `<option value="">All tests</option>` + ids.map(id => `<option value="${E(id)}">${E(D.TESTS[id].title)}</option>`).join("");
    $("bFind").value = ""; $("bAll").checked = false; fillBankSec(); drawBank(); $("bankDlg").showModal();
  });
  function fillBankSec() { const ids = $("bTest").value ? [$("bTest").value] : Object.keys(D.TESTS).filter(id => id !== editing);
    const secs = [...new Set(ids.flatMap(id => D.TESTS[id].questions.map(q => q.section || "General")))];
    $("bSec").innerHTML = `<option value="">All sections</option>` + secs.map(s => `<option>${E(s)}</option>`).join(""); }
  function drawBank() {
    const ids = $("bTest").value ? [$("bTest").value] : Object.keys(D.TESTS).filter(id => id !== editing), sec = $("bSec").value, w = $("bFind").value.trim().toLowerCase();
    const have = new Set(tQs.map(q => q.q.trim()));
    bankRows = ids.flatMap(id => D.TESTS[id].questions.map(q => ({ q, from: D.TESTS[id].title }))).filter(x => (!sec || (x.q.section || "General") === sec) && (!w || (x.q.q + " " + (x.q.topic || "")).toLowerCase().includes(w)));
    $("bList").innerHTML = bankRows.length ? bankRows.slice(0, 400).map((x, i) => `<label><input type="checkbox" data-b="${i}"${have.has(x.q.q.trim()) ? " disabled" : ""}><span>${E(x.q.q)}<small>${E(x.q.section || "General")}${x.q.topic ? " · " + E(x.q.topic) : ""} · ${E(x.from)}${have.has(x.q.q.trim()) ? " · already in this test" : ""}</small></span></label>`).join("") : `<p class="muted">No questions match.</p>`;
    $("bInfo").textContent = bankRows.length + " questions";
  }
  $("bTest").addEventListener("change", () => { fillBankSec(); drawBank(); });
  $("bSec").addEventListener("change", drawBank); $("bFind").addEventListener("input", drawBank);
  $("bAll").addEventListener("change", () => $("bList").querySelectorAll("input:not(:disabled)").forEach(c => c.checked = $("bAll").checked));
  $("bCancel").addEventListener("click", () => $("bankDlg").close());
  $("bAdd").addEventListener("click", () => {
    const picked = [...$("bList").querySelectorAll("input:checked")].map(c => JSON.parse(JSON.stringify(bankRows[+c.dataset.b].q)));
    $("bankDlg").close(); if (!picked.length) return;
    tQs = tQs.concat(picked); picked.forEach(q => { if (q.section && tSecs.length && !tSecs.some(s => s.name === q.section)) tSecs.push({ name: q.section, minutes: 0, n: 0 }); });
    drawSecs(); drawQs(); say(`${picked.length} questions added from the question bank.`, "ok");
  });

  // ---------- open / close / save ----------
  function openEd() { $("tEd").hidden = false; $("tEd").scrollIntoView({ behavior: "smooth", block: "start" }); }
  function closeEd() { $("tEd").hidden = true; editing = null; }
  $("tClose").addEventListener("click", () => { if (tQs.length && !confirmBox("Close without publishing? Unpublished changes will be lost.")) return; closeEd(); });
  // subject of a test (teachers: only their own subjects, only subject-wise / chapter tests)
  function fillSubjSel(v) {
    const list = D.SUBJECTS.filter(s => !isTeacher() || mySubs().includes(s.id));
    $("tSubj").innerHTML = (isTeacher() ? "" : `<option value="">– none –</option>`) + list.map(s => `<option value="${E(s.id)}">${E(s.name)}</option>`).join("");
    if (v != null && list.some(s => s.id === v)) $("tSubj").value = v;
    if (isTeacher()) { [...$("tType").options].forEach(o => o.hidden = !/^(Subject-wise test|Chapter test)$/.test(o.value)); if (!/^(Subject-wise test|Chapter test)$/.test($("tType").value)) { $("tType").value = "Subject-wise test"; typeUi(); } $("tLiveW").hidden = true; $("tLive").checked = false; }
  }
  function resetTest() {
    editing = null; tQs = []; tSecs = []; openQ = -1; qLang = "en"; $("tFormTitle").textContent = "New test"; $("tOpen").hidden = true;
    fillExamSel(); const fe = $("mfExam").value; if (fe) $("tExam").value = fe; fillTierSel($("mfTier").value);
    $("tType").value = $("mfType").value || "Full mock test"; typeUi();
    ["tTitle", "tYear", "tShift"].forEach(k => $(k).value = ""); $("tMin").value = 60; $("tPlus").value = 2; $("tMinus").value = 0.5;
    $("tLive").checked = true; $("tSect").checked = false; $("tStrict").checked = false; whenSet("tWhen", null);
    fillSubjSel("");
    if (curTier() && !isTeacher()) $("tPreset").click(); else { drawSecs(); drawQs(); }
  }
  $("tNew").addEventListener("click", () => { edTo(tEdHome); resetTest(); openEd(); });
  function loadTest(id) {
    const t = D.TESTS[id]; editing = id; tQs = JSON.parse(JSON.stringify(t.questions)); openQ = -1; qLang = "en";
    fillExamSel(); $("tExam").value = examById(t.exam) || t.exam === "all" ? t.exam : "all"; fillTierSel(t.tier || "t1");
    $("tType").value = t.type; typeUi(); if (t.section) fillSecPick(t.section); fillSubjSel(t.subject || "");
    $("tFormTitle").textContent = "Edit test"; $("tTitle").value = t.title; $("tYear").value = t.year || ""; $("tShift").value = t.shift || "";
    $("tMin").value = t.minutes; $("tPlus").value = t.plus; $("tMinus").value = t.minus; $("tLive").checked = D.LIVE.some(l => l.link === "test.html?id=" + id);
    $("tSect").checked = !!t.sectional; $("tStrict").checked = !!t.strict; whenSet("tWhen", t.publishAt);
    const names = t.sections && t.sections.length ? t.sections.map(s => s.name) : [...new Set(tQs.map(q => q.section).filter(Boolean))];
    tSecs = names.map(n => ({ name: n, minutes: ((t.sections || []).find(s => s.name === n) || {}).minutes || 0, n: (t.plan || {})[n] || 0 }));
    $("tOpen").href = "test.html?id=" + encodeURIComponent(id); $("tOpen").hidden = false;
    drawSecs(); drawQs(); openEd();
  }
  $("tSave").addEventListener("click", async () => {
    const title = $("tTitle").value.trim(); if (!title) return say("Give the test a name (step 1).", "err");
    if (!tQs.length) return say("Add questions first (step 3).", "err");
    for (let i = 0; i < tQs.length; i++) { const p = qProblem(tQs[i]); if (p) { openQ = i; drawQs(); return say(`Question ${i + 1} ${p}.`, "err"); } }
    let id = editing; if (!id) { id = slug(title); let k = 2; while (D.TESTS[id]) id = slug(title) + "-" + k++; }
    const exam = $("tExam").value, type = $("tType").value, tr = curTier(), subj = $("tSubj").value;
    if (isTeacher() && !mySubs().includes(subj)) return say("Choose your subject for this test (step 1).", "err");
    const qs = tQs.map(q => { const c = { ...q }; ["topic", "qh", "whyh", "img", "wimg"].forEach(k => { if (!c[k]) delete c[k]; }); if (c.optsh && !c.optsh.some(Boolean)) delete c.optsh; if (c.oimg && !c.oimg.some(Boolean)) delete c.oimg; if (!c.section) c.section = "General"; return c; });
    const t = { title, exam, type, minutes: +$("tMin").value || 60, plus: +$("tPlus").value || 1, minus: +$("tMinus").value || 0, questions: qs };
    if (tr && exam !== "all") t.tier = tr.id;
    if (subj) t.subject = subj;
    if (type === "Section-wise test") t.section = $("tSecPick").value;
    if (type === "PYQ paper") { if ($("tYear").value.trim()) t.year = $("tYear").value.trim(); if ($("tShift").value.trim()) t.shift = $("tShift").value.trim(); }
    if ($("tStrict").checked) t.strict = true;
    const tw = whenVal("tWhen"); if (tw && tw > Date.now()) t.publishAt = tw;
    const order = tSecs.map(s => s.name); qs.sort((a, b) => { const x = order.indexOf(a.section), y = order.indexOf(b.section); return (x < 0 ? 99 : x) - (y < 0 ? 99 : y); });
    if (tSecs.length) t.plan = Object.fromEntries(tSecs.filter(s => s.n).map(s => [s.name, s.n]));
    if ($("tSect").checked) {
      const names = [...new Set(qs.map(q => q.section))];
      t.sectional = true; t.sections = names.map(n => ({ name: n, minutes: ((tSecs.find(s => s.name === n) || {}).minutes) || 15 }));
      t.minutes = t.sections.reduce((s, x) => s + x.minutes, 0);
    } else if (tSecs.length > 1) t.sections = tSecs.filter(s => qs.some(q => q.section === s.name)).map(s => ({ name: s.name, minutes: s.minutes || 0 }));
    D.TESTS[id] = t;
    const link = "test.html?id=" + id, entry = { name: title, type, exams: examName(exam) + (tr && exam !== "all" && tiersOf(exam).length > 1 ? " · " + tr.name : ""), questions: qs.length, minutes: t.minutes, marking: `+${t.plus} / −${t.minus}`, link };
    if (t.publishAt) entry.publishAt = t.publishAt;
    const i = D.LIVE.findIndex(l => l.link === link);
    if (!isTeacher()) { if ($("tLive").checked) { if (i >= 0) D.LIVE[i] = entry; else D.LIVE.unshift(entry); } else if (i >= 0) D.LIVE.splice(i, 1); }
    try {
      say("Publishing test… (1 of 2)", "info", true); await save("TESTS");
      if (!isTeacher()) { say("Publishing test… (2 of 2)", "info", true); await save("LIVE"); }
      editing = id; tQs = JSON.parse(JSON.stringify(qs)); drawQs(); drawTests(); drawLive(); $("tFormTitle").textContent = "Edit test"; $("tOpen").href = link; $("tOpen").hidden = false;
      say(`Published "${title}" with ${qs.length} questions under ${examName(exam)}${tr && exam !== "all" ? " → " + tr.name : ""} → ${type}. Live in about a minute.`, "ok");
    } catch (e) { say("Could not publish: " + e.message, "err"); }
  });
  $("tSect").addEventListener("change", () => { if ($("tSect").checked && tSecs.length) $("tMin").value = tSecs.reduce((a, s) => a + (s.minutes || 0), 0) || $("tMin").value; });

  // =====================================================================
  // LIVE TESTS
  // =====================================================================
  function drawLive() {
    $("lList").innerHTML = D.LIVE.length ? D.LIVE.map((l, i) => { const id = (/[?&]id=([^&]+)/.exec(l.link) || [])[1];
      return `<div class="item"><span class="t"><b>${E(l.name)}</b><span>${E(l.type)} · ${E(l.exams || "")} · ${l.questions} questions · ${l.minutes} min · ${E(l.marking || "")}${whenText(l.publishAt)}</span></span>
      <a class="btn btn-out btn-sm" href="${E(l.link)}" target="_blank" rel="noopener">Open</a>
      ${id && D.TESTS[id] ? `<button class="btn btn-out btn-sm" type="button" data-ledit="${E(id)}">Edit</button>` : ""}
      <button class="btn btn-out btn-sm" type="button" data-up="${i}" ${i ? "" : "disabled"} aria-label="Move up">↑</button>
      <button class="btn btn-out btn-sm" type="button" data-down="${i}" ${i < D.LIVE.length - 1 ? "" : "disabled"} aria-label="Move down">↓</button>
      <button class="btn btn-del btn-sm" type="button" data-rm="${i}">Remove</button></div>`; }).join("") : `<p class="muted" style="margin:0">No live tests yet. Press ＋ New live test.</p>`;
  }
  // the same test editor as Mock tests, shown here
  const tEdHome = $("tEd").parentNode;
  const edTo = host => { if ($("tEd").parentNode !== host) host.appendChild($("tEd")); };
  $("lNew").addEventListener("click", () => { edTo($("lEdHost")); resetTest(); $("tLive").checked = true; $("tFormTitle").textContent = "New live test"; openEd(); });
  $("lList").addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.ledit) { edTo($("lEdHost")); loadTest(b.dataset.ledit); $("tFormTitle").textContent = "Edit live test"; return; }
    const i = +(b.dataset.up ?? b.dataset.down ?? b.dataset.rm);
    if (b.dataset.up) [D.LIVE[i - 1], D.LIVE[i]] = [D.LIVE[i], D.LIVE[i - 1]];
    if (b.dataset.down) [D.LIVE[i + 1], D.LIVE[i]] = [D.LIVE[i], D.LIVE[i + 1]];
    if (b.dataset.rm && !confirmBox(`Remove "${D.LIVE[i].name}" from Live tests? The test itself stays in Mock tests.`)) return;
    if (b.dataset.rm) D.LIVE.splice(i, 1);
    drawLive(); say("Press Save order / removals to publish this change.", "info");
  });
  $("lSave").addEventListener("click", async () => { try { say("Publishing…", "info", true); await save("LIVE"); say("Live tests published.", "ok"); } catch (e) { say("Could not publish: " + e.message, "err"); } });

  // =====================================================================
  // WHAT'S NEW
  // =====================================================================
  $("wDate").value = new Date().toISOString().slice(0, 10);
  function drawNews() {
    D.NEWS.sort((a, b) => b.date.localeCompare(a.date));
    $("wList").innerHTML = D.NEWS.length ? D.NEWS.map((n, i) => `<div class="item"><span class="t"><b>${E(n.text)}</b><span>${E(n.date)}${n.link ? " · " + E(n.link) : ""}</span></span><button class="btn btn-del btn-sm" type="button" data-wrm="${i}">Remove</button></div>`).join("") : `<p class="muted" style="margin:0">Nothing yet.</p>`;
  }
  $("wAdd").addEventListener("click", () => {
    const text = $("wText").value.trim(); if (!text) return say("Write what changed.", "err");
    const n = { date: $("wDate").value || new Date().toISOString().slice(0, 10), text }; if ($("wLink").value.trim()) n.link = $("wLink").value.trim();
    D.NEWS.unshift(n); $("wText").value = ""; $("wLink").value = ""; drawNews(); say("Added. Press Publish to put it live.", "ok");
  });
  $("wList").addEventListener("click", e => { const b = e.target.closest("[data-wrm]"); if (!b) return; D.NEWS.splice(+b.dataset.wrm, 1); drawNews(); });
  $("wSave").addEventListener("click", async () => { try { say("Publishing…", "info", true); await save("NEWS"); say("What's new published.", "ok"); } catch (e) { say("Could not publish: " + e.message, "err"); } });

  // =====================================================================
  // REPORTS (mistakes reported by students)
  // =====================================================================
  const testName = id => (D.TESTS[id] && D.TESTS[id].title) || (id === "polity-ch1-4" ? "Indian Polity – Chapters 1 to 4" : id);
  async function drawReports() {
    try {
      const r = await fetch("/api/admin/reports", { cache: "no-store" }); const d = await r.json(); if (!r.ok) throw new Error(d.error || r.status);
      $("rList").innerHTML = d.reports.map(x => `<div class="item"><span class="t"><b>${E(testName(x.test))} · Question ${x.q + 1}</b>
        <span>${E(x.why || "")}${x.text ? " – " + E(x.text) : ""}</span><span>${x.by ? E(x.by) + " · " : ""}${new Date(x.created).toLocaleString("en-IN")}</span></span>
        ${D.TESTS[x.test] ? `<button class="btn btn-out btn-sm" type="button" data-redit="${E(x.test)}">Edit test</button>` : ""}
        <button class="btn btn-out btn-sm" type="button" data-rdel="${x.id}">Done – remove</button></div>`).join("") || `<p class="muted" style="margin:0">No reports. All good!</p>`;
    } catch (e) { $("rList").innerHTML = `<p class="muted" style="margin:0">Could not load reports: ${E(e.message)}</p>`; }
  }
  $("rList").addEventListener("click", async e => {
    const del = e.target.closest("[data-rdel]"), ed = e.target.closest("[data-redit]");
    if (del) { try { await fetch("/api/admin/reports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "delete", id: +del.dataset.rdel }) }); drawReports(); } catch (er) { say("Could not remove.", "err"); } }
    if (ed) { openTab("tests"); const b = document.querySelector(`[data-edit="${CSS.escape(ed.dataset.redit)}"]`); if (b) b.click(); }
  });
  document.querySelector('#atabs [data-t="reports"]').addEventListener("click", drawReports);

  // =====================================================================
  // WEBSITE (menu, name, footer, exams, subjects, topics, page edits)
  // =====================================================================
  const NAVD = [["home.html", "Home"], ["mock-tests.html", "Mock Tests"], ["live-tests.html", "Live Tests"], ["notes.html", "Notes"], ["pyq.html", "PYQ Papers"], ["rank-calculator.html", "Rank Calculator"], ["daily-quiz.html", "Daily Quiz"], ["leaderboard.html", "Leaderboard"], ["home.html#about", "About"]];
  let navRows = [];
  function drawWebsite() {
    const pages = [["home.html", "Home"], ["privacy.html", "Privacy Policy"], ["terms.html", "Terms of Use"], ["contact.html", "Contact"], ["mock-tests.html", "Mock Tests"], ["live-tests.html", "Live Tests"], ["notes.html", "Notes"], ["rank-calculator.html", "Rank Calculator"], ["pyq.html", "PYQ Papers"], ["rank-calculator.html", "Rank Calculator"], ["daily-quiz.html", "Daily quiz"], ["leaderboard.html", "Leaderboard"], ["account.html", "Account details"], ...D.EXAMS.map(x => [x.page, x.name + " page"])];
    const edited = (D.SITE.pages || {});
    $("wPages").innerHTML = pages.map(([u, n]) => `<div class="item"><span class="t"><b>${E(n)}</b><span>${E(u)}${edited[u.replace(/\.html$/, "")] ? " · has your edits" : ""}</span></span><a class="btn btn-out btn-sm" href="${E(u)}?edit=1" target="_blank" rel="noopener">✎ Edit page</a></div>`).join("");
    const sh = D.SITE.shell || {};
    $("wBrand").value = sh.brand || ""; $("wEmail").value = sh.email || ""; $("wFoot1").value = sh.foot1 ? sh.foot1.replace(/<[^>]+>/g, "") : ""; $("wFoot2").value = sh.foot2 ? sh.foot2.replace(/<[^>]+>/g, "") : "";
    $("wFoot1").placeholder = "© SSCAspirants_Official · Created by an idiot and created for idiots"; $("wFoot2").placeholder = "Notes, mock tests and PYQs for SSC exams · @SSCAspirants_Official";
    const nv = sh.nav || {};
    navRows = NAVD.map(([h, n]) => ({ h, n: (nv[h] && nv[h].label) || n, def: n, hide: !!(nv[h] && nv[h].hide), own: false }))
      .concat((sh.links || []).map(l => ({ h: l.href, n: l.label, hide: !!l.hide, own: true })));
    if (sh.navOrder) navRows.sort((a, b) => { const ia = sh.navOrder.indexOf(a.h), ib = sh.navOrder.indexOf(b.h); return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib); });
    drawNav(); drawExams(); drawSubs(); drawTopics();
  }
  function drawNav() {
    $("wNav").innerHTML = navRows.map((r, i) => `<div class="item" data-i="${i}"><input data-f="n" value="${E(r.n)}" aria-label="Menu label" style="flex:1 1 160px;min-height:40px;border:1px solid var(--line);border-radius:9px;padding:0 10px">
      <input data-f="h" value="${E(r.h)}" ${r.own ? "" : "readonly"} aria-label="Link" style="flex:1 1 160px;min-height:40px;border:1px solid var(--line);border-radius:9px;padding:0 10px;${r.own ? "" : "opacity:.6"}">
      <label style="display:flex;gap:6px;align-items:center;font-weight:600"><input type="checkbox" data-f="show" ${r.hide ? "" : "checked"}> Show</label>
      <button class="btn btn-out btn-sm" type="button" data-m="-1" ${i ? "" : "disabled"}>↑</button><button class="btn btn-out btn-sm" type="button" data-m="1" ${i < navRows.length - 1 ? "" : "disabled"}>↓</button>
      ${r.own ? `<button class="btn btn-del btn-sm" type="button" data-rm>Delete</button>` : ""}</div>`).join("");
  }
  const readNav = () => $("wNav").querySelectorAll("[data-i]").forEach(row => { const r = navRows[+row.dataset.i]; r.n = row.querySelector('[data-f="n"]').value.trim(); r.h = row.querySelector('[data-f="h"]').value.trim(); r.hide = !row.querySelector('[data-f="show"]').checked; });
  $("wNav").addEventListener("click", e => { const row = e.target.closest("[data-i]"); if (!row) return; const i = +row.dataset.i;
    if (e.target.closest("[data-m]")) { readNav(); const j = i + +e.target.closest("[data-m]").dataset.m; [navRows[i], navRows[j]] = [navRows[j], navRows[i]]; drawNav(); }
    if (e.target.closest("[data-rm]")) { readNav(); navRows.splice(i, 1); drawNav(); } });
  $("wNavAdd").onclick = () => { readNav(); navRows.push({ h: "https://", n: "New link", hide: false, own: true }); drawNav(); };
  $("wShellSave").onclick = async () => {
    readNav();
    for (const r of navRows) if (r.own && !/^(https?:\/\/[^\s]+|[\w./#?=&-]+)$/i.test(r.h)) return say(`The link for "${r.n}" doesn't look right.`, "err");
    const sh = D.SITE.shell = D.SITE.shell || {};
    const em = $("wEmail").value.trim(); if (em && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) return say("The contact email doesn't look right.", "err");
    sh.email = em || undefined;
    sh.brand = $("wBrand").value.trim() || undefined; sh.foot1 = $("wFoot1").value.trim() ? E($("wFoot1").value.trim()) : undefined; sh.foot2 = $("wFoot2").value.trim() ? E($("wFoot2").value.trim()) : undefined;
    sh.nav = {}; navRows.filter(r => !r.own).forEach(r => { if (r.n !== r.def || r.hide) sh.nav[r.h] = { label: r.n, hide: r.hide }; });
    sh.links = navRows.filter(r => r.own).map(r => ({ label: r.n, href: r.h, hide: r.hide }));
    sh.navOrder = navRows.map(r => r.h);
    try { say("Saving…", "info", true); await save("SITE"); say("Menu, name and footer saved. Live in about a minute.", "ok"); } catch (er) { say("Could not save: " + er.message, "err"); }
  };
  // exams: every field can be changed
  const LBL = { name: "Name", short: "Short name (badge)", full: "Full name", level: "Level", posts: "Posts", color: "Colour (CSS)", page: "Page file" };
  const tierBox = (t, j) => `<div class="mt-sb" data-tr="${j}" style="background:var(--surface)"><div class="form">
      <label class="f">Tier name<input data-t="name" value="${E(t.name)}" placeholder="Tier 1"></label><label class="f">Total minutes<input data-t="minutes" type="number" value="${E(t.minutes)}"></label>
      <label class="f">Marks for correct<input data-t="plus" type="number" step="0.25" value="${E(t.plus)}"></label><label class="f">Minus for wrong<input data-t="minus" type="number" step="0.25" value="${E(t.minus)}"></label>
      <label class="f wide">Negative marking (shown to students)<input data-t="negative" value="${E(t.negative || "")}"></label>
      <label class="f wide">Pattern – one section per line: Section | Questions | Marks | Minutes<textarea data-t="pattern" style="min-height:120px">${E((t.pattern || []).map(r => r.join(" | ")).join("\n"))}</textarea></label></div>
      <div style="margin-top:8px"><button class="btn btn-del btn-sm" type="button" data-trdel>Remove this tier</button></div></div>`;
  function drawExams() {
    $("wExams").innerHTML = D.EXAMS.map((x, i) => `<details class="item" data-e="${i}" style="display:block"><summary style="cursor:pointer;font-weight:700">${E(x.name || "New exam")} ${x.hide ? '<span class="pill soon">Hidden</span>' : ""}</summary>
      <div class="form" style="margin-top:12px">${Object.keys(LBL).map(k => `<label class="f${k === "posts" ? " wide" : ""}">${LBL[k]}<input data-k="${k}" value="${E(x[k] || "")}" ${k === "page" ? "readonly" : ""}></label>`).join("")}
      <div class="f wide">Tiers (Tier 1, Tier 2 … or Paper 1, Paper 2) – each has its own pattern; "⚡ Use exam pattern" in Mock tests uses these
        <div class="tiers" style="display:flex;flex-direction:column;gap:10px;margin-top:6px">${window.SSCTiers(x).map(tierBox).join("")}</div>
        <div><button class="btn btn-out btn-sm" type="button" data-tradd>＋ Add tier</button></div></div>
      ${Object.keys(x).filter(k => !LBL[k] && !["id", "pattern", "hide", "tiers", "stage", "time", "negative"].includes(k)).map(k => `<label class="f wide">${E(k)} (other detail)<textarea data-j="${E(k)}">${E(JSON.stringify(x[k], null, 1))}</textarea></label>`).join("")}</div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:10px"><label style="display:flex;gap:6px;align-items:center;font-weight:600"><input type="checkbox" data-k="show" ${x.hide ? "" : "checked"}> Show on the website</label>
      <button class="btn btn-out btn-sm" type="button" data-em="-1" ${i ? "" : "disabled"}>↑</button><button class="btn btn-out btn-sm" type="button" data-em="1" ${i < D.EXAMS.length - 1 ? "" : "disabled"}>↓</button>
      <button class="btn btn-del btn-sm" type="button" data-edel>Delete exam</button></div></details>`).join("");
  }
  function readExams() {
    $("wExams").querySelectorAll("[data-e]").forEach(box => { const x = D.EXAMS[+box.dataset.e];
      box.querySelectorAll("input[data-k]").forEach(inp => { if (inp.dataset.k === "show") { if (inp.checked) delete x.hide; else x.hide = true; } else x[inp.dataset.k] = inp.value.trim(); });
      x.tiers = [...box.querySelectorAll("[data-tr]")].map((tb, j) => { const g = k => tb.querySelector(`[data-t="${k}"]`).value.trim();
        return { id: "t" + (j + 1), name: g("name") || "Tier " + (j + 1), minutes: +g("minutes") || 60, plus: +g("plus") || 1, minus: +g("minus") || 0, negative: g("negative"),
          pattern: g("pattern").split(/\r?\n/).map(l => l.split("|").map(c => c.trim())).filter(r => r[0]).map(r => [r[0], +r[1] || 0, +r[2] || 0, +r[3] || 0]) }; });
      if (x.tiers[0]) { x.pattern = x.tiers[0].pattern.map(r => r.slice(0, 3)); x.stage = x.tiers[0].name; x.time = x.tiers[0].minutes + " minutes"; x.negative = x.tiers[0].negative; }
      box.querySelectorAll("textarea[data-j]").forEach(t => { try { x[t.dataset.j] = JSON.parse(t.value); } catch (e) { throw new Error(`"${t.dataset.j}" of ${x.name} is not written correctly.`); } }); });
  }
  let newExamPages = [], goneExamPages = [];
  $("wExams").addEventListener("click", e => { const box = e.target.closest("[data-e]"); if (!box) return; const i = +box.dataset.e;
    if (e.target.closest("[data-tradd]")) { e.preventDefault(); const tl = box.querySelector(".tiers"), n = tl.children.length + 1; tl.insertAdjacentHTML("beforeend", tierBox({ name: "Tier " + n, minutes: 60, plus: 2, minus: 0.5, negative: "", pattern: [] }, n - 1)); return; }
    if (e.target.closest("[data-trdel]")) { e.preventDefault(); const tl = box.querySelector(".tiers"); if (tl.children.length < 2) return say("An exam needs at least one tier.", "err"); if (confirmBox("Remove this tier? Tests in it will show under the first tier.")) e.target.closest("[data-tr]").remove(); return; }
    const mv = e.target.closest("[data-em]"); if (mv) { e.preventDefault(); try { readExams(); } catch (er) { return say(er.message, "err"); } const j = i + +mv.dataset.em; [D.EXAMS[i], D.EXAMS[j]] = [D.EXAMS[j], D.EXAMS[i]]; drawExams(); }
    if (e.target.closest("[data-edel]")) { e.preventDefault(); if (!confirmBox(`Delete ${D.EXAMS[i].name}? Its page will be removed too.`)) return; try { readExams(); } catch (er) {} goneExamPages.push(D.EXAMS[i].page); D.EXAMS.splice(i, 1); drawExams(); say("Press Save exams to finish.", "info"); } });
  $("wExamAdd").onclick = () => {
    try { readExams(); } catch (er) { return say(er.message, "err"); }
    const name = prompt("Name of the new exam (e.g. SSC Delhi Police Constable)"); if (!name) return;
    let id = slug(name).replace(/^ssc-/, ""); const ids = D.EXAMS.map(x => x.id); let k = 2, base = id; while (ids.includes(id)) id = base + "-" + k++;
    const x = { id, page: "ssc-" + id + ".html", short: name.replace(/^SSC\s+/i, "").split(/\s+/).map(w => w[0]).join("").toUpperCase().slice(0, 5), name, full: name, level: "", posts: "", tiers: [{ id: "t1", name: "Tier 1", minutes: 60, plus: 2, minus: 0.5, negative: "−0.50 per wrong answer", pattern: [] }], pattern: [], color: "linear-gradient(135deg,#1F3A93,#3F62D1)" };
    D.EXAMS.push(x); newExamPages.push(x); drawExams(); $("wExams").querySelector(`[data-e="${D.EXAMS.length - 1}"]`).open = true; say("Fill in the details, then Save exams.", "info");
  };
  $("wExamSave").onclick = async () => {
    try { readExams(); } catch (er) { return say(er.message, "err"); }
    try {
      say("Saving exams…", "info", true);
      for (const x of newExamPages.filter(x => D.EXAMS.includes(x))) {
        const tpl = await readText("ssc-cgl.html"); if (!tpl) throw new Error("Could not copy an exam page.");
        const html = tpl.replace(/data-exam="[^"]*"/, `data-exam="${x.id}"`).replace(/data-page="exam-[^"]*"/, `data-page="exam-${x.id}"`).replace(/data-title="[^"]*"/, `data-title="${E(x.name)}"`)
          .replace(/<title>[^<]*<\/title>/, `<title>${E(x.name)} – Exam Pattern, Mock Tests & PYQs | SSCAspirants_Official</title>`);
        await writeB64(x.page, b64FromText(html), "Admin: new exam page " + x.page);
      }
      for (const p of goneExamPages) if (!D.EXAMS.some(x => x.page === p)) await removeFile(p, "Admin: delete exam page " + p);
      newExamPages = []; goneExamPages = [];
      await save("EXAMS"); drawExams(); say("Exams saved. Live in about a minute.", "ok");
    } catch (er) { say("Could not save: " + er.message, "err"); }
  };
  // subjects and chapters
  function drawSubs() {
    $("wSubs").innerHTML = D.SUBJECTS.map((s, si) => `<details class="item" data-s="${si}" style="display:block"><summary style="cursor:pointer;font-weight:700">${E(s.name)} ${s.hide ? '<span class="pill soon">Hidden</span>' : ""} <span class="muted" style="font-weight:400">· ${s.chapters.length} chapters</span></summary>
      <div class="form" style="margin-top:10px"><label class="f">Subject name<input data-sk="name" value="${E(s.name)}"></label><label class="f">Hindi name<input data-sk="hi" value="${E(s.hi || "")}"></label></div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin:10px 0"><label style="display:flex;gap:6px;align-items:center;font-weight:600"><input type="checkbox" data-sk="show" ${s.hide ? "" : "checked"}> Show subject</label>
        <button class="btn btn-out btn-sm" type="button" data-sm="-1" ${si ? "" : "disabled"}>↑ Subject</button><button class="btn btn-out btn-sm" type="button" data-sm="1" ${si < D.SUBJECTS.length - 1 ? "" : "disabled"}>↓ Subject</button>
        <button class="btn btn-del btn-sm" type="button" data-sdel2>Delete subject</button></div>
      ${s.chapters.map((c, ci) => `<div class="item" data-c="${ci}" style="flex-wrap:wrap"><b style="min-width:26px">${ci + 1}.</b>
        <input data-ck="title" value="${E(c.title)}" aria-label="Chapter title" style="flex:2 1 220px;min-height:38px;border:1px solid var(--line);border-radius:9px;padding:0 10px">
        <input data-ck="sub" value="${E(c.sub || "")}" placeholder="Short line" aria-label="Short line" style="flex:2 1 200px;min-height:38px;border:1px solid var(--line);border-radius:9px;padding:0 10px">
        <span class="pill ${D.NOTES[c.id] ? "ok" : "soon"}">${D.NOTES[c.id] ? "Has notes" : "Coming soon"}</span>
        <label style="display:flex;gap:6px;align-items:center"><input type="checkbox" data-ck="show" ${c.hide ? "" : "checked"}> Show</label>
        <button class="btn btn-out btn-sm" type="button" data-cm="-1" ${ci ? "" : "disabled"}>↑</button><button class="btn btn-out btn-sm" type="button" data-cm="1" ${ci < s.chapters.length - 1 ? "" : "disabled"}>↓</button>
        <button class="btn btn-del btn-sm" type="button" data-cdel>Delete</button></div>`).join("")}
      <button class="btn btn-out btn-sm" type="button" data-cadd style="margin-top:8px">＋ Add chapter</button></details>`).join("");
  }
  let goneNotes = [];
  function readSubs() {
    $("wSubs").querySelectorAll("[data-s]").forEach(box => { const s = D.SUBJECTS[+box.dataset.s];
      s.name = box.querySelector('[data-sk="name"]').value.trim() || s.name; s.hi = box.querySelector('[data-sk="hi"]').value.trim();
      if (box.querySelector('[data-sk="show"]').checked) delete s.hide; else s.hide = true;
      box.querySelectorAll("[data-c]").forEach(row => { const c = s.chapters[+row.dataset.c]; c.title = row.querySelector('[data-ck="title"]').value.trim() || c.title; c.sub = row.querySelector('[data-ck="sub"]').value.trim();
        if (row.querySelector('[data-ck="show"]').checked) delete c.hide; else c.hide = true; }); });
  }
  $("wSubs").addEventListener("click", e => {
    const box = e.target.closest("[data-s]"); if (!box) return; const si = +box.dataset.s, s = D.SUBJECTS[si], row = e.target.closest("[data-c]");
    const b = e.target.closest("button"); if (!b) return; e.preventDefault(); readSubs();
    const open = [...$("wSubs").querySelectorAll("details")].map(d => d.open);
    if (b.dataset.sm) { const j = si + +b.dataset.sm; [D.SUBJECTS[si], D.SUBJECTS[j]] = [D.SUBJECTS[j], D.SUBJECTS[si]]; [open[si], open[j]] = [open[j], open[si]]; }
    if (b.hasAttribute("data-sdel2")) { if (!confirmBox(`Delete the subject "${s.name}" and all its chapters and notes?`)) return; s.chapters.forEach(c => goneNotes.push(c.id)); D.SUBJECTS.splice(si, 1); open.splice(si, 1); }
    if (row && b.dataset.cm) { const ci = +row.dataset.c, j = ci + +b.dataset.cm; [s.chapters[ci], s.chapters[j]] = [s.chapters[j], s.chapters[ci]]; }
    if (row && b.hasAttribute("data-cdel")) { const c = s.chapters[+row.dataset.c]; if (!confirmBox(`Delete the chapter "${c.title}"${D.NOTES[c.id] ? " and its notes" : ""}?`)) return; goneNotes.push(c.id); s.chapters.splice(+row.dataset.c, 1); }
    if (b.hasAttribute("data-cadd")) { const t = prompt("New chapter title"); if (!t) return; let id = slug(t), k = 2; const all = D.SUBJECTS.flatMap(x => x.chapters.map(c => c.id)); const base = id; while (all.includes(id)) id = base + "-" + k++; s.chapters.push({ id, title: t, sub: "" }); }
    drawSubs(); $("wSubs").querySelectorAll("details").forEach((d, i) => d.open = !!open[i]); say("Press Save subjects and chapters to finish.", "info");
  });
  $("wSubAdd").onclick = () => { readSubs(); const n = prompt("New subject name (e.g. Indian History)"); if (!n) return; let id = slug(n), k = 2; const base = id; while (D.SUBJECTS.some(s => s.id === id)) id = base + "-" + k++; D.SUBJECTS.push({ id, name: n, hi: "", chapters: [] }); drawSubs(); };
  $("wSubSave").onclick = async () => {
    readSubs();
    try { say("Saving…", "info", true);
      const left = new Set(D.SUBJECTS.flatMap(s => s.chapters.map(c => c.id))); let notesChanged = false;
      goneNotes.forEach(id => { if (!left.has(id) && D.NOTES[id]) { delete D.NOTES[id]; notesChanged = true; } }); goneNotes = [];
      if (notesChanged) await save("NOTES"); await save("SUBJECTS"); fillSubjects(); say("Subjects and chapters saved. Live in about a minute.", "ok");
    } catch (er) { say("Could not save: " + er.message, "err"); }
  };
  // topic lists
  function drawTopics() {
    $("wTopics").innerHTML = Object.entries(D.TOPICS).map(([k, g]) => `<label class="f">${E(g.label)}<textarea data-tg="${E(k)}" style="min-height:170px">${E(g.topics.map(t => typeof t === "string" ? t : t.name + (t.link ? " | " + t.link : "")).join("\n"))}</textarea></label>`).join("");
  }
  $("wTopicSave").onclick = async () => {
    $("wTopics").querySelectorAll("[data-tg]").forEach(t => { D.TOPICS[t.dataset.tg].topics = t.value.split(/\r?\n/).map(l => l.trim()).filter(Boolean).map(l => { const [n, link] = l.split("|").map(x => x.trim()); return link ? { name: n, link } : n; }); });
    try { say("Saving…", "info", true); await save("TOPICS"); say("Topic lists saved.", "ok"); } catch (er) { say("Could not save: " + er.message, "err"); }
  };
  document.querySelector('#atabs [data-t="website"]').addEventListener("click", drawWebsite);

  // =====================================================================
  // DAILY QUIZ
  // =====================================================================
  const istToday = () => new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10);
  function drawDaily() {
    if (!$("dDate").value) $("dDate").value = istToday();
    const days = Object.keys(D.DAILY).sort().reverse();
    $("dList").innerHTML = days.map(d => `<div class="item"><span class="t"><b>${E(d)}${d === istToday() ? " (today)" : d > istToday() ? " (scheduled)" : ""}</b><span>${E(D.DAILY[d].title || "Daily quiz")} · ${D.DAILY[d].questions.length} questions</span></span>
      <button class="btn btn-out btn-sm" type="button" data-dedit="${d}">Edit</button><button class="btn btn-del btn-sm" type="button" data-ddel="${d}">Delete</button></div>`).join("") || `<p class="muted" style="margin:0">No daily quizzes yet.</p>`;
  }
  $("dList").addEventListener("click", async e => {
    const ed = e.target.closest("[data-dedit]"), del = e.target.closest("[data-ddel]");
    if (ed) { const q = D.DAILY[ed.dataset.dedit]; $("dDate").value = ed.dataset.dedit; $("dTitle").value = q.title || ""; $("dText").value = toQuiz(q.questions); $("dText").scrollIntoView({ block: "center" }); }
    if (del) { if (!confirmBox(`Delete the daily quiz of ${del.dataset.ddel}?`)) return; delete D.DAILY[del.dataset.ddel];
      try { await save("DAILY"); drawDaily(); say("Deleted.", "ok"); } catch (er) { say("Could not delete: " + er.message, "err"); } }
  });
  $("dSave").addEventListener("click", async () => {
    const day = $("dDate").value; if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return say("Pick a date.", "err");
    const r = parseQuiz($("dText").value); if (r.errs.length) return say(r.errs[0], "err"); if (!r.list.length) return say("Add questions first.", "err");
    D.DAILY[day] = { title: $("dTitle").value.trim(), questions: r.list.map(q => ({ q: q.q, opts: q.opts, a: q.a, why: q.why })) };
    try { say("Saving…", "info", true); await save("DAILY"); drawDaily(); say(`Daily quiz for ${day} saved. Students see it on that day.`, "ok"); } catch (er) { say("Could not save: " + er.message, "err"); }
  });
  document.querySelector('#atabs [data-t="daily"]').addEventListener("click", drawDaily);

  // expose the text parsers for testing
  window.SSC_ADMIN = { parseBody, parseQuiz, parseTable, toBody, toQuiz, toTable };
})();
