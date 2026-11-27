// SSCAspirants_Official – Admin extras: Notice bar (Website tab), Doubts tab, and "My subject at a glance" on Status.
(function () {
  const A = () => window.AdminAPI, $ = id => document.getElementById(id);
  const day = t => new Date(t).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
  const subName = id => (A().D.SUBJECTS.find(s => s.id === id) || {}).name || id;
  async function J(u, body) { const r = await fetch(u, body ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : { cache: "no-store" });
    const d = await r.json().catch(() => ({})); if (!r.ok) { const e = new Error(d.error || "Error " + r.status); e.status = r.status; throw e; } return d; }

  // ---------- notice bar ----------
  function notice() {
    const web = document.querySelector('section[data-p="website"]'); if (!web || $("nbCard") || A().isTeacher()) return;
    const { D, E } = A(), N = D.SITE.notice || {};
    web.insertAdjacentHTML("afterbegin", `<div class="card" id="nbCard"><div class="sec-head"><h2>Notice bar</h2><p>A strip at the top of every page – exam dates, new courses, offers</p></div>
      <div class="form"><label class="f wide">Notice text<input id="nbText" maxlength="160" value="${E(N.text || "")}" placeholder="SSC CGL 2027 notification out – start your free mock today!"></label>
      <label class="f">Button link (optional)<input id="nbLink" value="${E(N.link || "")}" placeholder="courses.html or https://…"></label>
      <label class="f">Button text<input id="nbBtn" maxlength="30" value="${E(N.btn || "")}" placeholder="See more"></label>
      <label class="f">Colour<select id="nbTone">${[["blue", "Blue"], ["gold", "Gold"], ["green", "Green"], ["red", "Red (urgent)"]].map(([v, l]) => `<option value="${v}"${(N.tone || "blue") === v ? " selected" : ""}>${l}</option>`).join("")}</select></label>
      <label class="f ck2"><input type="checkbox" id="nbOn" ${N.on ? "checked" : ""}> Show the notice</label></div>
      <div class="bar" style="margin-top:12px"><button class="btn btn-pri" type="button" id="nbSave">Save notice</button></div></div>`);
    $("nbSave").onclick = async () => {
      D.SITE.notice = { on: $("nbOn").checked, text: $("nbText").value.trim(), link: $("nbLink").value.trim(), btn: $("nbBtn").value.trim(), tone: $("nbTone").value };
      if (!D.SITE.notice.text) D.SITE.notice.on = false;
      try { A().say("Saving notice…", "info", true); await A().save("SITE"); A().say(D.SITE.notice.on ? "Notice is live in about a minute." : "Notice saved (hidden).", "ok"); } catch (e) { A().say("Could not save: " + e.message, "err"); }
    };
  }

  // ---------- texts & labels ----------
  function labels() {
    const web = document.querySelector('section[data-p="website"]'); if (!web || $("lbCard") || A().isTeacher() || !window.SSC_LABEL_DEFS) return;
    const { D, E } = A(), cur = (D.SITE.labels = D.SITE.labels || {});
    const groups = {}; SSC_LABEL_DEFS.forEach(([g, k, v]) => (groups[g] = groups[g] || []).push([k, v]));
    const nb = $("nbCard");
    (nb || web.firstElementChild).insertAdjacentHTML(nb ? "afterend" : "beforebegin", `<div class="card" id="lbCard"><div class="sec-head"><h2>Texts &amp; labels</h2><p>Change the words on buttons and boxes. Leave a box empty to use the normal text.</p></div>
      ${Object.entries(groups).map(([g, list]) => `<details class="nt-det" style="margin-bottom:10px"><summary>${E(g)} <span class="muted" style="font-weight:500">(${list.length})</span></summary>
        <div class="form" style="margin-top:10px">${list.map(([k, v]) => `<label class="f">${E(v)}<input data-lb="${E(k)}" value="${E(cur[k] || "")}" placeholder="${E(v)}"></label>`).join("")}</div></details>`).join("")}
      <p class="muted" style="font-size:.86rem;margin:4px 0 10px">Words in { } like {n} or {done} are filled in by the site – keep them in your text.</p>
      <div class="bar" style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-pri" type="button" id="lbSave">Save texts</button><button class="btn btn-out" type="button" id="lbReset">Use normal texts again</button></div></div>`);
    $("lbSave").onclick = async () => { const L = {}; $("lbCard").querySelectorAll("[data-lb]").forEach(i => { if (i.value.trim()) L[i.dataset.lb] = i.value.trim(); });
      D.SITE.labels = L; if (!Object.keys(L).length) delete D.SITE.labels;
      try { A().say("Saving texts…", "info", true); await A().save("SITE"); A().say("Texts saved. Live in about a minute.", "ok"); } catch (e) { A().say("Could not save: " + e.message, "err"); } };
    $("lbReset").onclick = () => { if (!A().confirmBox("Clear all your changed texts and use the normal texts?")) return; $("lbCard").querySelectorAll("[data-lb]").forEach(i => i.value = ""); $("lbSave").click(); };
  }

  // ---------- colours & fonts ----------
  const TH = [["pri", "Main colour (buttons, links)", "#1F3A93"], ["gold", "Accent colour", "#E0A21B"], ["side", "Side menu", "#141B38"], ["bg", "Page background", "#FAF8F3"], ["ink", "Text colour", "#1E2433"],
    ["ans", "Test: Answered", "#12B76A"], ["nans", "Test: Not answered", "#F04438"], ["mrk", "Test: Marked for review", "#7A5AF8"]];
  const PRESETS = { "Navy + Emerald (now)": {}, "Royal blue": { pri: "#2563EB", gold: "#F59E0B", side: "#0F172A", bg: "#F5F8FC" }, "Teal calm": { pri: "#0F766E", gold: "#F59E0B", side: "#134E4A", bg: "#F4FAF8" },
    "Maroon": { pri: "#9F1239", gold: "#D97706", side: "#3B0A1A", bg: "#FCF7F5" }, "Purple": { pri: "#6D28D9", gold: "#F59E0B", side: "#2E1065", bg: "#F8F6FD" } };
  function theme() {
    const web = document.querySelector('section[data-p="website"]'); if (!web || $("thCard") || A().isTeacher()) return;
    const { D, E } = A(), T = D.SITE.theme || {}, fonts = window.SSC_FONTS || ["Inter", "Poppins"];
    $("lbCard").insertAdjacentHTML("afterend", `<div class="card" id="thCard"><div class="sec-head"><h2>Colours &amp; fonts</h2><p>For the whole site (light mode). Test colours also work in dark mode.</p></div>
      <p style="margin:0 0 6px;font-weight:600;font-size:.9rem">Ready colour sets</p><div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px">${Object.keys(PRESETS).map(n => `<button class="btn btn-out btn-sm" type="button" data-pre="${E(n)}">${E(n)}</button>`).join("")}</div>
      <div class="form">${TH.map(([k, l, d]) => `<label class="f">${E(l)}<span style="display:flex;gap:8px;align-items:center"><input type="color" data-th="${k}" value="${E(/^#[0-9a-f]{6}$/i.test(T[k] || "") ? T[k] : d)}" style="width:52px;height:40px;padding:0;border:1px solid var(--line);border-radius:8px"><code data-thv="${k}">${E(T[k] || d)}</code></span></label>`).join("")}
        <label class="f">Text font<select data-thf="font">${fonts.map(f => `<option${(T.font || "Inter") === f ? " selected" : ""}>${f}</option>`).join("")}</select></label>
        <label class="f">Heading font<select data-thf="head">${fonts.map(f => `<option${(T.head || "Poppins") === f ? " selected" : ""}>${f}</option>`).join("")}</select></label></div>
      <p class="muted" style="font-size:.86rem;margin:10px 0">Tip: keep text dark on a light background so it is easy on students' eyes.</p>
      <div class="bar" style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-pri" type="button" id="thSave">Save colours &amp; fonts</button><button class="btn btn-out" type="button" id="thReset">Back to normal colours</button></div></div>`);
    const c = $("thCard");
    c.addEventListener("input", e => { const k = e.target.dataset.th; if (k) c.querySelector(`[data-thv="${k}"]`).textContent = e.target.value; });
    c.addEventListener("click", e => { const p = e.target.closest("[data-pre]"); if (!p) return; const set = PRESETS[p.dataset.pre];
      TH.forEach(([k, , d]) => { const i = c.querySelector(`[data-th="${k}"]`); i.value = set[k] || d; c.querySelector(`[data-thv="${k}"]`).textContent = i.value; }); });
    $("thSave").onclick = async () => { const N = {}; TH.forEach(([k, , d]) => { const v = c.querySelector(`[data-th="${k}"]`).value; if (v.toLowerCase() !== d.toLowerCase()) N[k] = v; });
      const f = c.querySelector('[data-thf="font"]').value, h = c.querySelector('[data-thf="head"]').value; if (f !== "Inter") N.font = f; if (h !== "Poppins") N.head = h;
      D.SITE.theme = N; if (!Object.keys(N).length) delete D.SITE.theme;
      try { A().say("Saving colours…", "info", true); await A().save("SITE"); A().say("Colours and fonts saved. Live in about a minute.", "ok"); } catch (e) { A().say("Could not save: " + e.message, "err"); } };
    $("thReset").onclick = () => { if (!A().confirmBox("Go back to the normal colours and fonts?")) return; c.querySelector('[data-pre]').click(); c.querySelector('[data-thf="font"]').value = "Inter"; c.querySelector('[data-thf="head"]').value = "Poppins"; $("thSave").click(); };
  }

  // ---------- doubts ----------
  let dbStatus = "open";
  async function doubts() {
    const { E } = A(), box = $("dbList"); if (!box) return;
    if (A().isTeacher()) $("dbHint").textContent = "Doubts from your subjects: " + A().mySubs().map(subName).join(", ");
    try {
      const d = await J("/api/admin/doubts?status=" + dbStatus);
      const L = d.doubts || [];
      box.innerHTML = L.length ? L.map(x => `<div class="item" style="flex-direction:column;align-items:stretch" data-id="${x.id}">
        <span class="t"><b>${E(x.name || "Student")} · ${E(subName(x.subject || ""))}</b><span>${E(x.where || x.key)} · ${day(x.created)}${x.key ? ` · <a href="${x.key.startsWith("note:") ? "note.html?id=" + encodeURIComponent(x.key.slice(5)) : "course.html?id=" + encodeURIComponent(x.key.split(":")[1]) + "#lesson=" + encodeURIComponent(x.key.split(":")[2] || "")}" target="_blank" rel="noopener">open</a>` : ""}</span></span>
        <p style="margin:8px 0;font-size:1.02rem">${E(x.text)}</p>
        ${x.answer ? `<div style="border-left:4px solid var(--ans);background:var(--ok-soft);border-radius:8px;padding:8px 12px"><b>${E(x.by || "Teacher")}:</b> ${E(x.answer)}</div>` : ""}
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px"><textarea data-ans rows="2" style="flex:1 1 300px;border:1px solid var(--line);border-radius:10px;background:var(--surface);color:var(--ink);font:inherit;padding:8px 10px" placeholder="${x.answer ? "Change the answer…" : "Write the answer…"}"></textarea><button class="btn btn-pri btn-sm" type="button" data-send>${x.answer ? "Update" : "Send answer"}</button></div></div>`).join("")
        : `<div class="mt-empty">${dbStatus === "open" ? "No doubts waiting. 🎉" : "No doubts yet."}</div>`;
    } catch (e) { box.innerHTML = `<p class="muted">Doubts work on the live website. (${E(e.message)})</p>`; }
  }

  // ---------- my subject at a glance (Status tab) ----------
  async function glance() {
    const st = document.querySelector('section[data-p="connect"]'); if (!st) return;
    let g = $("glance"); if (!g) { st.insertAdjacentHTML("afterend", `<section class="card" data-p="connect" id="glance" style="margin-top:18px"${st.hidden ? " hidden" : ""}></section>`); g = $("glance"); }
    const { D, E } = A(), T = A().isTeacher(), subs = T ? A().mySubs() : D.SUBJECTS.map(s => s.id);
    let S = {}; try { S = (await J("/api/admin/stats")).subjects || {}; } catch (e) {}
    const lessonsOf = sid => D.COURSES.reduce((a, c) => a + (c.chapters || []).filter(ch => ch.subject === sid).reduce((b, ch) => b + (ch.lessons || []).length, 0), 0);
    const rows = subs.map(sid => { const s = D.SUBJECTS.find(x => x.id === sid) || { chapters: [] }, ready = s.chapters.filter(c => D.NOTES[c.id]).length, x = S[sid] || {};
      return `<tr><td><b>${E(subName(sid))}</b></td><td>${ready} / ${s.chapters.length}</td><td>${Object.values(D.TESTS).filter(t => t.subject === sid).length}</td><td>${lessonsOf(sid)}</td>
        <td>${x.readers != null ? x.readers : "–"}</td><td>${x.avg != null ? x.avg + "%" : "–"}</td><td>${x.open != null ? (x.open ? `<b style="color:var(--bad)">${x.open}</b>` : "0") : "–"}</td></tr>`; }).join("");
    g.innerHTML = `<h3 style="margin:0 0 10px;font:700 1.1rem Poppins,sans-serif">${T ? "My subject at a glance" : "Subjects at a glance"}</h3>
      <div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:.92rem" class="glt"><thead><tr><th>Subject</th><th>Notes ready</th><th>Tests</th><th>Course lessons</th><th>Students reading (30 days)</th><th>Avg test score</th><th>Doubts waiting</th></tr></thead><tbody>${rows}</tbody></table></div>
      <style>.glt th,.glt td{text-align:left;padding:8px 10px;border-bottom:1px solid var(--line);white-space:nowrap}.glt th{font-size:.75rem;text-transform:uppercase;letter-spacing:.04em;color:var(--muted)}</style>`;
  }

  // ---------- name watermark ----------
  function wmark() {
    const web = document.querySelector('section[data-p="website"]'); if (!web || $("wmCard") || A().isTeacher() || !$("thCard")) return;
    const { D, E } = A(), W = D.SITE.wm || {};
    $("thCard").insertAdjacentHTML("afterend", `<div class="card" id="wmCard"><div class="sec-head"><h2>Name watermark</h2><p>Each student's own name shows faintly across the notes, so if someone shares a screenshot you know who it was.</p></div>
      <div class="form"><label class="f wide">Watermark text<input id="wmText" maxlength="80" value="${E(W.text || "")}" placeholder="{name} · {email}"></label>
      <label class="f">How dark<select id="wmStr">${[["light", "Light"], ["medium", "Medium"], ["strong", "Strong"]].map(([v, l]) => `<option value="${v}"${(W.strength || "medium") === v ? " selected" : ""}>${l}</option>`).join("")}</select></label>
      <label class="f ck2"><input type="checkbox" id="wmOn" ${W.on === false ? "" : "checked"}> Show the watermark</label>
      <label class="f ck2"><input type="checkbox" id="wmNotes" ${W.notes === false ? "" : "checked"}> On notes</label>
      <label class="f ck2"><input type="checkbox" id="wmCrs" ${W.courses === false ? "" : "checked"}> On course lessons</label></div>
      <p class="muted" style="font-size:.86rem;margin:10px 0">{name} = student's name, {email} = their email, {date} = today's date. Leave the box empty to use "{name} · {email}".</p>
      <div class="bar"><button class="btn btn-pri" type="button" id="wmSave">Save watermark</button></div></div>`);
    $("wmSave").onclick = async () => {
      D.SITE.wm = { on: $("wmOn").checked, text: $("wmText").value.trim(), strength: $("wmStr").value, notes: $("wmNotes").checked, courses: $("wmCrs").checked };
      try { A().say("Saving watermark…", "info", true); await A().save("SITE"); A().say(D.SITE.wm.on ? "Watermark is live in about a minute." : "Watermark turned off.", "ok"); } catch (e) { A().say("Could not save: " + e.message, "err"); }
    };
  }

  function init() {
    notice(); labels(); theme(); wmark(); glance(); doubts();
    if (init.done) return; init.done = true;
    $("dbF").addEventListener("click", e => { const b = e.target.closest("[data-s]"); if (!b) return; dbStatus = b.dataset.s;
      $("dbF").querySelectorAll("button").forEach(x => x.className = "btn btn-sm " + (x === b ? "btn-pri" : "btn-out")); doubts(); });
    $("dbList").addEventListener("click", async e => { const b = e.target.closest("[data-send]"); if (!b) return; const it = b.closest("[data-id]"), ans = it.querySelector("[data-ans]").value.trim();
      if (!ans) return A().say("Write the answer first.", "err");
      try { await J("/api/admin/doubts", { id: +it.dataset.id, answer: ans }); A().say("Answer sent. The student sees it on the page.", "ok"); doubts(); glance(); } catch (er) { A().say("Could not send: " + er.message, "err"); } });
  }
  window.AdminExtras = { init };
})();
