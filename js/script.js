function applySiteLinks() {
  document.querySelectorAll("[data-ll-link]").forEach((el) => {
    const key = el.getAttribute("data-ll-link");
    const url = window.LL_SITE?.[`${key}Url`];
    if (url) el.setAttribute("href", url);
  });
}

function setActiveNav() {
  const page = document.body.dataset.page;
  if (!page) return;
  const link = document.querySelector(`[data-nav="${page}"]`);
  if (link) link.setAttribute("aria-current", "page");
}

function setDateStrip() {
  const el = document.querySelector("[data-ll-date-strip]");
  if (!el) return;
  el.textContent = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function initVideoPlayButtons() {
  document.querySelectorAll("[data-video-play]").forEach((btn) => {
    const iframe = document.getElementById(btn.getAttribute("data-video-play"));
    if (!iframe) return;
    btn.addEventListener("click", () => {
      const url = new URL(iframe.src);
      url.searchParams.set("autoplay", "1");
      iframe.src = url.toString();
    });
  });
}

function initSiteChrome() {
  applySiteLinks();
  setActiveNav();
  setDateStrip();
  initVideoPlayButtons();
  const menuToggle = document.querySelector(".menu-toggle");
  const primaryNav = document.querySelector(".primary-nav");
  const yearEl = document.querySelector("#year");

  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  if (menuToggle && primaryNav) {
    menuToggle.addEventListener("click", () => {
      const isOpen = primaryNav.classList.toggle("is-open");
      menuToggle.setAttribute("aria-expanded", String(isOpen));
    });

    primaryNav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        if (window.matchMedia("(max-width: 680px)").matches) {
          primaryNav.classList.remove("is-open");
          menuToggle.setAttribute("aria-expanded", "false");
        }
      });
    });
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initSiteChrome);
} else {
  initSiteChrome();
}
