/**
 * Liar's Ledger - js/scan.js
 * Orchestrates the /scan page: anonymous identity, the scan-quota flow,
 * article extraction, and rendering - free-tier only, no claim/verdict
 * text, no Pro upsell (see js/vendor/*.js's header comments and
 * CHANGELOG.md's v0.17.13 entry for why).
 *
 * Loads BEFORE js/vendor/*.js in scan.html. Two jobs happen here:
 *  1. Define the browser-environment shims those files expect
 *     (window.browser, window.CONFIG, window.logger, window.safeSessionSet,
 *     window.authHeaders) - assigned as plain `window.X =` rather than
 *     `const`/`let` so there's no risk of a redeclaration clash with any
 *     top-level binding a vendor file might add later.
 *  2. Define this page's own orchestration (form handling, the scan
 *     pipeline, rendering) - all wrapped in functions that only RUN after
 *     DOMContentLoaded, by which point every vendor script (loaded later
 *     in the HTML, but still before DOMContentLoaded fires) has already
 *     defined resolveAll/lookupAll/extractArticleAnalysisDualVerified/etc
 *     as globals.
 *
 * Naming note: every top-level name declared below was checked against
 * every top-level name js/vendor/ll-*.js declares, to avoid a same-name
 * global collision across script tags sharing one document scope.
 */

const apiBase = (window.LL_SITE && window.LL_SITE.apiBase) || "https://api.liarsledger.com";
const WEB_TOKEN_STORAGE_KEY = "ll_web_token";

// ---------------------------------------------------------------------------
// Shims - see header comment above for why these exist and why they're
// window.X = ... rather than const/let.
// ---------------------------------------------------------------------------

let currentToken = null;
const sessionStore = new Map(); // in-browser stand-in for browser.storage.session

window.CONFIG = { PROXY_URL: apiBase };

window.logger = {
  info:  (ctx, msg) => console.log(`[scan:${ctx}] ${msg}`),
  warn:  (ctx, msg) => console.warn(`[scan:${ctx}] ${msg}`),
  error: (ctx, msg) => console.error(`[scan:${ctx}] ${msg}`),
};

window.safeSessionSet = async (key, value) => {
  sessionStore.set(key, value);
};

window.browser = {
  storage: {
    session: {
      async get(key) {
        return sessionStore.has(key) ? { [key]: sessionStore.get(key) } : {};
      },
      async set(obj) {
        for (const [k, v] of Object.entries(obj)) sessionStore.set(k, v);
      },
      async remove(key) {
        sessionStore.delete(key);
      },
    },
    // ll-lookup.js/ll-api.js/ll-votesmart.js never touch storage.sync -
    // present only so nothing throws if that ever changes.
    sync: { async get() { return {}; } },
  },
  runtime: {
    // ll-lookup.js's loadDictionary() calls this with
    // "src/data/politicians.json" and fetch()es whatever comes back - the
    // real extension resolves that to its own bundled file; here it's
    // GET /api/politicians-dictionary instead (server/providers/politicians.js),
    // which serves the same underlying src/data/politicians.json so the
    // dictionary this page resolves against never drifts from the
    // extension's own copy.
    getURL(_relativePath) {
      return `${apiBase}/api/politicians-dictionary`;
    },
  },
};

window.authHeaders = async () => (currentToken ? { Authorization: `Bearer ${currentToken}` } : {});

// ---------------------------------------------------------------------------
// Anonymous web identity - same token:{id} / scans:{id}:{date} Redis
// keyspace the extension's own install token uses (server/providers/store.js),
// just persisted in localStorage instead of chrome.storage.sync, and sent
// as a plain Authorization: Bearer header like every other client already
// does - not a cookie, deliberately (see CHANGELOG.md v0.17.13).
// ---------------------------------------------------------------------------

function generateWebTokenId() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function llFetch(path, opts = {}) {
  const res = await fetch(`${apiBase}${path}`, opts);
  let body = null;
  try { body = await res.json(); } catch { /* no JSON body */ }
  return { res, body };
}

/**
 * Ensures currentToken is set, registering a fresh one if this is the
 * first visit. Returns the /register response body (status/tier/
 * scansToday/limit/capacityWarning) so the caller can seed the remaining-
 * scans display without a second round trip.
 */
async function getOrCreateWebToken() {
  currentToken = localStorage.getItem(WEB_TOKEN_STORAGE_KEY) || generateWebTokenId();
  localStorage.setItem(WEB_TOKEN_STORAGE_KEY, currentToken);

  const { res, body } = await llFetch("/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tokenId: currentToken }),
  });

  if (!res.ok || !body) {
    throw new Error("registration failed");
  }
  return body;
}

// ---------------------------------------------------------------------------
// UI helpers
// ---------------------------------------------------------------------------

const form        = document.getElementById("scanForm");
const urlInput     = document.getElementById("scanUrlInput");
const submitBtn    = document.getElementById("scanSubmitBtn");
const remainingEl  = document.getElementById("scanRemaining");
const statusEl     = document.getElementById("scanStatus");
const resultsEl    = document.getElementById("scanResults");

function showStatus(message, type) {
  statusEl.hidden = false;
  statusEl.textContent = message;
  statusEl.className = `scan-status scan-status--${type}`;
}

function hideStatus() {
  statusEl.hidden = true;
  statusEl.textContent = "";
  statusEl.className = "scan-status";
}

function hideResults() {
  resultsEl.hidden = true;
  resultsEl.innerHTML = "";
}

function setFormBusy(busy) {
  urlInput.disabled = busy;
  submitBtn.disabled = busy;
  submitBtn.textContent = busy ? "Scanning…" : "Scan Article";
}

function updateRemainingDisplay({ remaining, limit }) {
  if (typeof remaining !== "number" || typeof limit !== "number") return;
  remainingEl.textContent = remaining > 0
    ? `${remaining} of ${limit} free scans left today · resets at midnight UTC`
    : `Daily free limit reached (${limit}/day) · resets at midnight UTC`;
}

async function refreshScanStatus() {
  try {
    const { res, body } = await llFetch("/api/scan-status", {
      headers: await authHeaders(),
    });
    if (res.ok && body) updateRemainingDisplay(body);
  } catch {
    // Non-fatal - the remaining-scans line just doesn't update this time.
  }
}

// ---------------------------------------------------------------------------
// Render - a free-tier-only port of report.js's renderRecord(). Keeps the
// header, Legislation, Roll-Call Votes, and VoteSmart sections (all
// free-tier data already); drops the claim/verdict block and the Pro
// upsell card entirely, since this anonymous page shows no AI-generated
// content at all, not even a teaser. See CHANGELOG.md v0.17.13.
// ---------------------------------------------------------------------------

function escapeHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function voteClass(vote) {
  if (vote === "Yea") return "ll-vote-yea";
  if (vote === "Nay") return "ll-vote-nay";
  return "ll-vote-notvoting";
}

function ratingColor(pct) {
  return pct >= 70 ? "var(--teal)" : pct >= 40 ? "var(--accent)" : "var(--alert)";
}

const BILL_TYPE_MAP = {
  s: "senate-bill", hr: "house-bill",
  sjres: "senate-joint-resolution", hjres: "house-joint-resolution",
  sres: "senate-resolution", hres: "house-simple-resolution",
};

function renderFreeRecord(record) {
  const p = record.politician || {};
  const partyRaw  = p.party || "";
  const partyCode = partyRaw === "D" || partyRaw === "Democratic" ? "D"
                  : partyRaw === "R" || partyRaw === "Republican"  ? "R" : "I";
  const partyLabel = partyCode === "D" ? "DEM" : partyCode === "R" ? "REP" : partyRaw || "IND";
  const chamber   = p.chamber ? p.chamber.charAt(0).toUpperCase() + p.chamber.slice(1).toLowerCase() : "";
  const eyebrow   = [chamber, p.state].filter(Boolean).join(" · ");
  // Official Biographical Directory of Congress - authoritative, and every
  // bioguide_id resolves here without needing to guess a name-slug format
  // (congress.gov's own member-page URLs are slug-based and easy to get
  // subtly wrong for compound names, suffixes, etc.).
  const profileUrl = p.bioguide_id
    ? `https://bioguide.congress.gov/search/bio/${encodeURIComponent(p.bioguide_id)}`
    : null;

  const allBills = []
    .concat((record.sponsored   || []).map(b => ({ ...b, role: "Sponsored"   })))
    .concat((record.cosponsored || []).map(b => ({ ...b, role: "Cosponsored" })));

  const billsHtml = allBills.length === 0
    ? `<div class="ll-empty">No sponsored or cosponsored bills found on these topics.</div>`
    : allBills.map(bill => {
        const type = (bill.type || "").toLowerCase();
        const num  = bill.number || "";
        const url  = `https://www.congress.gov/bill/${bill.congress || 119}th-congress/${BILL_TYPE_MAP[type] || type}/${num}`;
        return `
          <div class="ll-row">
            <div class="ll-row-left ll-bill-role">
              ${escapeHtml(bill.role)}<br>
              <span class="ll-row-left-sub">${escapeHtml(bill.type || "")} ${escapeHtml(String(num))}</span>
            </div>
            <div class="ll-row-right">
              <div>${escapeHtml(bill.title || "")}</div>
              <div class="ll-row-sub">${escapeHtml(bill.introducedDate || "")} · <a href="${escapeHtml(url)}" target="_blank" rel="noopener">View on congress.gov →</a></div>
            </div>
          </div>`;
      }).join("");

  const rollVotes = record.rollCallVotes || [];
  const rollHtml = rollVotes.length === 0
    ? `<div class="ll-empty">No roll-call votes found on these topics.</div>`
    : rollVotes.map(v => {
        const vurl = v.voteUrl ? `<a href="${escapeHtml(v.voteUrl)}" target="_blank" rel="noopener">↗ Vote page</a>` : "";
        return `
          <div class="ll-row">
            <div class="ll-row-left ${voteClass(v.position)}">${escapeHtml(v.position || "-")}<br>
              <span class="ll-row-left-sub">${escapeHtml(v.date || "")}</span>
            </div>
            <div class="ll-row-right">
              <div>${escapeHtml(v.question || "")}</div>
              <div class="ll-row-sub">${v.legislation ? escapeHtml(v.legislation) + " · " : ""}${vurl}</div>
            </div>
          </div>`;
      }).join("");

  // VoteSmart - free for everyone (sourced data, not AI-generated), same
  // as the extension's own free tier. See report.js's matching comment.
  const vsVotes = record.voteSmartVotes || [];
  const vsVotesHtml = vsVotes.length === 0
    ? `<div class="ll-empty">No topic-matched votes found.</div>`
    : vsVotes.map(v => `
        <div class="ll-row">
          <div class="ll-row-left ${voteClass(v.vote)}">${escapeHtml(v.vote)}<br>
            <span class="ll-row-left-sub">${escapeHtml(v.date || "")}</span>
          </div>
          <div class="ll-row-right">
            <div>${escapeHtml(v.title || "")}</div>
            <div class="ll-row-sub">${escapeHtml(v.billNumber || "")}${v.stage ? " · " + escapeHtml(v.stage) : ""}${v.categories?.length ? " · " + v.categories.map(escapeHtml).join(", ") : ""}</div>
          </div>
        </div>`).join("");

  const vsRatings = record.voteSmartRatings || [];
  const vsRatingsHtml = vsRatings.length === 0
    ? `<div class="ll-empty">No interest group ratings found.</div>`
    : vsRatings.map(r => {
        const pct   = typeof r.rating === "number" ? r.rating : parseInt(r.rating, 10);
        const color = ratingColor(pct);
        return `
          <div class="ll-rating-row">
            <div class="ll-rating-score" style="color:${color}">${pct}%
              <div class="ll-rating-year">${escapeHtml(r.year || "")}</div>
            </div>
            <div>
              <div class="ll-rating-name">${escapeHtml(r.sigName || "")}</div>
              <div class="ll-rating-cats">${escapeHtml((r.categories || []).join(", "))}</div>
              <div class="ll-rating-bar-wrap">
                <div class="ll-rating-bar" style="width:${pct}%;background:${color}"></div>
              </div>
            </div>
            <div class="ll-rating-text">${escapeHtml(r.ratingText || "")}</div>
          </div>`;
      }).join("");

  return `
    <article class="ll-politician-card">
      <div class="ll-politician-header">
        <div class="ll-eyebrow">${escapeHtml(eyebrow)}</div>
        <h3 class="ll-name">${escapeHtml(p.full_name || p.matched_as || "")}
          <span class="ll-party-pill ll-party-${partyCode}">${partyLabel}</span>
        </h3>
        <div class="ll-party-meta">119th Congress${profileUrl ? ` · <a href="${profileUrl}" target="_blank" rel="noopener">Official profile ↗</a>` : ""}</div>
      </div>

      <div class="ll-section">
        <div class="ll-section-title">Legislation <span class="ll-section-source">· congress.gov</span></div>
        ${billsHtml}
      </div>

      <div class="ll-section">
        <div class="ll-section-title">Roll-Call Votes <span class="ll-section-source">· govtrack</span></div>
        ${rollHtml}
      </div>

      <div class="ll-section">
        <div class="ll-section-title">Vote History <span class="ll-section-source">· votesmart</span></div>
        ${vsVotesHtml}
      </div>

      <div class="ll-section">
        <div class="ll-section-title">Interest Group Ratings <span class="ll-section-source">· votesmart</span></div>
        ${vsRatingsHtml}
      </div>
    </article>`;
}

// ---------------------------------------------------------------------------
// Scan pipeline
// ---------------------------------------------------------------------------

function formatError(prefix, err) {
  const code = err && err.code;
  return code ? `${prefix} [${code}]` : prefix;
}

async function handleScanSubmit(event) {
  event.preventDefault();
  hideStatus();
  hideResults();

  const rawUrl = urlInput.value.trim();

  // Client-side check for UX only - a friendlier message than a raw fetch
  // failure for the common "forgot https://" case. Never trusted as real
  // validation; the actual SSRF/scheme/format checks happen server-side
  // in POST /api/scan/extract (server/providers/articleFetch.js).
  let parsedUrl;
  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    showStatus("That doesn't look like a valid URL. Include the https:// part.", "error");
    return;
  }
  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    showStatus("Only http:// and https:// links are supported.", "error");
    return;
  }

  setFormBusy(true);
  showStatus("Reserving a scan slot…", "loading");

  try {
    if (!currentToken) await getOrCreateWebToken();

    // 1. Reserve a scan slot - same two-phase reserve/commit flow the
    // extension uses (server/providers/store.js's reserveScan/commitScan).
    const start = await llFetch("/api/scan/start", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    });

    if (start.res.status === 429) {
      showStatus(
        `Daily free limit reached (${start.body?.limit ?? "?"}/day). Resets at midnight UTC, or `
        + `install the extension for the same allowance on every article.`,
        "rate-limited",
      );
      updateRemainingDisplay({ remaining: 0, limit: start.body?.limit });
      return;
    }
    if (!start.res.ok || !start.body?.scanToken) {
      showStatus("Couldn't reserve a scan slot. Please try again.", "error");
      return;
    }
    const { scanToken, commitToken } = start.body;

    // 2. Fetch + extract the article server-side (POST /api/scan/extract,
    // server/providers/articleFetch.js) - the one step that genuinely
    // can't run in-browser, since most news sites don't send CORS headers
    // letting this page fetch() their HTML directly.
    showStatus("Fetching the article…", "loading");
    const extract = await llFetch("/api/scan/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await authHeaders()) },
      body: JSON.stringify({ url: rawUrl }),
    });
    if (!extract.res.ok || !extract.body?.text) {
      showStatus(formatError(extract.body?.error || "Couldn't read that article.", extract.body), "error");
      return;
    }
    const { text: articleText } = extract.body;

    // 3. Dual-model claim extraction - identical pipeline the extension
    // uses (js/vendor/ll-llm.js, copied unmodified from src/llm.js). Free
    // tier's claim/summary fields already come back stripped server-side
    // (gateExtractionResult in server/index.js) - we simply never render
    // record.claim/record.verdict below.
    showStatus("Identifying politicians and pulling their record…", "loading");
    const analysis = await extractArticleAnalysisDualVerified(articleText, {
      claudeEndpoint:  `${apiBase}/api/claude/extract`,
      mistralEndpoint: `${apiBase}/api/mistral/extract`,
      scanToken,
    });
    if (!analysis.ok) {
      showStatus(`Analysis failed: ${analysis.error}`, "error");
      return;
    }
    if (!analysis.figures?.length) {
      showStatus("No current members of Congress were detected in this article.", "empty");
      return;
    }

    // 4. Resolve names against the real dictionary (js/vendor/ll-lookup.js).
    const { resolved } = await resolveAll(analysis.figures.map(f => f.lookup_name));
    if (!resolved.length) {
      showStatus("No current members of Congress were detected in this article.", "empty");
      return;
    }

    // 5. Congress.gov/GovTrack/VoteSmart lookup (js/vendor/ll-api.js +
    // ll-votesmart.js), same topic-merging js/vendor/ll-topic-match.js
    // and js/vendor/ll-keywords.js the extension uses.
    const fallbackTopics = getSearchTerms(articleText);
    const memberJobs = resolved.map(member => {
      const fig = analysis.figures.find(f =>
        (f.lookup_name || "").toLowerCase().includes((member.last_name || "").toLowerCase())
      );
      const topics = mergeTopicsForMember(fig, analysis.main_topics || [], fallbackTopics);
      return { member: { ...member, _llm_search_terms: fig?.search_terms || [], _main_topics: fallbackTopics }, topics };
    });

    const records = await lookupAll(memberJobs);

    // 6. Commit-fairness: only counts against the daily limit if at least
    // one member had a usable result, matching background.js's rule.
    const anySourceOk = records.some(r => !r._sources_errored);
    if (anySourceOk) {
      await llFetch("/api/scan/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await authHeaders()) },
        body: JSON.stringify({ commitToken }),
      }).catch(() => {});
    }

    // 7. Render - free-tier only, no claim/verdict/upsell.
    hideStatus();
    resultsEl.innerHTML = records.map(renderFreeRecord).join("");
    resultsEl.hidden = false;

    await refreshScanStatus();
  } catch (err) {
    console.error("[scan] pipeline error:", err);
    showStatus(formatError("Something went wrong scanning that article.", err), "error");
  } finally {
    setFormBusy(false);
  }
}

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

async function initScanPage() {
  if (!form) return; // scan.html always has this, but guard for safety

  form.addEventListener("submit", handleScanSubmit);

  try {
    const registration = await getOrCreateWebToken();
    updateRemainingDisplay({
      remaining: Math.max(0, registration.limit - registration.scansToday),
      limit: registration.limit,
    });
  } catch {
    showStatus("Couldn't connect to the scan service. Please refresh and try again.", "error");
    submitBtn.disabled = true;
  }
}

document.addEventListener("DOMContentLoaded", initScanPage);
