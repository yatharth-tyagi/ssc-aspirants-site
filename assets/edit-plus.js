// SSCAspirants_Official – extra tools shared by the Doc and PPT editors:
//   EditPlus.draw()      – drawing pad (finger, mouse or S Pen) → picture
//   EditPlus.equation()  – equation editor → MathML (shows on every modern browser)
//   EditPlus.emoji()     – emoji and icon picker
//   EditPlus.toMathML()  – small LaTeX → MathML converter used by the equation editor
(function () {
  const css = `
.xp-dlg{border:1px solid var(--line);border-radius:16px;padding:0;background:var(--surface);color:var(--ink);width:min(1100px,calc(100vw - 20px));max-width:none;max-height:calc(100vh - 20px);box-sizing:border-box;overflow:hidden}
.xp-dlg::backdrop{background:rgba(10,14,30,.6)}
.xp-head{display:flex;align-items:center;gap:10px;padding:12px 16px;border-bottom:1px solid var(--line)}
.xp-head h2{margin:0;margin-right:auto;font:700 1.1rem Poppins,sans-serif}
.xp-body{padding:12px 16px;overflow:auto;max-height:calc(100vh - 150px)}
.xp-foot{display:flex;gap:10px;justify-content:flex-end;padding:12px 16px;border-top:1px solid var(--line)}
.xp-bar{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-bottom:10px}
.xp-bar button,.xp-bar label{min-height:38px;min-width:38px;padding:0 10px;border-radius:9px;border:1px solid var(--line);background:var(--bg);color:var(--ink);font:600 .86rem Inter,sans-serif;cursor:pointer;display:inline-flex;align-items:center;gap:6px}
.xp-bar button[aria-pressed="true"]{background:var(--pri);color:#fff;border-color:var(--pri)}
.xp-bar .sw{width:30px;min-width:30px;padding:0;border-radius:50%}
.xp-bar .sw[aria-pressed="true"]{outline:3px solid var(--pri);outline-offset:2px}
.xp-bar input[type=range]{width:110px}
.xp-bar input[type=color]{width:30px;height:26px;border:0;padding:0;background:none}
.xp-sep{width:1px;height:28px;background:var(--line);margin:0 4px}
.xp-cv{position:relative;border:1px solid var(--line);border-radius:12px;overflow:hidden;touch-action:none;background:#fff}
.xp-cv.grid{background-image:linear-gradient(#e8e3d6 1px,transparent 1px),linear-gradient(90deg,#e8e3d6 1px,transparent 1px);background-size:32px 32px}
.xp-cv canvas{display:block;width:100%;height:auto;cursor:crosshair;touch-action:none}
.xp-eq textarea{width:100%;box-sizing:border-box;min-height:84px;border:1px solid var(--line);border-radius:10px;background:var(--bg);color:var(--ink);font:500 1rem 'Courier New',monospace;padding:10px}
.xp-prev{min-height:90px;border:1px dashed var(--line);border-radius:12px;display:grid;place-items:center;padding:14px;font-size:1.7rem;background:#fff;color:#1E2433;overflow:auto}
.xp-eqb{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0}
.xp-eqb button{min-height:36px;padding:0 10px;border-radius:8px;border:1px solid var(--line);background:var(--bg);color:var(--ink);font:500 .95rem Inter,serif;cursor:pointer}
.xp-eqb button:hover{background:var(--pri-soft)}
.xp-help{font-size:.84rem;color:var(--muted);margin:6px 0 0}
.xp-emo h6{margin:10px 0 6px;font:700 .72rem Inter,sans-serif;text-transform:uppercase;letter-spacing:.05em;color:var(--muted)}
.xp-emo .g{display:grid;grid-template-columns:repeat(auto-fill,40px);gap:4px}
.xp-emo .g button{width:40px;height:40px;border-radius:8px;border:1px solid var(--line);background:var(--bg);font-size:1.35rem;cursor:pointer}
.xp-emo .g button:hover{background:var(--pri-soft)}
.xp-btn{min-height:40px;padding:0 16px;border-radius:10px;border:1px solid var(--line);background:var(--bg);color:var(--ink);font:600 .92rem Inter,sans-serif;cursor:pointer}
.xp-btn.pri{background:var(--pri);color:#fff;border-color:var(--pri)}`;
  const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  function dialog(title, body, foot) {
    const d = document.createElement("dialog"); d.className = "xp-dlg";
    d.innerHTML = `<div class="xp-head"><h2>${esc(title)}</h2><button class="xp-btn" type="button" data-x="close">✕</button></div><div class="xp-body">${body}</div><div class="xp-foot">${foot || ""}</div>`;
    document.body.appendChild(d); d.addEventListener("close", () => d.remove());
    d.querySelector('[data-x="close"]').onclick = () => d.close();
    d.showModal(); return d;
  }

  // =====================================================================
  // Drawing pad
  // =====================================================================
  const PENS = ["#1E2433", "#1F3A93", "#C00000", "#0F6B5B", "#C9962E", "#7A2448", "#FF6D00", "#FFFFFF"];
  function draw() {
    return new Promise(resolve => {
      const d = dialog("Draw", `
        <div class="xp-bar" role="toolbar" aria-label="Drawing tools">
          <button type="button" data-tool="pen" aria-pressed="true" title="Pen">✏ Pen</button>
          <button type="button" data-tool="hl" title="Highlighter">🖍 Highlighter</button>
          <button type="button" data-tool="er" title="Eraser">🩹 Eraser</button>
          <span class="xp-sep"></span>
          <button type="button" data-tool="line" title="Straight line">╱ Line</button>
          <button type="button" data-tool="arrow" title="Arrow">➝ Arrow</button>
          <button type="button" data-tool="rect" title="Rectangle">▭ Box</button>
          <button type="button" data-tool="ell" title="Circle">◯ Circle</button>
          <span class="xp-sep"></span>
          ${PENS.map((c, i) => `<button type="button" class="sw" data-col="${c}" aria-pressed="${i === 0}" title="${c}" style="background:${c}"></button>`).join("")}
          <label title="Any colour">More <input type="color" data-colpick value="#1F3A93"></label>
          <label>Size <input type="range" min="1" max="40" value="4" data-size></label>
          <span class="xp-sep"></span>
          <button type="button" data-act="undo" title="Undo">↶ Undo</button>
          <button type="button" data-act="redo" title="Redo">↷ Redo</button>
          <button type="button" data-act="clear" title="Clear all">🗑 Clear</button>
          <label><input type="checkbox" data-grid checked> Grid</label>
          <label><input type="checkbox" data-white> White background</label>
        </div>
        <div class="xp-cv grid"><canvas width="1600" height="900"></canvas></div>
        <p class="xp-help">Draw with your finger, mouse or S Pen (pen pressure works). Only the drawn part is added – empty space is cut off.</p>`,
        `<button class="xp-btn" type="button" data-x="cancel">Cancel</button><button class="xp-btn pri" type="button" data-x="ok">Insert drawing</button>`);
      const cv = d.querySelector("canvas"), g = cv.getContext("2d"), box = d.querySelector(".xp-cv");
      let tool = "pen", col = PENS[0], size = 4, strokes = [], redo = [], curS = null;
      const pick = (sel, attr, v) => d.querySelectorAll(sel).forEach(b => b.setAttribute("aria-pressed", b.getAttribute(attr) === v));
      d.querySelector(".xp-bar").addEventListener("click", e => {
        const t = e.target.closest("[data-tool]"); if (t) { tool = t.dataset.tool; pick("[data-tool]", "data-tool", tool); }
        const c = e.target.closest("[data-col]"); if (c) { col = c.dataset.col; pick("[data-col]", "data-col", col); if (tool === "er") { tool = "pen"; pick("[data-tool]", "data-tool", tool); } }
        const a = e.target.closest("[data-act]"); if (a) {
          if (a.dataset.act === "undo" && strokes.length) redo.push(strokes.pop());
          if (a.dataset.act === "redo" && redo.length) strokes.push(redo.pop());
          if (a.dataset.act === "clear" && strokes.length && confirm("Clear the whole drawing?")) { strokes = []; redo = []; }
          paint(); }
      });
      d.querySelector("[data-colpick]").addEventListener("input", e => { col = e.target.value; pick("[data-col]", "data-col", "-"); });
      d.querySelector("[data-size]").addEventListener("input", e => size = +e.target.value);
      d.querySelector("[data-grid]").addEventListener("change", e => box.classList.toggle("grid", e.target.checked));
      const pt = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * cv.width / r.width, (e.clientY - r.top) * cv.height / r.height, e.pressure && e.pointerType === "pen" ? e.pressure : 0.5]; };
      function strokePath(s, ctx) {
        ctx.save(); ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = s.col; ctx.fillStyle = s.col;
        if (s.tool === "er") { ctx.globalCompositeOperation = "destination-out"; ctx.strokeStyle = "#000"; }
        if (s.tool === "hl") ctx.globalAlpha = 0.35;
        const p = s.pts, w = s.size * (s.tool === "hl" ? 4 : s.tool === "er" ? 3 : 1);
        if (/^(line|arrow|rect|ell)$/.test(s.tool)) {
          const [x0, y0] = p[0], [x1, y1] = p[p.length - 1]; ctx.lineWidth = w; ctx.beginPath();
          if (s.tool === "rect") ctx.rect(Math.min(x0, x1), Math.min(y0, y1), Math.abs(x1 - x0), Math.abs(y1 - y0));
          else if (s.tool === "ell") ctx.ellipse((x0 + x1) / 2, (y0 + y1) / 2, Math.abs(x1 - x0) / 2, Math.abs(y1 - y0) / 2, 0, 0, Math.PI * 2);
          else { ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); }
          ctx.stroke();
          if (s.tool === "arrow") { const a = Math.atan2(y1 - y0, x1 - x0), L = Math.max(16, w * 4); ctx.beginPath(); ctx.moveTo(x1, y1);
            ctx.lineTo(x1 - L * Math.cos(a - 0.45), y1 - L * Math.sin(a - 0.45)); ctx.lineTo(x1 - L * Math.cos(a + 0.45), y1 - L * Math.sin(a + 0.45)); ctx.closePath(); ctx.fill(); }
        } else if (s.tool === "hl" || s.tool === "er") { ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(p[0][0], p[0][1]); p.forEach(q => ctx.lineTo(q[0], q[1])); if (p.length === 1) ctx.lineTo(p[0][0] + 0.1, p[0][1]); ctx.stroke(); }
        else { // pen: width follows pressure
          if (p.length === 1) { ctx.beginPath(); ctx.arc(p[0][0], p[0][1], w * (0.5 + p[0][2]) / 2, 0, Math.PI * 2); ctx.fill(); }
          for (let i = 1; i < p.length; i++) { ctx.lineWidth = w * (0.5 + (p[i][2] + p[i - 1][2]) / 2); ctx.beginPath(); ctx.moveTo(p[i - 1][0], p[i - 1][1]); ctx.lineTo(p[i][0], p[i][1]); ctx.stroke(); }
        }
        ctx.restore();
      }
      let raf = 0;
      function paint() { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => { g.clearRect(0, 0, cv.width, cv.height); strokes.forEach(s => strokePath(s, g)); if (curS) strokePath(curS, g); }); }
      cv.addEventListener("pointerdown", e => { e.preventDefault(); cv.setPointerCapture(e.pointerId); curS = { tool, col, size, pts: [pt(e)] }; paint(); });
      cv.addEventListener("pointermove", e => { if (!curS) return; const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
        if (/^(line|arrow|rect|ell)$/.test(curS.tool)) curS.pts = [curS.pts[0], pt(e)]; else evs.forEach(x => curS.pts.push(pt(x))); paint(); });
      const up = () => { if (!curS) return; strokes.push(curS); redo = []; curS = null; paint(); };
      cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up);
      d.querySelector('[data-x="cancel"]').onclick = () => d.close();
      d.addEventListener("close", () => resolve(d.returnValue === "ok" ? d._out : null));
      d.querySelector('[data-x="ok"]').onclick = () => {
        if (!strokes.length) { d.close(); return; }
        const full = document.createElement("canvas"); full.width = cv.width; full.height = cv.height; const fg = full.getContext("2d");
        strokes.forEach(s => strokePath(s, fg));
        // cut off empty space
        const data = fg.getImageData(0, 0, full.width, full.height).data; let x0 = full.width, y0 = full.height, x1 = 0, y1 = 0;
        for (let y = 0; y < full.height; y += 2) for (let x = 0; x < full.width; x += 2) if (data[(y * full.width + x) * 4 + 3] > 8) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
        if (x1 <= x0) { d.close(); return; }
        const pad = 16; x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(full.width, x1 + pad); y1 = Math.min(full.height, y1 + pad);
        const out = document.createElement("canvas"); out.width = x1 - x0; out.height = y1 - y0; const og = out.getContext("2d");
        if (d.querySelector("[data-white]").checked) { og.fillStyle = "#fff"; og.fillRect(0, 0, out.width, out.height); }
        og.drawImage(full, x0, y0, out.width, out.height, 0, 0, out.width, out.height);
        d._out = out; d.returnValue = "ok"; d.close();
      };
    });
  }

  // =====================================================================
  // LaTeX → MathML (the part of LaTeX used in school maths)
  // =====================================================================
  const SYM = {
    alpha: "α", beta: "β", gamma: "γ", delta: "δ", epsilon: "ε", theta: "θ", lambda: "λ", mu: "μ", pi: "π", rho: "ρ", sigma: "σ", tau: "τ", phi: "φ", omega: "ω",
    Gamma: "Γ", Delta: "Δ", Theta: "Θ", Lambda: "Λ", Pi: "Π", Sigma: "Σ", Phi: "Φ", Omega: "Ω"
  };
  const OPS = {
    times: "×", div: "÷", pm: "±", mp: "∓", cdot: "·", le: "≤", leq: "≤", ge: "≥", geq: "≥", ne: "≠", neq: "≠", approx: "≈", equiv: "≡", sim: "∼", propto: "∝",
    infty: "∞", therefore: "∴", because: "∵", angle: "∠", triangle: "△", perp: "⊥", parallel: "∥", degree: "°", circ: "°", rightarrow: "→", to: "→", leftarrow: "←",
    Rightarrow: "⇒", Leftrightarrow: "⇔", sum: "∑", prod: "∏", int: "∫", in: "∈", notin: "∉", subset: "⊂", cup: "∪", cap: "∩", forall: "∀", exists: "∃", ldots: "…", cdots: "⋯", "%": "%", rupee: "₹"
  };
  const FUNCS = ["sin", "cos", "tan", "cot", "sec", "cosec", "csc", "log", "ln", "lim", "max", "min"];
  function toMathML(src, block) {
    let i = 0; const s = String(src || "");
    const peek = () => s[i];
    const skip = () => { while (i < s.length && /\s/.test(s[i])) i++; };
    function cmd() { i++; if (!/[a-zA-Z]/.test(s[i] || "")) return s[i++] || ""; let n = ""; while (i < s.length && /[a-zA-Z]/.test(s[i])) n += s[i++]; return n; }
    function group() { skip(); if (peek() === "{") { i++; const inner = seq("}"); i++; return `<mrow>${inner}</mrow>`; } return atom(); }
    function rawGroup() { skip(); if (peek() !== "{") return ""; i++; let depth = 1, out = ""; while (i < s.length) { const c = s[i++]; if (c === "{") depth++; if (c === "}" && --depth === 0) break; out += c; } return out; }
    function atom() {
      skip(); const c = peek(); if (c == null) return "";
      if (c === "{") return group();
      if (c === "\\") {
        const n = cmd();
        if (n === "frac" || n === "dfrac") { const a = group(), b = group(); return `<mfrac>${a}${b}</mfrac>`; }
        if (n === "sqrt") { skip(); if (peek() === "[") { i++; let k = ""; while (i < s.length && s[i] !== "]") k += s[i++]; i++; return `<mroot>${group()}<mrow>${toInner(k)}</mrow></mroot>`; } return `<msqrt>${group()}</msqrt>`; }
        if (n === "text") return `<mtext>${esc(rawGroup())}</mtext>`;
        if (n === "overline" || n === "bar") return `<mover>${group()}<mo>¯</mo></mover>`;
        if (n === "vec") return `<mover>${group()}<mo>→</mo></mover>`;
        if (n === "left" || n === "right") { skip(); const b = s[i++] || ""; return b === "." ? "" : `<mo>${esc(b)}</mo>`; }
        if (n === "," || n === ";" || n === " " || n === "quad") return `<mspace width="${n === "quad" ? "1em" : ".3em"}"></mspace>`;
        if (SYM[n]) return `<mi>${SYM[n]}</mi>`;
        if (OPS[n]) return `<mo>${OPS[n]}</mo>`;
        if (FUNCS.includes(n)) return `<mi>${n}</mi><mspace width=".15em"></mspace>`;
        return `<mi>${esc(n)}</mi>`;
      }
      if (/[0-9.]/.test(c)) { let n = ""; while (i < s.length && /[0-9.]/.test(s[i])) n += s[i++]; return `<mn>${n}</mn>`; }
      if (/[a-zA-Z]/.test(c)) { i++; return `<mi>${c}</mi>`; }
      i++; return `<mo>${esc(c === "*" ? "×" : c === "-" ? "−" : c)}</mo>`;
    }
    function seq(end) {
      let out = "";
      while (i < s.length) {
        skip(); if (i >= s.length || s[i] === end) break;
        if (s[i] === "}") { i++; continue; }
        let base = atom(), sub = null, sup = null;
        for (;;) { skip(); if (s[i] === "^") { i++; sup = group(); } else if (s[i] === "_") { i++; sub = group(); } else break; }
        out += sub && sup ? `<msubsup>${base || "<mi></mi>"}${sub}${sup}</msubsup>` : sup ? `<msup>${base || "<mi></mi>"}${sup}</msup>` : sub ? `<msub>${base || "<mi></mi>"}${sub}</msub>` : base;
      }
      return out;
    }
    function toInner(k) { const save = [i]; return toMathML(k).replace(/^<math[^>]*>|<\/math>$/g, ""); }
    const body = seq(null);
    return `<math${block ? ' display="block"' : ""}>${body}</math>`;
  }
  const EQ_TPL = [["Fraction", "\\frac{a}{b}"], ["Square", "x^{2}"], ["Power", "a^{n}"], ["Index", "x_{1}"], ["√", "\\sqrt{x}"], ["∛", "\\sqrt[3]{x}"],
    ["×", "\\times "], ["÷", "\\div "], ["±", "\\pm "], ["≤", "\\le "], ["≥", "\\ge "], ["≠", "\\ne "], ["≈", "\\approx "], ["π", "\\pi "], ["θ", "\\theta "], ["°", "^{\\circ}"],
    ["∠", "\\angle "], ["△", "\\triangle "], ["∴", "\\therefore "], ["∞", "\\infty "], ["∑", "\\sum_{i=1}^{n}"], ["sin", "\\sin "], ["cos", "\\cos "], ["tan", "\\tan "], ["log", "\\log_{10} "], ["x̄", "\\overline{x}"], ["Text", "\\text{ words }"]];
  const EQ_EX = [["(a+b)²", "(a+b)^{2} = a^{2} + 2ab + b^{2}"], ["SI", "SI = \\frac{P \\times R \\times T}{100}"], ["CI", "A = P\\left(1 + \\frac{R}{100}\\right)^{n}"],
    ["Area of circle", "A = \\pi r^{2}"], ["Pythagoras", "a^{2} + b^{2} = c^{2}"], ["Quadratic", "x = \\frac{-b \\pm \\sqrt{b^{2} - 4ac}}{2a}"], ["sin²+cos²", "\\sin^{2}\\theta + \\cos^{2}\\theta = 1"], ["Profit %", "Profit\\% = \\frac{Profit}{CP} \\times 100"]];
  function equation(start) {
    return new Promise(resolve => {
      const d = dialog("Equation", `<div class="xp-eq">
        <div class="xp-eqb">${EQ_TPL.map(([l, v]) => `<button type="button" data-ins="${esc(v)}">${esc(l)}</button>`).join("")}</div>
        <textarea spellcheck="false" placeholder="Type the equation, e.g.  (a+b)^2 = a^2 + 2ab + b^2   or   \\frac{P \\times R \\times T}{100}">${esc(start || "")}</textarea>
        <p class="xp-help">Ready formulas:</p><div class="xp-eqb">${EQ_EX.map(([l, v]) => `<button type="button" data-set="${esc(v)}">${esc(l)}</button>`).join("")}</div>
        <p class="xp-help">Preview</p><div class="xp-prev"></div>
        <label class="xp-help" style="display:flex;gap:8px;align-items:center;margin-top:10px"><input type="checkbox" data-block checked> On its own line (centred)</label></div>`,
        `<button class="xp-btn" type="button" data-x="cancel">Cancel</button><button class="xp-btn pri" type="button" data-x="ok">Insert equation</button>`);
      const ta = d.querySelector("textarea"), pv = d.querySelector(".xp-prev");
      const show = () => { pv.innerHTML = ta.value.trim() ? toMathML(ta.value, true) : `<span style="font-size:1rem;color:#999">Your equation shows here</span>`; };
      ta.addEventListener("input", show); show(); ta.focus();
      d.addEventListener("click", e => { const b = e.target.closest("[data-ins],[data-set]"); if (!b) return;
        if (b.dataset.set) ta.value = b.dataset.set; else { const a = ta.selectionStart, z = ta.selectionEnd; ta.value = ta.value.slice(0, a) + b.dataset.ins + ta.value.slice(z); ta.selectionStart = ta.selectionEnd = a + b.dataset.ins.length; }
        ta.focus(); show(); });
      d.querySelector('[data-x="cancel"]').onclick = () => d.close();
      d.querySelector('[data-x="ok"]').onclick = () => { const v = ta.value.trim(); d._out = v ? { latex: v, block: d.querySelector("[data-block]").checked, mathml: toMathML(v, d.querySelector("[data-block]").checked) } : null; d.returnValue = "ok"; d.close(); };
      d.addEventListener("close", () => resolve(d.returnValue === "ok" ? d._out : null));
    });
  }

  // =====================================================================
  // Emoji and icons
  // =====================================================================
  const EMO = {
    "Study": "📌 📝 📖 📚 📒 🧠 💡 🎯 ✅ ❌ ⭐ 🌟 🔥 ⚡ ⏰ 📅 🏆 🥇 🎓 ✍️ 🔍 📊 📈 📉 🧮 🔢 🔤 💯 ❓ ❗ ⚠️ 🚫 🔑 🗝️ 🧩 🪄".split(" "),
    "Arrows & marks": "👉 👈 👆 👇 ➡️ ⬅️ ⬆️ ⬇️ ↗️ ↘️ 🔁 🔄 ✔️ ☑️ ✖️ ➕ ➖ ➗ ✳️ ❇️ 🔴 🟠 🟡 🟢 🔵 🟣 ⚫ ⚪ 🟥 🟧 🟨 🟩 🟦 🟪 ⬛ ⬜".split(" "),
    "India & GK": "🇮🇳 🏛️ ⚖️ 🗳️ 📜 🕌 🛕 ⛪ 🏰 🗺️ 🌍 🌏 🏔️ 🌋 🏜️ 🏝️ 🌊 🌾 🌳 🐅 🦚 🪷 ☀️ 🌙 🌧️ ⚛️ 🧪 🧬 🔬 🔭 💊 🩺 🚀 🛰️ ⚙️ 💰 🪙 🏦 🚆 ✈️".split(" "),
    "People & hands": "👍 👎 👏 🙌 🤝 🙏 ✋ ✌️ 🤔 😊 😃 😎 🤓 😮 😴 🥳 💪 👨‍🏫 👩‍🏫 👨‍🎓 👩‍🎓 👮 💂 🧑‍⚖️ 👑".split(" ")
  };
  function emoji() {
    return new Promise(resolve => {
      const d = dialog("Emoji & icons", `<div class="xp-emo">${Object.entries(EMO).map(([h, l]) => `<h6>${esc(h)}</h6><div class="g">${l.map(x => `<button type="button" data-e="${x}">${x}</button>`).join("")}</div>`).join("")}</div>`);
      d.addEventListener("click", e => { const b = e.target.closest("[data-e]"); if (b) { d._out = b.dataset.e; d.returnValue = "ok"; d.close(); } });
      d.addEventListener("close", () => resolve(d.returnValue === "ok" ? d._out : null));
    });
  }

  // small text prompt in a dialog (window.prompt is blocked in some previews)
  function ask(title, label, value, okLabel) {
    return new Promise(resolve => {
      const d = dialog(title, `<label style="display:flex;flex-direction:column;gap:6px;font-weight:600">${esc(label)}<input type="text" value="${esc(value || "")}" style="min-height:42px;border:1px solid var(--line);border-radius:10px;background:var(--bg);color:var(--ink);font:inherit;padding:0 10px"></label>`,
        `<button class="xp-btn" type="button" data-x="cancel">Cancel</button><button class="xp-btn pri" type="button" data-x="ok">${esc(okLabel || "OK")}</button>`);
      d.style.width = "min(520px,calc(100vw - 20px))";
      const inp = d.querySelector("input"); inp.focus(); inp.select();
      const ok = () => { d._out = inp.value; d.returnValue = "ok"; d.close(); };
      inp.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); ok(); } });
      d.querySelector('[data-x="cancel"]').onclick = () => d.close(); d.querySelector('[data-x="ok"]').onclick = ok;
      d.addEventListener("close", () => resolve(d.returnValue === "ok" ? d._out : null));
    });
  }

  const ytId = u => { u = String(u || "").trim(); const m = /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/|v\/))([\w-]{11})/.exec(u); return m ? m[1] : /^[\w-]{11}$/.test(u) ? u : ""; };
  window.EditPlus = { draw, equation, emoji, ask, dialog, toMathML, ytId, esc };
})();
