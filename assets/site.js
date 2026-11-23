// SSC Aspirants Official – shared layout (side menu, top bar, reading mode, search)
// Every page has <body data-page="..." data-title="..."> and its content in <main id="content">.
// This script wraps that content with the side menu and top bar, so the menu lives in ONE place.
(function () {
  const IG = "https://www.instagram.com/sscaspirants_official/";
  const NAV = [
    ["index.html", "Home", "home", '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>'],
    ["mock-tests.html", "Mock Tests", "tests", '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M9 2h6"/>'],
    ["notes.html", "Notes", "notes", '<path d="M4 5h7v14H4zM13 5h7v14h-7z"/>'],
    ["pyq.html", "PYQ Papers", "pyq", '<path d="M6 3h9l4 4v14H6zM14 3v5h5"/>'],
    ["index.html#about", "About", "about", '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>']
  ];
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
  const page = document.body.dataset.page || "";
  const title = document.body.dataset.title || "SSC Aspirants Official";
  const content = document.getElementById("content");
  if (!content || document.body.dataset.shell === "off") { window.SSC = { store, svg, esc, applyRead }; return; }

  // ---- build the shell ----
  const shell = document.createElement("div");
  shell.className = "shell";
  shell.innerHTML = `
    <aside id="side" aria-label="Main menu">
      <a class="brand" href="index.html"><img src="assets/logo.png" alt=""><span><b>SSC Aspirants</b><small>OFFICIAL</small></span></a>
      <nav aria-label="Main">${NAV.map(([h, n, id, ic]) =>
        `<a class="side-link" href="${h}"${id === page ? ' aria-current="page"' : ""}>${svg(ic)}${n}</a>`).join("")}</nav>
      <div class="side-label">Exams</div>
      <nav aria-label="Exams" class="side-exams">${(window.EXAMS || []).map(e =>
        `<a class="side-link small" href="${e.page}"${"exam-" + e.id === page ? ' aria-current="page"' : ""}><span class="side-ab">${e.short}</span>${e.name}</a>`).join("")}</nav>
      <a class="side-ig" href="${IG}" target="_blank" rel="noopener">${svg('<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1"/>')}Follow on Instagram</a>
    </aside>
    <div class="overlay" id="overlay"></div>
    <div class="main">
      <header class="top" style="position:sticky">
        <button class="icon-btn" id="ham" type="button" aria-label="Open or close menu" aria-controls="side" aria-expanded="true">${svg('<path d="M4 6h16M4 12h16M4 18h16"/>')}<span class="ham-label">Menu</span></button>
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
        <div class="results" id="results" role="listbox" aria-label="Search results"></div>
      </header>
    </div>`;
  const main = shell.querySelector(".main");
  document.body.insertBefore(shell, document.body.firstChild);
  main.appendChild(content);
  const foot = document.createElement("footer");
  foot.className = "foot"; foot.id = "about";
  foot.innerHTML = `<span>© ${new Date().getFullYear()} SSC Aspirants Official · Created by <b>Yatharth Tyagi</b></span>
    <span>Notes, mock tests and PYQs for SSC exams · <a href="${IG}" target="_blank" rel="noopener">@sscaspirants_official</a></span>`;
  main.appendChild(foot);

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

  window.SSC = { store, svg, esc };
})();
