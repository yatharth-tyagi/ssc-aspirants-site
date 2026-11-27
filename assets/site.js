window.__pp = window.__pp || (() => "/api/me/photo?v=" + Date.now());
// SSCAspirants_Official – shared layout (side menu, top bar, reading mode, search)
// Every page has <body data-page="..." data-title="..."> and its content in <main id="content">.
// This script wraps that content with the side menu and top bar, so the menu lives in ONE place.
// Exam tiers (Tier 1 / Tier 2 or Paper 1 / Paper 2). Old exam data without tiers becomes one tier.
window.SSCTiers = function (ex) {
  if (!ex) return [];
  if (ex.tiers && ex.tiers.length) return ex.tiers;
  const m = parseInt(ex.time) || 60;
  return [{ id: "t1", name: ex.stage || "Tier 1", minutes: /hour/i.test(ex.time || "") ? m * 60 : m, plus: 2, minus: 0.5, negative: ex.negative || "", pattern: ex.pattern || [] }];
};
// Where "Back to test series" goes for a test
window.SSCSeriesUrl = function (t) {
  const ex = t && (window.EXAMS || []).find(e => e.id === t.exam);
  if (!ex) return "mock-tests.html";
  const tab = { "Full mock test": "mock", "Section-wise test": "sectional", "Subject-wise test": "subject", "Chapter test": "subject", "PYQ paper": "pyq" }[t.type] || "mock";
  return ex.page + (t.tier && t.tier !== "t1" ? "?tier=" + encodeURIComponent(t.tier) : "") + "#" + tab;
};
// ---- app (PWA): faster repeat visits, works on weak internet, "Install app" ----
(function () {
  const host = location.hostname;
  if ("serviceWorker" in navigator && (/(^|\.)sscaspirants-official\.(in|com)$/.test(host) || /\.pages\.dev$/.test(host)))
    window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
  window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); window.__installEvt = e; document.dispatchEvent(new Event("ssc-installable")); });
})();
// ---- words and colours the owner can change in Admin → Website (Texts & labels, Colours & fonts) ----
// Every label: [group, key, default]. Pages use SSCL("key") in code, or data-l="key" on an element.
window.SSC_LABEL_DEFS = [
  ["Home dashboard", "dash.study", "My study"], ["Home dashboard", "dash.streak0", "🔥 Start your streak today"], ["Home dashboard", "dash.streakN", "🔥 {n}-day streak"],
  ["Home dashboard", "dash.studySub", "Small daily steps get the selection."], ["Home dashboard", "dash.live", "Today's live test"], ["Home dashboard", "dash.liveNone", "No live test right now"],
  ["Home dashboard", "dash.liveNoneSub", "New tests are added every week."], ["Home dashboard", "dash.liveBtn0", "See live tests"], ["Home dashboard", "dash.liveBtn", "▶ Start test"],
  ["Home dashboard", "dash.prog", "Notes progress"], ["Home dashboard", "dash.progDone", "{done} of {total} chapters done"], ["Home dashboard", "dash.cont", "Continue reading"],
  ["Home dashboard", "dash.contNone", "Start with Indian Polity"], ["Home dashboard", "dash.contNoneSub", "Chapter-wise notes with memory tricks and a quick check."],
  ["Home dashboard", "dash.contBtn0", "Open notes"], ["Home dashboard", "dash.contBtn", "Continue →"], ["Home dashboard", "dash.contHere", "you stopped here"], ["Home dashboard", "dash.pyq", "PYQ papers"],
  ["Home dashboard", "dash.quiz", "Daily quiz"], ["Home dashboard", "dash.quizT", "Today's 5-minute quiz"], ["Home dashboard", "dash.quizSub", "Keep your streak alive – a new quiz every day."],
  ["Home dashboard", "dash.quizBtn", "Play now"], ["Home dashboard", "dash.board", "Leaderboard"],
  ["Jobs page", "jobs.title", "Jobs update"], ["Jobs page", "jobs.sub", "Latest govt jobs, admit cards, results and exam dates – with official links"],
  ["Jobs page", "jobs.search", "Search jobs, admit cards, results…"], ["Jobs page", "jobs.all", "All"], ["Jobs page", "jobs.boxJob", "Latest jobs"], ["Jobs page", "jobs.boxAdmit", "Admit card"],
  ["Jobs page", "jobs.boxResult", "Result & answer key"], ["Jobs page", "jobs.empty", "Nothing here yet."], ["Jobs page", "jobs.cal", "Exam calendar"], ["Jobs page", "jobs.calSub", "Important dates, soonest first"],
  ["Jobs page", "jobs.calEmpty", "Dates will show here."], ["Jobs page", "jobs.back", "← All job updates"], ["Jobs page", "jobs.dates", "Important dates"], ["Jobs page", "jobs.details", "Details"],
  ["Jobs page", "jobs.links", "Important links"], ["Jobs page", "jobs.lastDate", "Last date"], ["Jobs page", "jobs.warn", "Always check the official notification before applying. Dates and details can change."],
  ["Courses", "crs.full", "Complete course"], ["Courses", "crs.subject", "Subject course"], ["Courses", "crs.free", "Free"], ["Courses", "crs.joined", "✓ Joined"],
  ["Courses", "crs.fAll", "All courses"], ["Courses", "crs.fFull", "Complete courses"], ["Courses", "crs.fSubject", "Subject courses"], ["Courses", "crs.fMine", "My courses"],
  ["Courses", "crs.joinFree", "Join free"], ["Courses", "crs.enroll", "Enroll now"], ["Courses", "crs.demo", "Free demo lessons are open – try before you join."],
  ["Courses", "crs.payMsg", "Online payment is starting soon. Follow @SSCAspirants_Official for the launch."], ["Courses", "crs.login", "Please log in to join."],
  ["Courses", "crs.youJoined", "✓ You have joined"], ["Courses", "crs.tabLessons", "Lessons"], ["Courses", "crs.tabLive", "Live classes"], ["Courses", "crs.tabAbout", "About"],
  ["Courses", "crs.markDone", "Mark as done"], ["Courses", "crs.done", "✓ Done"], ["Courses", "crs.next", "Next ›"], ["Courses", "crs.locked", "Join the course to open this lesson"],
  ["Courses", "crs.videoSoon", "Video coming soon"], ["Courses", "crs.readNotes", "Read notes"], ["Courses", "crs.startTest", "Start test"], ["Courses", "crs.openPdf", "Open PDF"],
  ["Doubts & revision", "dbt.title", "💬 Ask a doubt"], ["Doubts & revision", "dbt.sub", "Stuck somewhere? Ask here – the subject teacher will answer."], ["Doubts & revision", "dbt.ph", "Write your doubt clearly…"],
  ["Doubts & revision", "dbt.btn", "Ask doubt"], ["Doubts & revision", "dbt.mine", "Your doubts here"], ["Doubts & revision", "dbt.wait", "⏳ Waiting for the teacher's answer"],
  ["Doubts & revision", "dbt.sent", "Sent! You'll see the answer here."], ["Doubts & revision", "dbt.login", "Please log in to ask a doubt."],
  ["Doubts & revision", "rev.add", "☆ Add to revision list"], ["Doubts & revision", "rev.in", "★ In your revision list"], ["Doubts & revision", "note.finish", "Finished this chapter?"],
  ["Doubts & revision", "note.complete", "✓ Mark as complete"], ["Doubts & revision", "note.undo", "↺ Mark as not complete"], ["Doubts & revision", "note.completed", "✓ You have completed this chapter."],
  ["Test screen", "test.online", "SSCAspirants_Official · Online Examination"], ["Test screen", "test.system", "System Name:"], ["Test screen", "test.cand", "Candidate Name"], ["Test screen", "test.subject", "Subject"],
  ["Test screen", "test.roll", "Roll No."], ["Test screen", "test.login", "Login"], ["Test screen", "test.practice", "Practice mode – no password needed."], ["Test screen", "test.signin", "Sign In"],
  ["Test screen", "test.thisTest", "This test"], ["Test screen", "test.agree", "I have read the instructions and I am ready to begin."], ["Test screen", "test.begin", "I am ready to begin"],
  ["Test screen", "test.ins", "Instructions"], ["Test screen", "test.qp", "Question Paper"], ["Test screen", "test.pause", "Pause"], ["Test screen", "test.fs", "Full screen"],
  ["Test screen", "test.markNext", "Mark for Review & Next"], ["Test screen", "test.clear", "Clear Response"], ["Test screen", "test.back", "Back"], ["Test screen", "test.saveNext", "Save & Next"],
  ["Test screen", "test.submitTest", "Submit test"], ["Test screen", "test.submitSec", "Submit section & next"], ["Test screen", "test.keep", "Keep working"],
  ["Test screen", "test.nv", "Not visited"], ["Test screen", "test.na", "Not answered"], ["Test screen", "test.a", "Answered"], ["Test screen", "test.m", "Marked for review"],
  ["Test screen", "test.am", "Answered & marked for review (will be evaluated)"]
];
(function () {
  const S = window.SITE || {}, L = S.labels || {}, D = {};
  window.SSC_LABEL_DEFS.forEach(([, k, v]) => D[k] = v);
  // SSCL("key", { n: 3 }) → the owner's text (or the default), with {n} filled in
  window.SSCL = (k, vars) => { let s = (L[k] != null && L[k] !== "" ? L[k] : D[k] != null ? D[k] : k) + ""; if (vars) s = s.replace(/\{(\w+)\}/g, (m, x) => vars[x] != null ? vars[x] : m); return s; };
  window.SSCLabels = root => (root || document).querySelectorAll("[data-l]").forEach(el => { const v = SSCL(el.dataset.l); if (el.dataset.lAttr) el.setAttribute(el.dataset.lAttr, v); else el.textContent = v; });
  // colours and fonts (light mode; exam colours also in dark mode)
  const T = S.theme || {}, hex = c => /^#[0-9a-f]{6}$/i.test(c || "") ? c : "";
  const FONT_OK = ["Inter", "Poppins", "Hind", "Mukta", "Roboto", "Open Sans", "Lato", "Nunito", "Noto Sans", "Baloo 2", "Montserrat", "Rubik"];
  let css = "";
  const light = { pri: "--pri", gold: "--gold", bg: "--bg", side: "--side", ink: "--ink" }, both = { ans: "--ans", nans: "--nans", mrk: "--mrk" };
  const lv = Object.entries(light).filter(([k]) => hex(T[k])).map(([k, v]) => `${v}:${T[k]}`), bv = Object.entries(both).filter(([k]) => hex(T[k])).map(([k, v]) => `${v}:${T[k]}`);
  if (hex(T.pri)) lv.push(`--pri-soft:${T.pri}1f`);
  if (hex(T.side)) lv.push(`--side-active:color-mix(in srgb,${T.side} 75%,#ffffff)`);
  if (lv.length) css += `:root{${lv.join(";")}}`;
  if (bv.length) css += `:root,html[data-read="dark"]{${bv.join(";")}}`;
  const fonts = [T.font, T.head].filter(f => FONT_OK.includes(f) && !/^(Inter|Poppins|Hind)$/.test(f));
  if (fonts.length) { const l = document.createElement("link"); l.rel = "stylesheet"; l.href = "https://fonts.googleapis.com/css2?" + fonts.map(f => "family=" + f.replace(/ /g, "+") + ":wght@400;500;600;700").join("&") + "&display=swap"; document.head.appendChild(l); }
  if (FONT_OK.includes(T.font)) css += `body,button,input,select,textarea{font-family:"${T.font}",system-ui,sans-serif}`;
  if (FONT_OK.includes(T.head)) css += `h1,h2,h3,.sec-head h2{font-family:"${T.head}","${T.font || "Inter"}",sans-serif!important}`;
  if (css) { const st = document.createElement("style"); st.id = "ssc-theme"; st.textContent = css; document.head.appendChild(st); }
  window.SSC_FONTS = FONT_OK;
})();
(function () {
  const IG = "https://www.instagram.com/sscaspirants_official/";
  const NAV = [
    ["home.html", "Home", "home", '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>'],
    ["jobs.html", "Jobs Update", "jobs", '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18"/>'],
    ["courses.html", "Courses", "courses", '<path d="M2 8l10-5 10 5-10 5z"/><path d="M6 10v5c0 2 3 4 6 4s6-2 6-4v-5M22 8v6"/>'],
    ["mock-tests.html", "Mock Tests", "tests", '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M9 2h6"/>'],
    ["live-tests.html", "Live Tests", "live", '<circle cx="12" cy="12" r="3"/><path d="M6.3 6.3a8 8 0 0 0 0 11.4M17.7 6.3a8 8 0 0 1 0 11.4M3.5 3.5a12 12 0 0 0 0 17M20.5 3.5a12 12 0 0 1 0 17"/>'],
    ["notes.html", "Notes", "notes", '<path d="M4 5h7v14H4zM13 5h7v14h-7z"/>'],
    ["pyq.html", "PYQ Papers", "pyq", '<path d="M6 3h9l4 4v14H6zM14 3v5h5"/>'],
    ["rank-calculator.html", "Rank Calculator", "rank", '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M8 6h8M8 11h2M14 11h2M8 15h2M14 15h2M8 19h2M14 19h2"/>'],
    ["daily-quiz.html", "Daily Quiz", "daily", '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4M8 14l2 2 4-4"/>'],
    ["leaderboard.html", "Leaderboard", "leaderboard", '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>'],
    ["home.html#about", "About", "about", '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>']
  ];
  // subjects/chapters hidden in Admin → Website are left out everywhere students look
  if (window.SUBJECTS && !/^(admin|admin-team|slide-editor|docs-editor)(\.html)?$/.test(location.pathname.split("/").pop()))
    window.SUBJECTS = window.SUBJECTS.filter(s => !s.hide).map(s => ({ ...s, chapters: s.chapters.filter(c => !c.hide) }));
  // menu changes made in Admin → Website (labels, hide, order, extra links)
  const SITE = window.SITE || {}, SH = SITE.shell || {};
  const LINK_IC = '<path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/>';
  const navItems = () => {
    const nv = SH.nav || {};
    let list = NAV.map(([h, n, id, ic]) => ({ h, n: (nv[h] && nv[h].label) || n, id, ic, hide: nv[h] && nv[h].hide }));
    (SH.links || []).forEach(l => list.push({ h: l.href, n: l.label, id: "", ic: LINK_IC, hide: l.hide, ext: /^https?:/i.test(l.href) }));
    if (SH.navOrder) list.sort((a, b) => { const ia = SH.navOrder.indexOf(a.h), ib = SH.navOrder.indexOf(b.h); return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib); });
    return list.filter(x => !x.hide);
  };
  const shownExams = () => (window.EXAMS || []).filter(e => !e.hide);
  const svg = (p, s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  const store = {
    get(k, d) { try { return localStorage.getItem(k) || d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  // ---- reading mode + text size (eye comfort) ----
  const root = document.documentElement;
  let read = store.get("ssc-read", "light") === "dark" ? "dark" : "light";
  let scale = parseFloat(store.get("ssc-scale", "1")) || 1;
  const applyRead = () => { root.dataset.read = read; root.style.setProperty("--scale", scale); };
  applyRead();

  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  // text typed in "Edit page" keeps only simple formatting (no scripts or styles)
  const KEEP = { B: 1, STRONG: 1, I: 1, EM: 1, U: 1, BR: 1, SPAN: 1, SMALL: 1, SUP: 1, SUB: 1, A: 1, S: 1, MARK: 1, WBR: 1 };
  function clean(html) {
    const d = new DOMParser().parseFromString("<div>" + (html || "") + "</div>", "text/html"), root = d.body.firstChild;
    const walk = el => [...el.children].forEach(n => {
      if (!KEEP[n.tagName]) { if (/^(SCRIPT|STYLE|IFRAME|OBJECT|EMBED|SVG|IMG|FORM|INPUT)$/i.test(n.tagName)) { n.remove(); return; } walk(n); n.replaceWith(...n.childNodes); return; }
      [...n.attributes].forEach(a => { const v = a.value.trim(); if (a.name === "class" && /^[\w -]*$/.test(v)) return; if (a.name === "href" && /^(https?:\/\/|[\w./#?=&-]+$)/i.test(v) && !/^javascript:/i.test(v)) return; if ((a.name === "target" && v === "_blank") || (a.name === "rel" && v === "noopener")) return; n.removeAttribute(a.name); });
      walk(n);
    });
    walk(root); return root.innerHTML;
  }
  const page = document.body.dataset.page || "";
  const title = document.body.dataset.title || "SSCAspirants_Official";
  const content = document.getElementById("content");
  SSCLabels();
  if (!content || document.body.dataset.shell === "off") { window.SSC = { store, svg, esc, applyRead }; return; }

  // ---- build the shell ----
  const shell = document.createElement("div");
  shell.className = "shell";
  shell.innerHTML = `
    <aside id="side" aria-label="Main menu">
      <a class="brand" href="home.html"><img src="assets/logo.png" alt=""><span><b data-shell="brand">${SH.brand ? esc(SH.brand) : "SSCAspirants<wbr>_Official"}</b></span></a>
      <nav aria-label="Main">${navItems().map(x =>
        `<a class="side-link" href="${esc(x.h)}"${x.id && x.id === page ? ' aria-current="page"' : ""}${x.ext ? ' target="_blank" rel="noopener"' : ""}>${svg(x.ic)}<span>${esc(x.n)}</span></a>`).join("")}</nav>
      <div id="sideAcct"></div>
      <a class="side-ig" href="${IG}" target="_blank" rel="noopener">${svg('<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1"/>')}Follow on Instagram</a>
    </aside>
    <div class="overlay" id="overlay"></div>
    <div class="main">
      <header class="top" style="position:sticky">
        <button class="icon-btn" id="ham" type="button" aria-label="Open or close menu" aria-controls="side" aria-expanded="true">${svg('<path d="M4 6h16M4 12h16M4 18h16"/>')}<span class="ham-label">Menu</span></button>
        ${page === "home" ? "" : `<button class="icon-btn nav-ic" id="backNav" type="button" aria-label="Back" title="Back">${svg('<path d="M15 18l-6-6 6-6"/>')}</button>
        <a class="icon-btn nav-ic" id="homeNav" href="home.html" aria-label="Home" title="Home">${svg('<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>')}</a>`}
        <h1>${title}</h1>
        <button class="icon-btn only-compact" id="searchBtn" type="button" aria-label="Search" aria-expanded="false">${svg('<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>')}</button>
        <button class="icon-btn only-compact" id="readBtn" type="button" aria-label="Reading mode and text size" aria-expanded="false" title="Light / dark and text size">${svg('<path d="M3 19l5-13 5 13M4.8 14.5h6.4"/><path d="M15 19l3-8 3 8M15.9 16.5h4.2"/>', 22)}</button>
        <label class="search" for="q">${svg('<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>', 18)}
          <input id="q" type="search" placeholder="Search notes, tests, PYQs" autocomplete="off"></label>
        <div class="read-ctl">
          <div class="theme-sw" role="group" aria-label="Reading mode">
            <button type="button" data-read="light" title="Light mode" aria-label="Light mode">${svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>', 18)}<span class="lbl">Light</span></button>
            <button type="button" data-read="dark" title="Dark mode – for night" aria-label="Dark mode">${svg('<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>', 18)}<span class="lbl">Dark</span></button>
          </div>
          <div class="size-ctl" role="group" aria-label="Text size">
            <button type="button" id="smaller" title="Smaller text" aria-label="Smaller text"><span class="a-sm">A</span><span class="pm">−</span></button>
            <button type="button" id="bigger" title="Bigger text" aria-label="Bigger text"><span class="a-lg">A</span><span class="pm">+</span></button>
          </div>
        </div>
        <a class="avatar" id="avatar" href="account.html" hidden aria-label="Account details"></a>
        <div class="results" id="results" role="listbox" aria-label="Search results"></div>
      </header>
    </div>`;
  // "Install app" appears in the menu when the browser allows installing
  const addInstall = () => { if (!window.__installEvt || document.getElementById("installApp")) return;
    const a = document.createElement("button"); a.type = "button"; a.id = "installApp"; a.className = "side-link"; a.style.cssText = "border:0;background:#ffffff14;width:100%;text-align:left;font:inherit;cursor:pointer;margin-top:8px";
    a.innerHTML = svg('<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M12 6v8M9 11l3 3 3-3"/>') + "<span>Install app</span>";
    a.onclick = async () => { const ev = window.__installEvt; if (!ev) return; ev.prompt(); try { await ev.userChoice; } catch (e) {} window.__installEvt = null; a.remove(); };
    const ig = shell.querySelector(".side-ig"); ig.parentNode.insertBefore(a, ig); };
  document.addEventListener("ssc-installable", addInstall); setTimeout(addInstall, 0);
  const main = shell.querySelector(".main");
  document.body.insertBefore(shell, document.body.firstChild);
  // ---- notice bar (Admin → Website → Notice bar) ----
  const NB = SITE.notice;
  if (NB && NB.on && NB.text) { const k = "ssc-nb:" + [...NB.text].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);
    if (store.get(k, "") !== "x") { const d = document.createElement("div"); d.className = "notice-bar nb-" + (/^(gold|red|green)$/.test(NB.tone) ? NB.tone : "blue"); d.setAttribute("role", "status");
      const lk = NB.link && /^(https?:\/\/|[\w./#?=&-]+$)/i.test(NB.link) ? NB.link : "";
      d.innerHTML = `<span>📢 ${esc(NB.text)}</span>${lk ? `<a href="${esc(lk)}"${/^https?:/i.test(lk) ? ' target="_blank" rel="noopener"' : ""}>${esc(NB.btn || "See more")} →</a>` : ""}<button type="button" aria-label="Close notice">✕</button>`;
      d.querySelector("button").onclick = () => { store.set(k, "x"); d.remove(); }; main.appendChild(d); } }
  main.appendChild(content);
  const foot = document.createElement("footer");
  foot.className = "foot"; foot.id = "about";
  foot.innerHTML = `<span data-shell="foot1">${SH.foot1 != null ? clean(SH.foot1) : `© ${new Date().getFullYear()} SSCAspirants_Official · Created by an idiot and created for idiots`}</span>
    <span data-shell="foot2">${SH.foot2 != null ? clean(SH.foot2) : `Notes, mock tests and PYQs for SSC exams · <a href="${IG}" target="_blank" rel="noopener">@SSCAspirants_Official</a>`}</span>`;
  foot.insertAdjacentHTML("beforeend", `<span class="foot-links"><a href="privacy.html">Privacy Policy</a> · <a href="terms.html">Terms of Use</a> · <a href="contact.html">Contact</a></span>`);
  main.appendChild(foot);

  // ---- page edits made with "✎ Edit page" (stored in data/site.js) ----
  const pageId = (location.pathname.split("/").pop() || "index").replace(/\.html$/, "") || "index";
  const DYN = new Set(["liveTests", "whatsNew", "subs", "chaps", "list", "note", "pyqList", "slideBox"]);
  const SKIP = /^(STYLE|SCRIPT|SVG|SELECT|OPTION|INPUT|TEXTAREA|NOSCRIPT|TEMPLATE|IMG|path|circle|rect)$/i;
  const isDyn = el => { for (let n = el; n && n !== content; n = n.parentElement) if ((n.id && DYN.has(n.id)) || n.hasAttribute("data-dyn")) return true; return false; };
  const keyOf = el => { const p = []; for (let n = el; n && n !== content; n = n.parentElement) { const same = [...n.parentElement.children].filter(x => x.tagName === n.tagName); p.unshift(n.tagName.toLowerCase() + (same.length > 1 ? same.indexOf(n) : "")); } return p.join("/"); };
  const hasText = el => [...el.childNodes].some(n => n.nodeType === 3 && n.nodeValue.trim());
  const ED = { page: pageId, texts: [], imgs: [], links: [], blocks: [], pristine: {}, clean, esc, SITE };
  if (!/^(admin|admin-team)$/.test(pageId)) {
    (function collect(el) { [...el.children].forEach(c => {
      if (SKIP.test(c.tagName) || (c.id && DYN.has(c.id)) || c.hasAttribute("data-dyn")) { if (c.tagName === "IMG" && !isDyn(c)) ED.imgs.push(c); return; }
      if (hasText(c) && c.tagName !== "BUTTON") { ED.texts.push(c); return; }
      collect(c);
    }); })(content);
    content.querySelectorAll("a[href]").forEach(a => { if (!isDyn(a)) ED.links.push(a); });
    ED.blocks = [...content.children].filter(c => !/^(STYLE|SCRIPT)$/.test(c.tagName));
    ED.texts.forEach(el => { const k = keyOf(el); el.dataset.k = k; ED.pristine[k] = el.innerHTML; });
    ED.imgs.forEach(el => { const k = "img:" + keyOf(el); el.dataset.k = k; ED.pristine[k] = el.getAttribute("src"); });
    ED.links.forEach(el => { const k = "a:" + keyOf(el); el.dataset.ka = k; ED.pristine[k] = el.getAttribute("href"); });
    ED.blocks.forEach(el => el.dataset.b = "b:" + keyOf(el));
    const P = (SITE.pages || {})[pageId];
    if (P) applyPage(P);
  }
  function customBlock(c) {
    const el = document.createElement("section"); el.className = "custom-block"; el.dataset.b = "c:" + c.id; el.dataset.custom = c.id;
    const pic = c.img && /^(https:\/\/|assets\/)/i.test(c.img) ? `<img src="${esc(c.img)}" alt="${esc(c.alt || "")}" data-cimg style="max-width:100%;border-radius:14px;display:block">` : "";
    const btn = c.btn ? `<a class="btn btn-pri" data-cbtn href="${esc(/^(https?:\/\/|[\w./#?=&-]+$)/i.test(c.link || "") ? c.link : "#")}"${/^https?:/i.test(c.link || "") ? ' target="_blank" rel="noopener"' : ""}>${esc(c.btn)}</a>` : "";
    el.innerHTML = `${c.title != null ? `<div class="sec-head"><h2 data-ctitle>${clean(c.title)}</h2></div>` : ""}<div class="card" style="display:flex;flex-wrap:wrap;gap:18px;align-items:center">
      ${c.type === "picture" || c.type === "both" ? `<div style="flex:1 1 260px">${pic}</div>` : ""}
      ${c.type !== "picture" ? `<div style="flex:2 1 300px"><div data-chtml>${clean(c.html || "")}</div>${btn ? `<p style="margin:14px 0 0">${btn}</p>` : ""}</div>` : (btn ? `<p style="margin:0">${btn}</p>` : "")}</div>`;
    return el;
  }
  function applyPage(P) {
    ED.texts.forEach(el => { const v = (P.t || {})[el.dataset.k]; if (v != null) el.innerHTML = clean(v); });
    ED.imgs.forEach(el => { const v = (P.img || {})[el.dataset.k]; if (v && /^(https:\/\/|assets\/)/i.test(v)) el.src = v; });
    ED.links.forEach(el => { const v = (P.href || {})[el.dataset.ka]; if (v && /^(https?:\/\/|[\w./#?=&-]+$)/i.test(v)) el.setAttribute("href", v); });
    (P.add || []).forEach(c => content.appendChild(customBlock(c)));
    const all = [...content.querySelectorAll(":scope > [data-b]")];
    if (P.order && P.order.length) { const byKey = {}; all.forEach(b => byKey[b.dataset.b] = b);
      P.order.forEach(k => byKey[k] && content.appendChild(byKey[k])); all.forEach(b => { if (!P.order.includes(b.dataset.b)) content.appendChild(b); }); }
    all.forEach(b => { if ((P.hide || []).includes(b.dataset.b)) { b.hidden = true; b.dataset.hiddenBlock = "1"; } });
  }
  ED.customBlock = customBlock;
  // exams hidden in Admin → Website disappear from the exam lists too
  (window.EXAMS || []).filter(e => e.hide).forEach(e => content.querySelectorAll(`a[href="${e.page}"]`).forEach(a => { if (a.classList.contains("exam")) a.hidden = true; }));

  // ---- a test always opens in its own tab, like the real exam window ----
  document.addEventListener("click", e => { const a = e.target.closest && e.target.closest('a[href^="test.html"]'); if (a && !a.target) { a.target = "_blank"; a.rel = "noopener"; } }, true);

  // ---- back: previous page on this site, otherwise the page this one belongs to ----
  const bk = document.getElementById("backNav");
  if (bk) bk.addEventListener("click", () => {
    let same = false; try { same = !!document.referrer && new URL(document.referrer).origin === location.origin; } catch (e) {}
    if (same && history.length > 1) history.back(); else location.href = document.body.dataset.back || "home.html";
  });

  // ---- hamburger: desktop collapses the menu, phone slides it in ----
  const ham = document.getElementById("ham"), side = document.getElementById("side");
  const mobile = () => window.matchMedia("(max-width:719px)").matches;
  // Home: the side menu stays open on computers and tablets (no hamburger); other pages remember open / closed
  const homeFixed = page === "home";
  if (homeFixed) document.body.classList.add("home-fixed");
  if (!homeFixed && !mobile() && store.get("ssc-nav", "open") === "closed") document.body.classList.add("nav-closed");
  const sync = () => ham.setAttribute("aria-expanded", mobile() ? document.body.classList.contains("nav-open") : !document.body.classList.contains("nav-closed"));
  ham.addEventListener("click", () => {
    if (mobile()) document.body.classList.toggle("nav-open");
    else if (homeFixed) return;
    else { document.body.classList.toggle("nav-closed"); store.set("ssc-nav", document.body.classList.contains("nav-closed") ? "closed" : "open"); }
    sync();
  });
  document.getElementById("overlay").addEventListener("click", () => { document.body.classList.remove("nav-open"); sync(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape") { document.body.classList.remove("nav-open"); sync(); } });
  sync();

  // ---- compact header (phones and tablets): search and reading controls open on tap ----
  const toggle = (cls, btn, focus) => {
    const on = !document.body.classList.contains(cls);
    document.body.classList.remove("show-search", "show-read");
    document.getElementById("searchBtn").setAttribute("aria-expanded", false);
    document.getElementById("readBtn").setAttribute("aria-expanded", false);
    if (on) { document.body.classList.add(cls); btn.setAttribute("aria-expanded", true); if (focus) focus.focus(); }
  };
  document.getElementById("searchBtn").addEventListener("click", e => toggle("show-search", e.currentTarget, document.getElementById("q")));
  document.getElementById("readBtn").addEventListener("click", e => toggle("show-read", e.currentTarget));
  document.addEventListener("keydown", e => { if (e.key === "Escape") document.body.classList.remove("show-search", "show-read"); });

  // ---- reading mode buttons ----
  const modeBtns = shell.querySelectorAll("[data-read]");
  const paintModes = () => modeBtns.forEach(b => b.setAttribute("aria-pressed", b.dataset.read === read));
  modeBtns.forEach(b => b.addEventListener("click", () => { read = b.dataset.read; store.set("ssc-read", read); applyRead(); paintModes(); }));
  paintModes();
  const size = d => { scale = Math.min(1.3, Math.max(0.9, Math.round((scale + d) * 100) / 100)); store.set("ssc-scale", scale); applyRead(); };
  document.getElementById("smaller").addEventListener("click", () => size(-0.05));
  document.getElementById("bigger").addEventListener("click", () => size(0.05));

  // ---- search across pages and chapters ----
  const q = document.getElementById("q"), res = document.getElementById("results");
  const index = () => {
    const items = [
      { t: "Mock Tests", s: "Full, sectional and chapter tests", h: "mock-tests.html" },
      { t: "PYQ Papers", s: "Previous year papers, exam-wise", h: "pyq.html" },
      { t: "Rank calculator", s: "Marks and rank from your SSC answer key", h: "rank-calculator.html" },
      { t: "Daily quiz", s: "A new quiz every day, keep your streak", h: "daily-quiz.html" },
      { t: "Leaderboard", s: "Top students of each test", h: "leaderboard.html" },
      { t: "Indian Polity – Chapter Test", s: "Demo test in the Eduquity style", h: "test.html" }
    ];
    (window.EXAMS || []).forEach(e => items.push({ t: e.name, s: e.full + " · pattern, mock tests, PYQs", h: e.page }));
    (window.SUBJECTS || []).forEach(sub => sub.chapters.forEach(c => items.push({
      t: c.title, s: sub.name + " · " + c.sub, h: (window.NOTES && window.NOTES[c.id]) || c.ready ? "note.html?id=" + c.id : "notes.html#" + sub.id
    })));
    return items;
  };
  q.addEventListener("input", () => {
    const v = q.value.trim().toLowerCase();
    if (!v) { res.classList.remove("show"); return; }
    const hits = index().filter(i => (i.t + " " + i.s).toLowerCase().includes(v)).slice(0, 7);
    res.innerHTML = hits.length ? hits.map(i => `<a href="${i.h}">${esc(i.t)}<span>${esc(i.s)}</span></a>`).join("")
      : `<a href="notes.html">No match for "${esc(q.value)}"<span>Browse all notes</span></a>`;
    res.classList.add("show");
  });
  document.addEventListener("click", e => { if (!e.target.closest(".search") && !e.target.closest("#results")) res.classList.remove("show"); });

  // ---- name watermark on notes and course lessons (Admin → Website → Name watermark) ----
  window.SSCWatermark = function () {
    const W = SITE.wm || {}, d = window.__me; if (W.on === false || !d) return;
    const who = d.user || d.admin; if (!who) return;
    const t = String(W.text || "{name} · {email}").replace(/\{name\}/g, who.name || "").replace(/\{email\}/g, who.email || "")
      .replace(/\{date\}/g, new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })).trim();
    if (!t) return;
    const op = { light: .07, medium: .12, strong: .2 }[W.strength] || .12, x = s => s.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
    const svgT = `<svg xmlns="http://www.w3.org/2000/svg" width="340" height="200"><text x="170" y="100" text-anchor="middle" transform="rotate(-24 170 100)" font-family="Inter,Arial,sans-serif" font-size="15" font-weight="600" fill="#6b7280" fill-opacity="${op}">${x(t)}</text></svg>`;
    const bg = `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgT)}")`;
    const els = []; if (W.notes !== false) els.push(...document.querySelectorAll("article.protected")); if (W.courses !== false) els.push(...document.querySelectorAll("#player"));
    els.forEach(el => { let o = el.querySelector(":scope > .wm-name"); if (!o) { o = document.createElement("div"); o.className = "wm-name"; o.setAttribute("aria-hidden", "true");
      if (getComputedStyle(el).position === "static") el.style.position = "relative"; el.appendChild(o); } o.style.backgroundImage = bg; });
  };
  // lessons and notes redraw their content, so keep the watermark layer in place
  new MutationObserver(() => { document.querySelectorAll("article.protected,#player").forEach(el => { if (!el.querySelector(":scope > .wm-name")) window.SSCWatermark(); }); })
    .observe(document.documentElement, { childList: true, subtree: true });

  // ---- account: who is logged in (student account and/or admin account – separate logins) ----
  const logout = async () => { try { await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" }); } catch (e) {} location.href = "index.html"; };
  const paintAvatar = u => {
    const av = document.getElementById("avatar");
    av.innerHTML = u.photo ? `<img src="${window.__pp()}" alt="">` : esc((u.name || u.email).trim().charAt(0).toUpperCase());
    av.title = u.name + " – Account details"; av.hidden = false;
  };
  fetch("/api/auth/me", { credentials: "same-origin" }).then(r => r.status === 401 ? { out: true } : r.json()).then(d => {
    window.__me = d; window.SSCWatermark && window.SSCWatermark();
    const sa = document.getElementById("sideAcct");
    if (!d.user && !d.admin) { if (d.out) sa.innerHTML = `<div class="side-label">Account</div><a class="side-link" href="index.html">${svg('<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"/>')}Log in</a>`; return; }
    let h = `<div class="side-label">Account</div>`;
    if (d.user) {
      paintAvatar(d.user);
      h += `<a class="side-link" href="account.html"${page === "account" ? ' aria-current="page"' : ""}>${svg('<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>')}Account details</a>`;
      h += `<a class="side-link" href="saved.html"${page === "saved" ? ' aria-current="page"' : ""}>${svg('<path d="M6 3h12v18l-6-4-6 4z"/>')}Revision &amp; saved</a>`;
    }
    if (d.admin) h += `<a class="side-link" href="admin.html"${page === "admin" || page === "admin-team" ? ' aria-current="page"' : ""}>${svg('<path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z"/>')}Admin panel</a>`;
    if (d.user) h += `<button class="side-link" type="button" id="logoutBtn">${svg('<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>')}Log out</button>`;
    sa.innerHTML = h;
    if (d.user) document.getElementById("logoutBtn").addEventListener("click", logout);
    if (d.admin && d.admin.role !== "teacher" && !/^(admin|admin-team)$/.test(pageId)) {
      const eb = document.createElement("button"); eb.className = "icon-btn"; eb.type = "button"; eb.id = "editPageBtn"; eb.title = "Edit this page (admin)"; eb.style.cssText = "width:auto;padding:0 12px;font-weight:700;color:var(--pri)";
      eb.textContent = "✎ Edit page"; document.querySelector(".top h1").after(eb);
      const go = () => { if (window.SSCEditor) return window.SSCEditor.start(); const sc = document.createElement("script"); sc.src = "assets/editpage.js"; sc.onload = () => window.SSCEditor.start(); document.body.appendChild(sc); };
      eb.onclick = go; if (/[?&]edit=1/.test(location.search)) go();
    }
    window.SSC.user = d.user; window.SSC.admin = d.admin;
    document.dispatchEvent(new CustomEvent("ssc:user", { detail: d }));
  }).catch(() => {});


  // ---- test cards: after a test is given, the card shows the last attempt (marks, accuracy, rank,
  //      correct / wrong / skipped), Solution & Analysis, Reattempt and the list of all attempts ----
  const nthW = n => n + (n % 100 >= 11 && n % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] || "th");
  const testQs = key => { if (window.TESTS && TESTS[key]) return TESTS[key].questions;
    if (key === "polity-ch1-4" && window.SUBJECTS && window.NOTES) { const sb = SUBJECTS.find(x => x.id === "polity"), qs = []; if (sb) sb.chapters.forEach(c => (NOTES[c.id] && NOTES[c.id].quiz || []).forEach(q => qs.push(q))); return qs; }
    return null; };
  const tUrl = (key, extra) => (key === "polity-ch1-4" ? "test.html?" : "test.html?id=" + encodeURIComponent(key) + "&") + extra;
  const counts = (key, a) => { const Q = testQs(key); if (!Q || !a.ans || a.ans.length !== Q.length) return null;
    let r = 0, w = 0, sk = 0; a.ans.forEach((x, i) => { if (x == null) sk++; else if (x === Q[i].a) r++; else w++; }); return { r, w, sk }; };
  const fmtN = v => +(+v).toFixed(2);
  function paintCard(el, list) {
    if (!list || !list.length) return;
    list = list.slice().sort((a, b) => (a.n || 0) - (b.n || 0) || a.created - b.created);
    const key = el.dataset.tcard, last = list.reduce((x, y) => (y.created > x.created ? y : x)), c = counts(key, last);
    const title = el.dataset.title || (el.querySelector("b") || {}).textContent || "Test";
    const acc = c && c.r + c.w ? Math.round(c.r / (c.r + c.w) * 100) : null;
    el.classList.add("tc-done");
    el.innerHTML = `<span class="pill ok tc-pill">✓ Attempted${list.length > 1 ? ` · ${list.length} attempts` : ""}</span>
      <b class="tc-title">${esc(title)}</b>
      <div class="tc-stats"><span title="Marks in your last attempt">📝 <b>${fmtN(last.score)}</b>/${fmtN(last.max)}</span>${acc != null ? `<span title="Accuracy">◎ ${acc}%</span>` : ""}${last.rank != null ? `<span title="Rank">🏆 ${last.rank}/${last.total}</span>` : ""}<span class="muted">${nthW(last.n || list.length)} attempt</span></div>
      ${c ? `<div class="tc-bar" aria-hidden="true"><i class="c" style="flex:${c.r}"></i><i class="w" style="flex:${c.w}"></i><i class="s" style="flex:${c.sk}"></i></div>
      <div class="tc-leg"><span><i class="c"></i>${c.r} Correct</span><span><i class="w"></i>${c.w} Wrong</span><span><i class="s"></i>${c.sk} Skipped</span></div>` : ""}
      <div class="tc-btns"><a class="btn btn-pri" href="${tUrl(key, "view=result&n=" + (last.n || list.length))}">Solution &amp; Analysis</a>
        <a class="btn btn-out" href="${tUrl(key, "again=1")}">↻ Reattempt (${nthW(list.length + 1)})</a>
        <button class="btn btn-out" type="button" data-allatt>All attempts (${list.length})</button></div>`;
    el.querySelector("[data-allatt]").addEventListener("click", () => attemptsDialog(key, title, list));
  }
  function attemptsDialog(key, title, list) {
    let dl = document.getElementById("attDlg");
    if (!dl) { dl = document.createElement("dialog"); dl.id = "attDlg"; dl.className = "att-dlg"; document.body.appendChild(dl);
      dl.addEventListener("click", e => { if (e.target === dl || e.target.closest("[data-close]")) dl.close(); }); }
    dl.innerHTML = `<div class="att-h"><div><small>All attempts</small><b>${esc(title)}</b></div><button type="button" class="icon-btn" data-close aria-label="Close">✕</button></div>
      <div class="att-list">${list.map(a => { const c = counts(key, a), n = a.n || 1;
        return `<div class="att-row${n === 1 ? " off" : ""}"><span class="att-n">${nthW(n)}${n === 1 ? "<small>Official rank</small>" : ""}</span>
          <span class="att-m"><b>${fmtN(a.score)}</b>/${fmtN(a.max)}<small>Marks</small></span>
          <span class="att-m"><b>${a.rank != null ? a.rank + "<i>/" + a.total + "</i>" : "–"}</b><small>Rank</small></span>
          <span class="att-m"><b>${a.pct != null ? fmtN(a.pct) : "–"}</b><small>Percentile</small></span>
          <span class="att-c">${c ? `<em class="c">✓ ${c.r}</em><em class="w">✗ ${c.w}</em><em class="s">– ${c.sk}</em>` : ""}<small>${new Date(a.created).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</small></span>
          <span class="att-b"><a class="btn btn-pri" href="${tUrl(key, "view=result&n=" + n)}">Result</a><a class="btn btn-out" href="solutions.html?id=${encodeURIComponent(key)}&n=${n}">Solutions</a></span></div>`; }).join("")}</div>
      <p class="muted att-note">Your official rank always comes from your 1st attempt. Later attempts show the rank that score would get.</p>
      <div class="att-f"><a class="btn btn-pri" href="${tUrl(key, "again=1")}">↻ Reattempt (${nthW(list.length + 1)} attempt)</a></div>`;
    dl.showModal();
  }
  function testCards() {
    const cards = [...document.querySelectorAll("[data-tcard]")]; if (!cards.length) return;
    fetch("/api/me/attempts?full=1", { credentials: "same-origin" }).then(r => r.ok ? r.json() : null).then(d => {
      if (!d || !d.attempts) return; const by = {}; d.attempts.forEach(a => (by[a.test] = by[a.test] || []).push(a));
      cards.forEach(c => paintCard(c, by[c.dataset.tcard]));
    }).catch(() => {});
  }
  window.SSCTestCards = testCards;
  testCards();
  window.SSC = { store, svg, esc, logout, paintAvatar, clean, ED };
})();
