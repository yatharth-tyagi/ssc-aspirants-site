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
  const id = new URLSearchParams(location.search).get("id");
  const n = window.NOTES && window.NOTES[id];
  const box = document.getElementById("note");
  if (!n) { box.innerHTML = '<h1>Note not found</h1><p><a href="notes.html">Back to all notes</a></p>'; return; }
  const sub = (window.SUBJECTS || []).find(s => s.chapters.some(c => c.id === id)) || { id: "polity", name: "Notes", chapters: [] };
  const list = sub.chapters.filter(c => window.NOTES[c.id]);
  const i = list.findIndex(c => c.id === id), prev = list[i - 1], next = list[i + 1];
  const chNo = sub.chapters.findIndex(c => c.id === id) + 1;
  document.title = n.title + " – SSCAspirants_Official";
  document.getElementById("crumb").textContent = "Chapter " + chNo;
  const cs = document.getElementById("crumbSub"); cs.textContent = sub.name; cs.href = "notes.html#" + sub.id;
  const head = (n.tableHead || []).filter(Boolean);
  const pager = `<div class="pager">${prev ? `<a class="btn btn-out" href="note.html?id=${prev.id}">← ${esc(prev.title)}</a>` : `<a class="btn btn-out" href="notes.html#${sub.id}">← All ${esc(sub.name)} notes</a>`}
      ${next ? `<a class="btn btn-pri" href="note.html?id=${next.id}">${esc(next.title)} →</a>` : ""}</div>`;
  const hasNotes = !!(n.html || (n.phases && n.phases.length));
  const quizHtml = () => (n.quiz && n.quiz.length ? "<h2>Quick check</h2>" : "") + (n.quiz || []).map((q, qi) => `<div class="q" data-q="${qi}"><p>${qi + 1}. ${esc(q.q)}<small>${esc(q.tag || "")}</small></p>
      ${q.opts.map((o, oi) => `<button type="button" data-o="${oi}">${String.fromCharCode(65 + oi)}. ${esc(o)}</button>`).join("")}<div class="why" hidden></div></div>`).join("");
  function quizWire() { box.querySelectorAll(".q").forEach(el => { const q = (n.quiz || [])[el.dataset.q];
    el.querySelectorAll("button").forEach(b => b.addEventListener("click", () => { el.querySelectorAll("button").forEach(x => { x.disabled = true; if (+x.dataset.o === q.a) x.classList.add("right"); });
      if (+b.dataset.o !== q.a) b.classList.add("wrong"); const w = el.querySelector(".why"); w.hidden = false; w.textContent = (+b.dataset.o === q.a ? "Correct. " : "Not quite. ") + q.why; })); }); }
  // Slides made in the admin slide editor (data/slides/<deck>.json), and the optional PDF download.
  function extras() {
    const meta = box.querySelector(".note-meta");
    if (n.pdf) meta.insertAdjacentHTML("beforeend", `<button class="btn btn-out pdf-btn" type="button" id="pdfBtn" style="margin-left:auto;min-height:36px;padding:6px 14px">Download PDF</button>`);
    if (!n.deck) { if (n.pdf) document.getElementById("pdfBtn").onclick = () => SlideKit.printNow("note-printing", n.title); return; }
    const h1 = box.querySelector("h1");
    h1.insertAdjacentHTML("afterend", `${hasNotes ? `<div class="note-switch chips" role="group" aria-label="Show"><button class="chip" type="button" data-v="slides" aria-pressed="true">Slides</button><button class="chip" type="button" data-v="notes" aria-pressed="false">Notes</button></div>` : ""}<div id="slideBox"><p class="muted">Loading slides…</p></div>`);
    const rest = [...box.children].filter(el => el !== h1 && el !== meta && !el.matches("#slideBox,.note-switch,.pager"));
    let deck = null;
    const view = v => { box.querySelectorAll(".note-switch [data-v]").forEach(b => b.setAttribute("aria-pressed", b.dataset.v === v));
      document.getElementById("slideBox").hidden = v !== "slides"; rest.forEach(el => el.hidden = v === "slides"); };
    if (hasNotes) { view("slides"); box.querySelector(".note-switch").addEventListener("click", e => { const b = e.target.closest("[data-v]"); if (b) view(b.dataset.v); }); }
    fetch("data/slides/" + encodeURIComponent(n.deck) + ".json", { cache: "no-cache" }).then(r => { if (!r.ok) throw 0; return r.json(); }).then(d => {
      deck = d; SlideKit.viewer(d, document.getElementById("slideBox"), { download: false });
    }).catch(() => { document.getElementById("slideBox").innerHTML = `<p class="muted">The slides could not be loaded. Please refresh the page.</p>`; });
    if (n.pdf) document.getElementById("pdfBtn").onclick = () => {
      const slidesOn = !document.getElementById("slideBox").hidden;
      if (slidesOn && deck) SlideKit.printDeck(deck); else SlideKit.printNow("note-printing", n.title);
    };
  }
  if (!hasNotes && n.deck) {
    box.innerHTML = `<div class="note-meta"><span class="pill">${esc(sub.name)} · Chapter ${chNo}</span>${n.read ? `<span class="pill ok">${esc(n.read)}</span>` : ""}${(n.exams || []).map(e => `<span class="pill soon">${esc(e)}</span>`).join("")}</div>
      <h1>${esc(n.title)}</h1>${n.intro ? `<p>${esc(n.intro)}</p>` : ""}${pager}`;
    extras(); return;
  }
  // Notes uploaded from a Word file in the admin page are stored as HTML.
  if (n.html) {
    const clean = window.DOMPurify ? DOMPurify.sanitize(n.html) : safeHtml(n.html);
    box.innerHTML = `<div class="note-meta"><span class="pill">${esc(sub.name)} · Chapter ${chNo}</span>${n.read ? `<span class="pill ok">${esc(n.read)}</span>` : ""}${(n.exams || []).map(e => `<span class="pill soon">${esc(e)}</span>`).join("")}</div>
      <h1>${esc(n.title)}</h1>${n.intro ? `<p>${esc(n.intro)}</p>` : ""}<div class="doc">${clean}</div>${quizHtml()}${pager}`;
    quizWire(); extras(); return;
  }
  box.innerHTML = `
    <div class="note-meta"><span class="pill">${esc(sub.name)} · Chapter ${chNo}</span><span class="pill ok">${esc(n.read)}</span>${(n.exams || []).map(e => `<span class="pill soon">${esc(e)}</span>`).join("")}</div>
    <h1>${esc(n.title)}</h1>
    <p>${esc(n.intro)}</p>
    ${(n.phases || []).map(p => `<h2>${esc(p.h)}</h2><ol class="tl">${p.items.map(it => `
      <li><span class="yr">${esc(it.yr)}</span><div><h3>${esc(it.t)}</h3>${it.s ? `<small>${esc(it.s)}</small>` : ""}
      <ul>${it.pts.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div></li>`).join("")}</ol>`).join("")}
    ${n.phases && n.phases.length ? "" : ""}${n.table ? `<h2>${esc(n.tableTitle || "Important facts")}</h2><div class="tbl"><table><thead><tr>${head.map(h => `<th>${esc(h)}</th>`).join("")}</tr></thead>
      <tbody>${n.table.map(r => `<tr>${r.slice(0, head.length).map(c => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>` : ""}
    ${n.tricks && n.tricks.length ? `<div class="tricks"><b>Memory tricks</b><ul>${n.tricks.map(t => `<li>${esc(t)}</li>`).join("")}</ul></div>` : ""}
    ${n.quiz && n.quiz.length ? "<h2>Quick check</h2>" : ""}
    ${(n.quiz || []).map((q, qi) => `<div class="q" data-q="${qi}"><p>${qi + 1}. ${esc(q.q)}<small>${esc(q.tag)}</small></p>
      ${q.opts.map((o, oi) => `<button type="button" data-o="${oi}">${String.fromCharCode(65 + oi)}. ${esc(o)}</button>`).join("")}
      <div class="why" hidden></div></div>`).join("")}
    <div class="pager">${prev ? `<a class="btn btn-out" href="note.html?id=${prev.id}">← ${esc(prev.title)}</a>` : `<a class="btn btn-out" href="notes.html#${sub.id}">← All ${esc(sub.name)} notes</a>`}
      ${next ? `<a class="btn btn-pri" href="note.html?id=${next.id}">${esc(next.title)} →</a>` : `<a class="btn btn-pri" href="test.html">Take the chapter test →</a>`}</div>`;
  box.querySelectorAll(".q").forEach(el => {
    const q = (n.quiz || [])[el.dataset.q];
    el.querySelectorAll("button").forEach(b => b.addEventListener("click", () => {
      el.querySelectorAll("button").forEach(x => { x.disabled = true; if (+x.dataset.o === q.a) x.classList.add("right"); });
      if (+b.dataset.o !== q.a) b.classList.add("wrong");
      const w = el.querySelector(".why"); w.hidden = false; w.textContent = (+b.dataset.o === q.a ? "Correct. " : "Not quite. ") + q.why;
    }));
  });
  extras();
})();
