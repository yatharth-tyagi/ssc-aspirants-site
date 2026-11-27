// SSCAspirants_Official – Doubt box (students ask, the subject's teacher answers in Admin → Doubts).
// DoubtBox.mount(element, { key: "note:<chapter>" | "lesson:<course>:<lesson>", subject: "<subject id>", where: "Chapter or lesson name" })
// Server: GET /api/doubts?key=… → { doubts: [{ id, text, answer, by, created, answered }] } (the student's own)
//         POST /api/doubts { key, subject, where, text } → { ok }
(function () {
  const E = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const L = k => E(window.SSCL ? SSCL(k) : k);
  const day = t => new Date(t).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
  document.head.insertAdjacentHTML("beforeend", `<style>
    .dbx{display:flex;flex-direction:column;gap:12px}.dbx h3{margin:0;font:700 1.1rem Poppins,sans-serif}
    .dbx textarea{width:100%;box-sizing:border-box;min-height:84px;border:1px solid var(--line);border-radius:12px;background:var(--bg);color:var(--ink);font:inherit;padding:10px 12px;resize:vertical}
    .dbx .row{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.dbx .row .muted{font-size:.88rem}
    .dq{border:1px solid var(--line);border-radius:12px;padding:12px 14px;background:var(--bg)}.dq p{margin:0}
    .dq .a{margin-top:10px;border-left:4px solid var(--ans);background:var(--ok-soft);border-radius:8px;padding:8px 12px}
    .dq small{color:var(--muted)}.dq .w{color:var(--acc);font-weight:600;font-size:.88rem;margin-top:6px;display:block}</style>`);
  function mount(el, o) {
    el.innerHTML = `<div class="card dbx"><h3>${L("dbt.title")}</h3><p class="muted" style="margin:0">${L("dbt.sub")}</p>
      <textarea maxlength="1000" placeholder="${L("dbt.ph")}"></textarea><div class="row"><button class="btn btn-pri" type="button">${L("dbt.btn")}</button><span class="muted" data-m></span></div><div data-list></div></div>`;
    const ta = el.querySelector("textarea"), msg = el.querySelector("[data-m]"), list = el.querySelector("[data-list]");
    const load = async () => { try { const r = await fetch("/api/doubts?key=" + encodeURIComponent(o.key), { cache: "no-store" }); if (!r.ok) throw 0; const d = await r.json();
        list.innerHTML = (d.doubts || []).length ? `<p style="margin:4px 0 8px;font-weight:700">${L("dbt.mine")}</p>` + d.doubts.map(x => `<div class="dq" style="margin-bottom:8px"><p>${E(x.text)}</p><small>${day(x.created)}</small>
          ${x.answer ? `<div class="a"><b>${E(x.by || "Teacher")}:</b> ${E(x.answer)}</div>` : `<span class="w">${L("dbt.wait")}</span>`}</div>`).join("") : ""; } catch (e) { list.innerHTML = ""; } };
    el.querySelector("button").onclick = async () => { const t = ta.value.trim(); if (t.length < 5) { msg.textContent = "Please write your doubt (at least a few words)."; return; }
      try { const r = await fetch("/api/doubts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: o.key, subject: o.subject, where: o.where, text: t }) });
        if (!r.ok) throw 0; ta.value = ""; msg.textContent = SSCL("dbt.sent"); load(); } catch (e) { msg.textContent = SSCL("dbt.login"); } };
    load();
  }
  window.DoubtBox = { mount };
})();
