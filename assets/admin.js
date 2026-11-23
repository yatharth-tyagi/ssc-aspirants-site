// SSC Aspirants Official – admin page.
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

  // ---------- settings (kept only in this browser) ----------
  const KEY = "ssc-admin";
  let cfg = {};
  try { cfg = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) {}
  ["tok", "own", "rep", "brn"].forEach(k => { if (cfg[k]) $(k).value = cfg[k]; });

  // ---------- GitHub ----------
  const api = path => `https://api.github.com/repos/${encodeURIComponent(cfg.own)}/${encodeURIComponent(cfg.rep)}${path}`;
  const H = (extra = {}) => ({ Authorization: "Bearer " + cfg.tok, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", ...extra });
  async function gh(path, opt = {}) {
    const r = await fetch(api(path), { ...opt, headers: H(opt.headers) });
    if (!r.ok) { const t = await r.text(); const e = new Error(r.status + " " + (JSON.parse(t || "{}").message || t)); e.status = r.status; throw e; }
    return r;
  }
  const b64FromBytes = bytes => { let s = ""; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); return btoa(s); };
  const b64FromText = t => b64FromBytes(new TextEncoder().encode(t));
  async function sha(path) {
    try { const r = await gh(`/contents/${path}?ref=${encodeURIComponent(cfg.brn)}`); return (await r.json()).sha; }
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
  const D = { NOTES: {}, SUBJECTS: [], TESTS: {}, LIVE: [], NEWS: [] };
  const FILES = {
    NOTES: ["data/notes.js", "NOTES", "All notes content."],
    SUBJECTS: ["data/subjects.js", "SUBJECTS", "Subjects and chapters. ready: true shows a chapter on the site."],
    TESTS: ["data/tests.js", "TESTS", "Tests made in the admin page. Each opens at test.html?id=<id>."],
    LIVE: ["data/live-tests.js", "LIVE_TESTS", "Tests shown in Live tests on the Home page."],
    NEWS: ["data/whats-new.js", "WHATS_NEW", "What's new on the Home page, newest first."]
  };
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

  // ---------- connect ----------
  $("connectBtn").addEventListener("click", async () => {
    cfg = { tok: $("tok").value.trim(), own: $("own").value.trim(), rep: $("rep").value.trim(), brn: $("brn").value.trim() || "main" };
    if (!cfg.tok) return say("Paste your GitHub key first.", "err");
    say("Connecting…", "info", true);
    try {
      const repo = await (await gh("")).json();
      if (!repo.permissions || !repo.permissions.push) throw new Error("This key cannot save to the repository. Give it Contents: Read and write.");
      try { localStorage.setItem(KEY, JSON.stringify(cfg)); } catch (e) {}
      const [n, s, t, l, w] = await Promise.all([
        readData("data/notes.js", "NOTES", {}), readData("data/subjects.js", "SUBJECTS", window.SUBJECTS || []),
        readData("data/tests.js", "TESTS", {}), readData("data/live-tests.js", "LIVE_TESTS", []), readData("data/whats-new.js", "WHATS_NEW", [])]);
      Object.assign(D, { NOTES: n, SUBJECTS: s, TESTS: t, LIVE: l, NEWS: w });
      connected = true; lockTabs();
      $("connInfo").textContent = `Connected to ${repo.full_name}. ${Object.keys(n).length} notes chapters, ${Object.keys(t).length} tests, ${l.length} live tests loaded.`;
      fillSubjects(); drawTests(); drawLive(); drawNews(); drawFiles();
      say("Connected. You can now add notes and tests.", "ok");
      openTab("notes");
    } catch (e) { say("Could not connect: " + e.message, "err"); }
  });
  $("forgetBtn").addEventListener("click", () => { try { localStorage.removeItem(KEY); } catch (e) {} $("tok").value = ""; connected = false; lockTabs(); openTab("connect"); say("Key removed from this device.", "ok"); });

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
    $("nDel").hidden = !D.NOTES[cid];
  }
  $("nSub").addEventListener("change", fillChapters);
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
    let c = s.chapters.find(x => x.id === cid);
    if (!c) { c = { id: cid, title, sub: $("nDesc").value.trim() }; s.chapters.push(c); }
    c.title = title; c.sub = $("nDesc").value.trim() || c.sub || ""; c.ready = true;
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
        if (!q.q || opts.length < 2 || q.a < 0 || q.a >= opts.length) bad.push(i + 2); else out.push(q);
      });
      tQs = out; drawTPrev();
      say(bad.length ? `${out.length} questions read. Skipped rows ${bad.slice(0, 10).join(", ")} (missing question, options or answer).` : `${out.length} questions read.`, bad.length ? "err" : "ok");
    } catch (err) { say("Could not read the file: " + err.message, "err"); }
  });
  $("tTpl").addEventListener("click", () => {
    const csv = "Section,Question,A,B,C,D,Answer,Explanation,Question (Hindi),A (Hindi),B (Hindi),C (Hindi),D (Hindi),Explanation (Hindi)\n" +
      'General Awareness,Which Act introduced dyarchy in the provinces?,Indian Councils Act 1909,Government of India Act 1919,Government of India Act 1935,Charter Act 1853,B,"The 1919 Act split provincial subjects into transferred and reserved.",प्रांतों में द्वैध शासन किस अधिनियम ने शुरू किया?,भारतीय परिषद अधिनियम 1909,भारत सरकार अधिनियम 1919,भारत सरकार अधिनियम 1935,चार्टर अधिनियम 1853,1919 के अधिनियम ने प्रांतीय विषयों को हस्तांतरित और आरक्षित में बाँटा।\n' +
      "English Comprehension,Select the synonym of ABUNDANT,Scarce,Plentiful,Tiny,Empty,B,Abundant means plentiful.,,,,,,\n";
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv" })); a.download = "ssc-test-template.csv"; a.click();
  });
  function resetTest() {
    editing = null; tQs = []; $("tFormTitle").textContent = "New test";
    ["tTitle", "tText"].forEach(k => $(k).value = ""); $("tMin").value = 60; $("tPlus").value = 2; $("tMinus").value = 0.5; $("tLive").checked = true; $("tSect").checked = false; $("tSecMin").value = 15; $("tFile").value = ""; drawTPrev();
  }
  $("tNew").addEventListener("click", resetTest);
  function drawTests() {
    const ids = Object.keys(D.TESTS);
    $("tList").innerHTML = ids.length ? ids.map(id => { const t = D.TESTS[id];
      return `<div class="item"><span class="t"><b>${E(t.title)}</b><span>${E(t.type)} · ${t.questions.length} questions · ${t.minutes} min · ${E(examName(t.exam))}</span></span>
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
      $("tSect").checked = !!t.sectional; $("tSecMin").value = t.sectional && t.sections[0] ? t.sections[0].minutes : 15;
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
    if ($("tSect").checked) {
      const names = [...new Set(tQs.map(q => q.section || "General"))];
      tQs.forEach(q => { if (!q.section) q.section = "General"; });
      t.sectional = true; t.sections = names.map(n => ({ name: n, minutes: +$("tSecMin").value || 15 }));
      t.minutes = t.sections.reduce((s, x) => s + x.minutes, 0);
    }
    D.TESTS[id] = t;
    const link = "test.html?id=" + id, entry = { name: title, type: t.type, exams: examName(t.exam), questions: tQs.length, minutes: t.minutes, marking: `+${t.plus} / −${t.minus}`, link };
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
        <button class="btn btn-out btn-sm" type="button" data-copy="assets/uploads/${E(f.name)}">Copy link</button></div>`).join("") || `<p class="muted" style="margin:0">No files yet.</p>`;
    } catch (e) { $("fList").innerHTML = `<p class="muted" style="margin:0">No files yet.</p>`; }
  }
  $("fList").addEventListener("click", async e => { const b = e.target.closest("[data-copy]"); if (!b) return;
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

  // expose the text parsers for testing
  window.SSC_ADMIN = { parseBody, parseQuiz, parseTable, toBody, toQuiz, toTable };
})();
