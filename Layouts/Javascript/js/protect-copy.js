(function(){
  "use strict";
  const editable = el => !!el && (el.matches("input,textarea,select,[contenteditable=\"true\"]") || !!el.closest("input,textarea,select,[contenteditable=\"true\"]"));
  document.addEventListener("copy", e => { if (!editable(e.target)) { e.preventDefault(); e.clipboardData?.setData("text/plain", ""); } }, true);
  document.addEventListener("cut", e => { if (!editable(e.target)) e.preventDefault(); }, true);
  document.addEventListener("contextmenu", e => { if (!editable(e.target)) e.preventDefault(); }, true);
  document.addEventListener("dragstart", e => e.preventDefault(), true);
  document.addEventListener("selectstart", e => { if (!editable(e.target)) e.preventDefault(); }, true);
  document.addEventListener("keydown", e => {
    const key=String(e.key||"").toLowerCase();
    if ((e.ctrlKey||e.metaKey) && ["c","x","u","s","a"].includes(key) && !editable(e.target)) e.preventDefault();
  }, true);
})();
