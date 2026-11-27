// SSCAspirants_Official – PPT editor: extra PowerPoint / Google Slides style tools.
// Adds: format painter, find & replace on all slides, drawing (S Pen), equations, emoji, YouTube video,
// flip, picture adjustments (brightness, contrast, colour, black & white), strike / highlight / x² / x₂
// and change case while typing, hide slide, slide numbers, and keyboard shortcuts.
(function () {
  const S = window.SlideAPI, P = window.EditPlus, K = window.SlideKit; if (!S || !P) return;
  const $ = id => document.getElementById(id), esc = P.esc;
  const btn = (attr, icon, label, title) => `<button class="rb" type="button" ${attr} title="${esc(title || label)}"><span class="ri">${icon}</span><span class="rl">${esc(label)}</span></button>`;
  const group = (label, inner) => `<div class="rg"><div class="rgb">${inner}</div><span class="rgl">${esc(label)}</span></div>`;
  const pane = n => document.querySelector(`#ribbon .rpane[data-rp="${n}"]`);

  // ---------- ribbon ----------
  pane("home").insertAdjacentHTML("beforeend", group("Tools", btn('data-x="painter" id="spPainter"', "🖌", "Format painter", "Copy the look of this box, then click another box") + btn('data-x="find"', "🔍", "Find & replace")));
  pane("insert").insertAdjacentHTML("beforeend", group("Media & maths", btn('data-x="draw"', "✍", "Draw", "Draw with finger, mouse or S Pen") + btn('data-x="eq"', "∑", "Equation") + btn('data-x="emoji"', "😊", "Emoji") + btn('data-x="video"', "▶", "YouTube video")));
  pane("design").insertAdjacentHTML("beforeend", group("Numbers", btn('data-x="num" id="spNum"', "#", "Slide numbers", "Show slide numbers to students")));
  document.head.insertAdjacentHTML("beforeend", `<style>.th.hid{opacity:.45}.th.hid::after{content:"Hidden";position:absolute;right:6px;top:6px;background:#B42318;color:#fff;font:700 .65rem Inter;border-radius:6px;padding:1px 6px}
    body.sp-paint #canvas .sk-el{cursor:copy}.props .xrow{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px}.props .xrow button{min-width:38px;min-height:36px;border-radius:8px;border:1px solid var(--line);background:var(--bg);color:var(--ink);font-weight:700}
    .props .xrow button[aria-pressed="true"]{background:var(--pri);color:var(--pri-ink);border-color:var(--pri)}.props input[type=range]{width:100%}</style>`);
  const paintNum = () => $("spNum").setAttribute("aria-pressed", !!(S.deck && S.deck.num));

  // ---------- helpers ----------
  async function addPictureFromCanvas(c, prefix, maxW) {
    const blob = await new Promise(ok => c.toBlob(ok, "image/png")), file = new File([blob], prefix + ".png", { type: "image/png" });
    const p = await S.uploadPicture(file, prefix); const w = Math.min(maxW || 700, p.w), h = Math.min(Math.round(w * p.h / p.w), 600);
    S.add({ t: "img", src: p.path, x: Math.round((K.W - w) / 2), y: Math.round((K.H - h) / 2), w, h });
  }
  // the text box being typed in (if any) and the last caret place inside it
  let range = null;
  document.addEventListener("selectionchange", () => { const s = getSelection(); if (s.rangeCount && s.anchorNode && s.anchorNode.parentElement && s.anchorNode.parentElement.closest("#canvas [contenteditable=true]")) range = s.getRangeAt(0).cloneRange(); });
  const editNode = () => document.querySelector("#canvas [contenteditable=true]");
  function inTyping(fn) { const n = editNode(); if (!n || !range) { S.stat("Double-click a text box and select some words first"); return false; }
    n.focus(); const s = getSelection(); s.removeAllRanges(); s.addRange(range); fn(s, n); n.dispatchEvent(new Event("input", { bubbles: true })); return true; }
  function wrap(tag) { inTyping(s => { if (s.isCollapsed) return S.stat("Select some words first"); const r = s.getRangeAt(0), el = document.createElement(tag);
    try { el.appendChild(r.extractContents()); r.insertNode(el); s.removeAllRanges(); const r2 = document.createRange(); r2.selectNodeContents(el); s.addRange(r2); range = r2.cloneRange(); } catch (e) {} }); }

  // ---------- format painter ----------
  const LOOK = ["fs", "color", "font", "bold", "italic", "underline", "align", "va", "fill", "fill2", "gang", "lh", "ls", "rad", "stroke", "sw", "shadow", "op", "bri", "con", "sat", "gray"];
  let paint = null;
  function armPainter() {
    if (paint) { paint = null; document.body.classList.remove("sp-paint"); $("spPainter").setAttribute("aria-pressed", false); return; }
    const o = S.selEls()[0]; if (!o) return S.stat("Select a box first, then press Format painter");
    paint = { from: o.id, t: o.t, look: Object.fromEntries(LOOK.filter(k => o[k] !== undefined).map(k => [k, o[k]])) };
    document.body.classList.add("sp-paint"); $("spPainter").setAttribute("aria-pressed", true); S.stat("Now click the box to paint");
  }
  window.addEventListener("pointerup", () => setTimeout(() => {
    if (!paint) return; const o = S.selEls()[0]; if (!o || o.id === paint.from) return;
    const look = paint.look; paint = null; document.body.classList.remove("sp-paint"); $("spPainter").setAttribute("aria-pressed", false);
    S.change(() => { const t = S.elById(o.id); LOOK.forEach(k => { if (t.t === "table" && !/^(fs|color)$/.test(k)) return; if (k in look) t[k] = look[k]; else if (!/^(fs|font|color)$/.test(k)) delete t[k]; }); });
    S.stat("Look painted");
  }, 30));

  // ---------- find & replace on all slides ----------
  function findReplace() {
    const d = P.dialog("Find & replace (all slides)", `<label style="display:flex;flex-direction:column;gap:6px;font-weight:600;margin-bottom:10px">Find<input type="text" data-f style="min-height:42px;border:1px solid var(--line);border-radius:10px;background:var(--bg);color:var(--ink);font:inherit;padding:0 10px"></label>
      <label style="display:flex;flex-direction:column;gap:6px;font-weight:600">Replace with<input type="text" data-r style="min-height:42px;border:1px solid var(--line);border-radius:10px;background:var(--bg);color:var(--ink);font:inherit;padding:0 10px"></label>
      <p class="xp-help" data-msg></p>`, `<button class="xp-btn" type="button" data-go="find">Find</button><button class="xp-btn pri" type="button" data-go="all">Replace all</button>`);
    d.style.width = "min(520px,calc(100vw - 20px))";
    const msg = d.querySelector("[data-msg]");
    const each = fn => S.deck.slides.forEach((sl, si) => (sl.els || []).forEach(e => { if (e.t === "text") e.html = fn(e.html, si); if (e.t === "table") e.rows = e.rows.map(r => r.map(c => fn(c, si))); }));
    const run = (html, re, rep, hit) => { const box = document.createElement("div"); box.innerHTML = html || ""; const w = document.createTreeWalker(box, NodeFilter.SHOW_TEXT); const list = []; while (w.nextNode()) list.push(w.currentNode);
      list.forEach(n => { const v = n.nodeValue.replace(re, m => { hit(); return rep == null ? m : rep; }); if (rep != null) n.nodeValue = v; }); return rep == null ? html : box.innerHTML; };
    d.addEventListener("click", e => { const b = e.target.closest("[data-go]"); if (!b) return; const f = d.querySelector("[data-f]").value; if (!f) return;
      const re = new RegExp(f.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"); let n = 0; const where = new Set();
      if (b.dataset.go === "find") { each((h, si) => run(h, re, null, () => { n++; where.add(si + 1); })); msg.textContent = n ? `Found ${n} time${n > 1 ? "s" : ""} on slide ${[...where].join(", ")}` : "Not found"; return; }
      S.stopEdit(); S.change(() => each(h => run(h, re, d.querySelector("[data-r]").value, () => n++))); msg.textContent = `${n} replaced`; });
  }

  // ---------- insert ----------
  document.querySelector("#ribbon").addEventListener("click", async e => {
    const b = e.target.closest("[data-x]"); if (!b) return; const x = b.dataset.x;
    if (x === "painter") return armPainter();
    if (x === "find") return findReplace();
    if (x === "num") { S.change(() => { S.deck.num = !S.deck.num; if (!S.deck.num) delete S.deck.num; }); paintNum(); S.stat(S.deck.num ? "Slide numbers on (students see them)" : "Slide numbers off"); return; }
    if (x === "draw") { const c = await P.draw(); if (c) { try { S.stat("Adding drawing…"); await addPictureFromCanvas(c, "draw", 800); S.stat("Drawing added"); } catch (er) { S.stat("Could not add: " + er.message); } } return; }
    if (x === "emoji") { const em = await P.emoji(); if (!em) return; if (editNode() && range) { inTyping(s => document.execCommand("insertText", false, em)); return; }
      S.add({ t: "text", x: 560, y: 280, w: 160, h: 160, html: em, fs: 110, align: "center", color: "#1E2433", font: "Inter", lh: 1.2 }); return; }
    if (x === "eq") return equation();
    if (x === "video") { const u = await P.ask("YouTube video", "Paste the YouTube link", "", "Add video"); if (u == null) return; const v = P.ytId(u); if (!v) return S.stat("That doesn't look like a YouTube link");
      S.add({ t: "video", vid: v, x: 240, y: 120, w: 800, h: 450 }); S.stat("Video added – it plays for students and in Present"); }
  });
  async function equation(existing) {
    const r = await P.equation(existing ? existing.latex : ""); if (!r) return;
    const m = P.toMathML(r.latex, false).replace("<math", "<math");
    if (existing) { S.change(() => { const o = S.elById(existing.id); o.html = m; o.latex = r.latex; }); return; }
    if (editNode() && range) { inTyping(() => document.execCommand("insertHTML", false, m + "&nbsp;")); return; }
    S.add({ t: "text", x: 240, y: 280, w: 800, h: 140, html: m, latex: r.latex, fs: 48, align: "center", va: "middle", color: S.inkFor(S.slide().bg), font: "Inter", lh: 1.3 });
  }

  // ---------- properties panel extras ----------
  let busy = false;
  new MutationObserver(() => { if (busy) return; busy = true; try { extras(); } finally { busy = false; } }).observe($("props"), { childList: true });
  function extras() {
    const p = $("props"); if (p.querySelector("[data-xp]")) return; const list = S.selEls();
    if (!list.length) {
      const sl = S.slide(); if (!sl) return;
      p.insertAdjacentHTML("afterbegin", `<div data-xp><label class="ck" style="flex-direction:row;gap:8px;align-items:center;margin-bottom:10px"><input type="checkbox" data-hide ${sl.hide ? "checked" : ""}> Hide this slide from students</label></div>`);
      p.querySelector("[data-hide]").onchange = e => S.change(() => { if (e.target.checked) S.slide().hide = true; else delete S.slide().hide; });
      return;
    }
    if (list.length > 1) return;
    const o = list[0]; let h = `<div data-xp>`;
    if (o.t === "text") h += `<p class="help" style="margin:0 0 6px">While typing (select words first):</p><div class="xrow">
      <button type="button" data-w="s" title="Strike"><s>S</s></button><button type="button" data-w="mark" title="Highlight"><span style="background:#FFE066;padding:0 3px">ab</span></button>
      <button type="button" data-w="sup" title="Superscript">x²</button><button type="button" data-w="sub" title="Subscript">x₂</button><button type="button" data-w="case" title="Change case">Aa</button>${o.latex ? `<button type="button" data-w="eqedit" title="Edit equation">∑ Edit</button>` : ""}</div>`;
    if (o.t === "img" || o.t === "shape") h += `<div class="xrow"><button type="button" data-flip="flipH" aria-pressed="${!!o.flipH}">⇋ Flip ↔</button><button type="button" data-flip="flipV" aria-pressed="${!!o.flipV}">⇵ Flip ↕</button></div>`;
    if (o.t === "img") h += `<p class="help" style="margin:4px 0">Picture adjustments</p>
      ${[["bri", "Brightness"], ["con", "Contrast"], ["sat", "Colour"]].map(([k, l]) => `<label>${l} <input type="range" min="0" max="200" step="5" value="${o[k] == null ? 100 : o[k]}" data-adj="${k}"></label>`).join("")}
      <div class="xrow" style="margin-top:6px"><button type="button" data-gray aria-pressed="${!!o.gray}">Black & white</button><button type="button" data-adjreset>Reset</button></div>`;
    if (o.t === "video") h += `<label style="margin-bottom:10px">YouTube link<input type="text" data-vid value="${esc(o.vid ? "https://www.youtube.com/watch?v=" + o.vid : "")}"></label><p class="help">Students can play the video right on the slide.</p>`;
    h += `</div><hr>`;
    const head = p.querySelector("h3"); if (head) head.insertAdjacentHTML("afterend", h); else p.insertAdjacentHTML("afterbegin", h);
    const x = p.querySelector("[data-xp]");
    x.addEventListener("mousedown", e => { if (e.target.closest("[data-w]")) e.preventDefault(); });
    x.addEventListener("pointerdown", e => { if (e.target.closest("[data-w]")) e.preventDefault(); });
    x.addEventListener("click", e => {
      const w = e.target.closest("[data-w]");
      if (w) { const k = w.dataset.w;
        if (k === "eqedit") return equation({ id: o.id, latex: o.latex });
        if (k === "case") return Ribbon.menu(w, [["up", "UPPERCASE"], ["low", "lowercase"], ["title", "Title Case"]], v => inTyping(s => { const t = s.toString(); if (!t) return;
          document.execCommand("insertText", false, v === "up" ? t.toUpperCase() : v === "low" ? t.toLowerCase() : t.toLowerCase().replace(/\b\w/g, m => m.toUpperCase())); }));
        return wrap(k); }
      const f = e.target.closest("[data-flip]"); if (f) return S.change(() => { const t = S.elById(o.id); t[f.dataset.flip] = !t[f.dataset.flip]; if (!t[f.dataset.flip]) delete t[f.dataset.flip]; });
      if (e.target.closest("[data-gray]")) return S.change(() => { const t = S.elById(o.id); t.gray = !t.gray; if (!t.gray) delete t.gray; });
      if (e.target.closest("[data-adjreset]")) return S.change(() => { const t = S.elById(o.id); ["bri", "con", "sat", "gray"].forEach(k => delete t[k]); });
    });
    x.addEventListener("input", e => { const a = e.target.dataset.adj; if (!a) return; S.elById(o.id)[a] = +e.target.value; S.drawCanvas(); });
    x.addEventListener("change", e => { const a = e.target.dataset.adj; if (a) { const v = +e.target.value; S.change(() => { const t = S.elById(o.id); if (v === 100) delete t[a]; else t[a] = v; }); }
      if (e.target.dataset.vid != null) { const v = P.ytId(e.target.value); if (!v) return S.stat("That doesn't look like a YouTube link"); S.change(() => S.elById(o.id).vid = v); } });
  }
  // double-click an equation box: edit the equation (instead of typing)
  $("canvas").addEventListener("dblclick", e => { const el = e.target.closest(".sk-el"); if (!el) return; const o = S.elById(el.dataset.id); if (o && o.latex && e.target.closest("math")) { e.stopImmediatePropagation(); S.stopEdit(); equation({ id: o.id, latex: o.latex }); } }, true);

  // hidden slides look faded in the slide list
  new MutationObserver(() => { const d = S.deck; if (!d) return; document.querySelectorAll("#thumbs .th").forEach(th => th.classList.toggle("hid", !!(d.slides[+th.dataset.i] || {}).hide)); paintNum(); })
    .observe($("thumbs"), { childList: true });
})();
