// Renders one chapter from data/notes.js into note.html?id=<chapter-id>
(function () {
  const ORDER = ["historical-background", "making", "salient-features", "preamble"];
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const id = new URLSearchParams(location.search).get("id");
  const n = window.NOTES && window.NOTES[id];
  const box = document.getElementById("note");
  if (!n) { box.innerHTML = '<h1>Note not found</h1><p><a href="notes.html">Back to all notes</a></p>'; return; }
  document.title = n.title + " – SSC Aspirants Official";
  const ch = ORDER.indexOf(id) + 1;
  const head = (n.tableHead || []).filter(Boolean);
  const i = ORDER.indexOf(id), prev = ORDER[i - 1], next = ORDER[i + 1];
  box.innerHTML = `
    <div class="chips"><span class="chip">Indian Polity · Chapter ${ch}</span><span class="chip">${esc(n.read)}</span></div>
    <h1>${esc(n.title)}</h1>
    <p>${esc(n.intro)}</p>
    ${n.phases.map(p => `<h2>${esc(p.h)}</h2><ol class="tl">${p.items.map(it => `
      <li><span class="yr">${esc(it.yr)}</span><div><h3>${esc(it.t)}</h3>${it.s ? `<small>${esc(it.s)}</small>` : ""}
      <ul>${it.pts.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div></li>`).join("")}</ol>`).join("")}
    ${n.table ? `<h2>${esc(n.tableTitle || "Important facts")}</h2><div class="tbl"><table><thead><tr>${head.map(h => `<th>${esc(h)}</th>`).join("")}</tr></thead>
      <tbody>${n.table.map(r => `<tr>${r.slice(0, head.length).map(c => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>` : ""}
    <div class="tricks"><b>MEMORY TRICKS</b><ul>${n.tricks.map(t => `<li>${esc(t)}</li>`).join("")}</ul></div>
    <h2>Quick check</h2>
    ${n.quiz.map((q, qi) => `<div class="q" data-q="${qi}"><p>${qi + 1}. ${esc(q.q)}<small>${esc(q.tag)}</small></p>
      ${q.opts.map((o, oi) => `<button type="button" data-o="${oi}">${String.fromCharCode(65 + oi)}. ${esc(o)}</button>`).join("")}
      <div class="why" hidden></div></div>`).join("")}
    <div class="pager">${prev ? `<a href="note.html?id=${prev}">← Previous chapter</a>` : `<a href="notes.html">← All notes</a>`}
      ${next ? `<a href="note.html?id=${next}">Next chapter →</a>` : ""}</div>`;
  box.querySelectorAll(".q").forEach(el => {
    const q = n.quiz[el.dataset.q];
    el.querySelectorAll("button").forEach(b => b.addEventListener("click", () => {
      el.querySelectorAll("button").forEach(x => { x.disabled = true; if (+x.dataset.o === q.a) x.classList.add("right"); });
      if (+b.dataset.o !== q.a) b.classList.add("wrong");
      const w = el.querySelector(".why"); w.hidden = false; w.textContent = (+b.dataset.o === q.a ? "Correct. " : "Not quite. ") + q.why;
    }));
  });
})();
