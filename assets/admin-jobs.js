// SSCAspirants_Official – Admin → Jobs (owner and admins). Saves data/jobs.js; shown to everyone on jobs.html.
(function () {
  const A = () => window.AdminAPI, $ = id => document.getElementById(id);
  const CATS = [["job", "Latest job / notification"], ["admit", "Admit card"], ["result", "Result / cut-off"], ["key", "Answer key"], ["date", "Exam date"]];
  const GROUPS = ["SSC", "Railway", "Bank", "Police", "Defence", "Teaching", "State PSC", "UP Govt", "Other"];
  const DATE_PRESETS = { job: ["Apply start", "Last date to apply", "Fee last date", "Exam date"], admit: ["Admit card", "Exam date"], result: ["Result declared"], key: ["Answer key released", "Objection last date"], date: ["Exam date"] };
  let edit = null, work = null;
  const today = () => new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10);

  document.head.insertAdjacentHTML("beforeend", `<style>
    .jb-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px;margin-bottom:12px}
    .jb-grid label,.jb-rows label{display:flex;flex-direction:column;gap:5px;font-weight:600;font-size:.88rem}
    .jb-grid input,.jb-grid select,.jb-grid textarea,.jb-rows input{min-height:40px;border:1px solid var(--line);border-radius:9px;background:var(--surface);color:var(--ink);font:inherit;font-size:15px;padding:0 10px}
    .jb-grid textarea{grid-column:1/-1;min-height:70px;padding:8px 10px}.jb-grid .wide{grid-column:1/-1}
    .jb-rows{display:flex;flex-direction:column;gap:8px;margin-bottom:12px}.jb-row{display:grid;grid-template-columns:1fr 1fr auto;gap:8px;align-items:end}
    .jb-row button{min-height:40px;border-radius:9px;border:1px solid var(--line);background:var(--bg);color:var(--bad);font-weight:700;padding:0 12px}
    @media(max-width:640px){.jb-row{grid-template-columns:1fr}}</style>`);

  function list() {
    const { D, E } = A(), L = D.JOBS.slice().sort((a, b) => (b.posted || "").localeCompare(a.posted || ""));
    const cat = c => (CATS.find(x => x[0] === c) || [, c])[1];
    $("jobBody").innerHTML = `<div class="bar" style="margin-bottom:14px;display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-pri" type="button" data-j="new">＋ Add update</button><a class="btn btn-out" href="jobs.html" target="_blank" rel="noopener">👁 Open Jobs page</a></div>
      <div class="list">${L.map(j => `<div class="item"><span class="t"><b>${E(j.title)} ${j.hide ? '<span class="pill soon">Hidden</span>' : ""}</b><span>${E(cat(j.cat))} · ${E(j.group || "Other")} · posted ${E(j.posted || "–")}</span></span>
        <a class="btn btn-out btn-sm" href="jobs.html#j=${encodeURIComponent(j.id)}" target="_blank" rel="noopener">Open</a><button class="btn btn-out btn-sm" type="button" data-j="edit" data-id="${E(j.id)}">Edit</button><button class="btn btn-del btn-sm" type="button" data-j="del" data-id="${E(j.id)}">Delete</button></div>`).join("") || `<div class="mt-empty">No updates yet. Press ＋ Add update.</div>`}</div>`;
  }
  function form() {
    const { E } = A(), j = work;
    $("jobBody").innerHTML = `<div class="bar" style="margin-bottom:12px"><button class="btn btn-out btn-sm" type="button" data-j="back">← All updates</button></div>
      <h3 style="margin:0 0 10px;font:700 1.15rem Poppins,sans-serif">${edit === "__new" ? "Add update" : "Edit update"}</h3>
      <div class="jb-grid">
        <label class="wide">Title<input data-f="title" maxlength="160" value="${E(j.title || "")}" placeholder="SSC CGL 2027 Notification – 15,000+ posts"></label>
        <label>Type<select data-f="cat">${CATS.map(([v, l]) => `<option value="${v}"${j.cat === v ? " selected" : ""}>${l}</option>`).join("")}</select></label>
        <label>Exam group<select data-f="group">${GROUPS.map(g => `<option${(j.group || "SSC") === g ? " selected" : ""}>${g}</option>`).join("")}</select></label>
        <label>Organisation<input data-f="org" value="${E(j.org || "")}" placeholder="Staff Selection Commission"></label>
        <label>Posted on<input type="date" data-f="posted" value="${E(j.posted || today())}"></label>
        <label>Posts / vacancies<input data-f="posts" value="${E(j.posts || "")}" placeholder="15,000 (approx.)"></label>
        <label>Age limit<input data-f="age" value="${E(j.age || "")}" placeholder="18–32 years"></label>
        <label>Application fee<input data-f="fee" value="${E(j.fee || "")}" placeholder="₹100 (no fee for women, SC/ST)"></label>
        <label>Eligibility<input data-f="eligibility" value="${E(j.eligibility || "")}" placeholder="Graduation"></label>
        <textarea data-f="desc" placeholder="Short description (optional)">${E(j.desc || "")}</textarea>
      </div>
      <p style="margin:0 0 6px;font-weight:700">Important dates</p><div class="jb-rows" id="jbDates">${(j.dates || []).map((d, i) => `<div class="jb-row"><label>What<input data-d="${i}:0" value="${E(d[0] || "")}"></label><label>Date<input type="date" data-d="${i}:1" value="${E(/^\d{4}-\d{2}-\d{2}$/.test(d[1] || "") ? d[1] : "")}"></label><button type="button" data-j="ddel" data-i="${i}">✕</button></div>`).join("")}</div>
      <div class="bar" style="margin-bottom:14px"><button class="btn btn-out btn-sm" type="button" data-j="dadd">＋ Add date</button></div>
      <p style="margin:0 0 6px;font-weight:700">Links (official websites only)</p><div class="jb-rows">${(j.links || []).map((l, i) => `<div class="jb-row"><label>Button text<input data-l="${i}:0" value="${E(l[0] || "")}" placeholder="Apply online"></label><label>Link (https://…)<input data-l="${i}:1" value="${E(l[1] || "")}" placeholder="https://ssc.gov.in/"></label><button type="button" data-j="ldel" data-i="${i}">✕</button></div>`).join("")}</div>
      <div class="bar" style="margin-bottom:14px"><button class="btn btn-out btn-sm" type="button" data-j="ladd">＋ Add link</button></div>
      <label class="ck2" style="display:flex;gap:8px;align-items:center;font-weight:600;margin-bottom:12px"><input type="checkbox" data-f="hide" ${j.hide ? "checked" : ""} style="width:18px;height:18px"> Hide this update</label>
      <div class="bar nt-pub"><button class="btn btn-pri" type="button" data-j="save">Save update</button></div>`;
  }
  function read(t) {
    const j = work; if (!j || !t) return;
    if (t.dataset.f) { j[t.dataset.f] = t.type === "checkbox" ? t.checked : t.value.trim(); if (t.dataset.f === "hide" && !j.hide) delete j.hide;
      if (t.dataset.f === "cat" && !(j.dates || []).some(d => d[1])) { j.dates = (DATE_PRESETS[j.cat] || []).map(n => [n, ""]); form(); } }
    if (t.dataset.d) { const [i, k] = t.dataset.d.split(":"); j.dates[+i][+k] = t.value.trim(); }
    if (t.dataset.l) { const [i, k] = t.dataset.l.split(":"); j.links[+i][+k] = t.value.trim(); }
  }
  function init() {
    if (!$("jobBody")) return; edit = null; work = null; list();
    if (init.done) return; init.done = true;
    $("jobBody").addEventListener("input", e => { if (e.target.tagName !== "SELECT" && e.target.type !== "checkbox") read(e.target); });
    $("jobBody").addEventListener("change", e => read(e.target));
    $("jobBody").addEventListener("click", async e => {
      const b = e.target.closest("[data-j]"); if (!b) return; const a = b.dataset.j, { D, say } = A();
      if (a === "new") { edit = "__new"; work = { id: "", cat: "job", group: "SSC", title: "", org: "", posted: today(), dates: DATE_PRESETS.job.map(n => [n, ""]), links: [["Official website", ""]] }; form(); return; }
      if (a === "edit") { edit = b.dataset.id; work = JSON.parse(JSON.stringify(D.JOBS.find(x => x.id === edit))); work.dates = work.dates || []; work.links = work.links || []; form(); return; }
      if (a === "back") { edit = null; work = null; list(); return; }
      if (a === "del") { const j = D.JOBS.find(x => x.id === b.dataset.id); if (!j || !A().confirmBox(`Delete "${j.title}"?`)) return; D.JOBS = D.JOBS.filter(x => x !== j);
        try { await A().save("JOBS"); say("Update deleted.", "ok"); } catch (er) { say("Could not delete: " + er.message, "err"); } list(); return; }
      const j = work; if (!j) return;
      if (a === "dadd") { j.dates.push(["", ""]); form(); return; }
      if (a === "ddel") { j.dates.splice(+b.dataset.i, 1); form(); return; }
      if (a === "ladd") { j.links.push(["", ""]); form(); return; }
      if (a === "ldel") { j.links.splice(+b.dataset.i, 1); form(); return; }
      if (a === "save") {
        if (!j.title) return say("Give the update a title.", "err");
        const bad = j.links.find(l => l[1] && !/^https:\/\/\S+$/i.test(l[1])); if (bad) return say(`The link "${bad[1]}" must start with https://`, "err");
        j.links = j.links.filter(l => l[1]); j.dates = j.dates.filter(d => d[0]);
        ["posts", "age", "fee", "eligibility", "desc", "org"].forEach(k => { if (!j[k]) delete j[k]; });
        if (edit === "__new") { let id = A().slug(j.title).slice(0, 50), k = 2; const base = id; while (D.JOBS.some(x => x.id === id)) id = base + "-" + k++; j.id = id; D.JOBS.unshift(j); }
        else D.JOBS[D.JOBS.findIndex(x => x.id === edit)] = j;
        try { say("Saving…", "info", true); await A().save("JOBS"); say("Saved. It shows on the Jobs page in about a minute.", "ok"); edit = null; work = null; list(); }
        catch (er) { if (edit === "__new") D.JOBS = D.JOBS.filter(x => x !== j); say("Could not save: " + er.message, "err"); }
      }
    });
  }
  window.AdminJobs = { init };
})();
