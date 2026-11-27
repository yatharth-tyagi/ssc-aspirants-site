// SSCAspirants_Official – Doc editor: extra Word / Google Docs style tools.
// Adds: clipboard + format painter, more styles/fonts/sizes, checklist, bullet & number styles,
// paragraph spacing, drawing (S Pen), equations, emoji, table of contents, footnotes, code block,
// 3 columns, more table tools (merge, split, cell colour, styles, sort), more picture tools
// (rotate, flip, border, shadow, wrap, caption, alt text, any width), a View tab
// (outline, focus mode, read aloud, word count, shortcuts) and keyboard shortcuts.
(function () {
  const A = window.DocAPI, P = window.EditPlus; if (!A || !P) return;
  const $ = id => document.getElementById(id), page = A.page, esc = P.esc;
  const btn = (attr, icon, label, title) => `<button class="tb rb" type="button" ${attr} title="${esc(title || label)}"><span class="ri">${icon}</span><span class="rl">${esc(label)}</span></button>`;
  const sm = (attr, icon, label, title) => `<button class="tb rb sm" type="button" ${attr} title="${esc(title || label)}"><span class="ri">${icon}</span><span class="rl">${esc(label)}</span></button>`;
  const group = (label, inner, stack) => `<div class="rg"><div class="rgb${stack ? " stack" : ""}">${inner}</div><span class="rgl">${esc(label)}</span></div>`;
  const pane = n => document.querySelector(`.rpane[data-rp="${n}"]`);

  // ---------- ribbon additions ----------
  pane("home").insertAdjacentHTML("afterbegin", group("Clipboard",
    `<div class="rrow">${sm('data-x="cut"', "✂", "Cut")}${sm('data-x="copy"', "⧉", "Copy")}</div><div class="rrow">${sm('data-x="paste"', "📋", "Paste text", "Paste as plain text")}${sm('data-x="painter" id="painterBtn"', "🖌", "Format painter", "Copy formatting, then select words to paint it on")}</div>`, true));
  const homeRgs = pane("home").querySelectorAll(".rg");
  homeRgs[homeRgs.length - 1].insertAdjacentHTML("beforebegin", group("Lists & spacing",
    `<div class="rrow">${sm('data-x="check"', "☑", "Checklist")}${sm('data-x="bstyle"', "•▾", "Bullet style")}</div><div class="rrow">${sm('data-x="nstyle"', "1.▾", "Number style")}${sm('data-x="space"', "↕", "Para spacing", "Space before / after paragraph")}</div>`, true));
  pane("insert").insertAdjacentHTML("beforeend",
    group("Draw & maths", btn('data-x="draw"', "✍", "Draw", "Draw with finger, mouse or S Pen") + btn('data-x="eq"', "∑", "Equation") + btn('data-x="emoji"', "😊", "Emoji")) +
    group("References", btn('data-x="toc"', "☰", "Contents", "Table of contents from your headings") + btn('data-x="fn"', "¹", "Footnote")) +
    group("Blocks", btn('data-x="code"', "&lt;/&gt;", "Code box") + btn('data-x="cols3"', "⫼", "3 columns") + btn('data-x="check"', "☑", "Checklist")));
  pane("layout").insertAdjacentHTML("beforeend", group("Paragraph", btn('data-x="space"', "↕", "Spacing", "Space before / after paragraph") + btn('data-x="indent"', "⇥", "Indent more") + btn('data-x="outdent"', "⇤", "Indent less")));
  // View tab
  const tabs = document.querySelector("#ribbon .rtabs"), fileTab = tabs.querySelector('[data-rt="file"]');
  fileTab.insertAdjacentHTML("beforebegin", `<button type="button" data-rt="view">View</button>`);
  pane("file").insertAdjacentHTML("beforebegin", `<div class="rpane" data-rp="view">${
    group("Show", btn('data-x="outline" id="outlineBtn"', "☰", "Outline", "List of headings – click to jump") + btn('data-x="focus"', "⛶", "Focus mode", "Full screen writing") + btn('data-x="spell" id="spellBtn"', "abc✓", "Spell check"))}${
    group("Tools", btn('data-x="read" id="readBtn"', "🔊", "Read aloud") + btn('data-x="count"', "#", "Word count") + btn('data-x="keys"', "⌨", "Shortcuts"))}</div>`);
  Ribbon.tabs($("ribbon"));
  $("spellBtn").setAttribute("aria-pressed", page.spellcheck);

  // more styles, fonts and sizes
  $("style").insertAdjacentHTML("afterbegin", `<option value="h1">Title</option>`);
  $("style").querySelector('option[value="h4"]').insertAdjacentHTML("afterend", `<option value="h5">Heading 4</option><option value="pre">Code</option>`);
  [["Verdana", "Verdana"], ["Trebuchet MS", "Trebuchet MS"], ["Tahoma", "Tahoma"], ["Garamond", "Garamond"], ["Comic Sans MS", "Comic Sans MS"], ["Segoe UI", "Segoe UI"], ["Noto Sans Devanagari", "Devanagari (हिन्दी)"]]
    .forEach(([v, l]) => $("font").insertAdjacentHTML("beforeend", `<option value="${v}">${l}</option>`));
  $("size").innerHTML = `<option value="">Size</option>${[8, 9, 10, 11, 12, 13, 14, 15, 16, 18, 20, 22, 24, 26, 28, 32, 36, 40, 48, 56, 64, 72].map(n => `<option>${n}</option>`).join("")}<option value="custom">Custom…</option>`;
  $("size").addEventListener("change", async e => { if (e.target.value !== "custom") return; e.stopImmediatePropagation(); e.target.value = "";
    const v = await P.ask("Text size", "Size in px (6 – 120)", "18", "Apply"); if (v && +v >= 6 && +v <= 120) A.wrapStyle("fontSize", (+v) + "px"); }, true);
  // extra ribbon CSS
  document.head.insertAdjacentHTML("beforeend", `<style>
    #page ul.chk{list-style:none;padding-left:4px}#page ul.chk li{cursor:pointer}
    #page pre{background:#141B38;color:#E8ECF8;padding:12px 14px;border-radius:10px;font:14px/1.5 'Courier New',monospace;white-space:pre-wrap}
    #page math{font-size:1.1em}#page math:hover{outline:1px dashed #C9962E;cursor:pointer}
    #page .toc{border:1px solid #CFC7B5;border-radius:10px;padding:10px 16px;margin:12px 0}
    .xp-outline{position:fixed;left:10px;top:var(--xp-top,190px);bottom:60px;width:240px;overflow:auto;z-index:40;background:var(--surface);border:1px solid var(--line);border-radius:12px;box-shadow:var(--shadow);padding:10px}
    .xp-outline h6{margin:0 0 8px;font:700 .75rem Inter,sans-serif;text-transform:uppercase;color:var(--muted)}
    .xp-outline button{display:block;width:100%;text-align:left;border:0;background:none;color:var(--ink);font:500 .88rem Inter,sans-serif;padding:6px 8px;border-radius:7px;cursor:pointer}
    .xp-outline button:hover{background:var(--pri-soft)}
    .ctx input[type=range]{width:110px}
    body.painting #page{cursor:copy}
  </style>`);

  // ---------- helpers ----------
  const sel = () => getSelection();
  const blocksInSel = () => { const s = sel(), out = []; const b = A.blockOf(); if (b) out.push(b);
    if (s.rangeCount && !s.isCollapsed) page.querySelectorAll("p,li,h1,h2,h3,h4,h5,blockquote,pre").forEach(x => { if (s.containsNode(x, true) && !out.includes(x)) out.push(x); }); return out; };
  const listOf = tag => { const s = sel(); let n = s.anchorNode; while (n && n !== page) { if (n.nodeType === 1 && (!tag ? /^(UL|OL)$/.test(n.tagName) : n.tagName === tag)) return n; n = n.parentNode; } return null; };
  const insert = html => A.exec("insertHTML", html);
  async function saveCanvas(canvas, prefix) {
    const data = canvas.toDataURL("image/png"), path = `assets/uploads/${prefix}-${Date.now().toString(36)}.png`;
    return { data, path, save: () => A.write(path, data.split(",")[1], "Admin: notes " + prefix) };
  }

  // ---------- format painter ----------
  let paint = null;
  function armPainter() {
    if (paint) { paint = null; document.body.classList.remove("painting"); $("painterBtn").setAttribute("aria-pressed", false); return; }
    page.focus(); A.restoreSel(); const s = sel(); if (!s.rangeCount) return A.stat("Click inside formatted words first");
    let el = s.anchorNode; if (el && el.nodeType === 3) el = el.parentNode; if (!el || !page.contains(el)) return A.stat("Click inside formatted words first");
    const cs = getComputedStyle(el), q = c => { try { return document.queryCommandState(c); } catch (e) { return false; } };
    paint = { bold: q("bold"), italic: q("italic"), underline: q("underline"), strikeThrough: q("strikeThrough"), color: cs.color, family: cs.fontFamily, size: cs.fontSize, bg: (() => { let x = el; while (x && x !== page) { const b = getComputedStyle(x).backgroundColor; if (b && !/rgba\(0, 0, 0, 0\)|transparent/.test(b) && x.tagName === "SPAN") return b; x = x.parentNode; } return ""; })() };
    document.body.classList.add("painting"); $("painterBtn").setAttribute("aria-pressed", true); A.stat("Format painter: select the words to paint");
  }
  page.addEventListener("mouseup", () => setTimeout(() => {
    if (!paint) return; const s = sel(); if (!s.rangeCount || s.isCollapsed) return;
    ["bold", "italic", "underline", "strikeThrough"].forEach(c => { let on = false; try { on = document.queryCommandState(c); } catch (e) {} if (on !== paint[c]) document.execCommand(c); });
    document.execCommand("foreColor", false, paint.color); if (paint.bg) document.execCommand("hiliteColor", false, paint.bg);
    document.execCommand("fontName", false, "__x__");
    page.querySelectorAll('span[style*="__x__"],font[face="__x__"]').forEach(el => { const sp = document.createElement("span"); sp.innerHTML = el.innerHTML; sp.style.fontFamily = paint.family; sp.style.fontSize = paint.size; el.replaceWith(sp); });
    A.changed(); paint = null; document.body.classList.remove("painting"); $("painterBtn").setAttribute("aria-pressed", false); A.stat("Formatting painted");
  }, 0));

  // ---------- lists ----------
  function setListStyle(tag, type) {
    page.focus(); A.restoreSel(); let l = listOf(tag);
    if (!l) { document.execCommand(tag === "UL" ? "insertUnorderedList" : "insertOrderedList"); l = listOf(tag); }
    if (!l) return; l.classList.remove("chk"); l.style.listStyleType = type; l.style.paddingLeft = ""; A.changed();
  }
  function checklist() {
    page.focus(); A.restoreSel(); const l = listOf("UL");
    if (l) { l.classList.add("chk"); l.style.listStyleType = "none"; l.querySelectorAll(":scope > li").forEach(li => { if (!/^[☐☑]/.test(li.textContent)) li.insertBefore(document.createTextNode("☐ "), li.firstChild); }); A.changed(); return; }
    insert(`<ul class="chk" style="list-style:none;padding-left:4px"><li>☐ First item</li><li>☐ Second item</li></ul><p><br></p>`);
  }
  page.addEventListener("click", e => { const li = e.target.closest("ul.chk > li"); if (!li) return; const r = li.getBoundingClientRect(); if (e.clientX - r.left > 26) return;
    const t = li.firstChild; if (t && t.nodeType === 3 && /^[☐☑]/.test(t.nodeValue)) { t.nodeValue = (t.nodeValue[0] === "☐" ? "☑" : "☐") + t.nodeValue.slice(1); A.changed(); } });

  // ---------- references ----------
  const slugId = (t, i) => "h-" + (String(t).toLowerCase().replace(/[^a-z0-9ऀ-ॿ]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "part") + "-" + i;
  function toc() {
    const hs = [...page.querySelectorAll("h1,h2,h3,h4,h5")].filter(h => !h.closest(".toc") && h.textContent.trim());
    if (!hs.length) return A.stat("Add some headings first (Home → Heading 1 / 2 / 3)");
    hs.forEach((h, i) => { if (!h.id) h.id = slugId(h.textContent, i + 1); });
    const lvl = { H1: 0, H2: 0, H3: 18, H4: 36, H5: 54 };
    const html = `<div class="toc"><p><b>Contents</b></p><ul style="list-style:none;padding-left:0;margin:0">${hs.map(h => `<li style="padding-left:${lvl[h.tagName]}px;margin:3px 0"><a href="#${h.id}">${esc(h.textContent.trim())}</a></li>`).join("")}</ul></div>`;
    const old = page.querySelector(".toc"); if (old) { old.outerHTML = html; A.changed(); A.stat("Contents updated"); return; }
    insert(html + "<p><br></p>");
  }
  async function footnote() {
    const txt = await P.ask("Footnote", "Footnote text", "", "Add footnote"); if (!txt) return;
    let box = page.querySelector(".footnotes"), n = box ? box.querySelectorAll("li").length + 1 : 1;
    insert(`<sup><a href="#fn-${n}" id="fnref-${n}">[${n}]</a></sup>&nbsp;`);
    box = page.querySelector(".footnotes");
    if (!box) { page.insertAdjacentHTML("beforeend", `<div class="footnotes" style="font-size:.9em;color:#555"><hr><ol></ol></div>`); box = page.querySelector(".footnotes"); }
    box.querySelector("ol").insertAdjacentHTML("beforeend", `<li id="fn-${n}">${esc(txt)} <a href="#fnref-${n}">↩</a></li>`); A.changed();
  }

  // ---------- drawing, equation, emoji ----------
  async function drawIt() {
    const c = await P.draw(); if (!c) return;
    const w = Math.min(100, Math.round(c.width / 1600 * 100 * 1.2)), f = await saveCanvas(c, "draw");
    insert(`<p style="text-align:center"><img src="${f.data}" data-path="${f.path}" alt="Drawing" style="width:${Math.max(20, w)}%"></p>`);
    try { A.stat("Saving drawing…"); await f.save(); A.stat("Drawing saved"); } catch (er) { A.stat("Could not save drawing: " + er.message); }
  }
  let eqTarget = null;
  async function eqIt(start) {
    const r = await P.equation(start); if (!r) { eqTarget = null; return; }
    const m = r.mathml.replace("<math", `<math data-latex="${esc(r.latex)}"`);
    if (eqTarget && eqTarget.isConnected) { const p = eqTarget.parentNode; eqTarget.outerHTML = m; eqTarget = null; A.changed(); return; }
    // put the equation in with the DOM (the browser's insert command breaks MathML apart)
    page.focus(); A.restoreSel(); const s = sel(), tmp = document.createElement("div"); tmp.innerHTML = m; const node = tmp.firstChild;
    if (r.block) { const p = document.createElement("p"); p.style.textAlign = "center"; p.appendChild(node); const after = document.createElement("p"); after.innerHTML = "<br>";
      const b = A.blockOf(); if (b && b !== page && page.contains(b)) { const top = b.closest("li") || b; top.after(p, after); } else page.append(p, after);
      const rr = document.createRange(); rr.setStart(after, 0); rr.collapse(true); s.removeAllRanges(); s.addRange(rr); }
    else { if (!s.rangeCount || !page.contains(s.anchorNode)) page.append(node); else { const rr = s.getRangeAt(0); rr.deleteContents(); const sp = document.createTextNode("\u00a0"); rr.insertNode(sp); rr.insertNode(node); rr.setStartAfter(sp); rr.collapse(true); s.removeAllRanges(); s.addRange(rr); } }
    A.changed();
  }
  page.addEventListener("dblclick", e => { const m = e.target.closest && e.target.closest("math"); if (!m) return; e.preventDefault(); eqTarget = m; eqIt(m.getAttribute("data-latex") || ""); });

  // ---------- paragraph spacing ----------
  function spacing(anchor) {
    Ribbon.menu(anchor, [["b0", "Space before: none"], ["b8", "Space before: small"], ["b20", "Space before: large"], ["a0", "Space after: none"], ["a8", "Space after: small"], ["a20", "Space after: large"], ["r", "Normal spacing"]], v => {
      const bl = blocksInSel(); if (!bl.length) return A.stat("Click inside a paragraph first");
      bl.forEach(x => { if (v === "r") { x.style.marginTop = x.style.marginBottom = ""; } else if (v[0] === "b") x.style.marginTop = v.slice(1) + "px"; else x.style.marginBottom = v.slice(1) + "px"; }); A.changed(); });
  }

  // ---------- view ----------
  function outline() {
    let o = document.querySelector(".xp-outline");
    if (o) { o.remove(); $("outlineBtn").setAttribute("aria-pressed", false); return; }
    o = document.createElement("nav"); o.className = "xp-outline"; o.style.setProperty("--xp-top", (document.querySelector(".dbar").getBoundingClientRect().bottom + 10) + "px"); document.body.appendChild(o); $("outlineBtn").setAttribute("aria-pressed", true);
    const fill = () => { const hs = [...page.querySelectorAll("h1,h2,h3,h4,h5")].filter(h => h.textContent.trim());
      o.innerHTML = `<h6>Outline</h6>` + (hs.length ? hs.map((h, i) => `<button type="button" data-h="${i}" style="padding-left:${({ H1: 8, H2: 8, H3: 22, H4: 36, H5: 50 })[h.tagName]}px;${/H1|H2/.test(h.tagName) ? "font-weight:700" : ""}">${esc(h.textContent.trim())}</button>`).join("") : `<p class="muted" style="font-size:.85rem">Headings you add show here.</p>`);
      o.onclick = e => { const b = e.target.closest("[data-h]"); if (b) hs[+b.dataset.h].scrollIntoView({ behavior: "smooth", block: "start" }); }; };
    fill(); page.addEventListener("input", () => { if (o.isConnected) { clearTimeout(o.t); o.t = setTimeout(fill, 400); } });
  }
  function readAloud() {
    if (!window.speechSynthesis) return A.stat("Read aloud is not available in this browser");
    if (speechSynthesis.speaking) { speechSynthesis.cancel(); $("readBtn").setAttribute("aria-pressed", false); return; }
    const t = (sel().toString() || page.innerText).slice(0, 30000); if (!t.trim()) return;
    const u = new SpeechSynthesisUtterance(t); u.lang = /[ऀ-ॿ]/.test(t) ? "hi-IN" : "en-IN"; u.rate = 1;
    u.onend = () => $("readBtn").setAttribute("aria-pressed", false); speechSynthesis.speak(u); $("readBtn").setAttribute("aria-pressed", true);
  }
  function counts() {
    const t = page.innerText, words = (t.trim().match(/\S+/g) || []).length;
    P.dialog("Word count", `<table style="width:100%;border-collapse:collapse;font-size:1rem">${[["Words", words], ["Characters (with spaces)", t.replace(/\n/g, "").length], ["Characters (no spaces)", t.replace(/\s/g, "").length],
      ["Paragraphs", page.querySelectorAll("p,li").length], ["Headings", page.querySelectorAll("h1,h2,h3,h4,h5").length], ["Pictures", page.querySelectorAll("img").length], ["Tables", page.querySelectorAll("table").length],
      ["Reading time", Math.max(1, Math.round(words / 200)) + " min"]].map(([k, v]) => `<tr><td style="padding:8px;border-bottom:1px solid var(--line)">${k}</td><td style="padding:8px;border-bottom:1px solid var(--line);text-align:right;font-weight:700">${v}</td></tr>`).join("")}</table>`).style.width = "min(460px,calc(100vw - 20px))";
  }
  function keys() {
    const K = [["Ctrl + B / I / U", "Bold / Italic / Underline"], ["Ctrl + Z / Y", "Undo / Redo"], ["Ctrl + K", "Add link"], ["Ctrl + Alt + 1 / 2 / 3 / 4", "Heading 1 / 2 / 3 / 4"], ["Ctrl + Alt + 0", "Normal text"],
      ["Ctrl + Shift + 7 / 8", "Numbers / Bullets"], ["Ctrl + Shift + 9", "Checklist"], ["Ctrl + ] / [", "Bigger / smaller text"], ["Ctrl + Shift + X", "Strike"], ["Ctrl + . / ,", "Superscript / subscript"],
      ["Tab / Shift + Tab", "Indent / outdent (in lists)"], ["Ctrl + Shift + V", "Paste as plain text"], ["Ctrl + H", "Find and replace"], ["Ctrl + S", "Save draft"], ["Double-click an equation", "Edit it"]];
    P.dialog("Keyboard shortcuts", `<table style="width:100%;border-collapse:collapse">${K.map(([k, v]) => `<tr><td style="padding:7px;border-bottom:1px solid var(--line);font-weight:700;white-space:nowrap">${k}</td><td style="padding:7px;border-bottom:1px solid var(--line)">${v}</td></tr>`).join("")}</table>`).style.width = "min(560px,calc(100vw - 20px))";
  }

  // ---------- ribbon clicks ----------
  document.querySelector(".tools").addEventListener("click", async e => {
    const b = e.target.closest("[data-x]"); if (!b) return; const x = b.dataset.x;
    if (x === "cut" || x === "copy") { page.focus(); A.restoreSel(); try { document.execCommand(x); } catch (er) {} if (x === "cut") A.changed(); return; }
    if (x === "paste") { try { const t = await navigator.clipboard.readText(); A.exec("insertText", t); } catch (er) { A.stat("Press Ctrl + Shift + V to paste as plain text"); } return; }
    if (x === "painter") return armPainter();
    if (x === "check") return checklist();
    if (x === "bstyle") return Ribbon.menu(b, [["disc", "● Round"], ["circle", "○ Circle"], ["square", "■ Square"], ['"✓  "', "✓ Tick"], ['"➤  "', "➤ Arrow"], ['"★  "', "★ Star"], ['"–  "', "– Dash"]], v => setListStyle("UL", v));
    if (x === "nstyle") return Ribbon.menu(b, [["decimal", "1. 2. 3."], ["lower-alpha", "a. b. c."], ["upper-alpha", "A. B. C."], ["lower-roman", "i. ii. iii."], ["upper-roman", "I. II. III."], ["devanagari", "१. २. ३."]], v => setListStyle("OL", v));
    if (x === "space") return spacing(b);
    if (x === "indent" || x === "outdent") return A.exec(x);
    if (x === "draw") return drawIt();
    if (x === "eq") { eqTarget = null; return eqIt(""); }
    if (x === "emoji") { const em = await P.emoji(); if (em) A.exec("insertText", em); return; }
    if (x === "toc") return toc();
    if (x === "fn") return footnote();
    if (x === "code") return insert(`<pre>Type here</pre><p><br></p>`);
    if (x === "cols3") return insert(`<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;margin:12px 0"><div><p>Column 1</p></div><div><p>Column 2</p></div><div><p>Column 3</p></div></div><p><br></p>`);
    if (x === "outline") return outline();
    if (x === "focus") { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen && document.documentElement.requestFullscreen().catch(() => {}); return; }
    if (x === "spell") { page.spellcheck = !page.spellcheck; b.setAttribute("aria-pressed", page.spellcheck); page.blur(); page.focus(); return; }
    if (x === "read") return readAloud();
    if (x === "count") return counts();
    if (x === "keys") return keys();
  });
  // style menu: Code
  $("style").addEventListener("change", e => { if (e.target.value === "pre") { e.stopImmediatePropagation(); A.exec("formatBlock", "<pre>"); } }, true);

  // ---------- table tools ----------
  $("tblBar").insertAdjacentHTML("beforeend", `<span style="width:8px"></span>
    <button class="tb" data-tx="mr">Merge →</button><button class="tb" data-tx="md">Merge ↓</button><button class="tb" data-tx="split">Split</button>
    <button class="tb" data-tx="fill">Cell colour</button><button class="tb" data-tx="va">Cell align</button><button class="tb" data-tx="style">Table style</button>
    <button class="tb" data-tx="sort">Sort A→Z</button><button class="tb" data-tx="even">Equal widths</button>`);
  const TSTY = { plain: ["Plain", "", "#CFC7B5", ""], blue: ["Blue heading", "#1F3A93", "#CFC7B5", "#fff"], gold: ["Gold heading", "#C9962E", "#E2D6B8", "#fff"], striped: ["Striped rows", "#1F3A93", "#CFC7B5", "#fff"], none: ["No lines", "", "transparent", ""] };
  $("tblBar").addEventListener("click", e => {
    const b = e.target.closest("[data-tx]"); const td = A.cell(); if (!b || !td) return; const tbl = td.closest("table"), tr = td.parentNode, a = b.dataset.tx;
    if (a === "mr") { const nx = td.nextElementSibling; if (!nx) return A.stat("No cell on the right"); td.colSpan = (td.colSpan || 1) + (nx.colSpan || 1); if (nx.textContent.trim()) td.insertAdjacentHTML("beforeend", " " + nx.innerHTML); nx.remove(); }
    if (a === "md") { const rows = [...tbl.rows], ri = rows.indexOf(tr) + (td.rowSpan || 1), below = rows[ri] && rows[ri].cells[td.cellIndex]; if (!below) return A.stat("No cell below");
      td.rowSpan = (td.rowSpan || 1) + (below.rowSpan || 1); if (below.textContent.trim()) td.insertAdjacentHTML("beforeend", "<br>" + below.innerHTML); below.remove(); }
    if (a === "split") { const cs = td.colSpan || 1, rs = td.rowSpan || 1; if (cs === 1 && rs === 1) return A.stat("This cell is not merged");
      for (let k = 1; k < cs; k++) { const n = document.createElement(td.tagName); n.innerHTML = "<br>"; td.after(n); }
      const rows = [...tbl.rows], ri = rows.indexOf(tr); for (let k = 1; k < rs; k++) { const r = rows[ri + k]; if (!r) break; for (let j = 0; j < cs; j++) { const n = document.createElement("td"); n.innerHTML = "<br>"; r.insertBefore(n, r.cells[td.cellIndex] || null); } }
      td.colSpan = 1; td.rowSpan = 1; }
    if (a === "fill") return Ribbon.palette(b, c => { td.style.background = c || ""; A.changed(); });
    if (a === "va") return Ribbon.menu(b, [["top", "Top"], ["middle", "Middle"], ["bottom", "Bottom"]], v => { td.style.verticalAlign = v; A.changed(); });
    if (a === "style") return Ribbon.menu(b, Object.entries(TSTY).map(([k, v]) => [k, v[0]]), k => { const [, hf, line, hc] = TSTY[k];
      tbl.querySelectorAll("td,th").forEach(c => { c.style.borderColor = line; c.style.background = ""; c.style.color = ""; });
      tbl.querySelectorAll("th").forEach(c => { c.style.background = hf; c.style.color = hc; });
      if (k === "striped") [...tbl.tBodies[0].rows].forEach((r, i) => { if (i % 2) [...r.cells].forEach(c => c.style.background = "#EEF2FC"); }); A.changed(); });
    if (a === "sort") { const body = tbl.tBodies[0]; if (!body) return; const ci = td.cellIndex, rows = [...body.rows];
      const key = r => (r.cells[ci] ? r.cells[ci].textContent.trim() : ""); const num = rows.every(r => !key(r) || !isNaN(parseFloat(key(r))));
      const asc = b.dataset.dir !== "asc"; b.dataset.dir = asc ? "asc" : "desc"; b.textContent = asc ? "Sort Z→A" : "Sort A→Z";
      rows.sort((p, q) => { const x = key(p), y = key(q); const r = num ? (parseFloat(x) || 0) - (parseFloat(y) || 0) : x.localeCompare(y, "en", { numeric: true }); return asc ? r : -r; }).forEach(r => body.appendChild(r)); }
    if (a === "even") { tbl.style.tableLayout = tbl.style.tableLayout === "fixed" ? "" : "fixed"; }
    A.changed();
  });

  // ---------- picture tools ----------
  $("imgBar").insertAdjacentHTML("beforeend", `<span style="width:8px"></span>
    <label class="tb" style="gap:6px">Width <input type="range" min="10" max="100" step="5" data-iw></label>
    <button class="tb" data-ix="rot">⟳ Rotate</button><button class="tb" data-ix="flip">⇋ Flip</button>
    <button class="tb" data-ix="border">Border</button><button class="tb" data-ix="round">Round</button><button class="tb" data-ix="shadow">Shadow</button>
    <button class="tb" data-ix="wrapL">Text right ⇥</button><button class="tb" data-ix="wrapR">⇤ Text left</button><button class="tb" data-ix="wrap0">No wrap</button>
    <button class="tb" data-ix="cap">Caption</button><button class="tb" data-ix="alt">Alt text</button><button class="tb" data-ix="repl">Replace</button>`);
  const img = () => { const i = A.curImg(); return i && i.isConnected ? i : null; };
  const tf = (i, k, v) => { const t = { r: +(i.dataset.rot || 0), f: i.dataset.flip === "1" }; if (k === "r") t.r = (t.r + 90) % 360; if (k === "f") t.f = !t.f;
    i.dataset.rot = t.r; i.dataset.flip = t.f ? "1" : "0"; i.style.transform = `${t.r ? `rotate(${t.r}deg)` : ""}${t.f ? " scaleX(-1)" : ""}`.trim(); };
  new MutationObserver(() => { const i = img(); if (i && $("imgBar").classList.contains("show")) $("imgBar").querySelector("[data-iw]").value = parseInt(i.style.width) || 100; }).observe($("imgBar"), { attributes: true, attributeFilter: ["class"] });
  $("imgBar").addEventListener("input", e => { const i = img(); if (i && e.target.dataset.iw != null) { i.style.width = e.target.value + "%"; A.changed(); } });
  $("imgBar").addEventListener("click", async e => {
    const b = e.target.closest("[data-ix]"), i = img(); if (!b || !i) return; const a = b.dataset.ix, p = i.closest("p") || i.parentNode;
    if (a === "rot") tf(i, "r"); if (a === "flip") tf(i, "f");
    if (a === "border") i.style.border = i.style.border ? "" : "3px solid #1F3A93";
    if (a === "round") i.style.borderRadius = i.style.borderRadius && i.style.borderRadius !== "0px" ? "0" : "16px";
    if (a === "shadow") i.style.boxShadow = i.style.boxShadow ? "" : "0 8px 24px rgba(0,0,0,.25)";
    if (a === "wrapL" || a === "wrapR") { i.style.float = a === "wrapL" ? "left" : "right"; i.style.margin = a === "wrapL" ? "4px 16px 8px 0" : "4px 0 8px 16px"; if (!i.style.width || parseInt(i.style.width) > 60) i.style.width = "40%"; if (p.tagName === "P") p.style.textAlign = ""; }
    if (a === "wrap0") { i.style.float = ""; i.style.margin = ""; }
    if (a === "cap") { const t = await P.ask("Caption", "Text under the picture", "", "Add caption"); if (t) p.insertAdjacentHTML("afterend", `<p style="text-align:center;font-size:14px;color:#666;font-style:italic;margin-top:4px">${esc(t)}</p>`); }
    if (a === "alt") { const t = await P.ask("Alt text", "Describe the picture (helps search and screen readers)", i.alt || "", "Save"); if (t != null) i.alt = t; }
    if (a === "repl") { const f = document.createElement("input"); f.type = "file"; f.accept = "image/*"; f.onchange = () => { if (!f.files[0]) return; const keep = i; A.replaceImage(keep, f.files[0]); }; f.click(); return; }
    A.changed();
  });

  // ---------- keyboard shortcuts ----------
  page.addEventListener("keydown", e => {
    const c = e.ctrlKey || e.metaKey, k = e.key;
    if (k === "Tab") { const li = A.blockOf(); e.preventDefault(); if (li && li.tagName === "LI") document.execCommand(e.shiftKey ? "outdent" : "indent"); else if (!e.shiftKey) document.execCommand("insertHTML", false, "&nbsp;&nbsp;&nbsp;&nbsp;"); A.changed(); return; }
    if (!c) return;
    if (k.toLowerCase() === "k" && !e.shiftKey) { e.preventDefault(); (async () => { const u = await P.ask("Link", "Web address (https://…)", "https://", "Add link"); if (u && /^https?:\/\/\S+/i.test(u)) A.exec("createLink", u); })(); return; }
    if (e.altKey && /^[0-4]$/.test(k)) { e.preventDefault(); A.exec("formatBlock", k === "0" ? "<p>" : ["", "<h2>", "<h3>", "<h4>", "<h5>"][+k]); return; }
    if (e.shiftKey && (k === "&" || k === "7")) { e.preventDefault(); A.exec("insertOrderedList"); return; }
    if (e.shiftKey && (k === "*" || k === "8")) { e.preventDefault(); A.exec("insertUnorderedList"); return; }
    if (e.shiftKey && (k === "(" || k === "9")) { e.preventDefault(); checklist(); return; }
    if (e.shiftKey && k.toLowerCase() === "x") { e.preventDefault(); A.exec("strikeThrough"); return; }
    if (k === "." && !e.shiftKey) { e.preventDefault(); A.exec("superscript"); return; }
    if (k === "," && !e.shiftKey) { e.preventDefault(); A.exec("subscript"); return; }
    if (k === "]" || k === "[") { e.preventDefault(); const s = sel(); let el = s.anchorNode; if (el && el.nodeType === 3) el = el.parentNode; const cur = parseFloat(getComputedStyle(el).fontSize) || 16; if (!s.isCollapsed) A.wrapStyle("fontSize", Math.max(8, cur + (k === "]" ? 2 : -2)) + "px"); return; }
  });
})();
