// Builds one exam page (ssc-cgl.html, ssc-chsl.html ...) from data/exams.js and data/topics.js.
// The page's <body data-exam="cgl"> says which exam to show.
// The page has tabs, each its own section: Exam pattern, Full mock tests, Section-wise tests,
// Subject-wise tests, PYQ papers and Notes. The address ends in #pattern, #mock, #sectional, #subject, #pyq or #notes.
(function () {
  // same as SSCTiers in site.js (this file runs before site.js)
  const SSCTiers = window.SSCTiers || (ex => ex.tiers && ex.tiers.length ? ex.tiers : [{ id: "t1", name: ex.stage || "Tier 1", minutes: parseInt(ex.time) || 60, plus: 2, minus: 0.5, negative: ex.negative || "", pattern: ex.pattern || [] }]);
  const ex = (window.EXAMS || []).find(e => e.id === document.body.dataset.exam);
  const box = document.getElementById("content");
  if (!ex) { box.innerHTML = '<p>Exam not found. <a href="mock-tests.html">See all exams</a></p>'; return; }
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const mins = q => Math.max(10, Math.round(q * 0.6));
  const card = (title, meta, href, id) => `<div class="card test"${id ? ` data-tcard="${esc(id)}"` : ""}><span class="pill ${href ? "ok" : "soon"}">${href ? "Available" : "Coming soon"}</span>
    <b>${esc(title)}</b><div class="meta">${meta}</div>${href ? `<a class="btn btn-pri" href="${href}">Start test</a>` : `<span class="btn off" aria-disabled="true">Coming soon</span>`}</div>`;
  const groupFor = name => {
    const n = name.toLowerCase();
    return Object.entries(window.TOPICS || {}).find(([, g]) => g.match.some(m => n.includes(m)));
  };

  // tests published from the admin page (data/tests.js) for this exam
  const TIERS = SSCTiers(ex);
  let tier = TIERS.find(t => t.id === new URLSearchParams(location.search).get("tier")) || TIERS[0];
  const tierOf = t => t.tier || "t1";
  const empty = what => `<div class="card empty"><b>${what} for ${esc(ex.name)}${TIERS.length > 1 ? " " + esc(tier.name) : ""} are coming soon.</b><span>New tests appear here as soon as they are published.</span></div>`;
  const testsOf = types => Object.entries(window.TESTS || {}).filter(([, t]) => (t.exam === ex.id || t.exam === "all") && types.includes(t.type) && (t.exam === "all" || tierOf(t) === tier.id));
  const tcard = ([id, t]) => card(t.title, `<span>${t.questions.length} questions</span><span>${t.minutes} min</span><span>+${t.plus} / −${t.minus}</span>${t.section ? `<span>${esc(t.section)}</span>` : ""}${t.year ? `<span>${esc(t.year)}${t.shift ? " · " + esc(t.shift) : ""}</span>` : ""}`, t.soonLock ? "" : "test.html?id=" + encodeURIComponent(id), t.soonLock ? "" : id);
  const listOf = (types, what) => { const l = testsOf(types); return l.length ? `<div class="tests">${l.map(tcard).join("")}</div>` : empty(what); };

  const TABS = [
    ["pattern", "Exam pattern"], ["mock", "Full mock tests"], ["sectional", "Section-wise tests"],
    ["subject", "Subject-wise tests"], ["pyq", "PYQ papers"], ["notes", "Notes"]
  ];
  // ---------- this exam's own notes (Admin → Notes → Exam) ----------
  const XS = (window.SUBJECTS || []).filter(s => s.exam === ex.id && !s.hide).map(s => ({ ...s, chapters: s.chapters.filter(c => !c.hide) }));
  const nready = c => !!(window.NOTES && window.NOTES[c.id] && !window.NOTES[c.id].soonLock);
  let xcur = (XS[0] || {}).id, PR = {};
  const xdone = s => s.chapters.filter(c => nready(c) && PR[c.id] && PR[c.id].done).length;
  function notesPanel() {
    const head = `<div class="sec-head"><h2>${esc(ex.name)} notes</h2><p>Chapter-wise notes made for ${esc(ex.name)}</p></div>`;
    if (!XS.length) return head + `<div class="card empty"><b>Notes for ${esc(ex.name)} are coming soon.</b><span>Chapters appear here as soon as they are published.</span></div>`;
    const s = XS.find(x => x.id === xcur) || XS[0], n = s.chapters.filter(nready).length, d = xdone(s), pc = n ? Math.round(d / n * 100) : 0;
    return head + `<div class="notes-wrap"><nav class="card subjects" aria-label="Subjects">${XS.map(x => { const r = x.chapters.filter(nready).length, dd = xdone(x);
        return `<button type="button" data-xs="${esc(x.id)}" aria-pressed="${x.id === s.id}">${esc(x.name)}<span>${esc(x.hi || "")}</span>${r && dd ? `<span class="sp">✓ ${dd}/${r} done</span>` : ""}</button>`; }).join("")}</nav>
      <div class="chapters"><div class="sec-head" style="margin:0;display:block"><h2>${esc(s.name)}</h2><p style="margin:2px 0 0">${n} of ${s.chapters.length} chapters ready${n ? ` · <b>${d} completed (${pc}%)</b>` : ""}</p>${n ? `<div class="pbar2" aria-label="${pc}% completed"><i style="width:${pc}%"></i></div>` : ""}</div>
      ${s.chapters.map((c, i) => { const dn = nready(c) && PR[c.id] && PR[c.id].done; return `<div class="row${dn ? " dn" : ""}"><span class="num">${dn ? "✓" : String(i + 1).padStart(2, "0")}</span><span class="t"><b>${esc(c.title)}</b><span>${esc(c.sub || "")}</span></span>${nready(c)
        ? `${dn ? `<span class="donepill">✓ Completed</span>` : ""}<a class="btn ${dn ? "btn-out" : "btn-pri"}" href="note.html?id=${encodeURIComponent(c.id)}">${dn ? "Read again" : PR[c.id] ? "Continue" : "Read notes"}</a>` : `<span class="pill soon">Coming soon</span>`}</div>`; }).join("")}</div></div>`;
  }
  const paintNotes = () => { const p = document.getElementById("panel-notes"); if (p) p.innerHTML = PANELS.notes = notesPanel(); };

  // ---------- panels (built for the chosen tier) ----------
  function build() {
  const P = tier.pattern || [], qs = P.reduce((a, r) => a + (+r[1] || 0), 0), marks = P.reduce((a, r) => a + (+r[2] || 0), 0);
  const pattern = `
    <div class="sec-head"><h2>${esc(ex.name)} ${esc(tier.name)} pattern</h2><p>Every test in this series follows this pattern</p></div>
    <div class="facts">
      <div class="fact"><b>${qs}</b><span>Questions</span></div>
      <div class="fact"><b>${marks}</b><span>Total marks</span></div>
      <div class="fact"><b>${tier.minutes} min</b><span>Time</span></div>
      <div class="fact"><b class="small">${esc(tier.negative || "−" + tier.minus + " per wrong answer")}</b><span>Negative marking</span></div>
    </div>
    <div class="card ptable"><table>
      <thead><tr><th>Section</th><th>Questions</th><th>Marks</th><th>Time</th></tr></thead>
      <tbody>${P.map(r => `<tr><td>${esc(r[0])}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3] ? r[3] + " min" : "–"}</td></tr>`).join("")}</tbody>
      <tfoot><tr><td>Total</td><td>${qs}</td><td>${marks}</td><td>${tier.minutes} min</td></tr></tfoot>
    </table></div>
    <p class="muted">Posts: ${esc(ex.posts)}. Always check the latest official SSC notice for changes.</p>`;

  const mock = `
    <div class="sec-head"><h2>${esc(ex.name)} ${esc(tier.name)} – full mock tests</h2><p>Complete paper · real exam interface · English / Hindi</p></div>
    ${listOf(["Full mock test"], "Full mock tests")}`;

  const secTests = testsOf(["Section-wise test"]);
  const sectional = `
    <div class="sec-head"><h2>${esc(ex.name)} ${esc(tier.name)} – section-wise tests</h2><p>One section at a time, in the exam's own pattern</p></div>
    ${secTests.length ? P.map(([name, q, m]) => { const l = secTests.filter(([, t]) => (t.section || (t.questions[0] || {}).section) === name);
      return l.length ? `<h3 class="grp">${esc(name)} <span>${q} questions · ${m} marks</span></h3><div class="tests">${l.map(tcard).join("")}</div>` : ""; }).join("")
      + (() => { const other = secTests.filter(([, t]) => !P.some(r => r[0] === (t.section || (t.questions[0] || {}).section))); return other.length ? `<h3 class="grp">Other sections</h3><div class="tests">${other.map(tcard).join("")}</div>` : ""; })()
      : empty("Section-wise tests")}`;

  const seen = new Set();
  const topicHtml = P.map(([name]) => {
      const g = groupFor(name); if (!g || seen.has(g[0])) return ""; seen.add(g[0]);
      const list = g[1].topics.map(t => typeof t === "string" ? { name: t } : t).filter(t => t.link);
      return list.length ? `<h3 class="grp">${esc(g[1].label)} <span>${list.length} topics</span></h3>
        <div class="topics">${list.map(t => `<div class="topic"><span><b>${esc(t.name)}</b></span><a class="btn btn-pri" href="${t.link}">Start</a></div>`).join("")}</div>` : "";
    }).join("");
  const subj = testsOf(["Subject-wise test", "Chapter test"]);
  const subject = `
    <div class="sec-head"><h2>${esc(ex.name)} – subject-wise tests</h2><p>Topic by topic and chapter by chapter</p></div>
    ${subj.length ? `<div class="tests">${subj.map(tcard).join("")}</div>` : ""}${topicHtml}${subj.length || topicHtml ? "" : empty("Subject-wise tests")}`;

  const pyqs = testsOf(["PYQ paper"]), years = [...new Set(pyqs.map(([, t]) => String(t.year || "Other")))].sort().reverse();
  const pyq = `
    <div class="sec-head"><h2>${esc(ex.name)} ${esc(tier.name)} – previous year papers</h2><p>Year-wise and shift-wise, as timed tests</p></div>
    ${pyqs.length ? years.map(y => `<h3 class="grp">${esc(y)} <span>${pyqs.filter(([, t]) => String(t.year || "Other") === y).length} papers</span></h3><div class="tests">${pyqs.filter(([, t]) => String(t.year || "Other") === y).map(tcard).join("")}</div>`).join("") : empty("Previous year papers")}`;

  return { pattern, mock, sectional, subject, pyq, notes: notesPanel() };
  }
  let PANELS = build();

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
  .tierbar{display:flex;gap:8px;flex-wrap:wrap}
  .tierbar button{min-height:46px;padding:8px 22px;border-radius:12px;border:2px solid var(--line);background:var(--surface);color:var(--ink);font:700 1rem "Poppins",sans-serif}
  .tierbar button[aria-pressed="true"]{background:linear-gradient(135deg,#1F3A93,#3F62D1);color:#fff;border-color:transparent;box-shadow:0 6px 16px rgba(31,58,147,.25)}
  .empty{display:flex;flex-direction:column;gap:4px;text-align:center;padding:26px 18px;border-style:dashed}
  .empty span{color:var(--muted);font-size:.92rem}
  .notes-wrap{display:flex;flex-wrap:wrap;gap:20px;align-items:flex-start}
  .subjects{flex:1 1 230px;max-width:280px;display:flex;flex-direction:column;gap:4px}
  .subjects button{display:flex;flex-direction:column;align-items:flex-start;text-align:left;border:1px solid transparent;background:transparent;color:var(--ink);padding:10px 14px;border-radius:10px;min-height:44px}
  .subjects button span{font-size:.85rem;color:var(--muted)}
  .subjects button[aria-pressed="true"]{background:var(--pri);color:var(--pri-ink)}
  .subjects button[aria-pressed="true"] span{color:var(--pri-ink);opacity:.85}
  .subjects button .sp{font-size:.75rem;font-weight:700;color:var(--ok)}
  .subjects button[aria-pressed="true"] .sp{color:#C8F2E2}
  .chapters{flex:999 1 520px;display:flex;flex-direction:column;gap:10px}
  .pbar2{height:8px;border-radius:6px;background:var(--line);overflow:hidden;margin-top:6px}.pbar2 i{display:block;height:100%;background:linear-gradient(90deg,#25A386,#0F6B5B);border-radius:6px}
  .row.dn .num{background:var(--ok);color:#fff;border-color:var(--ok)}
  .donepill{display:inline-flex;align-items:center;gap:4px;font-size:.8rem;font-weight:700;color:var(--ok);background:var(--ok-soft);border-radius:999px;padding:3px 10px;margin-right:6px}
  @media(max-width:700px){.subjects{max-width:none;flex-direction:row;overflow-x:auto}.subjects button{flex:none}}
  </style>
  <section class="ex-hero">
    <span class="ex-ic" style="background:${ex.color}">${esc(ex.short)}</span>
    <div style="flex:1 1 320px">
      <span class="pill gold">${esc(ex.level)}</span>
      <h2 style="margin-top:8px">${esc(ex.name)}</h2>
      <p>${esc(ex.full)}</p>
    </div>
  </section>
  ${TIERS.length > 1 ? `<div class="tierbar" role="group" aria-label="Tier">${TIERS.map(t => `<button type="button" data-tier="${esc(t.id)}" aria-pressed="${t.id === tier.id}">${esc(t.name)}</button>`).join("")}</div>` : ""}
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
  const tb = box.querySelector(".tierbar");
  if (tb) tb.addEventListener("click", e => { const b = e.target.closest("[data-tier]"); if (!b) return;
    tier = TIERS.find(t => t.id === b.dataset.tier); PANELS = build();
    tb.querySelectorAll("[data-tier]").forEach(x => x.setAttribute("aria-pressed", x === b));
    TABS.forEach(([id]) => document.getElementById("panel-" + id).innerHTML = PANELS[id]);
    if (window.SSCTestCards) window.SSCTestCards();
    const u = new URL(location.href); if (tier.id === TIERS[0].id) u.searchParams.delete("tier"); else u.searchParams.set("tier", tier.id); history.replaceState(null, "", u); });
  box.addEventListener("click", e => { const b = e.target.closest("[data-xs]"); if (!b) return; xcur = b.dataset.xs; paintNotes(); });
  if (XS.length) fetch("/api/me/progress").then(r => r.ok ? r.json() : null).then(d => { if (!d) return; PR = {}; d.progress.forEach(p => PR[p.chapter] = p); paintNotes(); }).catch(() => {});
  const start = location.hash.slice(1) === "tests" ? "mock" : location.hash.slice(1);
  open(start, !!PANELS[start]);

})();
