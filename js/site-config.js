/** Shared URLs and paths — single place to update chrome links. */
window.LL_SITE = {
  // Two install-link variants so Chrome Web Store referrer data can tell
  // "came from the website" apart from "came from inside the extension"
  // (e.g. the popup's pricing link, or the sidebar's upgrade prompts —
  // both already point at /pricing, which itself is reached via the
  // website, but the *install* button only ever appears on-site, so this
  // distinction matters for things like the rate-limited upsell card if
  // it's ever changed to suggest reinstalling, or any future in-extension
  // surface that links to the Chrome Web Store directly rather than via
  // a website page in between).
  installUrl:
    "https://chromewebstore.google.com/detail/liars-ledger/ffjkghkknndcnchnhgpboglmjanlcpfd?hl=en-US",
  installFromExtensionUrl:
    "https://chromewebstore.google.com/detail/liars-ledger/ffjkghkknndcnchnhgpboglmjanlcpfd?hl=en-US&utm_source=ext_sidebar",
  // The published Chrome Web Store extension ID — extracted from the
  // installUrl above, where it always appears in the same position
  // (.../detail/<name>/<id>). Used by pricing-page.js to message the
  // extension directly via chrome.runtime.sendMessage(extensionId, ...)
  // and ask for the install token, instead of requiring manual copy/paste.
  // IMPORTANT: this is the real CWS-assigned ID, NOT the random ID Chrome
  // assigns to an unpacked/locally-loaded build during development — those
  // are different per-install and this feature will silently fail to
  // connect if tested against an unpacked build using its own different ID
  // without temporarily swapping this value during that specific test.
  extensionId: "ffjkghkknndcnchnhgpboglmjanlcpfd",
  githubUrl: "https://github.com/ryanegauthier/liars-ledger",
  docsUrl: "https://docs.liarsledger.com",
  apiBase: "https://api.liarsledger.com",
};
