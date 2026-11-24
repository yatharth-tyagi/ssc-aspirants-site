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
  const D = { NOTES: {}, SUBJECTS: [], TESTS: {}, LIVE: [], NEWS: [], EXAMS: [], TOPICS: {}, SITE: {}, DAILY: {} };
  const FILES = {
    NOTES: ["data/notes.js", "NOTES", "All notes content."],
    SUBJECTS: ["data/subjects.js", "SUBJECTS", "Subjects and chapters. ready: true shows a chapter on the site."],
    TESTS: ["data/tests.js", "TESTS", "Tests made in the admin page. Each opens at test.html?id=<id>."],
    LIVE: ["data/live-tests.js", "LIVE_TESTS", "Tests shown in Live tests on the Home page."],
    NEWS: ["data/whats-new.js", "WHATS_NEW", "What's new on the Home page, newest first."],
    EXAMS: ["data/exams.js", "EXAMS", "One entry per exam. Each exam has its own page (e.g. ssc-cgl.html) built from this data. hide: true hides it from the lists."],
    TOPICS: ["data/topics.js", "TOPICS", "Subject-wise (topic-wise) tests for each section. A topic with a link opens that test."],
    DAILY: ["data/daily.js", "DAILY", "Daily quiz: one entry per date (YYYY-MM-DD). Students only see dates up to today."],
    SITE: ["data/site.js", "SITE", "Website texts, pictures, menu and sections changed from the admin page (✎ Edit page and Admin → Website)."]
  };
  // date-time box ⇄ time stamp
  const whenVal = id => { const v = $(id).value; return v ? new Date(v).getTime() : null; };
  const whenSet = (id, t) => { $(id).value = t ? new Date(t - new Date(t).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ""; };
  const whenText = t => t && t > Date.now() ? ` · <span class="pill soon">Goes live ${new Date(t).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</span>` : "";
  const save = k => writeData(FILES[k][0], FILES[k][1], D[k], FILES[k][2]);

  // ---------- tabs ----------
  let connected = false;
  const tabs = [...document.querySelectorAll("#atabs [data-t]")];
  function openTab(t) {
    if (!connected && t !== "connect") t = "connect";
    tabs.forEach(b => b.setAttribute("aria-selected", b.dataset.t === t));
    document.querySelectorAll("[data-p]").forEach(p => p.hidden = p.dataset.p !== t);
  }
  tabs.forEach(b => b.addEventListener("click", () => openTab(b.dataset.t)));
  const lockTabs = () => tabs.forEach(b => b.disabled = !connected && b.dataset.t !== "connect");
  lockTabs(); openTab("connect");

  // ---------- connect (runs by itself when the page opens) ----------
  async function connect() {
    say("Loading your website data…", "info", true);
    try {
      const repo = await (await gh("")).json();
      if (repo.permissions && !repo.permissions.push) throw new Error("The GITHUB_TOKEN in Cloudflare can't save. Give it Contents: Read and write.");
      const [n, s, t, l, w] = await Promise.all([
        readData("data/notes.js", "NOTES", {}), readData("data/subjects.js", "SUBJECTS", window.SUBJECTS || []),
        readData("data/tests.js", "TESTS", {}), readData("data/live-tests.js", "LIVE_TESTS", []), readData("data/whats-new.js", "WHATS_NEW", [])]);
      Object.assign(D, { NOTES: n, SUBJECTS: s, TESTS: t, LIVE: l, NEWS: w });
      const [ex, tp, si] = await Promise.all([readData("data/exams.js", "EXAMS", window.EXAMS || []), readData("data/topics.js", "TOPICS", window.TOPICS || {}), readData("data/site.js", "SITE", {})]);
      Object.assign(D, { EXAMS: ex, TOPICS: tp, SITE: si || {}, DAILY: (await readData("data/daily.js", "DAILY", {})) || {} });
      connected = true; lockTabs();
      $("connInfo").textContent = `Connected to ${repo.full_name}. ${Object.keys(n).length} notes chapters, ${Object.keys(t).length} tests, ${l.length} live tests loaded.`;
      fillSubjects(); drawTests(); drawLive(); drawNews(); drawFiles();
      say("Ready. You can add notes and tests.", "ok");
      if (!$("atabs").querySelector('[aria-selected="true"]:not([data-t="connect"])')) openTab("notes");
    } catch (e) {
      $("connInfo").textContent = "";
      say(e.status === 401 || e.status === 403 ? "Please log in on the admin login page." : "Could not load: " + e.message, "err");
    }
  }
  $("connectBtn").addEventListener("click", connect);
  setTimeout(connect, 0);

  // ---------- who is logged in + admin log out ----------
  fetch("/api/admin/me").then(r => r.json()).then(d => { if (d.admin) $("whoAdmin").textContent = "Logged in as " + d.admin.name + (d.admin.owner ? " (owner)" : "") + " · " + d.admin.email; }).catch(() => {});
  $("aLogout").addEventListener("click", async () => { try { await fetch("/api/auth/admin-logout", { method: "POST" }); } catch (e) {} location.href = "/admin-login"; });

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

  let docxHtml = "";
  const mode = () => document.querySelector('[name="nMode"]:checked').value;
  document.querySelectorAll('[name="nMode"]').forEach(r => r.addEventListener("change", () => { $("nFormBox").hidden = mode() !== "form"; $("nDocxBox").hidden = mode() !== "docx"; }));

  function fillSubjects() {
    $("nSub").innerHTML = D.SUBJECTS.map(s => `<option value="${E(s.id)}">${E(s.name)}</option>`).join("");
    fillChapters();
  }
  function fillChapters() {
    const s = D.SUBJECTS.find(x => x.id === $("nSub").value) || D.SUBJECTS[0]; if (!s) return;
    $("nChap").innerHTML = s.chapters.map((c, i) => `<option value="${E(c.id)}">${i + 1}. ${E(c.title)}${D.NOTES[c.id] ? " ✓" : ""}</option>`).join("") + `<option value="__new">+ New chapter</option>`;
    loadChapter();
  }
  function loadChapter() {
    const s = D.SUBJECTS.find(x => x.id === $("nSub").value), cid = $("nChap").value;
    const c = s && s.chapters.find(x => x.id === cid), n = D.NOTES[cid] || {};
    $("nTitle").value = n.title || (c ? c.title : ""); $("nDesc").value = c ? c.sub || "" : "";
    $("nRead").value = n.read || ""; $("nExams").value = (n.exams || []).join(", "); $("nIntro").value = n.intro || "";
    $("nBody").value = toBody(n); $("nTblTitle").value = n.tableTitle || ""; $("nTbl").value = toTable(n);
    $("nTricks").value = (n.tricks || []).join("\n"); $("nQuiz").value = toQuiz(n.quiz);
    docxHtml = n.html || ""; $("nDocxPrev").innerHTML = docxHtml ? safeHtml(docxHtml) : "No file chosen yet.";
    const r = document.querySelector(`[name="nMode"][value="${n.html ? "docx" : "form"}"]`); r.checked = true; r.dispatchEvent(new Event("change"));
    $("nDel").hidden = !D.NOTES[cid]; $("nPdf").checked = !!n.pdf; whenSet("nWhen", n.publishAt);
  }
  $("nSub").addEventListener("change", fillChapters);
  $("nDocs").addEventListener("click", () => { const c = $("nChap").value; location.href = "docs-editor.html" + (c && c !== "__new" ? "?ch=" + encodeURIComponent(c) : ""); });
  $("nChap").addEventListener("change", loadChapter);

  $("nDocx").addEventListener("change", async e => {
    const f = e.target.files[0]; if (!f) return;
    try {
      say("Reading the Word file…", "info", true);
      if (!window.mammoth) await load(LIBS.mammoth);
      const res = await mammoth.convertToHtml({ arrayBuffer: await f.arrayBuffer() });
      docxHtml = safeHtml(res.value); $("nDocxPrev").innerHTML = docxHtml;
      if (!$("nTitle").value) $("nTitle").value = f.name.replace(/\.docx$/i, "");
      say(`Word file read: ${Math.round(docxHtml.length / 1024)} KB. Check the preview, then Publish.`, "ok");
    } catch (err) { say("Could not read the Word file: " + err.message, "err"); }
  });

  $("nSave").addEventListener("click", async () => {
    const s = D.SUBJECTS.find(x => x.id === $("nSub").value); if (!s) return;
    const title = $("nTitle").value.trim(); if (!title) return say("Give the chapter a title.", "err");
    let cid = $("nChap").value;
    if (cid === "__new") { const same = s.chapters.find(c => !D.NOTES[c.id] && (c.id === slug(title) || c.title.toLowerCase() === title.toLowerCase())); if (same) cid = same.id; }
    if (cid === "__new") { cid = slug(title); let k = 2; const all = D.SUBJECTS.flatMap(x => x.chapters.map(c => c.id)); while (all.includes(cid)) cid = slug(title) + "-" + k++; }
    const note = { subject: s.id, title, read: $("nRead").value.trim() || "10 min read",
      exams: $("nExams").value.split(",").map(x => x.trim()).filter(Boolean), intro: $("nIntro").value.trim() };
    if (mode() === "docx") {
      if (!docxHtml) return say("Choose a Word file first.", "err");
      note.html = docxHtml;
    } else {
      note.phases = parseBody($("nBody").value);
      if (!note.phases.length) return say("Write some notes first.", "err");
      const tb = parseTable($("nTbl").value); if (tb.table) { note.tableTitle = $("nTblTitle").value.trim() || "Important facts"; note.tableHead = tb.tableHead; note.table = tb.table; }
      note.tricks = $("nTricks").value.split(/\r?\n/).map(x => x.trim()).filter(Boolean);
      const qz = parseQuiz($("nQuiz").value); if (qz.errs.length) return say(qz.errs[0], "err");
      note.quiz = qz.list;
    }
    const old = D.NOTES[cid]; if (old && old.deck) note.deck = old.deck; // keep slides made in the slide editor
    if ($("nPdf").checked) note.pdf = true;
    const nw = whenVal("nWhen"); if (nw && nw > Date.now()) note.publishAt = nw;
    let c = s.chapters.find(x => x.id === cid);
    if (!c) { c = { id: cid, title, sub: $("nDesc").value.trim() }; s.chapters.push(c); }
    c.title = title; c.sub = $("nDesc").value.trim() || c.sub || ""; c.ready = true;
    if (note.publishAt) c.publishAt = note.publishAt; else delete c.publishAt;
    D.NOTES[cid] = note;
    try {
      say("Publishing… (1 of 2)", "info", true); await save("NOTES");
      say("Publishing… (2 of 2)", "info", true); await save("SUBJECTS");
      fillChapters(); $("nChap").value = cid; loadChapter();
      say(`Published "${title}". It will be live in about a minute at note.html?id=${cid}`, "ok");
    } catch (e) { say("Could not publish: " + e.message, "err"); }
  });

  $("nDel").addEventListener("click", async () => {
    const cid = $("nChap").value; if (!D.NOTES[cid]) return;
    if (!confirmBox(`Delete the notes for "${D.NOTES[cid].title}"? The chapter stays in the list as "Coming soon".`)) return;
    delete D.NOTES[cid];
    D.SUBJECTS.forEach(s => s.chapters.forEach(c => { if (c.id === cid) c.ready = false; }));
    try { await save("NOTES"); await save("SUBJECTS"); fillChapters(); say("Chapter notes deleted.", "ok"); }
    catch (e) { say("Could not delete: " + e.message, "err"); }
  });
  // window.confirm is blocked in some previews; fall back to allowing the action there
  function confirmBox(msg) { try { return window.confirm(msg); } catch (e) { return true; } }

  // =====================================================================
  // TESTS
  // =====================================================================
  let editing = null, tQs = [];
  $("tExam").innerHTML = `<option value="all">All SSC exams</option>` + (window.EXAMS || []).map(x => `<option value="${E(x.id)}">${E(x.name)}</option>`).join("");
  const tMode = () => document.querySelector('[name="tMode"]:checked').value;
  document.querySelectorAll('[name="tMode"]').forEach(r => r.addEventListener("change", () => { $("tFileBox").hidden = tMode() !== "file"; $("tTextBox").hidden = tMode() !== "text"; }));
  function drawTPrev() {
    const secs = {}; tQs.forEach(q => { const k = q.section || "General"; secs[k] = (secs[k] || 0) + 1; });
    $("tPrev").innerHTML = tQs.length ? `<b>${tQs.length} questions</b> · ${Object.entries(secs).map(([k, v]) => `${E(k)}: ${v}`).join(" · ")}<ol style="margin:10px 0 0;padding-left:20px">${tQs.slice(0, 8).map(q => `<li>${E(q.q)} <span class="muted">(${String.fromCharCode(65 + q.a)})</span></li>`).join("")}</ol>${tQs.length > 8 ? `<p class="muted" style="margin:6px 0 0">…and ${tQs.length - 8} more</p>` : ""}` : "None yet.";
  }
  $("tText").addEventListener("input", () => { const r = parseQuiz($("tText").value); tQs = r.list; drawTPrev(); if (r.errs.length) say(r.errs[0], "err"); });
  $("tFile").addEventListener("change", async e => {
    const f = e.target.files[0]; if (!f) return;
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
        const q = { q: pick(r, "question"), opts, a: ans ? ans.charCodeAt(0) - 65 : -1, why: pick(r, "explanation") };
        const sec = pick(r, "section"); if (sec) q.section = sec;
        const qh = pick(r, "question (hindi)"), oh = ["a", "b", "c", "d", "e"].map(k => pick(r, k + " (hindi)")).filter(Boolean);
        if (qh && oh.length === opts.length) { q.qh = qh; q.optsh = oh; const wh = pick(r, "explanation (hindi)"); if (wh) q.whyh = wh; }
        // topic + pictures (file names from the Files tab, or https links)
        const topic = pick(r, "topic"); if (topic) q.topic = topic;
        const im = k => { const v = pick(r, k); return !v ? "" : /^https:\/\//i.test(v) ? v : v.toLowerCase().replace(/[^a-z0-9.\-]+/g, "-"); };
        if (im("question image")) q.img = im("question image");
        const oi = ["a", "b", "c", "d", "e"].slice(0, opts.length).map(k => im(k + " image")); if (oi.some(Boolean)) q.oimg = oi;
        if (im("solution image")) q.wimg = im("solution image");
        if (im("solution image (hindi)")) q.wimgh = im("solution image (hindi)");
        if (!q.q || opts.length < 2 || q.a < 0 || q.a >= opts.length) bad.push(i + 2); else out.push(q);
      });
      tQs = out; drawTPrev();
      say(bad.length ? `${out.length} questions read. Skipped rows ${bad.slice(0, 10).join(", ")} (missing question, options or answer).` : `${out.length} questions read.`, bad.length ? "err" : "ok");
    } catch (err) { say("Could not read the file: " + err.message, "err"); }
  });
  $("tTpl").addEventListener("click", () => {
    const csv = "Section,Topic,Question,A,B,C,D,Answer,Explanation,Question (Hindi),A (Hindi),B (Hindi),C (Hindi),D (Hindi),Explanation (Hindi),Question image,A image,B image,C image,D image,Solution image\n" +
      'General Awareness,Polity – British Acts,Which Act introduced dyarchy in the provinces?,Indian Councils Act 1909,Government of India Act 1919,Government of India Act 1935,Charter Act 1853,B,"The 1919 Act split provincial subjects into transferred and reserved.",प्रांतों में द्वैध शासन किस अधिनियम ने शुरू किया?,भारतीय परिषद अधिनियम 1909,भारत सरकार अधिनियम 1919,भारत सरकार अधिनियम 1935,चार्टर अधिनियम 1853,1919 के अधिनियम ने प्रांतीय विषयों को हस्तांतरित और आरक्षित में बाँटा।,,,,,,\n' +
      'Quantitative Aptitude,Algebra,"If $x + \\frac{1}{x} = 3$, find $x^2 + \\frac{1}{x^2}$",7,9,11,5,A,"Square both sides: $x^2 + 2 + \\frac{1}{x^2} = 9$, so the answer is 7.",,,,,,,,,,,,q2-solution.png\n' +
      "General Intelligence and Reasoning,Mirror image,Select the correct mirror image of the given figure.,Option A,Option B,Option C,Option D,C,,,,,,,,q3-figure.png,q3-a.png,q3-b.png,q3-c.png,q3-d.png,\n";
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv" })); a.download = "ssc-test-template.csv"; a.click();
  });
  function resetTest() {
    editing = null; tQs = []; $("tFormTitle").textContent = "New test";
    ["tTitle", "tText"].forEach(k => $(k).value = ""); $("tMin").value = 60; $("tPlus").value = 2; $("tMinus").value = 0.5; $("tLive").checked = true; $("tSect").checked = false; $("tStrict").checked = false; whenSet("tWhen", null); $("tSecMin").value = 15; $("tFile").value = ""; drawTPrev();
  }
  $("tNew").addEventListener("click", resetTest);
  function drawTests() {
    const ids = Object.keys(D.TESTS);
    $("tList").innerHTML = ids.length ? ids.map(id => { const t = D.TESTS[id];
      return `<div class="item"><span class="t"><b>${E(t.title)}</b><span>${E(t.type)} · ${t.questions.length} questions · ${t.minutes} min · ${E(examName(t.exam))}${whenText(t.publishAt)}</span></span>
      <a class="btn btn-out btn-sm" href="test.html?id=${encodeURIComponent(id)}" target="_blank" rel="noopener">Open</a>
      <button class="btn btn-out btn-sm" type="button" data-edit="${E(id)}">Edit</button><button class="btn btn-del btn-sm" type="button" data-del="${E(id)}">Delete</button></div>`; }).join("")
      : `<p class="muted" style="margin:0">No tests yet. Make your first one below.</p>`;
  }
  const examName = id => id === "all" ? "All SSC exams" : ((window.EXAMS || []).find(x => x.id === id) || {}).name || id;
  $("tList").addEventListener("click", async e => {
    const ed = e.target.closest("[data-edit]"), del = e.target.closest("[data-del]");
    if (ed) { const id = ed.dataset.edit, t = D.TESTS[id]; editing = id; tQs = t.questions.slice();
      $("tFormTitle").textContent = "Edit test"; $("tTitle").value = t.title; $("tExam").value = t.exam; $("tType").value = t.type;
      $("tMin").value = t.minutes; $("tPlus").value = t.plus; $("tMinus").value = t.minus; $("tLive").checked = D.LIVE.some(l => l.link === "test.html?id=" + id);
      $("tSect").checked = !!t.sectional; $("tStrict").checked = !!t.strict; whenSet("tWhen", t.publishAt); $("tSecMin").value = t.sectional && t.sections[0] ? t.sections[0].minutes : 15;
      const fr = document.querySelector('[name="tMode"][value="file"]'); fr.checked = true; fr.dispatchEvent(new Event("change"));
      $("tText").value = toQuiz(tQs); drawTPrev(); $("tTitle").scrollIntoView({ behavior: "smooth", block: "center" }); }
    if (del) { const id = del.dataset.del; if (!confirmBox(`Delete the test "${D.TESTS[id].title}"?`)) return;
      delete D.TESTS[id]; D.LIVE = D.LIVE.filter(l => l.link !== "test.html?id=" + id);
      try { await save("TESTS"); await save("LIVE"); drawTests(); drawLive(); say("Test deleted.", "ok"); } catch (er) { say("Could not delete: " + er.message, "err"); } }
  });
  $("tSave").addEventListener("click", async () => {
    const title = $("tTitle").value.trim(); if (!title) return say("Give the test a name.", "err");
    if (tMode() === "text") { const r = parseQuiz($("tText").value); if (r.errs.length) return say(r.errs[0], "err"); tQs = r.list; }
    if (!tQs.length) return say("Add questions first.", "err");
    let id = editing; if (!id) { id = slug(title); let k = 2; while (D.TESTS[id]) id = slug(title) + "-" + k++; }
    const t = { title, exam: $("tExam").value, type: $("tType").value, minutes: +$("tMin").value || 60, plus: +$("tPlus").value || 1, minus: +$("tMinus").value || 0, questions: tQs };
    if ($("tStrict").checked) t.strict = true;
    const tw = whenVal("tWhen"); if (tw && tw > Date.now()) t.publishAt = tw;
    if ($("tSect").checked) {
      const names = [...new Set(tQs.map(q => q.section || "General"))];
      tQs.forEach(q => { if (!q.section) q.section = "General"; });
      t.sectional = true; t.sections = names.map(n => ({ name: n, minutes: +$("tSecMin").value || 15 }));
      t.minutes = t.sections.reduce((s, x) => s + x.minutes, 0);
    }
    D.TESTS[id] = t;
    const link = "test.html?id=" + id, entry = { name: title, type: t.type, exams: examName(t.exam), questions: tQs.length, minutes: t.minutes, marking: `+${t.plus} / −${t.minus}`, link };
    if (t.publishAt) entry.publishAt = t.publishAt;
    const i = D.LIVE.findIndex(l => l.link === link);
    if ($("tLive").checked) { if (i >= 0) D.LIVE[i] = entry; else D.LIVE.unshift(entry); } else if (i >= 0) D.LIVE.splice(i, 1);
    try {
      say("Publishing test… (1 of 2)", "info", true); await save("TESTS");
      say("Publishing test… (2 of 2)", "info", true); await save("LIVE");
      drawTests(); drawLive(); editing = id; $("tFormTitle").textContent = "Edit test";
      say(`Published "${title}" with ${tQs.length} questions. Live in about a minute at ${link}`, "ok");
    } catch (e) { say("Could not publish: " + e.message, "err"); }
  });
  drawTPrev();

  // =====================================================================
  // LIVE TESTS
  // =====================================================================
  function drawLive() {
    $("lList").innerHTML = D.LIVE.length ? D.LIVE.map((l, i) => `<div class="item"><span class="t"><b>${E(l.name)}</b><span>${E(l.type)} · ${l.questions} questions · ${l.minutes} min</span></span>
      <button class="btn btn-out btn-sm" type="button" data-up="${i}" ${i ? "" : "disabled"} aria-label="Move up">↑</button>
      <button class="btn btn-out btn-sm" type="button" data-down="${i}" ${i < D.LIVE.length - 1 ? "" : "disabled"} aria-label="Move down">↓</button>
      <button class="btn btn-del btn-sm" type="button" data-rm="${i}">Remove</button></div>`).join("") : `<p class="muted" style="margin:0">No live tests.</p>`;
    const opts = [{ v: "test.html", n: "Indian Polity – Chapters 1 to 4 (built-in)" }, ...Object.entries(D.TESTS).map(([id, t]) => ({ v: "test.html?id=" + id, n: t.title }))];
    $("lPick").innerHTML = opts.map(o => `<option value="${E(o.v)}">${E(o.n)}</option>`).join("");
  }
  $("lList").addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    const i = +(b.dataset.up ?? b.dataset.down ?? b.dataset.rm);
    if (b.dataset.up) [D.LIVE[i - 1], D.LIVE[i]] = [D.LIVE[i], D.LIVE[i - 1]];
    if (b.dataset.down) [D.LIVE[i + 1], D.LIVE[i]] = [D.LIVE[i], D.LIVE[i + 1]];
    if (b.dataset.rm) D.LIVE.splice(i, 1);
    drawLive();
  });
  $("lAdd").addEventListener("click", () => {
    const v = $("lPick").value; if (D.LIVE.some(l => l.link === v)) return say("That test is already in Live tests.", "err");
    if (v === "test.html") D.LIVE.push({ name: "Indian Polity – Chapters 1 to 4", type: "Subject-wise test", exams: "All SSC exams", questions: 19, minutes: 15, marking: "+2 / −0.50", link: v });
    else { const id = v.split("=")[1], t = D.TESTS[id]; D.LIVE.push({ name: t.title, type: t.type, exams: examName(t.exam), questions: t.questions.length, minutes: t.minutes, marking: `+${t.plus} / −${t.minus}`, link: v }); }
    drawLive();
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
  // FILES
  // =====================================================================
  async function drawFiles() {
    try {
      const r = await gh(`/contents/assets/uploads?ref=${encodeURIComponent(cfg.brn)}`); const list = await r.json();
      $("fList").innerHTML = list.filter(f => f.type === "file" && f.name !== ".keep").map(f => `<div class="item"><span class="t"><b>${E(f.name)}</b><span>assets/uploads/${E(f.name)} · ${Math.ceil(f.size / 1024)} KB</span></span>
        <button class="btn btn-out btn-sm" type="button" data-copy="assets/uploads/${E(f.name)}">Copy link</button>
        <button class="btn btn-del btn-sm" type="button" data-fdel="${E(f.name)}">Delete</button></div>`).join("") || `<p class="muted" style="margin:0">No files yet.</p>`;
    } catch (e) { $("fList").innerHTML = `<p class="muted" style="margin:0">No files yet.</p>`; }
  }
  $("fList").addEventListener("click", async e => {
    const d = e.target.closest("[data-fdel]");
    if (d) { if (!confirmBox(`Delete ${d.dataset.fdel}? Any notes, tests or slides using this file will show it as missing.`)) return;
      try { say("Deleting…", "info", true); await removeFile("assets/uploads/" + d.dataset.fdel, "Admin: delete " + d.dataset.fdel); drawFiles(); say("File deleted.", "ok"); } catch (er) { say("Could not delete: " + er.message, "err"); } return; }
    const b = e.target.closest("[data-copy]"); if (!b) return;
    const url = location.origin + location.pathname.replace(/[^/]*$/, "") + b.dataset.copy;
    try { await navigator.clipboard.writeText(url); say("Link copied: " + url, "ok"); } catch (er) { say("Link: " + url, "info"); } });
  $("fUp").addEventListener("click", async () => {
    const f = $("fFile").files[0]; if (!f) return say("Choose a file first.", "err");
    if (f.size > 20 * 1024 * 1024) return say("That file is over 20 MB. Please make it smaller.", "err");
    const name = f.name.toLowerCase().replace(/[^a-z0-9.\-]+/g, "-");
    try { say("Uploading…", "info", true); await writeB64("assets/uploads/" + name, b64FromBytes(new Uint8Array(await f.arrayBuffer())), "Admin: upload " + name);
      $("fFile").value = ""; drawFiles(); say("Uploaded: assets/uploads/" + name, "ok"); }
    catch (e) { say("Could not upload: " + e.message, "err"); }
  });

  // =====================================================================
  // SLIDES (made in slide-editor.html)
  // =====================================================================
  async function drawSlides() {
    try {
      const t = await readText("data/slides/index.json"), list = t ? JSON.parse(t) : [];
      const chName = id => { for (const s of D.SUBJECTS) { const c = s.chapters.find(x => x.id === id); if (c) return s.name + " · " + c.title; } return ""; };
      $("sList").innerHTML = list.map(d => `<div class="item"><span class="t"><b>${E(d.title)}</b><span>${d.slides} slides · saved ${new Date(d.updated).toLocaleString("en-IN")}${d.chapter ? " · on " + E(chName(d.chapter) || d.chapter) : " · draft (not published)"}${d.pdf ? " · PDF download on" : ""}</span></span>
        <a class="btn btn-out btn-sm" href="slide-editor.html?id=${encodeURIComponent(d.id)}">Open</a>${d.chapter ? `<a class="btn btn-out btn-sm" href="note.html?id=${encodeURIComponent(d.chapter)}" target="_blank" rel="noopener">View</a>` : ""}
        <button class="btn btn-del btn-sm" type="button" data-sdel="${E(d.id)}" data-stitle="${E(d.title)}">Delete</button></div>`).join("") || `<p class="muted" style="margin:0">No slides yet. Click <b>＋ New slides</b>.</p>`;
    } catch (e) { $("sList").innerHTML = `<p class="muted" style="margin:0">Could not load slides: ${E(e.message)}</p>`; }
  }
  document.querySelector('#atabs [data-t="slides"]').addEventListener("click", drawSlides);
  $("sList").addEventListener("click", async e => {
    const b = e.target.closest("[data-sdel]"); if (!b) return;
    if (!confirmBox(`Delete the slides "${b.dataset.stitle}"? Students will no longer see them. This cannot be undone.`)) return;
    const id = b.dataset.sdel;
    try {
      say("Deleting…", "info", true);
      const list = JSON.parse((await readText("data/slides/index.json")) || "[]");
      // take the slides off their chapter
      let notesChanged = false;
      Object.keys(D.NOTES).forEach(cid => { const n = D.NOTES[cid]; if (n.deck !== id) return; delete n.deck; notesChanged = true;
        if (!n.html && !(n.phases || []).length) { delete D.NOTES[cid]; D.SUBJECTS.forEach(s2 => s2.chapters.forEach(c => { if (c.id === cid) c.ready = false; })); } });
      if (notesChanged) { await save("NOTES"); await save("SUBJECTS"); }
      await removeFile(`data/slides/${id}.json`, "Admin: delete slides " + id);
      await writeB64("data/slides/index.json", b64FromText(JSON.stringify(list.filter(x => x.id !== id), null, 1)), "Admin: slides list");
      drawSlides(); say("Slides deleted.", "ok");
    } catch (er) { say("Could not delete: " + er.message, "err"); }
  });
  if (location.hash === "#notes") { const w = setInterval(() => { if (connected) { clearInterval(w); openTab("notes"); } }, 300); setTimeout(() => clearInterval(w), 15000); }
  if (location.hash === "#slides") setTimeout(() => { if (connected) { openTab("slides"); drawSlides(); } else { const w = setInterval(() => { if (connected) { clearInterval(w); openTab("slides"); drawSlides(); } }, 300); setTimeout(() => clearInterval(w), 15000); } }, 0);

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
  const NAVD = [["index.html", "Home"], ["mock-tests.html", "Mock Tests"], ["notes.html", "Notes"], ["pyq.html", "PYQ Papers"], ["daily-quiz.html", "Daily Quiz"], ["leaderboard.html", "Leaderboard"], ["index.html#about", "About"]];
  let navRows = [];
  function drawWebsite() {
    const pages = [["index.html", "Home"], ["mock-tests.html", "Mock Tests"], ["notes.html", "Notes"], ["pyq.html", "PYQ Papers"], ["daily-quiz.html", "Daily quiz"], ["leaderboard.html", "Leaderboard"], ["account.html", "Account details"], ...D.EXAMS.map(x => [x.page, x.name + " page"])];
    const edited = (D.SITE.pages || {});
    $("wPages").innerHTML = pages.map(([u, n]) => `<div class="item"><span class="t"><b>${E(n)}</b><span>${E(u)}${edited[u.replace(/\.html$/, "")] ? " · has your edits" : ""}</span></span><a class="btn btn-out btn-sm" href="${E(u)}?edit=1" target="_blank" rel="noopener">✎ Edit page</a></div>`).join("");
    const sh = D.SITE.shell || {};
    $("wBrand").value = sh.brand || ""; $("wFoot1").value = sh.foot1 ? sh.foot1.replace(/<[^>]+>/g, "") : ""; $("wFoot2").value = sh.foot2 ? sh.foot2.replace(/<[^>]+>/g, "") : "";
    $("wFoot1").placeholder = "© SSCAspirants_Official · Created by Yatharth Tyagi"; $("wFoot2").placeholder = "Notes, mock tests and PYQs for SSC exams · @SSCAspirants_Official";
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
    sh.brand = $("wBrand").value.trim() || undefined; sh.foot1 = $("wFoot1").value.trim() ? E($("wFoot1").value.trim()) : undefined; sh.foot2 = $("wFoot2").value.trim() ? E($("wFoot2").value.trim()) : undefined;
    sh.nav = {}; navRows.filter(r => !r.own).forEach(r => { if (r.n !== r.def || r.hide) sh.nav[r.h] = { label: r.n, hide: r.hide }; });
    sh.links = navRows.filter(r => r.own).map(r => ({ label: r.n, href: r.h, hide: r.hide }));
    sh.navOrder = navRows.map(r => r.h);
    try { say("Saving…", "info", true); await save("SITE"); say("Menu, name and footer saved. Live in about a minute.", "ok"); } catch (er) { say("Could not save: " + er.message, "err"); }
  };
  // exams: every field can be changed
  const LBL = { name: "Name", short: "Short name (badge)", full: "Full name", level: "Level", posts: "Posts", stage: "Stage", time: "Time", negative: "Negative marking", color: "Colour (CSS)", page: "Page file" };
  function drawExams() {
    $("wExams").innerHTML = D.EXAMS.map((x, i) => `<details class="item" data-e="${i}" style="display:block"><summary style="cursor:pointer;font-weight:700">${E(x.name || "New exam")} ${x.hide ? '<span class="pill soon">Hidden</span>' : ""}</summary>
      <div class="form" style="margin-top:12px">${Object.keys(LBL).map(k => `<label class="f${k === "posts" ? " wide" : ""}">${LBL[k]}<input data-k="${k}" value="${E(x[k] || "")}" ${k === "page" ? "readonly" : ""}></label>`).join("")}
      <label class="f wide">Pattern – one section per line: Section | Questions | Marks<textarea data-k="pattern" style="min-height:110px">${E((x.pattern || []).map(r => r.join(" | ")).join("\n"))}</textarea></label>
      ${Object.keys(x).filter(k => !LBL[k] && !["id", "pattern", "hide"].includes(k)).map(k => `<label class="f wide">${E(k)} (other detail)<textarea data-j="${E(k)}">${E(JSON.stringify(x[k], null, 1))}</textarea></label>`).join("")}</div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:10px"><label style="display:flex;gap:6px;align-items:center;font-weight:600"><input type="checkbox" data-k="show" ${x.hide ? "" : "checked"}> Show on the website</label>
      <button class="btn btn-out btn-sm" type="button" data-em="-1" ${i ? "" : "disabled"}>↑</button><button class="btn btn-out btn-sm" type="button" data-em="1" ${i < D.EXAMS.length - 1 ? "" : "disabled"}>↓</button>
      <button class="btn btn-del btn-sm" type="button" data-edel>Delete exam</button></div></details>`).join("");
  }
  function readExams() {
    $("wExams").querySelectorAll("[data-e]").forEach(box => { const x = D.EXAMS[+box.dataset.e];
      box.querySelectorAll("input[data-k]").forEach(inp => { if (inp.dataset.k === "show") { if (inp.checked) delete x.hide; else x.hide = true; } else x[inp.dataset.k] = inp.value.trim(); });
      x.pattern = box.querySelector('textarea[data-k="pattern"]').value.split(/\r?\n/).map(l => l.split("|").map(c => c.trim())).filter(r => r[0]).map(r => [r[0], +r[1] || r[1] || "", +r[2] || r[2] || ""]);
      box.querySelectorAll("textarea[data-j]").forEach(t => { try { x[t.dataset.j] = JSON.parse(t.value); } catch (e) { throw new Error(`"${t.dataset.j}" of ${x.name} is not written correctly.`); } }); });
  }
  let newExamPages = [], goneExamPages = [];
  $("wExams").addEventListener("click", e => { const box = e.target.closest("[data-e]"); if (!box) return; const i = +box.dataset.e;
    const mv = e.target.closest("[data-em]"); if (mv) { e.preventDefault(); try { readExams(); } catch (er) { return say(er.message, "err"); } const j = i + +mv.dataset.em; [D.EXAMS[i], D.EXAMS[j]] = [D.EXAMS[j], D.EXAMS[i]]; drawExams(); }
    if (e.target.closest("[data-edel]")) { e.preventDefault(); if (!confirmBox(`Delete ${D.EXAMS[i].name}? Its page will be removed too.`)) return; try { readExams(); } catch (er) {} goneExamPages.push(D.EXAMS[i].page); D.EXAMS.splice(i, 1); drawExams(); say("Press Save exams to finish.", "info"); } });
  $("wExamAdd").onclick = () => {
    try { readExams(); } catch (er) { return say(er.message, "err"); }
    const name = prompt("Name of the new exam (e.g. SSC Delhi Police Constable)"); if (!name) return;
    let id = slug(name).replace(/^ssc-/, ""); const ids = D.EXAMS.map(x => x.id); let k = 2, base = id; while (ids.includes(id)) id = base + "-" + k++;
    const x = { id, page: "ssc-" + id + ".html", short: name.replace(/^SSC\s+/i, "").split(/\s+/).map(w => w[0]).join("").toUpperCase().slice(0, 5), name, full: name, level: "", posts: "", stage: "", time: "", negative: "", pattern: [], color: "linear-gradient(135deg,#1F3A93,#3F62D1)" };
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
