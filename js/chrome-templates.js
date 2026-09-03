/** Baked-in site chrome -- header and footer templates injected by chrome-inject.js. */
window.LL_CHROME = {
  header: `<header class="site-header">
  <div class="top-ticker">
    <div class="container lg:px-16 ticker-wrap">
      <span>Receipts for politicians · Sourced from Congress</span>
      <span>Updated daily · Source: congress.gov · Live record</span>
    </div>
  </div>
  <div class="container lg:px-16 nav-wrap">
    <a class="brand" href="/" aria-label="Liar's Ledger Home">
      <span class="brand-liars">LIAR'S</span>
      <span class="brand-ledger">LEDGER</span>
      <span class="brand-dot" aria-hidden="true"></span>
    </a>
    <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="primary-nav">
      Menu
    </button>
    <nav id="primary-nav" class="primary-nav" aria-label="Primary">
      <a href="/#how-it-works" data-nav="how">How It Works</a>
      <a href="/scan" data-nav="scan">Try It Free</a>
      <a href="/pricing" data-nav="pricing">Pricing</a>
      <a href="/faq" data-nav="faq">FAQ</a>
      <a href="/#about" data-nav="about">About</a>
      <a href="https://docs.liarsledger.com" target="_blank" rel="noopener noreferrer">Docs</a>
      <a class="btn btn-small" data-ll-link="install" target="_blank" rel="noopener noreferrer" aria-label="Install Liar's Ledger browser extension">Install Extension</a>
    </nav>
  </div>
  <div class="date-strip">
    <div class="container lg:px-16 date-strip-wrap">
      <span data-ll-date-strip></span>
    </div>
  </div>
</header>`,

  footer: `<footer class="site-footer">
  <div class="container lg:px-16 footer-grid">
    <div class="footer-brand">
      <p class="footer-logo"><span>LIAR'S</span> <strong>LEDGER</strong></p>
      <p>An accountability tool. Not a verdict.</p>
      <div class="footer-colophon">
        <p class="footer-heading">Colophon</p>
        <p>Built in plain HTML and stubborn citations. Set in Oswald and IBM Plex. Sourced from official congressional records.</p>
      </div>
    </div>
    <nav class="footer-links" aria-label="Footer links">
      <div>
        <p class="footer-heading">Product</p>
        <a href="/#how-it-works">How it works</a>
        <a href="/scan">Try it free</a>
        <a href="/pricing">Pricing</a>
        <a href="/faq">FAQ</a>
        <a data-ll-link="install" target="_blank" rel="noopener noreferrer">Install</a>
        <a href="https://docs.liarsledger.com" target="_blank" rel="noopener noreferrer">Docs</a>
        <a href="https://github.com/ryanegauthier/liars-ledger/blob/main/CHANGELOG.md" target="_blank" rel="noopener noreferrer">Changelog</a>
      </div>
      <div>
        <p class="footer-heading">Sources</p>
        <a href="https://www.congress.gov/" target="_blank" rel="noopener noreferrer">congress.gov</a>
        <a href="https://clerk.house.gov/Votes" target="_blank" rel="noopener noreferrer">house.gov roll calls</a>
        <a href="https://www.senate.gov/legislative/votes_new.htm" target="_blank" rel="noopener noreferrer">senate.gov votes</a>
        <a href="https://www.fec.gov/" target="_blank" rel="noopener noreferrer">fec.gov filings</a>
      </div>
      <div>
        <p class="footer-heading">Company</p>
        <a href="/#about">About</a>
        <a href="https://github.com/ryanegauthier/liars-ledger" target="_blank" rel="noopener noreferrer">GitHub</a>
        <a href="mailto:contact@liarsledger.com">Contact</a>
        <a href="/privacy">Privacy policy</a>
      </div>
      <div>
        <div class="footer-social">
          <a href="https://x.com/liarsledger_com" target="_blank" rel="noopener noreferrer" aria-label="Liar's Ledger on X">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.9 2H22l-7.6 8.7L23 22h-6.6l-5.2-6.8L5 22H1.9l8.1-9.3L1 2h6.7l4.7 6.2L18.9 2zm-2.3 18h1.8L7.5 4H5.6l11 16z"/></svg>
          </a>
          <a href="https://www.facebook.com/LiarsLedger" target="_blank" rel="noopener noreferrer" aria-label="Liar's Ledger on Facebook">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.84c0-2.5 1.49-3.89 3.78-3.89 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.44 2.91h-2.34V22c4.78-.76 8.44-4.92 8.44-9.94z"/></svg>
          </a>
          <a href="https://linkedin.com/company/liars-ledger" target="_blank" rel="noopener noreferrer" aria-label="Liar's Ledger on LinkedIn">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zM8.34 18.34H5.67V9.5h2.67v8.84zM7 8.37a1.55 1.55 0 1 1 0-3.1 1.55 1.55 0 0 1 0 3.1zm11.34 9.97h-2.67v-4.3c0-1.03-.02-2.35-1.43-2.35-1.43 0-1.65 1.12-1.65 2.28v4.37H10v-8.84h2.56v1.21h.04c.36-.68 1.24-1.4 2.55-1.4 2.73 0 3.23 1.8 3.23 4.14v4.89z"/></svg>
          </a>
          <a href="https://bsky.app/profile/liarsledger.bsky.social" target="_blank" rel="noopener noreferrer" aria-label="Liar's Ledger on Bluesky">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 9.6C10.7 7.2 7.9 5 5.3 5 3.7 5 2 5.9 2 8c0 4.6 8 9.5 10 11.4 2-1.9 10-6.8 10-11.4 0-2.1-1.7-3-3.3-3-2.6 0-5.4 2.2-6.7 4.6z"/></svg>
          </a>
          <a href="https://www.tiktok.com/@liarsledger.com" target="_blank" rel="noopener noreferrer" aria-label="Liar's Ledger on TikTok">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16.6 5.8c-.9-.8-1.5-2-1.6-3.3h-3.1v13.3c0 1.5-1.2 2.7-2.7 2.7s-2.7-1.2-2.7-2.7 1.2-2.7 2.7-2.7c.3 0 .5 0 .8.1v-3.2c-.3 0-.5-.1-.8-.1-3.2 0-5.8 2.6-5.8 5.9s2.6 5.9 5.8 5.9 5.8-2.6 5.8-5.9V9.1c1.2.9 2.7 1.4 4.3 1.4V7.4c-.9 0-1.7-.2-2.5-.6-.1-.1-.2-.1-.2-.2.1-.3 0-.6 0-.8z"/></svg>
          </a>
          <a href="https://instagram.com/liarsledger" target="_blank" rel="noopener noreferrer" aria-label="Liar's Ledger on Instagram">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2c2.7 0 3.1 0 4.1.1 1.1 0 1.8.2 2.4.4.6.3 1.2.6 1.7 1.1.5.5.9 1 1.1 1.7.2.6.4 1.3.4 2.4.1 1 .1 1.4.1 4.1s0 3.1-.1 4.1c0 1.1-.2 1.8-.4 2.4-.3.6-.6 1.2-1.1 1.7-.5.5-1 .9-1.7 1.1-.6.2-1.3.4-2.4.4-1 .1-1.4.1-4.1.1s-3.1 0-4.1-.1c-1.1 0-1.8-.2-2.4-.4-.6-.3-1.2-.6-1.7-1.1-.5-.5-.9-1-1.1-1.7-.2-.6-.4-1.3-.4-2.4-.1-1-.1-1.4-.1-4.1s0-3.1.1-4.1c0-1.1.2-1.8.4-2.4.3-.6.6-1.2 1.1-1.7.5-.5 1-.9 1.7-1.1.6-.2 1.3-.4 2.4-.4C8.9 2 9.3 2 12 2zm0 1.8c-2.6 0-3 0-4 .1-.9 0-1.4.2-1.7.3-.4.2-.7.4-1 .7-.3.3-.5.6-.7 1-.1.3-.3.8-.3 1.7-.1 1-.1 1.4-.1 4s0 3 .1 4c0 .9.2 1.4.3 1.7.2.4.4.7.7 1 .3.3.6.5 1 .7.3.1.8.3 1.7.3 1 .1 1.4.1 4 .1s3 0 4-.1c.9 0 1.4-.2 1.7-.3.4-.2.7-.4 1-.7.3-.3.5-.6.7-1 .1-.3.3-.8.3-1.7.1-1 .1-1.4.1-4s0-3-.1-4c0-.9-.2-1.4-.3-1.7-.2-.4-.4-.7-.7-1-.3-.3-.6-.5-1-.7-.3-.1-.8-.3-1.7-.3-1-.1-1.4-.1-4-.1zM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 1.8a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4zm5.4-3.6a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4z"/></svg>
          </a>
        </div>
      </div>
    </nav>
  </div>
  <div class="container lg:px-16 footer-bottom">
    <p>&copy; <span id="year"></span> Liar's Ledger. The record is public. So is this.</p>
    <p>Independent · Non-partisan · Open source</p>
  </div>
</footer>`,
};
