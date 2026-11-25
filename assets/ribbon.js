// Ribbon helpers shared by the Docs and Slides editors: tabs, colour palette, symbols, small menus.
(function () {
  const COLORS = [
    "#000000", "#434343", "#666666", "#999999", "#B7B7B7", "#CCCCCC", "#D9D9D9", "#EFEFEF", "#F3F3F3", "#FFFFFF",
    "#980000", "#FF0000", "#FF9900", "#FFFF00", "#00FF00", "#00FFFF", "#4A86E8", "#0000FF", "#9900FF", "#FF00FF",
    "#E6B8AF", "#F4CCCC", "#FCE5CD", "#FFF2CC", "#D9EAD3", "#D0E0E3", "#C9DAF8", "#CFE2F3", "#D9D2E9", "#EAD1DC",
    "#DD7E6B", "#EA9999", "#F9CB9C", "#FFE599", "#B6D7A8", "#A2C4C9", "#A4C2F4", "#9FC5E8", "#B4A7D6", "#D5A6BD",
    "#CC4125", "#E06666", "#F6B26B", "#FFD966", "#93C47D", "#76A5AF", "#6D9EEB", "#6FA8DC", "#8E7CC3", "#C27BA0",
    "#A61C00", "#CC0000", "#E69138", "#F1C232", "#6AA84F", "#45818E", "#3C78D8", "#3D85C6", "#674EA7", "#A64D79",
    "#5B0F00", "#660000", "#783F04", "#7F6000", "#274E13", "#0C343D", "#1C4587", "#073763", "#20124D", "#4C1130"];
  const BRAND = ["#1F3A93", "#141B38", "#3F62D1", "#C9962E", "#F5C451", "#0F6B5B", "#25A386", "#B42318", "#7A2448", "#E5368B"];
  const SYMBOLS = "₹ ° √ ∛ π × ÷ ± ≠ ≈ ≤ ≥ ∞ ∴ ∵ ∠ △ ⊥ ∥ ∑ Δ θ α β γ λ μ σ Ω ½ ⅓ ¼ ¾ ² ³ ⁴ ₁ ₂ → ← ↑ ↓ ⇒ ⇔ ✓ ✗ ★ ☆ • ◆ ■ □ ● ○ ♦ ※ © ® ™ § ¶ “ ” ‘ ’ … — – € $ £ ¥ % ‰ ∝ ∈ ∉ ⊂ ∪ ∩".split(" ");
  let pop = null;
  const close = () => { if (pop) { pop.remove(); pop = null; } };
  document.addEventListener("mousedown", e => { if (pop && !pop.contains(e.target) && !e.target.closest("[data-pop]")) close(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape") close(); });
  function place(el, anchor) {
    document.body.appendChild(el); const r = anchor.getBoundingClientRect(), w = el.offsetWidth, h = el.offsetHeight;
    el.style.left = Math.max(6, Math.min(innerWidth - w - 6, r.left)) + "px";
    el.style.top = (r.bottom + h + 6 > innerHeight ? Math.max(6, r.top - h - 6) : r.bottom + 4) + "px";
  }
  function make(anchor, html) { close(); pop = document.createElement("div"); pop.className = "rpop"; pop.innerHTML = html; pop.addEventListener("mousedown", e => { if (!e.target.closest("input,select")) e.preventDefault(); }); place(pop, anchor); return pop; }
  window.Ribbon = {
    COLORS,
    // tabs: buttons with data-rt, panes with data-rp
    tabs(root, onChange) {
      const tb = [...root.querySelectorAll("[data-rt]")], panes = [...root.querySelectorAll("[data-rp]")];
      const show = t => { tb.forEach(b => b.setAttribute("aria-selected", b.dataset.rt === t)); panes.forEach(p => p.classList.toggle("on", p.dataset.rp === t)); if (onChange) onChange(t); };
      tb.forEach(b => b.addEventListener("click", () => show(b.dataset.rt))); show(tb[0].dataset.rt); return show;
    },
    // colour palette: onPick(colour) – colour is null for "No colour"
    palette(anchor, onPick, opt = {}) {
      const sw = l => `<div class="swg">${l.map(c => `<button type="button" title="${c}" data-col="${c}" style="background:${c}"></button>`).join("")}</div>`;
      const p = make(anchor, `<h6>Colours</h6>${sw(COLORS)}<h6 style="margin-top:8px">SSCAspirants colours</h6>${sw(BRAND)}
        <div class="prow">${opt.none !== false ? `<button type="button" data-col="">✕ ${opt.noneLabel || "No colour"}</button>` : ""}<label>More… <input type="color" value="${opt.value || "#1f3a93"}"></label></div>`);
      p.addEventListener("click", e => { const b = e.target.closest("[data-col]"); if (!b) return; close(); onPick(b.dataset.col || null); });
      p.querySelector("input[type=color]").addEventListener("change", e => { close(); onPick(e.target.value); });
    },
    symbols(anchor, onPick) {
      const p = make(anchor, `<h6>Symbols</h6><div class="symg">${SYMBOLS.map(s => `<button type="button" data-s="${s}">${s}</button>`).join("")}</div>`);
      p.addEventListener("click", e => { const b = e.target.closest("[data-s]"); if (b) { close(); onPick(b.dataset.s); } });
    },
    // small menu: items = [[value, label], …]
    menu(anchor, items, onPick) {
      const p = make(anchor, `<div class="rmenu">${items.map(([v, l]) => `<button type="button" data-v="${v}">${l}</button>`).join("")}</div>`);
      p.addEventListener("click", e => { const b = e.target.closest("[data-v]"); if (b) { close(); onPick(b.dataset.v); } });
    },
    close,
    // PDF → pictures (one per page). Uses pdf.js from the CDN.
    async pdfPages(buf, scale = 1.6, onPage) {
      const lib = await import("https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs");
      lib.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs";
      const doc = await lib.getDocument({ data: new Uint8Array(buf) }).promise, out = [];
      for (let i = 1; i <= doc.numPages; i++) {
        const pg = await doc.getPage(i), vp = pg.getViewport({ scale }), c = document.createElement("canvas");
        c.width = Math.round(vp.width); c.height = Math.round(vp.height);
        const x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height);
        await pg.render({ canvasContext: x, canvas: c, viewport: vp }).promise;
        out.push(c); if (onPage) onPage(i, doc.numPages);
      }
      return out;
    }
  };
})();
