// "✎ Edit page" – lets an admin change any text, picture, link or section on a page, right on the page.
// Changes are saved to data/site.js (through the site's server, admins only) and every visitor sees them.
(function () {
  const ED = SSC.ED, esc = SSC.esc, clean = SSC.clean, content = document.getElementById("content");
  let on = false, dirty = false, P = null, shellDefaults = {};
  const pg = ED.page;

  // ---------- GitHub (admins only, through /api/gh) ----------
  const gh = async (path, opt = {}) => { const r = await fetch("/api/gh" + path, { cache: "no-store", ...opt, headers: { Accept: "application/vnd.github+json", ...(opt.headers || {}) } });
    if (!r.ok) { const t = await r.text(); let m = t; try { m = JSON.parse(t).message || t; } catch (e) {} throw new Error(r.status + " " + m); } return r; };
  const readRaw = async p => { try { return await (await gh(`/contents/${p}?ref=main`, { headers: { Accept: "application/vnd.github.raw+json" } })).text(); } catch (e) { if (/^404/.test(e.message)) return null; throw e; } };
  const b64 = bytes => { let s = ""; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); return btoa(s); };
  async function write(p, base64, msg) {
    let sha = null; try { sha = (await (await gh(`/contents/${p}?ref=main&meta=1`)).json()).sha; } catch (e) {}
    const body = { message: msg, content: base64, branch: "main" }; if (sha) body.sha = sha;
    await gh(`/contents/${p}`, { method: "PUT", body: JSON.stringify(body), headers: { "Content-Type": "application/json" } });
  }

  const css = `
  body.editing-page{padding-top:58px}
  .ep-bar{position:fixed;top:0;left:0;right:0;z-index:2000;background:#C9962E;color:#141B38;display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:8px 14px;font:600 .9rem Inter,sans-serif;box-shadow:0 4px 14px rgba(0,0,0,.2)}
  .ep-bar button{min-height:38px;padding:0 14px;border-radius:9px;border:1px solid #141B38;background:#fff;color:#141B38;font-weight:700;cursor:pointer}
  .ep-bar button.pri{background:#141B38;color:#fff}
  .ep-bar input{min-height:34px;border-radius:8px;border:1px solid #141B38;padding:0 8px;min-width:220px;font:inherit}
  .ep-bar .msg{margin-left:auto;font-weight:600}
  body.editing-page [contenteditable="true"]{outline:1.5px dashed #C9962E;outline-offset:3px;border-radius:4px;cursor:text}
  body.editing-page [contenteditable="true"]:focus{outline:2px solid #1F3A93;background:rgba(201,150,46,.08)}
  body.editing-page img.ep-img{outline:3px dashed #1F3A93;cursor:pointer}
  .ep-blk{position:relative}
  .ep-tools{position:absolute;top:-14px;right:8px;z-index:50;display:flex;gap:4px;background:#141B38;border-radius:9px;padding:4px;box-shadow:0 4px 12px rgba(0,0,0,.25)}
  .ep-tools button{min-width:34px;height:30px;border-radius:7px;border:0;background:#ffffff1f;color:#fff;font:700 .8rem Inter,sans-serif;cursor:pointer;padding:0 8px}
  .ep-tools button:hover{background:#C9962E;color:#141B38}
  .ep-hidden{opacity:.35;outline:3px dashed #B42318;outline-offset:6px}
  .ep-hidden::before{content:"HIDDEN – students don't see this";position:absolute;left:8px;top:-12px;background:#B42318;color:#fff;font:700 .72rem Inter;padding:3px 8px;border-radius:6px;z-index:51}
  .ep-dlg{border:1px solid #E9E2D2;border-radius:16px;padding:20px;max-width:min(460px,calc(100vw - 32px));width:100%;box-sizing:border-box}
  .ep-dlg label{display:flex;flex-direction:column;gap:6px;font-weight:600;margin-bottom:12px}
  .ep-dlg input,.ep-dlg select{min-height:42px;border:1px solid #E9E2D2;border-radius:10px;padding:0 10px;font:inherit}`;

  function start() {
    if (on) return; on = true;
    const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
    const P0 = ((window.SITE || {}).pages || {})[pg] || {};
    P = { t: { ...(P0.t || {}) }, img: { ...(P0.img || {}) }, href: { ...(P0.href || {}) }, hide: [...(P0.hide || [])], add: JSON.parse(JSON.stringify(P0.add || [])) };
    document.body.classList.add("editing-page");
    const bar = document.createElement("div"); bar.className = "ep-bar";
    bar.innerHTML = `<span>✎ Editing this page</span><button class="pri" type="button" data-a="save">Save</button><button type="button" data-a="cancel">Cancel</button><button type="button" data-a="reset">Undo all edits on this page</button>
      <span id="epLink" hidden>Link: <input id="epHref" placeholder="https://… or page.html"> <button type="button" data-a="link">Apply</button></span><span class="msg" id="epMsg">Click any text to type. Click a picture to change it.</span>`;
    document.body.appendChild(bar);
    bar.addEventListener("click", e => { const b = e.target.closest("[data-a]"); if (!b) return; ({ save, cancel, reset, link: applyLink })[b.dataset.a](); });
    // texts (page + menu brand + footer)
    ED.texts.forEach(el => editable(el));
    document.querySelectorAll("[data-shell]").forEach(el => { shellDefaults[el.dataset.shell] = el.innerHTML; editable(el); });
    content.querySelectorAll("[data-ctitle],[data-chtml]").forEach(editable);
    // pictures
    ED.imgs.forEach(img => pickable(img)); content.querySelectorAll("[data-cimg]").forEach(pickable);
    // links do nothing while editing; show the link box instead
    document.addEventListener("click", e => { if (!on) return; const a = e.target.closest("a"); if (a && !e.target.closest(".ep-bar,.ep-tools")) e.preventDefault(); }, true);
    document.addEventListener("focusin", e => { if (e.target.closest && e.target.closest(".ep-bar")) return; const a = e.target.closest && e.target.closest("a[data-ka],a[data-cbtn]"); curLink = a || null; document.getElementById("epLink").hidden = !a; if (a) document.getElementById("epHref").value = a.getAttribute("href") || ""; });
    // sections
    blocks().forEach(tools);
    window.addEventListener("beforeunload", e => { if (dirty) { e.preventDefault(); e.returnValue = ""; } });
  }
  const blocks = () => [...content.querySelectorAll(":scope > [data-b]")];
  function editable(el) { el.contentEditable = "true"; el.addEventListener("input", () => dirty = true); el.addEventListener("keydown", e => { if (e.key === "Enter" && !/^(P|DIV|LI)$/.test(el.tagName) && !e.shiftKey && !el.hasAttribute("data-chtml")) e.preventDefault(); }); }
  let curLink = null;
  function applyLink() { if (!curLink) return; const v = document.getElementById("epHref").value.trim();
    if (v && !/^(https?:\/\/|[\w./#?=&-]+$)/i.test(v)) return say("That link doesn't look right."); curLink.setAttribute("href", v || "#"); dirty = true; say("Link changed – remember to Save."); }
  function pickable(img) {
    img.classList.add("ep-img"); img.title = "Click to change this picture";
    img.addEventListener("click", e => { e.preventDefault(); e.stopPropagation(); choosePic(async url => { img.src = url.data; img.dataset.newsrc = url.path; dirty = true; }); });
  }
  function choosePic(done) {
    const f = document.createElement("input"); f.type = "file"; f.accept = "image/*";
    f.onchange = async () => { const file = f.files[0]; if (!file) return;
      try { say("Uploading picture…");
        const img = await new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => no(new Error("That file isn't a picture.")); i.src = URL.createObjectURL(file); });
        const r = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight)), c = document.createElement("canvas");
        c.width = Math.round(img.naturalWidth * r); c.height = Math.round(img.naturalHeight * r); c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        const png = /png|gif|webp|svg/.test(file.type), data = c.toDataURL(png ? "image/png" : "image/jpeg", 0.88);
        const path = `assets/uploads/site-${Date.now().toString(36)}.${png ? "png" : "jpg"}`;
        await write(path, data.split(",")[1], "Admin: website picture");
        done({ data, path }); say("Picture changed – remember to Save.");
      } catch (e) { say("Could not upload: " + e.message); } };
    f.click();
  }
  function tools(b) {
    b.classList.add("ep-blk"); if (b.dataset.hiddenBlock) { b.hidden = false; b.classList.add("ep-hidden"); }
    const t = document.createElement("div"); t.className = "ep-tools"; t.contentEditable = "false";
    const custom = b.dataset.custom;
    t.innerHTML = `<button type="button" data-t="up" title="Move up">↑</button><button type="button" data-t="down" title="Move down">↓</button>
      <button type="button" data-t="hide">${b.classList.contains("ep-hidden") ? "Show" : "Hide"}</button>
      ${custom ? `<button type="button" data-t="edit">Settings</button><button type="button" data-t="del">Delete</button>` : ""}<button type="button" data-t="add">＋ Section below</button>`;
    t.addEventListener("click", e => { const x = e.target.closest("[data-t]"); if (!x) return; e.preventDefault(); e.stopPropagation(); act(b, x.dataset.t, x); });
    b.prepend(t);
  }
  function act(b, a, btn) {
    dirty = true;
    if (a === "up" && b.previousElementSibling && b.previousElementSibling.dataset.b) b.previousElementSibling.before(b);
    if (a === "down" && b.nextElementSibling) b.nextElementSibling.after(b);
    if (a === "hide") { const h = b.classList.toggle("ep-hidden"); btn.textContent = h ? "Show" : "Hide"; }
    if (a === "del") { if (!confirm("Delete this section?")) return; P.add = P.add.filter(c => c.id !== b.dataset.custom); b.remove(); }
    if (a === "add") settings(null, b);
    if (a === "edit") settings(P.add.find(c => c.id === b.dataset.custom), b);
    say("Remember to Save.");
  }
  // new section or its settings
  function settings(c, near) {
    const d = document.createElement("dialog"); d.className = "ep-dlg";
    const isNew = !c; c = c || { id: Math.random().toString(36).slice(2, 9), type: "text", title: "New section", html: "Type your text here.", btn: "", link: "" };
    d.innerHTML = `<h3 style="margin-top:0">${isNew ? "Add a section" : "Section settings"}</h3>
      <label>Type<select id="epType"><option value="text">Text</option><option value="picture">Picture</option><option value="both">Picture + text</option></select></label>
      <label>Heading (leave empty for none)<input id="epTitle" value="${c.title != null ? esc(c.title.replace(/<[^>]+>/g, "")) : ""}"></label>
      <label>Button text (optional)<input id="epBtn" value="${esc(c.btn || "")}" placeholder="e.g. Start test"></label>
      <label>Button link<input id="epBtnLink" value="${esc(c.link || "")}" placeholder="https://… or mock-tests.html"></label>
      <p style="margin:0 0 12px;color:#666;font-size:.88rem">After adding, type the text right on the page. For pictures, click the picture box to choose one.</p>
      <div style="display:flex;gap:10px;justify-content:flex-end"><button class="btn btn-out" type="button" data-x="0">Cancel</button><button class="btn btn-pri" type="button" data-x="1">${isNew ? "Add" : "Done"}</button></div>`;
    document.body.appendChild(d); d.querySelector("#epType").value = c.type; d.showModal();
    d.addEventListener("click", e => { const x = e.target.closest("[data-x]"); if (!x) return;
      if (x.dataset.x === "1") {
        const old = !isNew && content.querySelector(`[data-custom="${c.id}"]`);
        if (old) { const h = old.querySelector("[data-chtml]"); if (h) c.html = h.innerHTML; const im = old.querySelector("[data-cimg]"); if (im) c.img = im.dataset.newsrc || im.getAttribute("src"); }
        c.type = d.querySelector("#epType").value; const tt = d.querySelector("#epTitle").value.trim(); c.title = tt ? esc(tt) : null;
        c.btn = d.querySelector("#epBtn").value.trim(); c.link = d.querySelector("#epBtnLink").value.trim();
        if (c.type !== "text" && !c.img) c.img = "assets/logo.png";
        if (isNew) P.add.push(c);
        const el = ED.customBlock(c);
        if (old) old.replaceWith(el); else near.after(el);
        tools(el); el.querySelectorAll("[data-ctitle],[data-chtml]").forEach(editable); el.querySelectorAll("[data-cimg]").forEach(pickable);
        dirty = true; say("Section ready – type on the page, then Save.");
      }
      d.close(); d.remove(); });
  }

  // ---------- save ----------
  async function save() {
    say("Saving…");
    try {
      const t = {}, img = {}, href = {};
      const own = el => { const c = el.cloneNode(true); c.querySelectorAll(".ep-tools").forEach(x => x.remove()); return clean(c.innerHTML); };
      ED.texts.forEach(el => { const v = own(el); if (v !== clean(ED.pristine[el.dataset.k])) t[el.dataset.k] = v; });
      ED.imgs.forEach(el => { const v = el.dataset.newsrc || P.img[el.dataset.k]; if (v && v !== ED.pristine[el.dataset.k]) img[el.dataset.k] = v; });
      ED.links.forEach(el => { const v = el.getAttribute("href"); if (v !== ED.pristine[el.dataset.ka]) href[el.dataset.ka] = v; });
      const order = blocks().map(b => b.dataset.b), hide = blocks().filter(b => b.classList.contains("ep-hidden")).map(b => b.dataset.b);
      const add = P.add.filter(c => content.querySelector(`[data-custom="${c.id}"]`)).map(c => {
        const el = content.querySelector(`[data-custom="${c.id}"]`), ti = el.querySelector("[data-ctitle]"), h = el.querySelector("[data-chtml]"), im = el.querySelector("[data-cimg]"), bt = el.querySelector("[data-cbtn]");
        return { ...c, title: ti ? clean(ti.innerHTML) : null, html: h ? clean(h.innerHTML) : c.html, img: im ? (im.dataset.newsrc || im.getAttribute("src")) : c.img, link: bt ? bt.getAttribute("href") : c.link };
      });
      const NP = { t, img, href, hide, order, add };
      const code = await readRaw("data/site.js"); const w = {}; if (code) new Function("window", code)(w);
      const S = w.SITE || {}; S.pages = S.pages || {}; S.pages[pg] = NP;
      const sh = S.shell = S.shell || {};
      document.querySelectorAll("[data-shell]").forEach(el => { const k = el.dataset.shell, v = clean(el.innerHTML); if (v !== clean(shellDefaults[k])) sh[k] = k === "brand" ? el.textContent.trim() : v; });
      const text = `// Website texts, pictures, menu and sections changed from the admin page (✎ Edit page and Admin → Website).\n// Saved ${new Date().toISOString().slice(0, 10)}.\nwindow.SITE = ${JSON.stringify(S, null, 1)};\n`;
      await write("data/site.js", b64(new TextEncoder().encode(text)), "Admin: edit page " + pg);
      dirty = false; say("Saved ✓ Live for everyone in about a minute.");
    } catch (e) { say("Could not save: " + e.message); }
  }
  function cancel() { if (dirty && !confirm("Leave without saving your changes?")) return; dirty = false; location.href = location.pathname + location.search.replace(/[?&]edit=1/, ""); }
  async function reset() {
    if (!confirm("Remove ALL edits on this page and go back to the original? (Menu and footer edits stay.)")) return;
    say("Resetting…");
    try { const code = await readRaw("data/site.js"); const w = {}; if (code) new Function("window", code)(w); const S = w.SITE || {}; if (S.pages) delete S.pages[pg];
      await write("data/site.js", b64(new TextEncoder().encode(`// Website edits from the admin page.\nwindow.SITE = ${JSON.stringify(S, null, 1)};\n`)), "Admin: reset page " + pg);
      dirty = false; say("Done. Reloading in a minute shows the original page."); } catch (e) { say("Could not reset: " + e.message); }
  }
  const say = m => { const el = document.getElementById("epMsg"); if (el) el.textContent = m; };
  window.SSCEditor = { start };
})();
