// Builds one exam page (ssc-cgl.html, ssc-chsl.html ...) from data/exams.js and data/topics.js.
// The page's <body data-exam="cgl"> says which exam to show.
// The page has tabs, each its own section: Exam pattern, Full mock tests, Section-wise tests,
// Subject-wise tests and PYQ papers. The address ends in #pattern, #mock, #sectional, #subject or #pyq.
(function () {
  const ex = (window.EXAMS || []).find(e => e.id === document.body.dataset.exam);
  const box = document.getElementById("content");
  if (!ex) { box.innerHTML = '<p>Exam not found. <a href="mock-tests.html">See all exams</a></p>'; return; }
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const qs = ex.pattern.reduce((a, r) => a + r[1], 0), marks = ex.pattern.reduce((a, r) => a + r[2], 0);
  const polityQs = window.NOTES ? Object.values(NOTES).reduce((a, n) => a + (n.quiz || []).length, 0) : 19;
  const mins = q => Math.max(10, Math.round(q * 0.6));
  const card = (title, meta, href) => `<div class="card test"><span class="pill ${href ? "ok" : "soon"}">${href ? "Available" : "Coming soon"}</span>
    <b>${esc(title)}</b><div class="meta">${meta}</div>${href ? `<a class="btn btn-pri" href="${href}">Start test</a>` : `<span class="btn off" aria-disabled="true">Coming soon</span>`}</div>`;
  const groupFor = name => {
    const n = name.toLowerCase();
    return Object.entries(window.TOPICS || {}).find(([, g]) => g.match.some(m => n.includes(m)));
  };
  const years = ["2025", "2024", "2023"];

  // tests published from the admin page (data/tests.js) for this exam
  const realTests = type => Object.entries(window.TESTS || {}).filter(([, t]) => (t.exam === ex.id || t.exam === "all") && t.type === type)
    .map(([id, t]) => card(t.title, `<span>${t.questions.length} questions</span><span>${t.minutes} min</span><span>+${t.plus} / −${t.minus}</span>`, "test.html?id=" + encodeURIComponent(id))).join("");

  const TABS = [
    ["pattern", "Exam pattern"], ["mock", "Full mock tests"], ["sectional", "Section-wise tests"],
    ["subject", "Subject-wise tests"], ["pyq", "PYQ papers"]
  ];

  // ---------- panels ----------
  const pattern = `
    <div class="sec-head"><h2>${esc(ex.name)} exam pattern</h2><p>${esc(ex.stage)}</p></div>
    <div class="facts">
      <div class="fact"><b>${qs}</b><span>Questions</span></div>
      <div class="fact"><b>${marks}</b><span>Total marks</span></div>
      <div class="fact"><b>${esc(ex.time)}</b><span>Time</span></div>
      <div class="fact"><b class="small">${esc(ex.negative)}</b><span>Negative marking</span></div>
    </div>
    <div class="card ptable"><table>
      <thead><tr><th>Section</th><th>Questions</th><th>Marks</th></tr></thead>
      <tbody>${ex.pattern.map(r => `<tr><td>${esc(r[0])}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join("")}</tbody>
      <tfoot><tr><td>Total</td><td>${qs}</td><td>${marks}</td></tr></tfoot>
    </table></div>
    <p class="muted">Posts: ${esc(ex.posts)}. Always check the latest official SSC notice for changes.</p>`;

  const mock = `
    <div class="sec-head"><h2>${esc(ex.name)} full mock tests</h2><p>Complete paper · Eduquity CBT interface · English / Hindi</p></div>
    <div class="tests">${realTests("Full mock test")}${[1, 2, 3, 4, 5].map(i => card(`${ex.name} – Full Mock ${i}`,
      `<span>${qs} questions</span><span>${marks} marks</span><span>${esc(ex.time)}</span>`)).join("")}</div>`;

  const sectional = `
    <div class="sec-head"><h2>${esc(ex.name)} section-wise tests</h2><p>One section at a time, in the exam's own pattern</p></div>
    ${realTests("Section-wise test") ? `<div class="tests">${realTests("Section-wise test")}</div>` : ""}
    ${ex.pattern.map(([name, q, m]) => `
      <h3 class="grp">${esc(name)} <span>${q} questions · ${m} marks per test</span></h3>
      <div class="tests">${[1, 2, 3, 4, 5].map(i => card(`${name} – Sectional ${i}`,
        `<span>${q} questions</span><span>${m} marks</span><span>${mins(q)} min</span>`)).join("")}</div>`).join("")}`;

  const seen = new Set();
  const subject = `
    <div class="sec-head"><h2>${esc(ex.name)} subject-wise tests</h2><p>Topic by topic · 15 questions · 10 minutes each</p></div>
    ${realTests("Subject-wise test") + realTests("Chapter test") ? `<div class="tests">${realTests("Subject-wise test") + realTests("Chapter test")}</div>` : ""}
    ${ex.pattern.map(([name]) => {
      const g = groupFor(name); if (!g || seen.has(g[0])) return ""; seen.add(g[0]);
      const list = g[1].topics.map(t => typeof t === "string" ? { name: t } : t);
      return `<h3 class="grp">${esc(g[1].label)} <span>${list.length} topics</span></h3>
        <div class="topics">${list.map(t => `<div class="topic"><span><b>${esc(t.name)}</b><span>${t.link ? polityQs + " questions · 15 min" : "15 questions · 10 min"}</span></span>
          ${t.link ? `<a class="btn btn-pri" href="${t.link}">Start</a>` : `<span class="pill soon">Soon</span>`}</div>`).join("")}</div>`;
    }).join("")}`;

  const pyq = `
    <div class="sec-head"><h2>${esc(ex.name)} previous year papers</h2><p>Year-wise and shift-wise</p></div>
    <div class="chips" id="yrChips">${["All", ...years].map((y, i) => `<button class="chip" type="button" data-y="${y}" aria-pressed="${i === 0}">${y}</button>`).join("")}</div>
    ${realTests("PYQ paper") ? `<div class="tests">${realTests("PYQ paper")}</div>` : ""}
    <div id="pyqList" class="stack"></div>
    <p class="muted">Papers are being added. Exam dates and shifts will show as each paper is uploaded.</p>`;

  const PANELS = { pattern, mock, sectional, subject, pyq };

  box.innerHTML = `
  <style>
  .ex-hero{position:relative;overflow:hidden;border-radius:22px;padding:clamp(22px,4vw,36px);color:#fff;display:flex;flex-wrap:wrap;gap:22px;align-items:center;
    background:radial-gradient(circle at 90% 120%,#C9962E55 0,transparent 45%),linear-gradient(135deg,#1F3A93 0%,#141B38 100%);box-shadow:var(--shadow)}
  .ex-ic{flex:none;width:92px;height:92px;border-radius:24px;display:grid;place-items:center;font:700 1.25rem "Poppins",sans-serif;border:3px solid #F5C451}
  .ex-hero h2{color:#fff;font-size:clamp(1.8rem,4vw,2.5rem)}
  .ex-hero p{margin:4px 0 0;color:#DDE3FF}
  .tabbar{display:flex;gap:6px;overflow-x:auto;padding:6px;background:var(--surface);border:1px solid var(--line);border-radius:14px;box-shadow:var(--shadow);scrollbar-width:thin}
  .tabbar button{flex:none;min-height:44px;padding:8px 16px;border:0;border-radius:10px;background:transparent;color:var(--muted);font-weight:600;white-space:nowrap}
  .tabbar button:hover{color:var(--ink);background:var(--bg)}
  .tabbar button[aria-selected="true"]{background:var(--pri);color:var(--pri-ink)}
  .panel{display:flex;flex-direction:column;gap:14px}
  .panel>p{margin:0}
  .facts{display:grid;gap:12px;grid-template-columns:repeat(auto-fill,minmax(190px,1fr))}
  .fact{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:14px 16px}
  .fact b{display:block;font:700 1.25rem "Poppins",sans-serif}
  .fact b.small{font-size:1rem;line-height:1.4}
  .fact span{color:var(--muted);font-size:.9rem}
  .ptable{overflow-x:auto}
  .ptable table{border-collapse:collapse;width:100%;min-width:420px}
  .ptable th,.ptable td{text-align:left;padding:11px 14px;border-bottom:1px solid var(--line)}
  .ptable th{font-size:.8rem;text-transform:uppercase;letter-spacing:.04em;color:var(--muted)}
  .ptable td:nth-child(n+2),.ptable th:nth-child(n+2){text-align:right;font-variant-numeric:tabular-nums}
  .ptable tfoot td{font-weight:700}
  .tests{display:grid;gap:14px;grid-template-columns:repeat(auto-fill,minmax(240px,1fr))}
  .test{display:flex;flex-direction:column;gap:10px}
  .test .pill{align-self:flex-start}
  .meta{display:flex;flex-wrap:wrap;gap:6px 14px;color:var(--muted);font-size:.92rem}
  .grp{font:700 1.1rem "Poppins",sans-serif;margin:12px 0 0;display:flex;flex-wrap:wrap;gap:4px 12px;align-items:baseline}
  .grp span{font:500 .9rem "Inter",sans-serif;color:var(--muted)}
  .topics{display:grid;gap:10px;grid-template-columns:repeat(auto-fill,minmax(260px,1fr))}
  .topic{display:flex;gap:10px;align-items:center;justify-content:space-between;background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:12px 14px}
  .topic b{display:block;font-size:.98rem}
  .topic span span{font-size:.85rem;color:var(--muted)}
  .topic .btn{min-height:40px;padding:8px 14px}
  .stack{display:flex;flex-direction:column;gap:10px}
  </style>
  <section class="ex-hero">
    <span class="ex-ic" style="background:${ex.color}">${esc(ex.short)}</span>
    <div style="flex:1 1 320px">
      <span class="pill gold">${esc(ex.level)}</span>
      <h2 style="margin-top:8px">${esc(ex.name)}</h2>
      <p>${esc(ex.full)}</p>
    </div>
  </section>
  <div class="tabbar" role="tablist" aria-label="${esc(ex.name)} sections" id="tabbar">
    ${TABS.map(([id, label]) => `<button type="button" role="tab" id="tab-${id}" aria-controls="panel-${id}" data-tab="${id}">${label}</button>`).join("")}
  </div>
  ${TABS.map(([id]) => `<section class="panel" role="tabpanel" id="panel-${id}" aria-labelledby="tab-${id}" hidden>${PANELS[id]}</section>`).join("")}
  <section>
    <div class="sec-head"><h2>Other SSC exams</h2></div>
    <div class="chips">${EXAMS.filter(e => e.id !== ex.id).map(e => `<a class="chip" href="${e.page}" style="text-decoration:none">${esc(e.name)}</a>`).join("")}</div>
  </section>`;

  // ---------- tabs ----------
  const bar = document.getElementById("tabbar");
  function open(id, scroll) {
    if (!PANELS[id]) id = "pattern";
    TABS.forEach(([t]) => {
      document.getElementById("panel-" + t).hidden = t !== id;
      const b = document.getElementById("tab-" + t);
      b.setAttribute("aria-selected", t === id); b.tabIndex = t === id ? 0 : -1;
    });
    document.getElementById("tab-" + id).scrollIntoView({ block: "nearest", inline: "center" });
    if (scroll) bar.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  bar.addEventListener("click", e => {
    const b = e.target.closest("[data-tab]"); if (!b) return;
    history.replaceState(null, "", "#" + b.dataset.tab); open(b.dataset.tab, true);
  });
  bar.addEventListener("keydown", e => {
    if (!["ArrowRight", "ArrowLeft"].includes(e.key)) return;
    const ids = TABS.map(t => t[0]), cur = ids.indexOf(document.activeElement.dataset.tab);
    const nxt = ids[(cur + (e.key === "ArrowRight" ? 1 : ids.length - 1)) % ids.length];
    history.replaceState(null, "", "#" + nxt); open(nxt); document.getElementById("tab-" + nxt).focus();
  });
  window.addEventListener("hashchange", () => open(location.hash.slice(1), true));
  const start = location.hash.slice(1) === "tests" ? "mock" : location.hash.slice(1);
  open(start, !!PANELS[start]);

  // ---------- PYQ years ----------
  const list = document.getElementById("pyqList");
  const drawPyq = y => {
    list.innerHTML = (y === "All" ? years : [y]).map(yr => [1, 2, 3].map(s =>
      `<div class="row"><span class="num">S${s}</span><span class="t"><b>${esc(ex.name)} ${yr} · Shift ${s}</b><span>Exam date to be added</span></span><span class="btn off" aria-disabled="true">Attempt · soon</span></div>`).join("")).join("");
  };
  document.getElementById("yrChips").addEventListener("click", e => {
    const b = e.target.closest("[data-y]"); if (!b) return;
    document.querySelectorAll("#yrChips .chip").forEach(c => c.setAttribute("aria-pressed", c === b));
    drawPyq(b.dataset.y);
  });
  drawPyq("All");
})();
