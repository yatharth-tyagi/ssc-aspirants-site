// SSCAspirants_Official – Admin → Courses.
// Owner / admins: everything (new course, details, price, delete).
// Teachers: only chapters and lessons of their own subjects inside existing courses.
(function () {
  const A = () => window.AdminAPI, $ = id => document.getElementById(id);
  const KINDS = [["video", "▶ Video lecture"], ["live", "🔴 Live class"], ["notes", "📄 Notes"], ["pdf", "📕 PDF"], ["test", "📝 Test"]];
  const COLORS = ["#1F3A93", "#0F6B5B", "#7A2448", "#9A6A12", "#3F62D1", "#6E4FF0", "#B54708", "#141B38"];
  let edit = null, work = null, openCh = 0;
  const uid = () => Math.random().toString(36).slice(2, 8);
  const ytId = u => (window.CourseKit ? CourseKit.ytId(u) : u);
  const toLocal = t => t ? new Date(t - new Date(t).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "";

  document.head.insertAdjacentHTML("beforeend", `<style>
    .crs-row{display:flex;flex-wrap:wrap;gap:12px;align-items:center;border:1px solid var(--line);border-radius:14px;padding:12px 16px;background:var(--bg);margin-bottom:10px}
    .crs-row .sw{width:44px;height:44px;border-radius:12px;flex:none}
    .crs-row .t{flex:1 1 260px}.crs-row .t b{display:block}.crs-row .t span{font-size:.88rem;color:var(--muted)}
    .crs-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px;margin-bottom:12px}
    .crs-grid label,.crs-f label{display:flex;flex-direction:column;gap:5px;font-weight:600;font-size:.88rem}
    .crs-grid input,.crs-grid select,.crs-grid textarea,.crs-ch input,.crs-ch select,.crs-l input,.crs-l select{min-height:40px;border:1px solid var(--line);border-radius:9px;background:var(--surface);color:var(--ink);font:inherit;font-size:15px;padding:0 10px}
    .crs-grid textarea{min-height:80px;padding:8px 10px;grid-column:1/-1}
    .crs-ticks{display:flex;flex-wrap:wrap;gap:6px;margin:4px 0 12px}.crs-ticks label{display:flex;gap:6px;align-items:center;border:1px solid var(--line);border-radius:999px;padding:5px 12px;background:var(--surface);font-weight:600;font-size:.88rem;cursor:pointer}
    .crs-ticks input{width:17px;height:17px}
    .crs-ch{border:1px solid var(--line);border-radius:14px;background:var(--bg);margin-bottom:12px}
    .crs-ch>.h{display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:10px 12px;cursor:pointer}
    .crs-ch>.h b{flex:1 1 200px}.crs-ch.lock{opacity:.6}
    .crs-ch .b{padding:4px 12px 12px;display:flex;flex-direction:column;gap:8px;border-top:1px solid var(--line)}
    .crs-l{border:1px solid var(--line);border-radius:12px;background:var(--surface);padding:10px 12px;display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:8px;align-items:end}
    .crs-l label{display:flex;flex-direction:column;gap:4px;font-weight:600;font-size:.82rem}
    .crs-l .top{grid-column:1/-1;display:flex;gap:8px;align-items:center;flex-wrap:wrap}.crs-l .top b{flex:1}
    .crs-l .ck{flex-direction:row;align-items:center;gap:6px}.crs-l .ck input{width:18px;height:18px;min-height:0}
    .mini-b{min-height:34px;padding:0 10px;border-radius:8px;border:1px solid var(--line);background:var(--bg);color:var(--ink);font-weight:600}
    .mini-b.del{color:var(--bad)}
    .sw-row{display:flex;gap:6px;flex-wrap:wrap}.sw-row button{width:30px;height:30px;border-radius:8px;border:2px solid transparent}.sw-row button[aria-pressed="true"]{border-color:var(--ink)}
  </style>`);

  const canEditCourse = () => !A().isTeacher();
  const mineCh = ch => !A().isTeacher() || A().mySubs().includes(ch.subject);
  const subsOf = c => c.type === "full" ? A().D.SUBJECTS.map(s => s.id) : (c.subjects || []);
  const subName = id => (A().D.SUBJECTS.find(s => s.id === id) || {}).name || id;

  function list() {
    const { D, E } = A(), T = A().isTeacher();
    const rows = D.COURSES.filter(c => !T || subsOf(c).some(s => A().mySubs().includes(s)));
    $("crsBody").innerHTML = `${T ? `<p class="muted" style="margin-top:0">You can add chapters and lessons for your subject in these courses.</p>` : `<div class="bar" style="margin-bottom:14px"><button class="btn btn-pri" type="button" data-c="new">＋ New course</button></div>`}
      ${rows.map(c => { const n = (c.chapters || []).reduce((a, ch) => a + (ch.lessons || []).length, 0);
        return `<div class="crs-row"><span class="sw" style="background:linear-gradient(135deg,${E(c.color || "#1F3A93")},#141B38)"></span><span class="t"><b>${E(c.title)} ${c.hide ? '<span class="pill soon">Hidden</span>' : ""}</b>
        <span>${c.type === "full" ? "Complete course" : "Subject course · " + (c.subjects || []).map(subName).map(E).join(", ")} · ${(c.chapters || []).length} chapters · ${n} lessons · ${+c.price ? "₹" + c.price : "Free"}</span></span>
        <a class="btn btn-out btn-sm" href="course.html?id=${encodeURIComponent(c.id)}" target="_blank" rel="noopener">👁 Student view</a><button class="btn btn-pri btn-sm" type="button" data-c="edit" data-id="${E(c.id)}">✎ Edit</button>
        ${T ? "" : `<button class="btn btn-out btn-sm" type="button" data-c="del" data-id="${E(c.id)}" style="color:var(--bad)">Delete</button>`}</div>`; }).join("") || `<div class="mt-empty">${T ? "No course has your subject yet. Ask the owner to make one." : "No courses yet. Press ＋ New course."}</div>`}`;
  }

  function editor() {
    const { D, E } = A(), c = work, T = !canEditCourse(), dis = T ? "disabled" : "";
    const subsAll = D.SUBJECTS, exams = D.EXAMS.filter(x => !x.hide);
    const tests = Object.entries(D.TESTS), notes = Object.entries(D.NOTES);
    const lessonForm = (ch, ci, l, li) => {
      const f = (k, label, type = "text", extra = "") => `<label>${label}<input type="${type}" data-lf="${ci}:${li}:${k}" value="${E(type === "datetime-local" ? toLocal(l[k]) : l[k] == null ? "" : l[k])}" ${extra}></label>`;
      let h = `<div class="crs-l"><div class="top"><b>${(KINDS.find(k => k[0] === l.kind) || KINDS[0])[1]}</b>
        <button class="mini-b" type="button" data-c="lup" data-ci="${ci}" data-li="${li}" ${li ? "" : "disabled"}>↑</button><button class="mini-b" type="button" data-c="ldown" data-ci="${ci}" data-li="${li}" ${li < ch.lessons.length - 1 ? "" : "disabled"}>↓</button>
        <button class="mini-b del" type="button" data-c="ldel" data-ci="${ci}" data-li="${li}">Delete</button></div>
        ${f("title", "Lesson title")}`;
      if (l.kind === "video") h += f("vid", "YouTube link (unlisted is best)") + f("mins", "Minutes", "number", 'min="0"');
      if (l.kind === "live") h += f("when", "Date and time", "datetime-local") + f("link", "Class link (YouTube Live / Meet, https://…)") + f("vid", "Recording link (after class, optional)");
      if (l.kind === "notes") h += `<label>Notes chapter<select data-lf="${ci}:${li}:note"><option value="">– choose –</option>${notes.filter(([id, n]) => !ch.subject || n.subject === ch.subject).map(([id, n]) => `<option value="${E(id)}"${l.note === id ? " selected" : ""}>${E(n.title)}</option>`).join("")}</select></label>`;
      if (l.kind === "pdf") h += f("pdf", "PDF link (https://… or uploaded file)") + `<label>&nbsp;<button class="mini-b" type="button" data-c="pdfup" data-ci="${ci}" data-li="${li}">⬆ Upload PDF</button></label>`;
      if (l.kind === "test") h += `<label>Test<select data-lf="${ci}:${li}:test"><option value="">– choose –</option>${tests.map(([id, t]) => `<option value="${E(id)}"${l.test === id ? " selected" : ""}>${E(t.title)}</option>`).join("")}</select></label>`;
      h += `<label class="ck"><input type="checkbox" data-lf="${ci}:${li}:free" ${l.free ? "checked" : ""}> Free demo lesson</label></div>`;
      return h;
    };
    $("crsBody").innerHTML = `<div class="bar" style="margin-bottom:12px"><button class="btn btn-out btn-sm" type="button" data-c="back">← All courses</button></div>
      <h3 style="margin:0 0 10px;font:700 1.2rem Poppins,sans-serif">${edit === "__new" ? "New course" : "Edit course"}</h3>
      ${T ? `<p class="muted">Course details are set by the owner. You can add chapters and lessons for: <b>${A().mySubs().map(subName).map(E).join(", ")}</b>.</p>` : ""}
      <div class="crs-grid">
        <label>Course name<input data-cf="title" value="${E(c.title || "")}" ${dis}></label>
        <label>Type<select data-cf="type" ${dis}><option value="subject"${c.type !== "full" ? " selected" : ""}>Subject course</option><option value="full"${c.type === "full" ? " selected" : ""}>Complete course (all subjects)</option></select></label>
        <label>Price ₹ (0 = free)<input type="number" min="0" data-cf="price" value="${+c.price || 0}" ${dis}></label>
        <label>Original price ₹ (shows a cut price)<input type="number" min="0" data-cf="mrp" value="${+c.mrp || 0}" ${dis}></label>
        <label>Valid till<input data-cf="validity" value="${E(c.validity || "")}" placeholder="Till SSC CGL 2027" ${dis}></label>
        <label>Colour<span class="sw-row">${COLORS.map(x => `<button type="button" data-col="${x}" style="background:${x}" aria-pressed="${(c.color || COLORS[0]) === x}" ${dis}></button>`).join("")}</span></label>
        <textarea data-cf="desc" placeholder="About this course (shown to students)" ${dis}>${E(c.desc || "")}</textarea>
      </div>
      ${c.type !== "full" ? `<p style="margin:0;font-weight:600;font-size:.88rem">Subjects</p><div class="crs-ticks">${subsAll.map(s => `<label><input type="checkbox" data-csub="${E(s.id)}" ${(c.subjects || []).includes(s.id) ? "checked" : ""} ${dis}>${E(s.name)}</label>`).join("")}</div>` : ""}
      <p style="margin:0;font-weight:600;font-size:.88rem">For exams</p><div class="crs-ticks">${exams.map(x => `<label><input type="checkbox" data-cex="${E(x.id)}" ${(c.exams || []).includes(x.id) ? "checked" : ""} ${dis}>${E(x.name)}</label>`).join("")}</div>
      ${T ? "" : `<label class="ck" style="display:flex;gap:8px;align-items:center;margin-bottom:14px;font-weight:600"><input type="checkbox" data-cf="hide" ${c.hide ? "checked" : ""} style="width:18px;height:18px"> Hide this course from students</label>`}
      <h3 style="margin:6px 0 10px;font:700 1.1rem Poppins,sans-serif">Chapters and lessons</h3>
      ${(c.chapters || []).map((ch, ci) => { const mine = mineCh(ch);
        return `<div class="crs-ch${mine ? "" : " lock"}"><div class="h" data-c="toggle" data-ci="${ci}"><b>${ci + 1}. ${E(ch.title || "New chapter")}</b><span class="muted" style="font-size:.85rem">${E(subName(ch.subject || ""))} · ${(ch.lessons || []).length} lessons${mine ? "" : " · 🔒 another subject"}</span>
          ${mine ? `<button class="mini-b" type="button" data-c="cup" data-ci="${ci}" ${ci ? "" : "disabled"}>↑</button><button class="mini-b" type="button" data-c="cdown" data-ci="${ci}" ${ci < c.chapters.length - 1 ? "" : "disabled"}>↓</button><button class="mini-b del" type="button" data-c="cdel" data-ci="${ci}">Delete</button>` : ""}</div>
          ${openCh === ci && mine ? `<div class="b"><div class="crs-grid" style="margin:8px 0 0"><label>Chapter name<input data-chf="${ci}:title" value="${E(ch.title || "")}"></label>
            <label>Subject<select data-chf="${ci}:subject">${subsOf(c).filter(s => !A().isTeacher() || A().mySubs().includes(s)).map(s => `<option value="${E(s)}"${ch.subject === s ? " selected" : ""}>${E(subName(s))}</option>`).join("")}</select></label></div>
            ${(ch.lessons || []).map((l, li) => lessonForm(ch, ci, l, li)).join("")}
            <div class="bar">${KINDS.map(([k, n]) => `<button class="mini-b" type="button" data-c="ladd" data-k="${k}" data-ci="${ci}">＋ ${n}</button>`).join("")}</div></div>` : ""}</div>`; }).join("")}
      <div class="bar"><button class="btn btn-out" type="button" data-c="cadd">＋ Add chapter</button></div>
      <div class="bar nt-pub"><button class="btn btn-pri" type="button" data-c="save">Save course</button>${edit !== "__new" ? `<a class="btn btn-out" href="course.html?id=${encodeURIComponent(c.id)}" target="_blank" rel="noopener">👁 Student view</a>` : ""}</div>`;
  }

  function read(t) {
    const c = work; if (!t || !c) return;
    if (t.dataset.cf) { const k = t.dataset.cf; c[k] = t.type === "checkbox" ? t.checked : t.type === "number" ? +t.value : t.value; if (k === "hide" && !c.hide) delete c.hide; if (k === "type") editor(); }
    if (t.dataset.csub != null) c.subjects = [...$("crsBody").querySelectorAll("[data-csub]:checked")].map(x => x.dataset.csub);
    if (t.dataset.cex != null) c.exams = [...$("crsBody").querySelectorAll("[data-cex]:checked")].map(x => x.dataset.cex);
    if (t.dataset.chf) { const [ci, k] = t.dataset.chf.split(":"); c.chapters[+ci][k] = t.value; if (k === "subject") editor(); }
    if (t.dataset.lf) { const [ci, li, k] = t.dataset.lf.split(":"), l = c.chapters[+ci].lessons[+li];
      let v = t.type === "checkbox" ? t.checked : t.type === "number" ? (t.value === "" ? null : +t.value) : t.type === "datetime-local" ? (t.value ? new Date(t.value).getTime() : null) : t.value.trim();
      if (k === "vid" && v) v = ytId(v) || v;
      if (v === null || v === "" || v === false) delete l[k]; else l[k] = v; }
  }

  function init() {
    if (!$("crsBody")) return;
    edit = null; work = null; list();
    if (init.done) return; init.done = true;
    $("crsBody").addEventListener("input", e => { if (e.target.type !== "checkbox" && e.target.tagName !== "SELECT") read(e.target); });
    $("crsBody").addEventListener("change", e => read(e.target));
    $("crsBody").addEventListener("click", async e => {
      const col = e.target.closest("[data-col]"); if (col && work && canEditCourse()) { work.color = col.dataset.col; editor(); return; }
      const b = e.target.closest("[data-c]"); if (!b) return; const a = b.dataset.c, { D, say } = A(), ci = +b.dataset.ci, li = +b.dataset.li;
      if (a === "toggle") { if (e.target.closest("button")) return; openCh = openCh === ci ? -1 : ci; editor(); return; }
      if (a === "new") { edit = "__new"; work = { id: "", title: "", type: "subject", subjects: [], exams: [], price: 0, mrp: 0, validity: "", color: COLORS[0], desc: "", chapters: [] }; openCh = -1; editor(); return; }
      if (a === "edit") { edit = b.dataset.id; work = JSON.parse(JSON.stringify(D.COURSES.find(c => c.id === edit))); openCh = -1; editor(); return; }
      if (a === "back") { edit = null; work = null; list(); return; }
      if (a === "del") { const c = D.COURSES.find(x => x.id === b.dataset.id); if (!c || !A().confirmBox(`Delete the course "${c.title}"? Students who joined will lose it.`)) return;
        D.COURSES = D.COURSES.filter(x => x !== c); try { await A().save("COURSES"); say("Course deleted.", "ok"); } catch (er) { say("Could not delete: " + er.message, "err"); } list(); return; }
      const c = work; if (!c) return;
      if (a === "cadd") { const sub = subsOf(c).find(s => !A().isTeacher() || A().mySubs().includes(s)); if (!sub) return say(A().isTeacher() ? "This course has none of your subjects." : "Tick a subject for the course first.", "err");
        c.chapters.push({ id: uid(), title: "", subject: sub, lessons: [] }); openCh = c.chapters.length - 1; editor(); return; }
      if (a === "cdel") { if (!A().confirmBox(`Delete chapter ${ci + 1} and its lessons?`)) return; c.chapters.splice(ci, 1); openCh = -1; editor(); return; }
      if (a === "cup" || a === "cdown") { const j = ci + (a === "cup" ? -1 : 1); if (!mineCh(c.chapters[j])) return say("You can only move chapters of your own subject.", "err"); [c.chapters[ci], c.chapters[j]] = [c.chapters[j], c.chapters[ci]]; openCh = j; editor(); return; }
      if (a === "ladd") { c.chapters[ci].lessons.push({ id: uid(), kind: b.dataset.k, title: "" }); editor(); return; }
      if (a === "ldel") { c.chapters[ci].lessons.splice(li, 1); editor(); return; }
      if (a === "lup" || a === "ldown") { const L = c.chapters[ci].lessons, j = li + (a === "lup" ? -1 : 1); [L[li], L[j]] = [L[j], L[li]]; editor(); return; }
      if (a === "pdfup") { const f = document.createElement("input"); f.type = "file"; f.accept = "application/pdf"; f.onchange = async () => { const file = f.files[0]; if (!file) return;
          if (file.size > 20 * 1024 * 1024) return say("The PDF is bigger than 20 MB. Make it smaller first.", "err");
          const path = `assets/uploads/pdf-${A().slug(file.name.replace(/\.pdf$/i, "")).slice(0, 40)}-${Date.now().toString(36)}.pdf`;
          try { say("Uploading PDF…", "info", true); await A().writeB64(path, A().b64FromBytes(new Uint8Array(await file.arrayBuffer())), "Admin: course PDF"); c.chapters[ci].lessons[li].pdf = path; editor(); say("PDF uploaded.", "ok"); }
          catch (er) { say("Could not upload: " + er.message, "err"); } }; f.click(); return; }
      if (a === "save") {
        if (!c.title.trim()) return say("Give the course a name.", "err");
        if (c.type !== "full" && !(c.subjects || []).length) return say("Tick at least one subject.", "err");
        for (const ch of c.chapters) { if (!ch.title.trim()) return say("Every chapter needs a name.", "err"); for (const l of ch.lessons) if (!(l.title || "").trim()) return say(`A lesson in "${ch.title}" has no title.`, "err"); }
        if (edit === "__new") { let id = A().slug(c.title), k = 2; const base = id; while (D.COURSES.some(x => x.id === id)) id = base + "-" + k++; c.id = id; D.COURSES.push(c); }
        else { const i = D.COURSES.findIndex(x => x.id === edit); D.COURSES[i] = c; }
        try { say("Saving course…", "info", true); await A().save("COURSES"); edit = c.id; work = JSON.parse(JSON.stringify(c)); editor(); say("Course saved. Students see it in about a minute.", "ok"); }
        catch (er) { if (edit === "__new") D.COURSES = D.COURSES.filter(x => x !== c); say(er.status === 403 ? "Not allowed: you can only change your own subject's chapters." : "Could not save: " + er.message, "err"); }
      }
    });
  }
  window.AdminCourses = { init };
})();
