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
(function () {
  const IG = "https://www.instagram.com/sscaspirants_official/";
  const NAV = [
    ["index.html", "Home", "home", '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>'],
    ["mock-tests.html", "Mock Tests", "tests", '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M9 2h6"/>'],
    ["live-tests.html", "Live Tests", "live", '<circle cx="12" cy="12" r="3"/><path d="M6.3 6.3a8 8 0 0 0 0 11.4M17.7 6.3a8 8 0 0 1 0 11.4M3.5 3.5a12 12 0 0 0 0 17M20.5 3.5a12 12 0 0 1 0 17"/>'],
    ["notes.html", "Notes", "notes", '<path d="M4 5h7v14H4zM13 5h7v14h-7z"/>'],
    ["pyq.html", "PYQ Papers", "pyq", '<path d="M6 3h9l4 4v14H6zM14 3v5h5"/>'],
    ["rank-calculator.html", "Rank Calculator", "rank", '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M8 6h8M8 11h2M14 11h2M8 15h2M14 15h2M8 19h2M14 19h2"/>'],
    ["daily-quiz.html", "Daily Quiz", "daily", '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4M8 14l2 2 4-4"/>'],
    ["leaderboard.html", "Leaderboard", "leaderboard", '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>'],
    ["index.html#about", "About", "about", '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>']
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
  if (!content || document.body.dataset.shell === "off") { window.SSC = { store, svg, esc, applyRead }; return; }

  // ---- build the shell ----
  const shell = document.createElement("div");
  shell.className = "shell";
  shell.innerHTML = `
    <aside id="side" aria-label="Main menu">
      <a class="brand" href="index.html"><img src="assets/logo.png" alt=""><span><b data-shell="brand">${SH.brand ? esc(SH.brand) : "SSCAspirants<wbr>_Official"}</b></span></a>
      <nav aria-label="Main">${navItems().map(x =>
        `<a class="side-link" href="${esc(x.h)}"${x.id && x.id === page ? ' aria-current="page"' : ""}${x.ext ? ' target="_blank" rel="noopener"' : ""}>${svg(x.ic)}<span>${esc(x.n)}</span></a>`).join("")}</nav>
      <div class="side-label">Exams</div>
      <nav aria-label="Exams" class="side-exams">${shownExams().map(e =>
        `<a class="side-link small" href="${e.page}"${"exam-" + e.id === page ? ' aria-current="page"' : ""}><span class="side-ab">${e.short}</span>${e.name}</a>`).join("")}</nav>
      <div id="sideAcct"></div>
      <a class="side-ig" href="${IG}" target="_blank" rel="noopener">${svg('<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1"/>')}Follow on Instagram</a>
    </aside>
    <div class="overlay" id="overlay"></div>
    <div class="main">
      <header class="top" style="position:sticky">
        <button class="icon-btn" id="ham" type="button" aria-label="Open or close menu" aria-controls="side" aria-expanded="true">${svg('<path d="M4 6h16M4 12h16M4 18h16"/>')}<span class="ham-label">Menu</span></button>
        ${page === "home" ? "" : `<button class="icon-btn nav-ic" id="backNav" type="button" aria-label="Back" title="Back">${svg('<path d="M15 18l-6-6 6-6"/>')}</button>
        <a class="icon-btn nav-ic" id="homeNav" href="index.html" aria-label="Home" title="Home">${svg('<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>')}</a>`}
        <h1>${title}</h1>
        <button class="icon-btn only-compact" id="searchBtn" type="button" aria-label="Search" aria-expanded="false">${svg('<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>')}</button>
        <button class="icon-btn only-compact" id="readBtn" type="button" aria-label="Reading mode and text size" aria-expanded="false" style="font-weight:700">Aa</button>
        <label class="search" for="q">${svg('<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>', 18)}
          <input id="q" type="search" placeholder="Search notes, tests, PYQs" autocomplete="off"></label>
        <div class="read-ctl">
          <div class="seg" role="group" aria-label="Reading mode">
            <button type="button" data-read="light" title="Light">Light</button>
            <button type="button" data-read="dark" title="Dark – for night">Dark</button>
          </div>
          <div class="seg" role="group" aria-label="Text size">
            <button type="button" id="smaller" aria-label="Smaller text">A−</button>
            <button type="button" id="bigger" aria-label="Bigger text">A+</button>
          </div>
        </div>
        <a class="avatar" id="avatar" href="account.html" hidden aria-label="Account details"></a>
        <div class="results" id="results" role="listbox" aria-label="Search results"></div>
      </header>
    </div>`;
  const main = shell.querySelector(".main");
  document.body.insertBefore(shell, document.body.firstChild);
  main.appendChild(content);
  const foot = document.createElement("footer");
  foot.className = "foot"; foot.id = "about";
  foot.innerHTML = `<span data-shell="foot1">${SH.foot1 != null ? clean(SH.foot1) : `© ${new Date().getFullYear()} SSCAspirants_Official · Created by <b>Yatharth Tyagi</b>`}</span>
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

  // ---- back: previous page on this site, otherwise the page this one belongs to ----
  const bk = document.getElementById("backNav");
  if (bk) bk.addEventListener("click", () => {
    let same = false; try { same = !!document.referrer && new URL(document.referrer).origin === location.origin; } catch (e) {}
    if (same && history.length > 1) history.back(); else location.href = document.body.dataset.back || "index.html";
  });

  // ---- hamburger: desktop collapses the menu, phone slides it in ----
  const ham = document.getElementById("ham"), side = document.getElementById("side");
  const mobile = () => window.matchMedia("(max-width:719px)").matches;
  if (!mobile() && store.get("ssc-nav", "open") === "closed") document.body.classList.add("nav-closed");
  const sync = () => ham.setAttribute("aria-expanded", mobile() ? document.body.classList.contains("nav-open") : !document.body.classList.contains("nav-closed"));
  ham.addEventListener("click", () => {
    if (mobile()) document.body.classList.toggle("nav-open");
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

  // ---- account: who is logged in (student account and/or admin account – separate logins) ----
  const logout = async () => { try { await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" }); } catch (e) {} location.href = "/login"; };
  const paintAvatar = u => {
    const av = document.getElementById("avatar");
    av.innerHTML = u.photo ? `<img src="/api/me/photo?v=${u.photo}" alt="">` : esc((u.name || u.email).trim().charAt(0).toUpperCase());
    av.title = u.name + " – Account details"; av.hidden = false;
  };
  fetch("/api/auth/me", { credentials: "same-origin" }).then(r => r.status === 401 ? { out: true } : r.json()).then(d => {
    const sa = document.getElementById("sideAcct");
    if (!d.user && !d.admin) { if (d.out) sa.innerHTML = `<div class="side-label">Account</div><a class="side-link" href="/login">${svg('<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"/>')}Log in</a>`; return; }
    let h = `<div class="side-label">Account</div>`;
    if (d.user) {
      paintAvatar(d.user);
      h += `<a class="side-link" href="account.html"${page === "account" ? ' aria-current="page"' : ""}>${svg('<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>')}Account details</a>`;
      h += `<a class="side-link" href="saved.html"${page === "saved" ? ' aria-current="page"' : ""}>${svg('<path d="M6 3h12v18l-6-4-6 4z"/>')}Saved questions</a>`;
    }
    if (d.admin) h += `<a class="side-link" href="admin.html"${page === "admin" || page === "admin-team" ? ' aria-current="page"' : ""}>${svg('<path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z"/>')}Admin panel</a>`;
    if (d.user) h += `<button class="side-link" type="button" id="logoutBtn">${svg('<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>')}Log out</button>`;
    sa.innerHTML = h;
    if (d.user) document.getElementById("logoutBtn").addEventListener("click", logout);
    if (d.admin && !/^(admin|admin-team)$/.test(pageId)) {
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
