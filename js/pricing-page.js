(function () {
  const API_BASE = window.LL_SITE?.apiBase || "https://api.liarsledger.com";

  const form           = document.getElementById("subForm");
  const tokenField      = document.getElementById("subTokenField");
  const tokenConfirm     = document.getElementById("subTokenConfirm");
  const tokenPreviewEl   = document.getElementById("subTokenPreview");
  const tokenEl          = document.getElementById("subToken");
  const btn             = document.getElementById("subBtn");
  const msgEl           = document.getElementById("subMsg");

  if (!form || !tokenEl || !btn || !msgEl) return;

  // Token arriving via ?token= or the extension-messaging auto-detect below
  // is held here rather than written into the (hidden, in that case) input
  // — keeps all paths unambiguous about which source actually supplied it.
  let prefilledToken = null;

  function showMsg(text, type) {
    msgEl.textContent = text;
    msgEl.className = "sub-form-msg " + type;
  }

  function truncateToken(t) {
    return t.length > 16 ? `${t.slice(0, 8)}…${t.slice(-8)}` : t;
  }

  // Switches the form into "token detected" mode: hides the manual paste
  // field, shows a brief preview, leaves Subscribe as the only remaining
  // action. Shared by both ways a token can arrive — the explicit ?token=
  // URL param (someone clicked a link the extension built) and the
  // automatic extension-messaging detect below (someone just navigated
  // here directly, but the extension is installed and active).
  function confirmPrefilledToken(t) {
    prefilledToken = t;
    if (tokenField)     tokenField.hidden = true;
    if (tokenConfirm)   tokenConfirm.hidden = false;
    if (tokenPreviewEl) tokenPreviewEl.textContent = truncateToken(t);
  }

  // Read token from ?token= query param (set by background.js's upgradeUrl,
  // surfaced via the extension popup or the sidebar's upgrade prompts).
  // Takes priority over the auto-detect below — an explicit link click is
  // a more deliberate signal than a generic "ask the extension" probe, and
  // checking the URL first avoids firing an unnecessary extension message
  // when we already have what we need.
  // Returns true if a token was found this way, so the caller knows
  // whether to bother trying the auto-detect fallback at all.
  function readTokenFromUrl() {
    try {
      const params = new URLSearchParams(window.location.search);
      const t = params.get("token");
      if (t && t.length >= 16) {
        confirmPrefilledToken(t);
        // Strip from URL bar immediately — don't let the raw token sit in
        // the address bar or browser history.
        history.replaceState(null, "", window.location.pathname);
        return true;
      }
    } catch (_) {
      /* ignore */
    }
    return false;
  }

  // Automatic fallback for anyone who landed on /pricing directly (no
  // ?token=) — asks the extension itself for the install token via
  // chrome.runtime.sendMessage(extensionId, ...), the only way a regular
  // web page can reach into the extension's storage, since
  // chrome.storage.sync is sandboxed and not directly readable by a page.
  // Requires manifest.json's externally_connectable.matches to include
  // this origin, and the extension to declare a matching
  // onMessageExternal listener (see background.js) — without both, this
  // silently fails and the existing manual-paste field remains, which is
  // the correct, safe degradation: no error shown, just the same
  // experience this page already had before this feature existed.
  //
  // 1.5s timeout: chrome.runtime.sendMessage to an external extension ID
  // should resolve near-instantly if the extension is installed and the
  // channel is correctly configured; if it hasn't resolved by then,
  // something's wrong (extension not installed, wrong ID, manifest
  // misconfigured) and waiting longer just delays showing the fallback
  // field with no added chance of success.
  function tryAutoDetectToken() {
    const extensionId = window.LL_SITE?.extensionId;
    if (!extensionId || !window.chrome?.runtime?.sendMessage) return;

    let settled = false;
    const timeout = setTimeout(() => { settled = true; }, 1500);

    try {
      chrome.runtime.sendMessage(extensionId, { action: "getToken" }, (response) => {
        if (settled) return; // timeout already fired, ignore a late response
        clearTimeout(timeout);
        // chrome.runtime.lastError is set (not thrown) when the extension
        // isn't installed/reachable — must check it even though we don't
        // use the message, or Chrome logs an unhandled-error warning.
        if (chrome.runtime.lastError) return;
        if (response?.tokenId) {
          confirmPrefilledToken(response.tokenId);
        }
      });
    } catch (_) {
      /* extension not present, or messaging unsupported — fall through to manual field */
    }
  }

  if (!readTokenFromUrl()) {
    tryAutoDetectToken();
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Prefer a token detected automatically (via ?token= or the extension
    // messaging fallback above); fall back to the manual field otherwise.
    const token = prefilledToken || tokenEl.value.trim();

    if (!token) {
      showMsg("Install token is required. Open the extension popup → Account panel to find it.", "error");
      return;
    }
    if (token.length < 16) {
      showMsg("Token looks too short — check and try again.", "error");
      return;
    }

    btn.disabled = true;
    btn.textContent = "Creating checkout…";
    showMsg("", "");

    try {
      const res = await fetch(`${API_BASE}/pricing/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();

      if (res.status === 409) {
        showMsg("✓ This token already has Pro access. Check your extension.", "ok");
        btn.disabled = false;
        btn.textContent = "Subscribe to Pro →";
        return;
      }

      if (!res.ok || !data.url) {
        btn.disabled = false;
        btn.textContent = "Subscribe to Pro →";
        showMsg(data.error || "Something went wrong. Please try again.", "error");
        return;
      }

      showMsg("Redirecting to Square checkout…", "ok");
      window.location.href = data.url;
    } catch (_) {
      btn.disabled = false;
      btn.textContent = "Subscribe to Pro →";
      showMsg("Network error — check your connection and try again.", "error");
    }
  });
})();
