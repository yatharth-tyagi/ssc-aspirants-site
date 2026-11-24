// SSCAspirants_Official – slides (our own simple PowerPoint).
// Used by the slide editor (admin) and by the notes page (students).
// A deck is saved as data/slides/<id>.json:
//   { id, title, updated, slides: [ { bg, els: [ element, … ] } ] }
// Every slide is 1280 × 720 (16:9). Each element has x, y, w, h in those units and a type t:
//   text  { html, fs, color, font, bold, italic, underline, align, fill, lh }
//   img   { src }
//   shape { shape: rect | round | ellipse | line, fill, stroke, sw }
//   table { rows: [[cell html]], head, fs, color, headFill, headColor, border }
(function () {
  const W = 1280, H = 720;
  const FONTS = { Inter: "'Inter',system-ui,sans-serif", Poppins: "'Poppins','Inter',sans-serif", Hind: "'Hind','Inter',sans-serif", Merriweather: "'Merriweather',Georgia,serif", Georgia: "Georgia,serif", Courier: "'Courier New',monospace", Arial: "Arial,Helvetica,sans-serif" }; // single quotes: these go inside style="…"
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const color = c => (/^#[0-9a-f]{3,8}$/i.test(c || "") ? c : "");
  const uid = () => Math.random().toString(36).slice(2, 9);

  // only simple formatting is kept in text boxes (no scripts, links or styles)
  const OK = new Set(["B", "STRONG", "I", "EM", "U", "BR", "DIV", "P", "SPAN", "UL", "OL", "LI", "SUB", "SUP"]);
  function clean(html) {
    const doc = new DOMParser().parseFromString("<div>" + (html || "") + "</div>", "text/html");
    const walk = el => [...el.childNodes].forEach(n => {
      if (n.nodeType === 3) return;
      if (n.nodeType !== 1 || !OK.has(n.tagName)) { if (n.nodeType === 1 && !/^(SCRIPT|STYLE|IFRAME|OBJECT|EMBED)$/.test(n.tagName)) { walk(n); n.replaceWith(...n.childNodes); } else n.remove(); return; }
      [...n.attributes].forEach(a => n.removeAttribute(a.name));
      walk(n);
    });
    const root = doc.body.firstChild; walk(root);
    return root.innerHTML;
  }
  // pictures: an uploaded file name/path or an https link. While editing, a picture just uploaded
  // is shown from memory until the website has published it.
  const memory = {};
  const src = s => { s = String(s || ""); if (memory[s]) return memory[s]; if (/^https:\/\//i.test(s) || /^data:image\//.test(s)) return s; if (/^assets\/[a-z0-9/._-]+$/i.test(s)) return s; return ""; };

  const PATHS = {
    triangle: "M50 2 98 98 2 98Z", rtri: "M2 2 98 98 2 98Z", diamond: "M50 2 98 50 50 98 2 50Z", hexagon: "M25 3 75 3 98 50 75 97 25 97 2 50Z",
    arrow: "M2 32H62V6L98 50 62 94V68H2Z", larrow: "M98 32H38V6L2 50 38 94V68H98Z", star: "M50 3 62 37 98 37 69 59 80 95 50 73 20 95 31 59 2 37 38 37Z",
    bubble: "M8 4H92Q98 4 98 10V64Q98 70 92 70H42L22 94 26 70H8Q2 70 2 64V10Q2 4 8 4Z", pentagon: "M50 2 98 38 80 98 20 98 2 38Z", chevron: "M2 4H70L98 50 70 96H2L30 50Z",
    plus: "M36 2H64V36H98V64H64V98H36V64H2V36H36Z", cloud: "M28 84Q4 84 6 62 8 46 24 46 22 22 46 20 60 6 76 22 98 24 94 48 100 70 80 84Z"
  };
  const SHAPES = { rect: "Rectangle", round: "Rounded box", ellipse: "Circle / oval", line: "Line", triangle: "Triangle", rtri: "Right triangle", diamond: "Diamond", pentagon: "Pentagon", hexagon: "Hexagon", star: "Star", arrow: "Arrow →", larrow: "Arrow ←", chevron: "Chevron", plus: "Plus", bubble: "Speech bubble", cloud: "Cloud" };
  const fillOf = e => { const a = color(e.fill), b = color(e.fill2); return a && b ? `linear-gradient(${+e.gang || 135}deg,${a},${b})` : a || "transparent"; };
  function elHtml(e, edit) {
    const fx = `${e.rot ? `transform:rotate(${+e.rot}deg);` : ""}${e.op != null && e.op < 1 ? `opacity:${Math.max(0.05, +e.op)};` : ""}${e.shadow ? "filter:drop-shadow(0 8px 14px rgba(0,0,0,.28));" : ""}`;
    const box = `left:${e.x}px;top:${e.y}px;width:${e.w}px;height:${e.h}px;z-index:${e.z || 1};${fx}`;
    const a = `class="sk-el sk-${e.t}${e.anim ? " sk-anim-" + esc(e.anim) : ""}" data-id="${esc(e.id)}"${e.link && !edit ? ` data-link="${esc(e.link)}"` : ""} style="${box}"`;
    if (e.t === "text") {
      const st = `font-size:${+e.fs || 28}px;color:${color(e.color) || "#1E2433"};font-family:${FONTS[e.font] || FONTS.Inter};font-weight:${e.bold ? 700 : 400};font-style:${e.italic ? "italic" : "normal"};text-decoration:${e.underline ? "underline" : "none"};text-align:${["left", "center", "right"].includes(e.align) ? e.align : "left"};line-height:${+e.lh || 1.35};${color(e.fill) ? "background:" + fillOf(e) + ";" : ""}${e.strike ? "text-decoration-line:" + (e.underline ? "underline line-through" : "line-through") + ";" : ""}${e.ls ? `letter-spacing:${+e.ls}px;` : ""}${e.va && e.va !== "top" ? `display:flex;flex-direction:column;justify-content:${e.va === "middle" ? "center" : "flex-end"};` : ""}${e.rad ? `border-radius:${+e.rad}px;` : ""}`;
      return `<div ${a}><div class="sk-txt" style="${st}"><div>${clean(e.html)}</div></div></div>`;
    }
    if (e.t === "img") { const u = src(e.src); return `<div ${a}>${u ? `<img src="${esc(u)}" alt="" draggable="false" style="object-fit:${e.fit === "cover" ? "cover" : e.fit === "fill" ? "fill" : "contain"};${e.rad ? `border-radius:${+e.rad}px;` : ""}${color(e.stroke) && +e.sw ? `border:${+e.sw}px solid ${e.stroke};box-sizing:border-box;` : ""}">` : `<div class="sk-noimg">Picture</div>`}</div>`; }
    if (e.t === "shape") {
      const f = color(e.fill) || "transparent", s = color(e.stroke), sw = Math.max(0, +e.sw || 0);
      if (e.shape === "line") return `<div ${a}><div style="position:absolute;left:0;right:0;top:50%;height:${Math.max(2, sw || 4)}px;transform:translateY(-50%);background:${s || f || "#1F3A93"}"></div></div>`;
      if (PATHS[e.shape]) { const gid = "g" + esc(e.id);
        return `<div ${a}><svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style="overflow:visible;display:block">${color(e.fill) && color(e.fill2) ? `<defs><linearGradient id="${gid}" gradientTransform="rotate(${(+e.gang || 135) - 90} .5 .5)"><stop offset="0" stop-color="${color(e.fill)}"/><stop offset="1" stop-color="${color(e.fill2)}"/></linearGradient></defs>` : ""}
          <path d="${PATHS[e.shape]}" fill="${color(e.fill) && color(e.fill2) ? `url(#${gid})` : f}" stroke="${s || "none"}" stroke-width="${sw}" vector-effect="non-scaling-stroke" stroke-linejoin="round"/></svg></div>`; }
      const r = e.shape === "ellipse" ? "50%" : e.shape === "round" ? (e.rad ? +e.rad + "px" : "24px") : (e.rad ? +e.rad + "px" : "0");
      return `<div ${a}><div style="width:100%;height:100%;box-sizing:border-box;background:${fillOf(e)};border-radius:${r};${s && sw ? `border:${sw}px solid ${s};` : ""}"></div></div>`;
    }
    if (e.t === "table") {
      const rows = (e.rows || []).map((r, ri) => `<tr>${r.map((c, ci) => { const h = e.head && ri === 0;
        return `<td data-r="${ri}" data-c="${ci}" style="border:1px solid ${color(e.border) || "#D9D2C2"};${h ? `background:${color(e.headFill) || "#1F3A93"};color:${color(e.headColor) || "#fff"};font-weight:700;` : ""}"${edit ? ' class="sk-cell"' : ""}>${clean(c)}</td>`; }).join("")}</tr>`).join("");
      return `<div ${a}><table class="sk-tbl" style="font-size:${+e.fs || 20}px;color:${color(e.color) || "#1E2433"}">${rows}</table></div>`;
    }
    return "";
  }

  // draws one slide into host (scaled to fit the host's width)
  function render(slide, host, opt = {}) {
    host.classList.add("sk-host");
    const els = (slide.els || []).slice().sort((p, q) => (p.z || 1) - (q.z || 1));
    host.innerHTML = `<div class="sk-stage" style="background:${color(slide.bg) || "#FFFFFF"}">${els.map(e => elHtml(e, opt.edit)).join("")}
      ${opt.wm ? `<div class="sk-wm" aria-hidden="true"><img src="assets/logo-mark.png" alt=""><span>SSCAspirants_Official</span></div>` : ""}</div>`;
    fit(host);
    return host.firstChild;
  }
  function fit(host) {
    const st = host.querySelector(".sk-stage"); if (!st) return 1;
    const k = host.clientWidth / W || 1;
    st.style.transform = `scale(${k})`; host.style.height = H * k + "px";
    return k;
  }
  const ro = window.ResizeObserver ? new ResizeObserver(list => list.forEach(x => fit(x.target))) : null;
  const watch = host => ro && ro.observe(host);

  // ---------- ready-made slides in SSC Aspirants colours ----------
  const NAVY = "#141B38", BLUE = "#1F3A93", GOLD = "#C9962E", CREAM = "#FBF1DC", INK = "#1E2433";
  const T = (o) => ({ id: uid(), t: "text", fs: 28, color: INK, font: "Inter", align: "left", lh: 1.35, ...o });
  const S = (o) => ({ id: uid(), t: "shape", shape: "rect", fill: BLUE, ...o });
  const logo = (x, y, s) => ({ id: uid(), t: "img", src: "assets/logo-mark.png", x, y, w: s, h: s, z: 5 });
  const band = title => [S({ x: 0, y: 0, w: W, h: 110, fill: NAVY }), S({ x: 0, y: 110, w: W, h: 6, fill: GOLD }),
    T({ x: 60, y: 22, w: 1000, h: 70, html: esc(title), fs: 40, color: "#FFFFFF", font: "Poppins", bold: true, z: 3 }), logo(1166, 18, 76)];
  const TEMPLATES = {
    cover: { name: "Cover", make: () => ({ bg: NAVY, els: [
      S({ x: 0, y: 640, w: W, h: 80, fill: GOLD }), logo(565, 60, 150),
      T({ x: 100, y: 250, w: 1080, h: 120, html: "Chapter title", fs: 64, color: "#FFFFFF", font: "Poppins", bold: true, align: "center" }),
      T({ x: 100, y: 380, w: 1080, h: 60, html: "Subject · SSC CGL, CHSL, MTS", fs: 30, color: "#F5C451", align: "center" }),
      T({ x: 100, y: 655, w: 1080, h: 50, html: "SSCAspirants_Official · No excuses. Only selection.", fs: 24, color: NAVY, bold: true, align: "center" })] }) },
    topic: { name: "Topic + points", make: () => ({ bg: "#FFFFFF", els: [...band("Topic heading"),
      T({ x: 60, y: 150, w: 1160, h: 520, html: "<ul><li>First point</li><li>Second point</li><li>Third point</li></ul>", fs: 30 })] }) },
    two: { name: "Two columns", make: () => ({ bg: "#FFFFFF", els: [...band("Compare"),
      S({ x: 60, y: 150, w: 560, h: 520, shape: "round", fill: "#EEF2FC" }), S({ x: 660, y: 150, w: 560, h: 520, shape: "round", fill: CREAM }),
      T({ x: 90, y: 170, w: 500, h: 60, html: "Left heading", fs: 30, bold: true, color: BLUE, font: "Poppins" }),
      T({ x: 90, y: 240, w: 500, h: 400, html: "<ul><li>Point</li><li>Point</li></ul>", fs: 26 }),
      T({ x: 690, y: 170, w: 500, h: 60, html: "Right heading", fs: 30, bold: true, color: "#8A6416", font: "Poppins" }),
      T({ x: 690, y: 240, w: 500, h: 400, html: "<ul><li>Point</li><li>Point</li></ul>", fs: 26 })] }) },
    table: { name: "Table", make: () => ({ bg: "#FFFFFF", els: [...band("Important facts"),
      { id: uid(), t: "table", x: 60, y: 150, w: 1160, h: 400, fs: 24, head: true, headFill: BLUE, headColor: "#FFFFFF", border: "#D9D2C2", color: INK,
        rows: [["Year", "Event", "Person"], ["", "", ""], ["", "", ""], ["", "", ""]] }] }) },
    quiz: { name: "Quiz question", make: () => ({ bg: "#FFFFFF", els: [...band("Quick check"),
      T({ x: 60, y: 140, w: 1160, h: 110, html: "Question text?", fs: 32, bold: true }),
      ...["A. Option", "B. Option", "C. Option", "D. Option"].map((o, i) => [S({ x: 60 + (i % 2) * 590, y: 280 + Math.floor(i / 2) * 140, w: 570, h: 110, shape: "round", fill: "#EEF2FC", stroke: BLUE, sw: 2 }),
        T({ x: 90 + (i % 2) * 590, y: 310 + Math.floor(i / 2) * 140, w: 510, h: 60, html: o, fs: 28, z: 3 })]).flat(),
      T({ x: 60, y: 580, w: 1160, h: 60, html: "Answer: ", fs: 24, color: "#8A6416", italic: true })] }) },
    summary: { name: "Summary", make: () => ({ bg: CREAM, els: [S({ x: 0, y: 0, w: 16, h: H, fill: GOLD }), logo(1166, 24, 76),
      T({ x: 70, y: 40, w: 1000, h: 80, html: "Key points to remember", fs: 44, bold: true, color: NAVY, font: "Poppins" }),
      T({ x: 70, y: 150, w: 1140, h: 520, html: "<ol><li>Point</li><li>Point</li><li>Point</li></ol>", fs: 30 })] }) },
    blank: { name: "Blank", make: () => ({ bg: "#FFFFFF", els: [] }) }
  };
  const newDeck = title => ({ title: title || "Untitled slides", slides: [TEMPLATES.blank.make()] });

  // ---------- slide viewer (students) ----------
  function viewer(deck, host, opt = {}) {
    const slides = deck.slides || [];
    let i = 0;
    host.innerHTML = `<div class="sk-view"><div class="sk-screen"></div>
      <div class="sk-bar"><button class="btn btn-out" type="button" data-k="prev" aria-label="Previous slide">‹ Prev</button>
      <span class="sk-count"></span>
      <button class="btn btn-pri" type="button" data-k="next" aria-label="Next slide">Next ›</button>
      <button class="btn btn-out" type="button" data-k="fs">Full screen</button>
      ${opt.download ? `<button class="btn btn-out" type="button" data-k="pdf">Download PDF</button>` : ""}</div></div>`;
    const view = host.firstChild, scr = view.querySelector(".sk-screen");
    const go = k => { const old = i; i = Math.max(0, Math.min(slides.length - 1, k)); const sl = slides[i] || { els: [] }; render(sl, scr, { wm: !opt.noWm });
      const st = scr.querySelector(".sk-stage"); if (sl.tr && sl.tr !== "none" && old !== i) { st.classList.add("sk-tr-" + sl.tr + (i < old ? "-back" : "")); }
      st.querySelectorAll("[class*='sk-anim-']").forEach((el, n) => el.style.animationDelay = (0.15 + n * 0.35) + "s");
      st.querySelectorAll("[data-link]").forEach(el => { el.style.cursor = "pointer"; el.onclick = () => { const u = el.dataset.link; if (/^https?:\/\//i.test(u)) window.open(u, "_blank", "noopener"); else if (/^\d+$/.test(u)) go(+u - 1); else if (/^[\w./#?=&-]+$/.test(u)) location.href = u; }; });
      if (opt.onSlide) opt.onSlide(i, sl);
      view.querySelector(".sk-count").textContent = `${i + 1} / ${slides.length}`;
      view.querySelector('[data-k="prev"]').disabled = i === 0; view.querySelector('[data-k="next"]').disabled = i >= slides.length - 1; };
    watch(scr);
    view.addEventListener("click", e => { const b = e.target.closest("[data-k]"); if (!b) return;
      if (b.dataset.k === "prev") go(i - 1); if (b.dataset.k === "next") go(i + 1);
      if (b.dataset.k === "fs") { if (document.fullscreenElement) document.exitFullscreen(); else if (view.requestFullscreen) view.requestFullscreen().catch(() => {}); }
      if (b.dataset.k === "pdf") printDeck(deck); });
    document.addEventListener("fullscreenchange", () => setTimeout(() => fit(scr), 60));
    document.addEventListener("keydown", e => { if (!host.isConnected || /INPUT|TEXTAREA|SELECT/.test((e.target.tagName || "")) || e.target.isContentEditable) return;
      if (e.key === "ArrowRight" || e.key === "PageDown") go(i + 1); if (e.key === "ArrowLeft" || e.key === "PageUp") go(i - 1); });
    let sx = null; scr.addEventListener("touchstart", e => sx = e.touches[0].clientX, { passive: true });
    scr.addEventListener("touchend", e => { if (sx == null) return; const d = e.changedTouches[0].clientX - sx; if (Math.abs(d) > 50) go(i + (d < 0 ? 1 : -1)); sx = null; });
    go(0);
    return { go };
  }

  // ---------- PDF: the browser's "Save as PDF" (one slide per page, with watermark) ----------
  function printDeck(deck) {
    let box = document.getElementById("sk-print");
    if (!box) { box = document.createElement("div"); box.id = "sk-print"; document.body.appendChild(box); }
    box.innerHTML = (deck.slides || []).map(() => `<div class="sk-page"><div class="sk-pagein"></div></div>`).join("");
    box.querySelectorAll(".sk-pagein").forEach((h, k) => { render(deck.slides[k], h, { wm: true }); h.style.height = ""; h.querySelector(".sk-stage").style.transform = ""; });
    printNow("sk-printing", deck.title);
  }
  function printNow(cls, title) {
    const old = document.title; if (title) document.title = title + " – SSCAspirants_Official";
    window.__allowPrint = true; document.body.classList.add(cls);
    const done = () => { window.__allowPrint = false; document.body.classList.remove(cls); document.title = old; window.removeEventListener("afterprint", done); };
    window.addEventListener("afterprint", done);
    setTimeout(() => { window.print(); setTimeout(done, 1500); }, 300);
  }

  // ---------- PowerPoint file (admin only) ----------
  const loadScript = u => new Promise((ok, no) => { if (document.querySelector(`script[src="${u}"]`) && window.PptxGenJS) return ok(); const s = document.createElement("script"); s.src = u; s.onload = ok; s.onerror = () => no(new Error("Could not load " + u)); document.head.appendChild(s); });
  const toText = html => { const d = document.createElement("div"); d.innerHTML = clean(html).replace(/<li>/g, "<li>• ").replace(/<\/(li|div|p)>/g, "\n").replace(/<br>/g, "\n"); return d.textContent.replace(/\n{3,}/g, "\n\n").trim(); };
  async function dataUrl(u) { const r = await fetch(u); const b = await r.blob(); return await new Promise(ok => { const f = new FileReader(); f.onload = () => ok(f.result); f.readAsDataURL(b); }); }
  async function exportPptx(deck) {
    await loadScript("https://cdn.jsdelivr.net/npm/pptxgenjs@4.0.1/dist/pptxgen.bundle.js");
    const p = new PptxGenJS(); p.layout = "LAYOUT_WIDE"; p.title = deck.title || "Slides";
    const inch = v => v / 96, hex = c => (color(c) || "#000000").slice(1, 7);
    for (const sl of deck.slides || []) {
      const s = p.addSlide(); s.background = { color: hex(sl.bg || "#FFFFFF") };
      for (const e of (sl.els || []).slice().sort((a, b) => (a.z || 1) - (b.z || 1))) {
        const box = { x: inch(e.x), y: inch(e.y), w: inch(e.w), h: inch(e.h) };
        if (e.t === "text") s.addText(toText(e.html), { ...box, fontSize: Math.round((+e.fs || 28) * 0.75), color: hex(e.color || "#1E2433"), bold: !!e.bold, italic: !!e.italic, underline: e.underline ? { style: "sng" } : undefined,
          align: e.align || "left", valign: "top", fontFace: e.font === "Hind" ? "Nirmala UI" : e.font === "Poppins" ? "Poppins" : "Calibri", fill: color(e.fill) ? { color: hex(e.fill) } : undefined, margin: 4 });
        if (e.t === "img" && src(e.src)) { try { s.addImage({ ...box, data: await dataUrl(src(e.src)) }); } catch (er) {} }
        if (e.t === "shape") {
          if (e.shape === "line") s.addShape(p.ShapeType.line, { x: box.x, y: box.y + box.h / 2, w: box.w, h: 0, line: { color: hex(e.stroke || e.fill || "#1F3A93"), width: Math.max(1, (+e.sw || 4) * 0.75) } });
          else s.addShape(({ ellipse: p.ShapeType.ellipse, round: p.ShapeType.roundRect, triangle: p.ShapeType.triangle, rtri: p.ShapeType.rtTriangle, diamond: p.ShapeType.diamond, hexagon: p.ShapeType.hexagon, pentagon: p.ShapeType.pentagon, star: p.ShapeType.star5, arrow: p.ShapeType.rightArrow, larrow: p.ShapeType.leftArrow, chevron: p.ShapeType.chevron, plus: p.ShapeType.plus, bubble: p.ShapeType.wedgeRoundRectCallout, cloud: p.ShapeType.cloud })[e.shape] || p.ShapeType.rect,
            { ...box, fill: color(e.fill) ? { color: hex(e.fill) } : { type: "none" }, line: color(e.stroke) && +e.sw ? { color: hex(e.stroke), width: +e.sw * 0.75 } : { type: "none" }, rectRadius: e.shape === "round" ? 0.25 : undefined, rotate: +e.rot || 0 });
        }
        if (e.t === "table") s.addTable((e.rows || []).map((r, ri) => r.map(c => ({ text: toText(c), options: e.head && ri === 0 ? { bold: true, color: hex(e.headColor || "#FFFFFF"), fill: { color: hex(e.headFill || "#1F3A93") } } : {} }))),
          { ...box, fontSize: Math.round((+e.fs || 20) * 0.75), color: hex(e.color || "#1E2433"), border: { type: "solid", color: hex(e.border || "#D9D2C2"), pt: 0.75 } });
      }
    }
    await p.writeFile({ fileName: (deck.title || "slides").replace(/[^\w\- ]+/g, "").trim() + ".pptx" });
  }

  window.SlideKit = { PATHS, SHAPES, W, H, FONTS, TEMPLATES, render, fit, watch, viewer, printDeck, printNow, exportPptx, newDeck, clean, uid, memory, src };
})();
