// SSCAspirants_Official – Courses (students): course cards, joining a course, the course page with its lessons.
// Data: data/courses.js (Admin → Courses). Joined courses: /api/me/courses. Lesson ticks: /api/me/progress ("L:<course>:<lesson>").
// Note: until payments are live, paid lessons are only hidden in the page; the server will check payment later.
(function () {
  const E = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const SUBS = () => window.SUBJECTS || [], EXAMS = () => window.EXAMS || [];
  const subName = id => (SUBS().find(s => s.id === id) || {}).name || id;
  const exName = id => (EXAMS().find(x => x.id === id) || {}).name || id;
  const KIND = { video: ["▶", "Video"], live: ["🔴", "Live class"], notes: ["📄", "Notes"], pdf: ["📕", "PDF"], test: ["📝", "Test"] };
  const lessons = c => (c.chapters || []).flatMap(ch => (ch.lessons || []).map(l => ({ ...l, ch })));
  const priceHtml = c => !+c.price ? `<b class="free">${L("crs.free")}</b>` : `<b>₹${+c.price}</b>${+c.mrp > +c.price ? `<s>₹${+c.mrp}</s><span class="off">${Math.round((1 - c.price / c.mrp) * 100)}% off</span>` : ""}`;
  const ytId = u => { u = String(u || "").trim(); const m = /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/|v\/))([\w-]{11})/.exec(u); return m ? m[1] : /^[\w-]{11}$/.test(u) ? u : ""; };
  const L = k => E(window.SSCL ? SSCL(k) : k);
  const when = t => new Date(t).toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

  function card(c, joined) {
    const n = lessons(c).length;
    return `<a class="ccard" href="course.html?id=${encodeURIComponent(c.id)}"><div class="ccov" style="--c:${E(c.color || "#1F3A93")};background:linear-gradient(135deg,${E(c.color || "#1F3A93")},#141B38)"><span class="tag">${c.type === "full" ? L("crs.full") : L("crs.subject")}</span><b>${E(c.title)}</b></div>
      <div class="cbody"><div class="cmeta"><span>${(c.exams || []).map(exName).map(E).join(", ") || "All SSC exams"}</span><span>${n} lesson${n === 1 ? "" : "s"}</span></div>
      <div class="cmeta"><span>${c.type === "full" ? "All subjects" : (c.subjects || []).map(subName).map(E).join(", ")}</span>${c.validity ? `<span>${E(c.validity)}</span>` : ""}</div>
      <div class="price">${joined ? `<span class="pill ok">${L("crs.joined")}</span>` : priceHtml(c)}</div></div></a>`;
  }
  async function getJSON(u) { try { const r = await fetch(u, { cache: "no-store" }); return r.ok ? await r.json() : null; } catch (e) { return null; } }
  async function enrolled() { const d = await getJSON("/api/me/courses"); return (d && d.courses) || []; }

  async function page(host) {
    const id = new URLSearchParams(location.search).get("id"), c = (window.COURSES || []).find(x => x.id === id && !x.hide);
    if (!c) { host.innerHTML = `<div class="card"><h2>Course not found</h2><p><a href="courses.html">See all courses →</a></p></div>`; return; }
    document.title = c.title + " – SSCAspirants_Official";
    const me = await getJSON("/api/auth/me"), staff = !!(me && me.admin);
    let mine = await enrolled(), prog = {};
    const pd = await getJSON("/api/me/progress"); ((pd && pd.progress) || []).forEach(p => prog[p.chapter] = p);
    const key = l => `L:${c.id}:${l.id}`, all = lessons(c);
    const joined = () => staff || mine.includes(c.id);
    const open = l => joined() || l.free;
    const doneN = () => all.filter(l => prog[key(l)] && prog[key(l)].done).length;
    let cur = (/lesson=([\w-]+)/.exec(location.hash) || [])[1]; cur = all.find(l => l.id === cur) || all.find(open) || all[0];
    let tab = "les";

    host.innerHTML = `<div class="chero" style="background:linear-gradient(135deg,${E(c.color || "#1F3A93")},#141B38)"><div class="t"><span class="tag">${c.type === "full" ? L("crs.full") : L("crs.subject")}</span><h2>${E(c.title)}</h2><p>${E(c.desc || "")}</p>
      <p style="margin-top:10px;font-size:.92rem;opacity:.9">${(c.exams || []).map(exName).map(E).join(" · ") || "All SSC exams"} · ${all.length} lessons${c.validity ? " · " + E(c.validity) : ""}</p></div>
      <div class="buy" id="buy"></div></div>
      <div class="cl" style="margin-top:20px"><div><div class="player" id="player"></div><div class="lhead"><h3 id="lt"></h3><span id="lact"></span></div><p class="muted" id="lsub" style="margin:6px 0 0"></p><div id="ldoubt" style="margin-top:16px"></div></div>
      <aside><div class="ltabs" id="ltabs"><button type="button" data-t="les" aria-pressed="true">${L("crs.tabLessons")}</button><button type="button" data-t="live" aria-pressed="false">${L("crs.tabLive")}</button><button type="button" data-t="about" aria-pressed="false">${L("crs.tabAbout")}</button></div><div id="lside"></div></aside></div>`;
    const $ = s => host.querySelector(s);

    function buy() {
      const pc = all.length ? Math.round(doneN() / all.length * 100) : 0;
      $("#buy").innerHTML = joined() ? `<b style="font:700 1.05rem Poppins,sans-serif">${staff && !mine.includes(c.id) ? "Team view – all lessons open" : L("crs.youJoined")}</b><div class="cprog"><i style="width:${pc}%"></i></div><span class="muted">${doneN()} of ${all.length} lessons done (${pc}%)</span>`
        : `<div class="price">${priceHtml(c)}</div><button class="btn btn-pri" type="button" id="join">${+c.price ? L("crs.enroll") : L("crs.joinFree")}</button><span class="muted" style="font-size:.88rem">${all.some(l => l.free) ? L("crs.demo") : ""}</span><span class="muted" id="joinMsg" style="font-size:.88rem"></span>`;
      const j = $("#join"); if (j) j.onclick = async () => {
        if (+c.price) { $("#joinMsg").textContent = SSCL("crs.payMsg"); return; }
        try { const r = await fetch("/api/me/courses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ course: c.id }) }); if (!r.ok) throw 0; mine = (await r.json()).courses || [...mine, c.id]; draw(); }
        catch (e) { $("#joinMsg").textContent = SSCL("crs.login"); } };
    }
    function player() {
      const l = cur, P = $("#player"); if (!l) { P.innerHTML = `<div class="msg">No lessons yet.</div>`; return; }
      $("#lt").textContent = l.title; $("#lsub").textContent = `${l.ch.title}${c.type === "full" && l.ch.subject ? " · " + subName(l.ch.subject) : ""}${l.mins ? " · " + l.mins + " min" : ""}`;
      const done = prog[key(l)] && prog[key(l)].done, i = all.indexOf(l), nx = all[i + 1];
      $("#lact").innerHTML = open(l) ? `<button class="btn ${done ? "btn-out" : "btn-pri"}" type="button" id="markDone">${done ? L("crs.done") : L("crs.markDone")}</button>${nx ? `<button class="btn btn-out" type="button" id="nextL">${L("crs.next")}</button>` : ""}` : "";
      if (!open(l)) { P.innerHTML = `<div class="msg"><span style="font-size:2.4rem">🔒</span><b>${L("crs.locked")}</b><span>${+c.price ? "Enroll to unlock every lesson." : "It's free – just press Join."}</span></div>`; return; }
      const v = ytId(l.vid);
      if (l.kind === "video") P.innerHTML = v ? `<iframe src="https://www.youtube-nocookie.com/embed/${v}?rel=0&modestbranding=1&playsinline=1" title="${E(l.title)}" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen></iframe>` : `<div class="msg"><span style="font-size:2rem">🎬</span><b>${L("crs.videoSoon")}</b></div>`;
      if (l.kind === "live") { const t = +l.when || 0, now = Date.now(), soon = t && now > t - 15 * 60e3, over = t && now > t + 3 * 3600e3;
        P.innerHTML = v && over ? `<iframe src="https://www.youtube-nocookie.com/embed/${v}?rel=0&modestbranding=1&playsinline=1" title="${E(l.title)}" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen></iframe>`
          : `<div class="msg"><span style="font-size:2rem">🔴</span><b>${t ? (over ? "This live class is over" : "Live class – " + when(t)) : "Live class time will be announced"}</b>${l.link && soon && !over ? `<a class="btn btn-pri" href="${E(/^https:\/\//.test(l.link) ? l.link : "#")}" target="_blank" rel="noopener">Join live class</a>` : t && !over ? `<span>The Join button opens 15 minutes before the class.</span>` : ""}</div>`; }
      if (l.kind === "notes") { const n = (window.NOTES || {})[l.note]; P.innerHTML = `<div class="msg"><span style="font-size:2rem">📄</span><b>${E(n ? n.title : "Notes coming soon")}</b>${n ? `<a class="btn btn-pri" href="note.html?id=${encodeURIComponent(l.note)}">${L("crs.readNotes")}</a>` : ""}</div>`; }
      if (l.kind === "pdf") { const u = /^(https:\/\/|assets\/)/i.test(l.pdf || "") ? l.pdf : ""; P.innerHTML = u ? `<iframe src="${E(u)}#toolbar=0" title="${E(l.title)}" style="background:#fff"></iframe>` : `<div class="msg"><span style="font-size:2rem">📕</span><b>PDF coming soon</b></div>`;
        if (u) $("#lact").insertAdjacentHTML("afterbegin", `<a class="btn btn-out" href="${E(u)}" target="_blank" rel="noopener">${L("crs.openPdf")}</a>`); }
      if (l.kind === "test") { const t = (window.TESTS || {})[l.test]; P.innerHTML = `<div class="msg"><span style="font-size:2rem">📝</span><b>${E(t ? t.title : "Test coming soon")}</b>${t ? `<span>${(t.questions || []).length} questions · ${t.minutes} min</span><a class="btn btn-pri" href="test.html?id=${encodeURIComponent(l.test)}">${L("crs.startTest")}</a>` : ""}</div>`; }
      const md = $("#markDone"); if (md) md.onclick = async () => { const on = !done; prog[key(l)] = { chapter: key(l), done: on ? 1 : 0, seen: Date.now() };
        try { await fetch("/api/me/progress", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chapter: key(l), done: on }) }); } catch (e) {} draw(); };
      const nb = $("#nextL"); if (nb) nb.onclick = () => go(nx);
      if (window.DoubtBox && open(l)) DoubtBox.mount($("#ldoubt"), { key: `lesson:${c.id}:${l.id}`, subject: l.ch.subject || (c.subjects || [])[0] || "", where: `${c.title} › ${l.title}` }); else $("#ldoubt").innerHTML = "";
    }
    function side() {
      const S = $("#lside");
      if (tab === "les") S.innerHTML = (c.chapters || []).map((ch, ci) => `<details class="chap"${ch.lessons.some(l => l === cur || (cur && l.id === cur.id)) || ci === 0 ? " open" : ""}><summary>${ci + 1}. ${E(ch.title)}<small>${c.type === "full" && ch.subject ? E(subName(ch.subject)) + " · " : ""}${(ch.lessons || []).length}</small></summary>
        ${(ch.lessons || []).map(l => { const d = prog[key(l)] && prog[key(l)].done, k = KIND[l.kind] || KIND.video;
          return `<button type="button" class="les${d ? " done" : ""}" data-l="${E(l.id)}" aria-current="${cur && cur.id === l.id}"><span class="ic">${d ? "✓" : k[0]}</span><span class="tt">${E(l.title)}<small>${k[1]}${l.kind === "live" && l.when ? " · " + when(l.when) : ""}${l.mins ? " · " + l.mins + " min" : ""}</small></span><span class="st">${open({ ...l }) ? (l.free && !joined() ? `<span class="pill ok">${L("crs.free")}</span>` : "") : "🔒"}</span></button>`; }).join("")}</details>`).join("") || `<p class="muted">Lessons are coming soon.</p>`;
      if (tab === "live") { const L = all.filter(l => l.kind === "live").sort((a, b) => (+a.when || 9e15) - (+b.when || 9e15));
        S.innerHTML = `<div class="card" style="padding:6px 16px">${L.length ? L.map(l => `<div class="live-row"><time>${l.when ? E(when(l.when)) : "Time to be announced"}</time><span style="flex:1">${E(l.title)}</span><button class="btn btn-out" style="min-height:36px;padding:4px 12px" type="button" data-l="${E(l.id)}">Open</button></div>`).join("") : `<p class="muted">No live classes are planned yet.</p>`}</div>`; }
      if (tab === "about") S.innerHTML = `<div class="card"><p style="margin-top:0">${E(c.desc || "")}</p><p><b>Exams:</b> ${(c.exams || []).map(exName).map(E).join(", ") || "All SSC exams"}</p><p><b>Subjects:</b> ${(c.subjects || []).map(subName).map(E).join(", ")}</p>
        <p><b>Inside:</b> ${Object.entries(KIND).map(([k, v]) => { const n = all.filter(l => l.kind === k).length; return n ? `${n} ${v[1].toLowerCase()}${n > 1 ? "s" : ""}` : ""; }).filter(Boolean).join(" · ")}</p>${c.validity ? `<p style="margin-bottom:0"><b>Valid:</b> ${E(c.validity)}</p>` : ""}</div>`;
    }
    const go = l => { cur = l; history.replaceState(null, "", "#lesson=" + l.id); draw(); $("#player").scrollIntoView({ behavior: "smooth", block: "nearest" }); };
    function draw() { buy(); player(); side(); }
    host.addEventListener("click", e => { const b = e.target.closest("[data-l]"); if (b) { const l = all.find(x => x.id === b.dataset.l); if (l) go(l); }
      const t = e.target.closest("[data-t]"); if (t) { tab = t.dataset.t; host.querySelectorAll("#ltabs button").forEach(x => x.setAttribute("aria-pressed", x === t)); side(); } });
    draw();
  }
  window.CourseKit = { card, enrolled, page, lessons, ytId, KIND };
})();
