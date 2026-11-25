// Reads a PowerPoint file (.pptx) in the browser and turns every slide into editable SSCAspirants_Official slides:
// text boxes (with size, colour, bold/italic/underline, bullets, alignment), pictures, shapes, lines, tables,
// slide backgrounds and speaker notes. Charts, SmartArt and some effects are simplified.
(function () {
  const W = 1280, H = 720;
  // ---------- tiny .zip reader (uses the browser's built-in decompression) ----------
  async function unzip(buf) {
    const dv = new DataView(buf), u8 = new Uint8Array(buf); let eocd = -1;
    for (let i = buf.byteLength - 22; i >= Math.max(0, buf.byteLength - 65557); i--) if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
    if (eocd < 0) throw new Error("This is not a .pptx file.");
    const cnt = dv.getUint16(eocd + 10, true); let p = dv.getUint32(eocd + 16, true); const files = {};
    for (let n = 0; n < cnt; n++) {
      if (dv.getUint32(p, true) !== 0x02014b50) break;
      const method = dv.getUint16(p + 10, true), csize = dv.getUint32(p + 20, true), nlen = dv.getUint16(p + 28, true), elen = dv.getUint16(p + 30, true), clen = dv.getUint16(p + 32, true), loff = dv.getUint32(p + 42, true);
      const name = new TextDecoder().decode(u8.subarray(p + 46, p + 46 + nlen));
      const start = loff + 30 + dv.getUint16(loff + 26, true) + dv.getUint16(loff + 28, true);
      files[name] = { method, data: u8.subarray(start, start + csize) };
      p += 46 + nlen + elen + clen;
    }
    const bytes = async name => { const f = files[name]; if (!f) return null; if (f.method === 0) return f.data;
      return new Uint8Array(await new Response(new Blob([f.data]).stream().pipeThrough(new DecompressionStream("deflate-raw"))).arrayBuffer()); };
    return { has: n => !!files[n], bytes, text: async n => { const b = await bytes(n); return b ? new TextDecoder().decode(b) : null; } };
  }
  const xml = t => t ? new DOMParser().parseFromString(t, "application/xml") : null;
  const kids = (el, name) => el ? [...el.children].filter(c => c.localName === name) : [];
  const kid = (el, name) => kids(el, name)[0] || null;
  const path = (el, ...names) => names.reduce((e, n) => kid(e, n), el);
  const all = (el, name) => el ? [...el.getElementsByTagNameNS("*", name)] : [];
  const rid = el => el && (el.getAttributeNS("http://schemas.openxmlformats.org/officeDocument/2006/relationships", "id") || el.getAttribute("r:id"));
  const embed = el => el && (el.getAttributeNS("http://schemas.openxmlformats.org/officeDocument/2006/relationships", "embed") || el.getAttribute("r:embed"));
  const join = (base, rel) => { const parts = base.split("/").slice(0, -1); rel.split("/").forEach(s => { if (s === "..") parts.pop(); else if (s !== ".") parts.push(s); }); return parts.join("/"); };
  async function rels(z, file) { const d = xml(await z.text(join(file, "_rels/" + file.split("/").pop() + ".rels"))); const m = {};
    all(d, "Relationship").forEach(r => m[r.getAttribute("Id")] = { target: r.getAttribute("TargetMode") === "External" ? null : join(file, r.getAttribute("Target")), type: r.getAttribute("Type") || "" }); return m; }

  // ---------- colours ----------
  const hex2 = n => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  function mods(hex, el) {
    let r = parseInt(hex.slice(0, 2), 16), g = parseInt(hex.slice(2, 4), 16), b = parseInt(hex.slice(4, 6), 16);
    const v = n => { const x = kid(el, n); return x ? +x.getAttribute("val") / 100000 : null; };
    const lm = v("lumMod"), lo = v("lumOff"), tint = v("tint"), shade = v("shade");
    if (lm != null || lo != null) { const mx = Math.max(r, g, b) / 255, mn = Math.min(r, g, b) / 255; let l = (mx + mn) / 2, s = 0, h = 0, d = mx - mn;
      if (d) { s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn); const R = r / 255, G = g / 255, B = b / 255; h = mx === R ? (G - B) / d + (G < B ? 6 : 0) : mx === G ? (B - R) / d + 2 : (R - G) / d + 4; h /= 6; }
      l = Math.min(1, Math.max(0, l * (lm == null ? 1 : lm) + (lo || 0)));
      const q = l < .5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q, f = t => { t = (t + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < .5 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; };
      if (s === 0) r = g = b = l * 255; else { r = f(h + 1 / 3) * 255; g = f(h) * 255; b = f(h - 1 / 3) * 255; } }
    if (tint != null) { r = r + (255 - r) * (1 - tint); g = g + (255 - g) * (1 - tint); b = b + (255 - b) * (1 - tint); }
    if (shade != null) { r *= shade; g *= shade; b *= shade; }
    return "#" + hex2(r) + hex2(g) + hex2(b);
  }
  let THEME = {};
  function colorOf(fillEl) {
    if (!fillEl) return null;
    const s = kid(fillEl, "srgbClr"); if (s) return mods(s.getAttribute("val"), s);
    const sc = kid(fillEl, "schemeClr"); if (sc) { let n = sc.getAttribute("val"); n = { tx1: "dk1", bg1: "lt1", tx2: "dk2", bg2: "lt2" }[n] || n; return THEME[n] ? mods(THEME[n], sc) : null; }
    const sy = kid(fillEl, "sysClr"); if (sy) return mods(sy.getAttribute("lastClr") || (sy.getAttribute("val") === "window" ? "FFFFFF" : "000000"), sy);
    const pr = kid(fillEl, "prstClr"); if (pr) return { black: "#000000", white: "#FFFFFF", red: "#FF0000", blue: "#0000FF", green: "#008000", yellow: "#FFFF00" }[pr.getAttribute("val")] || null;
    return null;
  }

  // ---------- one slide ----------
  const GEOM = { rect: "rect", roundRect: "round", snip1Rect: "rect", ellipse: "ellipse", triangle: "triangle", rtTriangle: "rtri", diamond: "diamond", hexagon: "hexagon", pentagon: "pentagon", homePlate: "chevron",
    star5: "star", star4: "star", star6: "star", rightArrow: "arrow", leftArrow: "larrow", chevron: "chevron", plus: "plus", mathPlus: "plus", wedgeRoundRectCallout: "bubble", wedgeRectCallout: "bubble", wedgeEllipseCallout: "bubble", cloud: "cloud", cloudCallout: "cloud", line: "line", straightConnector1: "line" };
  const fontOf = (face, text) => /[ऀ-ॿ]/.test(text || "") || /hind|mangal|nirmala|kokila|devanagari|aparajita|utsaah/i.test(face || "") ? "Hind" : /poppins/i.test(face || "") ? "Poppins" : /merriweather/i.test(face || "") ? "Merriweather" : /georgia|times|cambria|garamond|serif/i.test(face || "") ? "Georgia" : /courier|consolas|mono/i.test(face || "") ? "Courier" : /arial|calibri|helvetica|segoe|verdana|tahoma/i.test(face || "") ? "Arial" : "Inter";
  const esc = s => String(s).replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));

  async function readDeck(file, opt = {}) {
    const z = await unzip(await file.arrayBuffer()), say = opt.progress || (() => {});
    const pres = xml(await z.text("ppt/presentation.xml")); if (!pres) throw new Error("This is not a PowerPoint file.");
    const sz = all(pres, "sldSz")[0], cx = +(sz && sz.getAttribute("cx")) || 12192000, cy = +(sz && sz.getAttribute("cy")) || 6858000;
    const k = Math.min(W / cx, H / cy), ox = (W - cx * k) / 2, oy = (H - cy * k) / 2, ptPx = 12700 * k; // 1pt in slide px
    const pr = await rels(z, "ppt/presentation.xml");
    const order = all(pres, "sldId").map(s => pr[rid(s)] && pr[rid(s)].target).filter(Boolean);
    // theme colours
    const th = Object.values(pr).find(r => /theme$/.test(r.type)); const thd = th ? xml(await z.text(th.target)) : null;
    THEME = {}; const cs = all(thd, "clrScheme")[0]; if (cs) [...cs.children].forEach(c => { const s = kid(c, "srgbClr"), y = kid(c, "sysClr"); THEME[c.localName] = s ? s.getAttribute("val") : y ? (y.getAttribute("lastClr") || "000000") : "000000"; });
    let skipped = 0; const media = {}; const slides = [];
    const pic = async target => { if (!target) return null; if (media[target]) return media[target]; const b = await z.bytes(target); if (!b) return null;
      const ext = (target.split(".").pop() || "png").toLowerCase(); if (!/^(png|jpe?g|gif|webp|bmp)$/.test(ext)) { skipped++; return null; }
      const blob = new Blob([b], { type: "image/" + (ext === "jpg" ? "jpeg" : ext) }); media[target] = opt.upload ? await opt.upload(blob, target.split("/").pop()) : URL.createObjectURL(blob); return media[target]; };

    for (let si = 0; si < order.length; si++) {
      say(`Reading slide ${si + 1} of ${order.length}…`);
      const sf = order[si], sd = xml(await z.text(sf)), sr = await rels(z, sf);
      const lay = Object.values(sr).find(r => /slideLayout$/.test(r.type)); const ld = lay ? xml(await z.text(lay.target)) : null; const lr = lay ? await rels(z, lay.target) : {};
      const mas = Object.values(lr).find(r => /slideMaster$/.test(r.type)); const md = mas ? xml(await z.text(mas.target)) : null;
      // placeholders on the layout / master (for boxes that inherit their place)
      const phs = d => all(d, "sp").map(sp => { const ph = all(sp, "ph")[0]; const x = all(sp, "xfrm")[0]; return ph && x ? { type: ph.getAttribute("type") || "body", idx: ph.getAttribute("idx"), x } : null; }).filter(Boolean);
      const lph = phs(ld), mph = phs(md);
      const findPh = (type, idx) => { type = type || "body"; const m = l => l.find(p => idx != null && p.idx === idx) || l.find(p => p.type === type) || l.find(p => (type === "ctrTitle" && p.type === "title") || (type === "subTitle" && p.type === "body"));
        return (m(lph) || m(mph) || {}).x || null; };
      const S = { bg: "#FFFFFF", els: [] };
      // background
      const bgOf = d => { const bp = path(d && all(d, "cSld")[0], "bg", "bgPr"); if (!bp) { const br = path(d && all(d, "cSld")[0], "bg", "bgRef"); return br ? { c: colorOf(br) } : null; }
        const sf2 = kid(bp, "solidFill"); if (sf2) return { c: colorOf(sf2) }; const gf = kid(bp, "gradFill"); if (gf) return { c: colorOf(all(gf, "gs")[0]) }; const bf = kid(bp, "blipFill"); if (bf) return { img: embed(all(bf, "blip")[0]) }; return null; };
      const bg = bgOf(sd) || bgOf(ld) || bgOf(md);
      if (bg && bg.c) S.bg = bg.c;
      if (bg && bg.img) { const relSet = bgOf(sd) ? sr : bgOf(ld) ? lr : await rels(z, mas.target); const u = await pic(relSet[bg.img] && relSet[bg.img].target); if (u) S.els.push({ id: "bg" + si, t: "img", src: u, x: 0, y: 0, w: W, h: H, fit: "cover", z: 0, lock: true }); }
      let zi = 1;
      const id = () => Math.random().toString(36).slice(2, 9);
      const box = (xf, T) => { const off = kid(xf, "off"), ext = kid(xf, "ext"); if (!off || !ext) return null;
        let x = +off.getAttribute("x"), y = +off.getAttribute("y"), w = +ext.getAttribute("cx"), h = +ext.getAttribute("cy"); [x, y] = T(x, y); w *= T.sx; h *= T.sy;
        return { x: Math.round(ox + x * k), y: Math.round(oy + y * k), w: Math.max(4, Math.round(w * k)), h: Math.max(2, Math.round(h * k)), rot: xf.getAttribute("rot") ? Math.round(+xf.getAttribute("rot") / 60000) : 0 }; };
      const ID = (x, y) => [x, y]; ID.sx = 1; ID.sy = 1;
      const textOf = (tb, phType) => {
        if (!tb) return null; const ps = kids(tb, "p"); let html = "", first = null, list = null, align = null, any = false;
        const bodyPr = kid(tb, "bodyPr"), anchor = bodyPr && bodyPr.getAttribute("anchor");
        ps.forEach(pEl => {
          const pPr = kid(pEl, "pPr"); const algn = pPr && pPr.getAttribute("algn"); if (align == null && algn) align = algn;
          let line = "";
          [...pEl.children].forEach(r => { if (r.localName === "br") { line += "<br>"; return; } if (!/^(r|fld)$/.test(r.localName)) return;
            const t = (kid(r, "t") || {}).textContent || ""; if (!t) return; any = true; const rp = kid(r, "rPr");
            let s2 = esc(t); if (rp && rp.getAttribute("b") === "1") s2 = `<b>${s2}</b>`; if (rp && rp.getAttribute("i") === "1") s2 = `<i>${s2}</i>`; if (rp && rp.getAttribute("u") && rp.getAttribute("u") !== "none") s2 = `<u>${s2}</u>`;
            if (!first && rp) first = rp; else if (!first) first = r; line += s2; });
          const bullet = pPr && (kid(pPr, "buChar") || kid(pPr, "buAutoNum")) ? (kid(pPr, "buAutoNum") ? "ol" : "ul") : (!pPr || !kid(pPr, "buNone")) && phType === "body" && line ? "ul" : null;
          if (bullet) { if (list !== bullet) { if (list) html += `</${list}>`; html += `<${bullet}>`; list = bullet; } html += `<li>${line || "<br>"}</li>`; }
          else { if (list) { html += `</${list}>`; list = null; } html += `<div>${line || "<br>"}</div>`; }
        });
        if (list) html += `</${list}>`;
        if (!any) return null;
        const rp = first && first.localName === "rPr" ? first : null, szv = rp && rp.getAttribute("sz");
        const fsPt = szv ? +szv / 100 : /title/i.test(phType || "") ? 40 : phType === "subTitle" ? 24 : 18;
        const latin = rp && kid(rp, "latin"), clr = rp && colorOf(kid(rp, "solidFill"));
        const plain = html.replace(/<[^>]+>/g, "");
        return { html, fs: Math.max(8, Math.round(fsPt * ptPx)), color: clr || (THEME.dk1 ? "#" + THEME.dk1 : "#1E2433"), font: fontOf(latin && latin.getAttribute("typeface"), plain),
          align: { ctr: "center", r: "right", just: "left" }[align] || (phType === "ctrTitle" ? "center" : "left"), va: anchor === "ctr" ? "middle" : anchor === "b" ? "bottom" : null };
      };
      async function walk(tree, T) {
        for (const el of [...tree.children]) {
          const n = el.localName;
          if (n === "grpSp") { const xf = path(el, "grpSpPr", "xfrm"); if (!xf) { await walk(el, T); continue; }
            const off = kid(xf, "off"), ext = kid(xf, "ext"), co = kid(xf, "chOff"), ce = kid(xf, "chExt");
            const gx = +off.getAttribute("x"), gy = +off.getAttribute("y"), sx = (+ext.getAttribute("cx")) / ((+ce.getAttribute("cx")) || 1), sy = (+ext.getAttribute("cy")) / ((+ce.getAttribute("cy")) || 1);
            const T2 = (x, y) => T(gx + (x - +co.getAttribute("x")) * sx, gy + (y - +co.getAttribute("y")) * sy); T2.sx = T.sx * sx; T2.sy = T.sy * sy;
            await walk(el, T2); continue; }
          if (n === "sp" || n === "cxnSp") {
            const ph = all(el, "ph")[0], phType = ph ? ph.getAttribute("type") || "body" : null;
            const spPr = kid(el, "spPr"); let xf = kid(spPr, "xfrm"); if (!xf && ph) xf = findPh(phType, ph.getAttribute("idx")); if (!xf) continue;
            const b = box(xf, T); if (!b) continue;
            const geom = kid(spPr, "prstGeom"), prst = geom ? geom.getAttribute("prst") : (kid(spPr, "custGeom") ? "rect" : null);
            const sf2 = kid(spPr, "solidFill"), gf = kid(spPr, "gradFill"), ln = kid(spPr, "ln"), style = kid(el, "style");
            let fill = sf2 ? colorOf(sf2) : gf ? colorOf(all(gf, "gs")[0]) : null, fill2 = gf ? colorOf(all(gf, "gs").slice(-1)[0]) : null;
            if (!sf2 && !gf && !kid(spPr, "noFill") && style && !ph && n === "sp") fill = colorOf(path(style, "fillRef"));
            let stroke = null, sw = 0;
            if (ln && !kid(ln, "noFill")) { stroke = colorOf(kid(ln, "solidFill")) || (style ? colorOf(path(style, "lnRef")) : null); sw = ln.getAttribute("w") ? Math.max(1, Math.round(+ln.getAttribute("w") * k)) : 1; }
            else if (!ln && style && (n === "cxnSp" || prst === "line")) { stroke = colorOf(path(style, "lnRef")); sw = 2; }
            const rot = b.rot || undefined; delete b.rot;
            const shapeName = GEOM[prst] || (prst ? (skipped++, "rect") : null);
            if (shapeName === "line" || n === "cxnSp") { S.els.push({ id: id(), t: "shape", shape: "line", ...b, h: Math.max(b.h, 8), y: b.h < 8 ? b.y - 4 : b.y, stroke: stroke || "#1E2433", sw: sw || 2, rot, z: zi++ }); continue; }
            if (shapeName && (fill || stroke)) S.els.push({ id: id(), t: "shape", shape: shapeName, ...b, fill: fill || "", fill2: fill2 && fill2 !== fill ? fill2 : undefined, gang: gf && all(gf, "lin")[0] ? Math.round(+all(gf, "lin")[0].getAttribute("ang") / 60000) + 90 : undefined, stroke: stroke || "", sw, rot, z: zi++ });
            const tx = textOf(kid(el, "txBody"), phType);
            if (tx) S.els.push({ id: id(), t: "text", ...b, ...tx, rot, lh: 1.25, z: zi++ });
            continue;
          }
          if (n === "pic") { const xf = path(el, "spPr", "xfrm"); const b = xf && box(xf, T); if (!b) continue; const bl = all(el, "blip")[0];
            const u = await pic(sr[embed(bl)] && sr[embed(bl)].target); if (u) { const rot = b.rot || undefined; delete b.rot; S.els.push({ id: id(), t: "img", src: u, ...b, fit: "fill", rot, z: zi++ }); } continue; }
          if (n === "graphicFrame") { const xf = kid(el, "xfrm"); const b = xf && box(xf, T); const tbl = all(el, "tbl")[0];
            if (!b) continue; if (!tbl) { skipped++; continue; } delete b.rot;
            const rows = all(tbl, "tr").map(tr => kids(tr, "tc").map(tc => kids(kid(tc, "txBody"), "p").map(p2 => all(p2, "t").map(t => esc(t.textContent)).join("")).join("<br>")));
            const tp = kid(tbl, "tblPr"); const r1 = all(tbl, "rPr")[0];
            S.els.push({ id: id(), t: "table", ...b, rows, head: !tp || tp.getAttribute("firstRow") !== "0", fs: Math.max(10, Math.round((r1 && r1.getAttribute("sz") ? +r1.getAttribute("sz") / 100 : 14) * ptPx)),
              headFill: "#1F3A93", headColor: "#FFFFFF", border: "#D9D2C2", color: "#1E2433", z: zi++ }); continue; }
          if (n === "AlternateContent" || n === "contentPart") skipped++;
        }
      }
      await walk(all(sd, "spTree")[0], ID);
      // speaker notes
      const nt = Object.values(sr).find(r => /notesSlide$/.test(r.type));
      if (nt) { const nd = xml(await z.text(nt.target)); const body = all(nd, "sp").find(sp => { const ph = all(sp, "ph")[0]; return ph && ph.getAttribute("type") === "body"; });
        const txt = body ? kids(kid(body, "txBody"), "p").map(p2 => all(p2, "t").map(t => t.textContent).join("")).join("\n").trim() : ""; if (txt) S.notes = txt; }
      slides.push(S);
    }
    if (!slides.length) throw new Error("No slides found in this file.");
    return { slides, skipped };
  }
  window.PptxImport = { read: readDeck, unzip };
})();
