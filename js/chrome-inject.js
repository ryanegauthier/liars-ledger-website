(function () {
  const templates = window.LL_CHROME;
  if (!templates) return;

  const part = document.currentScript?.dataset?.chrome;
  if (!part) return;

  const slotId = part === "header" ? "chrome-header" : "chrome-footer";
  const html = templates[part];
  const slot = document.getElementById(slotId);

  if (slot && html) {
    slot.outerHTML = html;
  }
})();
