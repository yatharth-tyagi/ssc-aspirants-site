// Notes reader: shows one chapter from data/notes.js at note.html?id=<chapter-id>.
// Chapter order and numbers come from data/subjects.js.
(function () {
  // Removes scripts and event handlers from uploaded HTML (used if DOMPurify could not load).
  function safeHtml(html) {
    const doc = new DOMParser().parseFromString(html, "text/html");
    doc.querySelectorAll("script,iframe,object,embed,style,link,meta,form,base").forEach(x => x.remove());
    doc.querySelectorAll("*").forEach(el => [...el.attributes].forEach(a => {
      const v = a.value.trim().toLowerCase();
      if (a.name.startsWith("on") || ((a.name === "href" || a.name === "src") && (v.startsWith("javascript:") || (v.startsWith("data:") && !v.startsWith("data:image/"))))) el.removeAttribute(a.name);
    }));
    return doc.body.innerHTML;
  }
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const id = new URLSearchParams(location.search).get("id"), GUEST = !!window.SSC_GUEST;
  const n = window.NOTES && window.NOTES[id];
  const box = document.getElementById("note");
  if (!n) { box.innerHTML = '<h1>Note not found</h1><p><a href="notes.html">Back to all notes</a></p>'; return; }
  const sub = (window.SUBJECTS || []).find(s => s.chapters.some(c => c.id === id)) || { id: "polity", name: "Notes", chapters: [] };
  const list = sub.chapters.filter(c => window.NOTES[c.id]);
  const i = list.findIndex(c => c.id === id), prev = list[i - 1], next = list[i + 1];
  const chNo = sub.chapters.findIndex(c => c.id === id) + 1;
  const subEx = sub.exam && (window.EXAMS || []).find(e => e.id === sub.exam);
  const subHref = subEx ? subEx.page + "#notes" : "notes.html#" + sub.id, subName = subEx ? subEx.name + " · " + sub.name : sub.name;
  document.title = n.title + " – SSCAspirants_Official";
  document.getElementById("crumb").textContent = "Chapter " + chNo;
  const cs = document.getElementById("crumbSub"); cs.textContent = subName; cs.href = subHref;
  const head = (n.tableHead || []).filter(Boolean);
  const pager = `<div class="pager">${prev ? `<a class="btn btn-out" href="note.html?id=${prev.id}">← ${esc(prev.title)}</a>` : `<a class="btn btn-out" href="${esc(subHref)}">← All ${esc(subName)} notes</a>`}
      ${next ? `<a class="btn btn-pri" href="note.html?id=${next.id}">${esc(next.title)} →</a>` : ""}</div>`;
  const src = v => { v = String(v || "").trim(); if (!v) return ""; if (/^https:\/\//i.test(v)) return v; if (/^(assets\/|\/assets\/)/.test(v)) return v.replace(/^\//, ""); if (/^[a-z0-9._-]+$/i.test(v)) return "assets/uploads/" + v; return ""; };
  const pic = (v, alt) => { const u = src(v); return u ? `<img class="pq-img" src="${esc(u)}" alt="${esc(alt || "")}" loading="lazy">` : ""; };

  // ---- what this chapter has ----
  const hasNotes = !!(n.html || (n.phases && n.phases.length));
  const tabs = [hasNotes && ["notes", "📄", "Notes"], n.deck && ["slides", "📊", "Slides"], n.video && n.video.id && ["video", "▶", "Video"], n.quiz && n.quiz.length && ["practice", "❓", "Practice"]].filter(Boolean);
  const notesHtml = () => {
    if (n.html) return `<div class="doc">${window.DOMPurify ? DOMPurify.sanitize(n.html) : safeHtml(n.html)}</div>`;
    return `${(n.phases || []).map(p => `<h2>${esc(p.h)}</h2><ol class="tl">${p.items.map(it => `
      <li><span class="yr">${esc(it.yr)}</span><div><h3>${esc(it.t)}</h3>${it.s ? `<small>${esc(it.s)}</small>` : ""}
      <ul>${it.pts.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div></li>`).join("")}</ol>`).join("")}
      ${n.table ? `<h2>${esc(n.tableTitle || "Important facts")}</h2><div class="tbl"><table><thead><tr>${head.map(h => `<th>${esc(h)}</th>`).join("")}</tr></thead>
      <tbody>${n.table.map(r => `<tr>${r.slice(0, head.length).map(c => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>` : ""}
      ${n.tricks && n.tricks.length ? `<div class="tricks"><b>Memory tricks</b><ul>${n.tricks.map(t => `<li>${esc(t)}</li>`).join("")}</ul></div>` : ""}`;
  };
  const panes = {
    notes: () => notesHtml(),
    slides: () => `<div id="slideBox"><p class="muted">Loading slides…</p></div>`,
    video: () => `<div class="vwrap"><iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(n.video.id)}?rel=0&modestbranding=1&playsinline=1" title="${esc(n.video.title || n.title)}" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen loading="lazy"></iframe></div>${n.video.title ? `<p class="vtitle">${esc(n.video.title)}</p>` : ""}`,
    practice: () => `<div class="pbar" id="pbar"></div>` + n.quiz.map((q, qi) => `<div class="q" data-q="${qi}"><p>${qi + 1}. ${esc(q.q)}${q.tag ? `<small>${esc(q.tag)}</small>` : ""}</p>${pic(q.img, "Question picture")}
      ${q.opts.map((o, oi) => `<button type="button" data-o="${oi}">${String.fromCharCode(65 + oi)}. ${esc(o)}</button>`).join("")}<div class="why" hidden></div></div>`).join("") +
      `<div class="pbar"><button class="btn btn-out" type="button" id="pAgain">↻ Reattempt all questions</button></div>`
  };
  box.innerHTML = `<div class="note-meta"><span class="pill">${esc(sub.name)} · Chapter ${chNo}</span>${n.read ? `<span class="pill ok">${esc(n.read)}</span>` : ""}${(n.exams || []).map(e => `<span class="pill soon">${esc(e)}</span>`).join("")}</div>
    <h1>${esc(n.title)}</h1>${n.intro ? `<p>${esc(n.intro)}</p>` : ""}
    ${tabs.length > 1 ? `<div class="ntabs" role="tablist" aria-label="Chapter">${tabs.map(([id, ic, l]) => `<button type="button" role="tab" data-v="${id}"><span aria-hidden="true">${ic}</span>${l}</button>`).join("")}</div>` : ""}
    ${tabs.map(([id]) => `<section class="npane" data-pane="${id}"${id === "notes" ? "" : ' data-dyn="1"'}>${panes[id]()}</section>`).join("")}
    ${n.locked ? `<div class="lockbox"><div aria-hidden="true" style="font-size:1.8rem">🔒</div><div class="lk-h">Read the full chapter</div><p class="muted">This is a preview. Log in or register to read the complete notes.</p>
      <div class="acts"><a class="btn btn-pri" href="/login?next=${encodeURIComponent(location.pathname + location.search)}#register">Register</a><a class="btn btn-out" href="/login?next=${encodeURIComponent(location.pathname + location.search)}">Log in</a></div></div>` : ""}
    <div class="donebar" id="doneBar"${GUEST ? " hidden" : ""}><span id="doneTxt">Finished this chapter?</span><button class="btn btn-pri" type="button" id="doneBtn">✓ Mark as complete</button></div>
    ${pager}`;

  // ---- reading progress (kept in the student's account) ----
  let isDone = false;
  const paintDone = () => { const b = document.getElementById("doneBtn"), bar = document.getElementById("doneBar");
    b.textContent = isDone ? "↺ Mark as not complete" : "✓ Mark as complete"; b.className = "btn " + (isDone ? "btn-out" : "btn-pri");
    document.getElementById("doneTxt").innerHTML = isDone ? "<b>✓ You have completed this chapter.</b>" : "Finished this chapter?"; bar.classList.toggle("on", isDone); };
  const post = body => fetch("/api/me/progress", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).catch(() => {});
  if (!GUEST) fetch("/api/me/progress").then(r => r.ok ? r.json() : null).then(d => { if (!d) return; const me = d.progress.find(x => x.chapter === id); isDone = !!(me && me.done); paintDone(); }).catch(() => {});
  if (!GUEST) post({ chapter: id });
  document.getElementById("doneBtn").addEventListener("click", () => { isDone = !isDone; paintDone(); post({ chapter: id, done: isDone }); });
  paintDone();

  // ---- tabs ----
  let deck = null, view = null;
  function show(v) {
    if (!tabs.some(t => t[0] === v)) v = tabs[0] ? tabs[0][0] : null; view = v;
    box.querySelectorAll(".ntabs [data-v]").forEach(b => b.setAttribute("aria-selected", b.dataset.v === v));
    box.querySelectorAll("[data-pane]").forEach(p => p.hidden = p.dataset.pane !== v);
    if (v === "slides" && !deck) loadDeck();
  }
  const tb = box.querySelector(".ntabs");
  if (tb) tb.addEventListener("click", e => { const b = e.target.closest("[data-v]"); if (!b) return; history.replaceState(null, "", "#" + b.dataset.v); show(b.dataset.v); });
  function loadDeck() {
    deck = {};
    fetch("data/slides/" + encodeURIComponent(n.deck) + ".json", { cache: "no-cache" }).then(r => { if (!r.ok) throw 0; return r.json(); }).then(d => {
      deck = d; SlideKit.viewer(d, document.getElementById("slideBox"), { download: false });
    }).catch(() => { document.getElementById("slideBox").innerHTML = `<p class="muted">The slides could not be loaded. Please refresh the page.</p>`; });
  }

  // ---- practice: instant right / wrong, reattempt as often as you like ----
  function wirePractice() {
    const pb = document.getElementById("pbar"); if (!pb) return;
    const score = () => { const done = box.querySelectorAll(".q.done").length, ok = box.querySelectorAll(".q.ok").length; pb.innerHTML = `<b>${ok}</b> correct · <b>${done}</b> of ${n.quiz.length} answered`; };
    box.querySelectorAll(".q").forEach(el => { const q = n.quiz[el.dataset.q];
      el.querySelectorAll("button[data-o]").forEach(b => b.addEventListener("click", () => {
        el.querySelectorAll("button[data-o]").forEach(x => { x.disabled = true; if (+x.dataset.o === q.a) x.classList.add("right"); });
        const good = +b.dataset.o === q.a; if (!good) b.classList.add("wrong"); el.classList.add("done"); if (good) el.classList.add("ok");
        const w = el.querySelector(".why"); w.hidden = false; w.innerHTML = `<b class="${good ? "ok-t" : "bad-t"}">${good ? "✓ Correct." : "✗ Not quite. Answer: " + String.fromCharCode(65 + q.a)}</b> ${esc(q.why || "")}${pic(q.wimg, "Solution")}`; score(); })); });
    document.getElementById("pAgain").addEventListener("click", () => { box.querySelectorAll(".q").forEach(el => { el.classList.remove("done", "ok"); el.querySelectorAll("button[data-o]").forEach(x => { x.disabled = false; x.classList.remove("right", "wrong"); }); const w = el.querySelector(".why"); w.hidden = true; w.innerHTML = ""; });
      score(); box.querySelector('[data-pane="practice"]').scrollIntoView({ behavior: "smooth", block: "start" }); });
    score();
  }
  wirePractice();

  // ---- optional PDF download (notes or slides, whichever is open) ----
  if (n.pdf && !GUEST && (hasNotes || n.deck)) {
    box.querySelector(".note-meta").insertAdjacentHTML("beforeend", `<button class="btn btn-out pdf-btn" type="button" id="pdfBtn" style="margin-left:auto;min-height:36px;padding:6px 14px">Download PDF</button>`);
    document.getElementById("pdfBtn").onclick = () => { if (view === "slides" && deck && deck.slides) SlideKit.printDeck(deck); else if (hasNotes) { show("notes"); SlideKit.printNow("note-printing", n.title); } else if (deck && deck.slides) SlideKit.printDeck(deck); };
  }
  show((location.hash || "").slice(1));
})();
