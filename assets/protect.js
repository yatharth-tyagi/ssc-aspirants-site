// Copy protection for notes. Websites cannot fully block screenshots,
// so this makes copying hard and the watermark marks every copy.
(function () {
  const stop = e => { e.preventDefault(); return false; };
  ["contextmenu", "copy", "cut", "dragstart", "selectstart"].forEach(t => document.addEventListener(t, stop));
  document.addEventListener("keydown", e => {
    const k = (e.key || "").toLowerCase();
    if ((e.ctrlKey || e.metaKey) && ["c", "x", "s", "p", "u", "a"].includes(k)) return stop(e);
    if (e.ctrlKey && e.shiftKey && ["i", "j", "c", "s"].includes(k)) return stop(e);
    if (k === "f12") return stop(e);
    if (k === "printscreen") { try { navigator.clipboard.writeText("© SSCAspirants_Official"); } catch (_) {} flash(); }
  });
  // Blur notes when the tab/window loses focus (many snipping and recording tools steal focus)
  const on = () => document.body.classList.add("shield"), off = () => document.body.classList.remove("shield");
  window.addEventListener("blur", on); window.addEventListener("focus", off);
  document.addEventListener("visibilitychange", () => document.hidden ? on() : off());
  function flash() { on(); setTimeout(off, 1500); }
  // printing is blocked unless the owner allowed "Download PDF" for this chapter (then the button sets __allowPrint)
  window.addEventListener("beforeprint", () => { if (!window.__allowPrint) on(); }); window.addEventListener("afterprint", off);
})();
