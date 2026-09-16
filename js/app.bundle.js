/**
 * HymnNaija — shared utilities.
 * No frameworks, no build step: this file is loaded before every other
 * module and attaches everything to the `HN` namespace on `window`.
 */
(function (global) {
  "use strict";

  const HN = global.HN || {};

  /* ---------------------------------------------------------------------
   * Storage: a thin, failure-safe wrapper around localStorage.
   * Church wifi/data can be flaky and some browsers (private mode, quota
   * exceeded) throw on setItem — every call is wrapped so a storage
   * failure never crashes the reading experience.
   * ------------------------------------------------------------------- */
  const STORAGE_PREFIX = "hymnnaija:";

  const storage = {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem(STORAGE_PREFIX + key);
        if (raw === null) return fallback;
        return JSON.parse(raw);
      } catch (err) {
        console.warn("HymnNaija storage read failed for", key, err);
        return fallback;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
        return true;
      } catch (err) {
        console.warn("HymnNaija storage write failed for", key, err);
        return false;
      }
    },
    remove(key) {
      try {
        localStorage.removeItem(STORAGE_PREFIX + key);
      } catch (err) {
        console.warn("HymnNaija storage remove failed for", key, err);
      }
    },
  };

  /* --------------------------------------------------------------------- */
  function debounce(fn, wait) {
    let t;
    return function debounced(...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  /** Normalize text for search: lowercase, strip diacritics/punctuation. */
  function normalize(str) {
    if (!str) return "";
    return String(str)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function qs(params) {
    return new URLSearchParams(params).toString();
  }

  function getParam(name) {
    return new URLSearchParams(location.search).get(name);
  }

  /** Highlight occurrences of `term` inside `text` (already-escaped safe). */
  function highlight(text, term) {
    const safe = escapeHtml(text);
    if (!term) return safe;
    const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    try {
      const re = new RegExp("(" + escapedTerm + ")", "ig");
      return safe.replace(re, "<mark>$1</mark>");
    } catch (e) {
      return safe;
    }
  }

  /* ---------------------------------------------------------------------
   * Toast: a small, polite, auto-dismissing message region. One live
   * region is created lazily and reused for the life of the page.
   * ------------------------------------------------------------------- */
  let toastRegion = null;
  function toast(message, opts) {
    opts = opts || {};
    if (!toastRegion) {
      toastRegion = document.createElement("div");
      toastRegion.className = "toast-region";
      toastRegion.setAttribute("role", "status");
      toastRegion.setAttribute("aria-live", "polite");
      document.body.appendChild(toastRegion);
    }
    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = message;
    toastRegion.appendChild(el);
    const duration = opts.duration || 2200;
    setTimeout(() => {
      el.style.opacity = "0";
      setTimeout(() => el.remove(), 200);
    }, duration);
  }

  /** Copy text to the clipboard with a graceful fallback. */
  async function copyText(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (err) {
      /* fall through to legacy path */
    }
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      return true;
    } catch (err) {
      return false;
    }
  }

  function onReady(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  HN.storage = storage;
  HN.debounce = debounce;
  HN.escapeHtml = escapeHtml;
  HN.normalize = normalize;
  HN.qs = qs;
  HN.getParam = getParam;
  HN.highlight = highlight;
  HN.toast = toast;
  HN.copyText = copyText;
  HN.onReady = onReady;

  global.HN = HN;
})(window);
/**
 * HymnNaija — icon library.
 * Small inline SVGs (currentColor) so icons theme with light/dark mode and
 * need no icon font or network request. Every icon is decorative by
 * default (aria-hidden) — the enclosing button/link carries the label.
 */
(function (global) {
  "use strict";
  const HN = global.HN;

  const ICONS = {
    search:
      '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"/><path d="M21 21l-4.3-4.3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    close:
      '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    heart:
      '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-10-9.3C.4 7.6 2.3 4 6 4c2.1 0 3.7 1.1 4.6 2.7C11.3 8.1 12 8.1 12.7 6.7 13.6 5.1 15.2 4 17.3 4c3.7 0 5.6 3.6 4 7.2-2.5 4.7-10 9.3-10 9.3z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
    heartFilled:
      '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-10-9.3C.4 7.6 2.3 4 6 4c2.1 0 3.7 1.1 4.6 2.7C11.3 8.1 12 8.1 12.7 6.7 13.6 5.1 15.2 4 17.3 4c3.7 0 5.6 3.6 4 7.2-2.5 4.7-10 9.3-10 9.3z"/></svg>',
    share:
      '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="18" cy="5" r="2.5" stroke="currentColor" stroke-width="2"/><circle cx="6" cy="12" r="2.5" stroke="currentColor" stroke-width="2"/><circle cx="18" cy="19" r="2.5" stroke="currentColor" stroke-width="2"/><path d="M8.2 10.8l7.6-4.6M8.2 13.2l7.6 4.6" stroke="currentColor" stroke-width="2"/></svg>',
    copy:
      '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="9" y="9" width="12" height="12" rx="2" stroke="currentColor" stroke-width="2"/><path d="M5 15H4a1 1 0 01-1-1V4a1 1 0 011-1h10a1 1 0 011 1v1" stroke="currentColor" stroke-width="2"/></svg>',
    sun:
      '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="4.5" stroke="currentColor" stroke-width="2"/><path d="M12 2.5v2M12 19.5v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2.5 12h2M19.5 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    moon:
      '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
    home:
      '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 11.5L12 4l8 7.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 10v9a1 1 0 001 1h4v-6h2v6h4a1 1 0 001-1v-9" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
    book:
      '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 6.5c-1.6-1.3-4-2-6.5-2-.8 0-1.5.7-1.5 1.5v11c0 .8.7 1.5 1.5 1.5 2.5 0 4.9.7 6.5 2 1.6-1.3 4-2 6.5-2 .8 0 1.5-.7 1.5-1.5V6c0-.8-.7-1.5-1.5-1.5-2.5 0-4.9.7-6.5 2z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M12 6.5V19" stroke="currentColor" stroke-width="2"/></svg>',
    settings:
      '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/><path d="M19.4 13.5a1.7 1.7 0 000-3l1.1-1.6-1.7-1.7-1.6 1.1a1.7 1.7 0 00-3 0L13.5 6h-3L9.8 7.8a1.7 1.7 0 00-3 0l-1.6-1.1-1.7 1.7 1.1 1.6a1.7 1.7 0 000 3l-1.1 1.6 1.7 1.7 1.6-1.1a1.7 1.7 0 003 0l.7 1.8h3l.7-1.8a1.7 1.7 0 003 0l1.6 1.1 1.7-1.7z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
    chevronLeft:
      '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M15 5l-7 7 7 7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    chevronRight:
      '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 5l7 7-7 7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    more:
      '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>',
    clock:
      '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="8.5" stroke="currentColor" stroke-width="2"/><path d="M12 7.5V12l3 2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    inbox:
      '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 12l3-8h12l3 8" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M3 12v6a2 2 0 002 2h14a2 2 0 002-2v-6h-5l-1.5 3h-5L8 12H3z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
    alert:
      '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3.5l10 17.3H2z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M12 10v4.5M12 17.2v.1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    wifiOff:
      '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 3l18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M5 8.8a15 15 0 0114-2M8.5 12.3a9.5 9.5 0 019-1.2M12 16v.1M12 16a4.7 4.7 0 013.3 1.4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    check:
      '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 12.5l5 5L20 7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    trash:
      '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 7h16M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m2 0-1 13a1 1 0 01-1 1H8a1 1 0 01-1-1L6 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  };

  HN.icon = function icon(name) {
    return ICONS[name] || "";
  };
})(window);
/**
 * HymnNaija — denomination emblems.
 * These are original, simple symbols (not reproductions of any church's
 * actual crest/trademark) used only to give each church's card slot a
 * distinct, recognizable visual identity.
 */
(function (global) {
  "use strict";
  const HN = global.HN;

  const EMBLEMS = {
    cac: '<circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M12 6v9M8.5 9.5c1 2 2 3 3.5 3s2.5-1 3.5-3M9 17l3-2 3 2" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
    methodist: '<path d="M12 3v18M7 8h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M12 2.5c1.3 1.6 2 2.8 2 4a2 2 0 11-4 0c0-1.2.7-2.4 2-4z" fill="currentColor"/>',
    rccg: '<path d="M12 4v16M6 10h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M12 2v3M12 19v3M4.5 6.5l2 2M17.5 6.5l-2 2M4.5 17.5l2-2M17.5 17.5l-2-2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>',
    ccc: '<path d="M12 21c-1.6 0-2.8-1.2-2.8-2.8 0-1.8 2.8-4.7 2.8-4.7s2.8 2.9 2.8 4.7C14.8 19.8 13.6 21 12 21z" fill="currentColor"/><rect x="10.5" y="8" width="3" height="7" rx="1" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M9 21h6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
    catholic: '<path d="M12 3v13M8.5 7.5h7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M8 16c0 2.5 1.8 4.5 4 4.5s4-2 4-4.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
    anglican: '<path d="M12 3v18M5 9h14M7.5 5.5h9M7.5 15.5h9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    mfm: '<path d="M12 21c-3 0-5-2-5-4.8 0-3 2.3-5.3 3-8 .6 1.6 1 2.2 1.8 2.8C13 9.4 13 7 12 3c3 3 5.5 6.6 5.5 10.2 0 .9-.2 1.7-.5 2.3.6-.3 1-.8 1.3-1.4.4 1 .7 2 .7 2.9 0 2.8-2.5 4-4 4z" fill="currentColor"/>',
    baptist: '<path d="M12 3c3 4 5 7.2 5 10a5 5 0 01-10 0c0-2.8 2-6 5-10z" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M9.5 14.5h5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    cs: '<path d="M12 6c-2 3-6 3-9 1 1 3.5 4.5 5.5 9 5.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 6c2 3 6 3 9 1-1 3.5-4.5 5.5-9 5.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="15.5" r="2.3" fill="currentColor"/>',
    "living-faith": '<path d="M4 10l3 3 5-6 5 6 3-3-1.5 8h-13z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M12 4v14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
    "deeper-life": '<path d="M4 6.5c2-1 5-1.2 8 .5 3-1.7 6-1.5 8-.5v12c-2-1-5-1.2-8 .5-3-1.7-6-1.5-8-.5z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M12 7v12" stroke="currentColor" stroke-width="1.6"/>',
    presbyterian: '<path d="M7 21c-1-4 .5-6 1.5-8C7 12 6.5 9.5 8 7c.5 2 1.5 2.8 2.5 3.5C10 8 10.5 5 12 3c1 2.5 1 5 .5 7.5C13.5 9.8 14.5 9 15 7c1.2 2.5 1 5-1 6 1 2 2.5 4 1.5 8z" fill="currentColor"/>',
    aog: '<path d="M4 13c2 .3 4-.3 5-2 .5 2 2 3 3 3s2.5-1 3-3c1 1.7 3 2.3 5 2-1.3 3-4 5-8 5s-6.7-2-8-5z" fill="currentColor"/><circle cx="12" cy="6" r="1.6" fill="currentColor"/>',
  };

  const DEFAULT_EMBLEM =
    '<path d="M12 3v13M8.5 7.5h7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="18.5" r="2" fill="currentColor"/>';

  HN.emblem = function emblem(id) {
    return (
      '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">' + (EMBLEMS[id] || DEFAULT_EMBLEM) + "</svg>"
    );
  };
})(window);
/**
 * HymnNaija — theme + reading preferences.
 * Applying the theme happens twice: once inline in <head> (see the small
 * blocking script in every page) to avoid a flash of the wrong theme, and
 * again here to wire up any UI controls once the DOM is ready.
 */
(function (global) {
  "use strict";
  const HN = global.HN;

  const THEME_KEY = "theme"; // "light" | "dark" | "system"
  const FONT_SCALE_KEY = "readerFontScale";
  const FONT_SCALE_MIN = 0.85;
  const FONT_SCALE_MAX = 1.6;
  const FONT_SCALE_STEP = 0.1;

  function getThemePref() {
    return HN.storage.get(THEME_KEY, "system");
  }

  function applyTheme(pref) {
    const root = document.documentElement;
    if (pref === "light" || pref === "dark") {
      root.setAttribute("data-theme", pref);
    } else {
      root.removeAttribute("data-theme"); // let the OS media query decide
    }
    // Keep the browser UI (address bar on Android, etc.) in sync.
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      const isDark =
        pref === "dark" ||
        (pref === "system" &&
          window.matchMedia &&
          window.matchMedia("(prefers-color-scheme: dark)").matches);
      meta.setAttribute("content", isDark ? "#12182b" : "#1e2a52");
    }
  }

  function setThemePref(pref) {
    HN.storage.set(THEME_KEY, pref);
    applyTheme(pref);
    document.dispatchEvent(new CustomEvent("hn:themechange", { detail: { pref } }));
  }

  function getFontScale() {
    return HN.storage.get(FONT_SCALE_KEY, 1);
  }

  function setFontScale(scale) {
    const clamped = Math.min(FONT_SCALE_MAX, Math.max(FONT_SCALE_MIN, scale));
    const rounded = Math.round(clamped * 100) / 100;
    document.documentElement.style.setProperty("--reader-scale", rounded);
    HN.storage.set(FONT_SCALE_KEY, rounded);
    return rounded;
  }

  function initFontScale() {
    document.documentElement.style.setProperty("--reader-scale", getFontScale());
  }

  HN.theme = {
    KEY: THEME_KEY,
    get: getThemePref,
    apply: applyTheme,
    set: setThemePref,
  };

  HN.fontScale = {
    MIN: FONT_SCALE_MIN,
    MAX: FONT_SCALE_MAX,
    STEP: FONT_SCALE_STEP,
    get: getFontScale,
    set: setFontScale,
    init: initFontScale,
  };
})(window);
/**
 * HymnNaija — language preference.
 * A single global preference (English / Yorùbá / ...), stored in
 * localStorage. Per-denomination availability is decided by data.js at
 * fetch time, since not every book has every language yet.
 */
(function (global) {
  "use strict";
  const HN = global.HN;
  const LANG_KEY = "languagePref";
  const DEFAULT_LANG = "en";

  function getLangPref() {
    return HN.storage.get(LANG_KEY, DEFAULT_LANG);
  }

  function setLangPref(code) {
    HN.storage.set(LANG_KEY, code);
    document.dispatchEvent(new CustomEvent("hn:languagechange", { detail: { code } }));
  }

  HN.language = {
    DEFAULT: DEFAULT_LANG,
    get: getLangPref,
    set: setLangPref,
  };
})(window);
/**
 * HymnNaija — data layer.
 * All hymn content lives in static JSON under /data. This module fetches,
 * caches (in memory, per page load) and normalizes that data. No database,
 * no backend — the service worker is what makes repeat/offline loads fast.
 */
(function (global) {
  "use strict";
  const HN = global.HN;

  const REGISTRY_URL = "data/denominations.json";

  let registryPromise = null;
  const collectionCache = new Map(); // denomination id -> Promise<collection>

  class DataError extends Error {
    constructor(message, cause) {
      super(message);
      this.name = "DataError";
      this.cause = cause;
    }
  }

  async function fetchJson(url) {
    let res;
    try {
      res = await fetch(url, { cache: "no-cache" });
    } catch (networkErr) {
      throw new DataError("network", networkErr);
    }
    if (!res.ok) {
      throw new DataError("http-" + res.status);
    }
    try {
      return await res.json();
    } catch (parseErr) {
      throw new DataError("parse", parseErr);
    }
  }

  function getDenominations() {
    if (!registryPromise) {
      registryPromise = fetchJson(REGISTRY_URL).then((json) => json.denominations || []);
      registryPromise.catch(() => {
        registryPromise = null; // allow retry on next call
      });
    }
    return registryPromise;
  }

  async function getDenominationMeta(id) {
    const list = await getDenominations();
    return list.find((d) => d.id === id) || null;
  }

  function getCollection(id, lang) {
    const useLang = lang || (HN.language ? HN.language.get() : "en");
    const cacheKey = id + ":" + useLang;
    if (!collectionCache.has(cacheKey)) {
      const p = (async () => {
        const meta = await getDenominationMeta(id);
        if (!meta) throw new DataError("unknown-denomination");
        if (meta.comingSoon) throw new DataError("coming-soon");
        const files = meta.files || (meta.file ? { en: meta.file } : {});
        const available = meta.languages || Object.keys(files);
        const resolvedLang = available.indexOf(useLang) !== -1 ? useLang : "en";
        const fileUrl = files[resolvedLang] || files.en || meta.file;
        const json = await fetchJson(fileUrl);
        return Object.assign({ meta, requestedLanguage: useLang, resolvedLanguage: resolvedLang }, json);
      })();
      p.catch(() => collectionCache.delete(cacheKey));
      collectionCache.set(cacheKey, p);
    }
    return collectionCache.get(cacheKey);
  }

  async function getHymn(denominationId, number, lang) {
    const collection = await getCollection(denominationId, lang);
    const num = Number(number);
    const hymn = collection.hymns.find((h) => h.number === num);
    if (!hymn) throw new DataError("unknown-hymn");
    return { hymn, collection };
  }

  /** Load every denomination's hymns, flattened, for global search. */
  async function getAllHymnsFlat(lang) {
    const list = await getDenominations();
    const collections = await Promise.allSettled(list.map((d) => getCollection(d.id, lang)));
    const flat = [];
    collections.forEach((result, i) => {
      if (result.status !== "fulfilled") return;
      const collection = result.value;
      collection.hymns.forEach((h) => {
        flat.push({
          denominationId: list[i].id,
          denominationName: collection.denominationName,
          accent: list[i].accent,
          number: h.number,
          title: h.title,
          author: h.author,
          verses: h.verses,
          _searchTitle: HN.normalize(h.title),
          _searchLyrics: HN.normalize(h.verses.join(" ")),
          _searchNumber: String(h.number),
        });
      });
    });
    return flat;
  }

  HN.data = {
    DataError,
    getDenominations,
    getDenominationMeta,
    getCollection,
    getHymn,
    getAllHymnsFlat,
  };
})(window);
/**
 * HymnNaija — favorites (localStorage only, no account/backend).
 * Stored as an array of { denominationId, number, title, denominationName,
 * accent, savedAt } so the favorites page can render without re-fetching
 * every collection.
 */
(function (global) {
  "use strict";
  const HN = global.HN;
  const KEY = "favorites";

  function all() {
    return HN.storage.get(KEY, []);
  }

  function keyFor(denominationId, number) {
    return denominationId + ":" + number;
  }

  function isFavorite(denominationId, number) {
    const k = keyFor(denominationId, number);
    return all().some((f) => keyFor(f.denominationId, f.number) === k);
  }

  function add(entry) {
    const list = all();
    const k = keyFor(entry.denominationId, entry.number);
    if (list.some((f) => keyFor(f.denominationId, f.number) === k)) return list;
    const next = [{ ...entry, savedAt: Date.now() }, ...list];
    HN.storage.set(KEY, next);
    document.dispatchEvent(new CustomEvent("hn:favoriteschange"));
    return next;
  }

  function remove(denominationId, number) {
    const k = keyFor(denominationId, number);
    const next = all().filter((f) => keyFor(f.denominationId, f.number) !== k);
    HN.storage.set(KEY, next);
    document.dispatchEvent(new CustomEvent("hn:favoriteschange"));
    return next;
  }

  function toggle(entry) {
    if (isFavorite(entry.denominationId, entry.number)) {
      remove(entry.denominationId, entry.number);
      return false;
    }
    add(entry);
    return true;
  }

  function groupedByDenomination() {
    const list = all();
    const groups = new Map();
    list.forEach((f) => {
      if (!groups.has(f.denominationId)) {
        groups.set(f.denominationId, {
          denominationId: f.denominationId,
          denominationName: f.denominationName,
          accent: f.accent,
          items: [],
        });
      }
      groups.get(f.denominationId).items.push(f);
    });
    return Array.from(groups.values());
  }

  HN.favorites = { all, isFavorite, add, remove, toggle, groupedByDenomination };
})(window);
/**
 * HymnNaija — recently viewed hymns (localStorage only).
 * Capped list, most recent first, de-duplicated by hymn.
 */
(function (global) {
  "use strict";
  const HN = global.HN;
  const KEY = "recents";
  const MAX_ITEMS = 20;

  function all() {
    return HN.storage.get(KEY, []);
  }

  function record(entry) {
    const list = all().filter(
      (r) => !(r.denominationId === entry.denominationId && r.number === entry.number)
    );
    list.unshift({ ...entry, viewedAt: Date.now() });
    HN.storage.set(KEY, list.slice(0, MAX_ITEMS));
    document.dispatchEvent(new CustomEvent("hn:recentschange"));
  }

  function clear() {
    HN.storage.set(KEY, []);
    document.dispatchEvent(new CustomEvent("hn:recentschange"));
  }

  HN.recents = { all, record, clear, MAX_ITEMS };
})(window);
/**
 * HymnNaija — shared render helpers.
 * Plain string-templating into innerHTML. No virtual DOM, no framework —
 * pages call these to build the bits of markup they share.
 */
(function (global) {
  "use strict";
  const HN = global.HN;

  const FEEDBACK_EMAIL = "aoluwatobi928@gmail.com";

  function requestMailto(d) {
    const subject = encodeURIComponent("HymnNaija — please add " + (d.fullName || d.name));
    const body = encodeURIComponent(
      "Hi,\n\nPlease add " + (d.fullName || d.name) + " to HymnNaija.\n\nHymn book name (if known): \n" +
        "Link or file, if you have one: \n\nThanks!"
    );
    return `mailto:${FEEDBACK_EMAIL}?subject=${subject}&body=${body}`;
  }

  function denomCard(d) {
    if (d.comingSoon) {
      return `
      <div class="denom-card denom-card--soon" style="--card-accent:${d.accent || "var(--brand)"}" aria-disabled="true">
        <div class="denom-card__soon-badge">Coming soon</div>
        <div class="denom-card__emblem">${HN.emblem(d.id)}</div>
        <div class="denom-card__name">${HN.escapeHtml(d.name)}</div>
        <a class="denom-card__request" href="${requestMailto(d)}">Request this church</a>
      </div>`;
    }
    return `
      <a class="denom-card" href="denomination.html?id=${encodeURIComponent(d.id)}"
         style="--card-accent:${d.accent || "var(--brand)"}">
        <div class="denom-card__emblem">${HN.emblem(d.id)}</div>
        <div class="denom-card__name">${HN.escapeHtml(d.name)}</div>
        <div class="denom-card__meta">${d.hymnCount} hymns</div>
      </a>`;
  }

  function hymnRow(entry, opts) {
    opts = opts || {};
    const term = opts.highlightTerm || "";
    const readerUrl =
      "reader.html?" +
      HN.qs({ den: entry.denominationId, num: entry.number, ...(opts.from ? { from: opts.from } : {}) });
    const isFav = HN.favorites.isFavorite(entry.denominationId, entry.number);
    const showDenom = opts.showDenomination;
    return `
      <li class="hymn-row" data-den="${HN.escapeHtml(entry.denominationId)}" data-num="${entry.number}">
        <a class="hymn-row__number" href="${readerUrl}" aria-hidden="true">${entry.number}</a>
        <a class="hymn-row__body" href="${readerUrl}">
          <div class="hymn-row__title">${HN.highlight(entry.title, term)}</div>
          <div class="hymn-row__meta">${
            showDenom ? HN.escapeHtml(entry.denominationName) + (entry.author ? " · " : "") : ""
          }${entry.author ? HN.escapeHtml(entry.author) : ""}</div>
        </a>
        <button type="button" class="hymn-row__fav" aria-pressed="${isFav}"
          aria-label="${isFav ? "Remove from favorites" : "Add to favorites"}"
          data-fav-toggle data-den="${HN.escapeHtml(entry.denominationId)}" data-num="${entry.number}"
          data-title="${HN.escapeHtml(entry.title)}" data-denomname="${HN.escapeHtml(entry.denominationName || "")}"
          data-accent="${HN.escapeHtml(entry.accent || "")}">
          ${HN.icon(isFav ? "heartFilled" : "heart")}
        </button>
      </li>`;
  }

  function skeletonRows(n) {
    return Array.from({ length: n })
      .map(
        () => `<li class="hymn-row skeleton-row" aria-hidden="true">
          <div class="skeleton"></div><div class="skeleton"></div>
        </li>`
      )
      .join("");
  }

  function emptyState(opts) {
    return `
      <div class="state-block">
        <div class="state-block__icon">${HN.icon(opts.icon || "inbox")}</div>
        <h3>${HN.escapeHtml(opts.title)}</h3>
        <p>${HN.escapeHtml(opts.message)}</p>
        ${opts.actionLabel ? `<a class="btn btn--primary" href="${opts.actionHref || "#"}">${HN.escapeHtml(opts.actionLabel)}</a>` : ""}
      </div>`;
  }

  function errorState(opts) {
    opts = opts || {};
    return `
      <div class="state-block" role="alert">
        <div class="state-block__icon">${HN.icon(opts.icon || "alert")}</div>
        <h3>${HN.escapeHtml(opts.title || "Something went wrong")}</h3>
        <p>${HN.escapeHtml(opts.message || "Please check your connection and try again.")}</p>
        <button type="button" class="btn btn--ghost" data-retry>Try again</button>
      </div>`;
  }

  /** Delegate favorite-button clicks within a container (event bubbling, so
   *  this can be attached once even as the list re-renders). */
  function wireFavoriteToggles(container) {
    container.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-fav-toggle]");
      if (!btn || !container.contains(btn)) return;
      e.preventDefault();
      const entry = {
        denominationId: btn.dataset.den,
        number: Number(btn.dataset.num),
        title: btn.dataset.title,
        denominationName: btn.dataset.denomname,
        accent: btn.dataset.accent,
      };
      const nowFav = HN.favorites.toggle(entry);
      btn.setAttribute("aria-pressed", String(nowFav));
      btn.setAttribute("aria-label", nowFav ? "Remove from favorites" : "Add to favorites");
      btn.innerHTML = HN.icon(nowFav ? "heartFilled" : "heart");
      HN.toast(nowFav ? "Added to favorites" : "Removed from favorites");
    });
  }

  HN.render = { denomCard, hymnRow, skeletonRows, emptyState, errorState, wireFavoriteToggles };
})(window);
/**
 * HymnNaija — client-side search.
 * Runs entirely in the browser against the flattened hymn index built by
 * data.js. Ranking: number match first (exact, then prefix), then title
 * match, then a lyrics match — so "23" surfaces hymn #23 before any hymn
 * whose lyrics happen to contain "23".
 */
(function (global) {
  "use strict";
  const HN = global.HN;

  let indexPromise = null;
  function getIndex() {
    if (!indexPromise) indexPromise = HN.data.getAllHymnsFlat();
    return indexPromise;
  }

  function scoreEntry(entry, normQuery, isNumericQuery) {
    if (isNumericQuery) {
      if (entry._searchNumber === normQuery) return { score: 100, field: "number" };
      if (entry._searchNumber.startsWith(normQuery)) return { score: 90, field: "number" };
    }
    if (entry._searchTitle === normQuery) return { score: 80, field: "title" };
    if (entry._searchTitle.startsWith(normQuery)) return { score: 70, field: "title" };
    if (entry._searchTitle.includes(normQuery)) return { score: 60, field: "title" };
    if (entry._searchLyrics.includes(normQuery)) return { score: 40, field: "lyrics" };
    return null;
  }

  /**
   * @param {string} rawQuery
   * @param {object} [opts] - { denominationId, limit }
   */
  async function run(rawQuery, opts) {
    opts = opts || {};
    const normQuery = HN.normalize(rawQuery);
    if (!normQuery) return { query: "", results: [] };

    const isNumericQuery = /^\d+$/.test(normQuery);
    const index = await getIndex();

    const scoped = opts.denominationId
      ? index.filter((e) => e.denominationId === opts.denominationId)
      : index;

    const scored = [];
    for (const entry of scoped) {
      const match = scoreEntry(entry, normQuery, isNumericQuery);
      if (match) scored.push({ entry, ...match });
    }

    scored.sort((a, b) => b.score - a.score || a.entry.title.localeCompare(b.entry.title));

    const limited = opts.limit ? scored.slice(0, opts.limit) : scored;

    return {
      query: rawQuery,
      normQuery,
      results: limited.map((s) => ({ ...s.entry, matchField: s.field })),
    };
  }

  HN.search = { run, getIndex };
})(window);
/**
 * HymnNaija — app bootstrap.
 * Runs on every page: marks the active tab, registers the service worker,
 * announces connectivity changes, and captures the PWA install prompt so
 * the Settings page can offer an explicit "Install app" action.
 */
(function (global) {
  "use strict";
  const HN = global.HN;

  function markActiveTab() {
    const page = document.body.dataset.page;
    if (!page) return;
    document.querySelectorAll(".tabbar__item[data-tab]").forEach((el) => {
      if (el.dataset.tab === page) el.setAttribute("aria-current", "page");
      else el.removeAttribute("aria-current");
    });
  }

  function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return;
    // file:// pages can't register a service worker; fail quietly.
    if (location.protocol === "file:") return;
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("service-worker.js").catch((err) => {
        console.warn("HymnNaija: service worker registration failed", err);
      });
    });
  }

  function watchConnectivity() {
    let lastKnown = navigator.onLine;
    window.addEventListener("online", () => {
      if (!lastKnown) HN.toast("Back online");
      lastKnown = true;
    });
    window.addEventListener("offline", () => {
      HN.toast("You're offline — saved hymns are still available");
      lastKnown = false;
    });
  }

  function captureInstallPrompt() {
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      global.__hnInstallPrompt = e;
      document.dispatchEvent(new CustomEvent("hn:installavailable"));
    });
    window.addEventListener("appinstalled", () => {
      global.__hnInstallPrompt = null;
      HN.toast("HymnNaija installed");
    });
  }

  HN.onReady(() => {
    markActiveTab();
    registerServiceWorker();
    watchConnectivity();
    captureInstallPrompt();
    if (HN.fontScale) HN.fontScale.init();
  });
})(window);
(function (global) {
  "use strict";
  const HN = global.HN;

  function wireSearch() {
    const form = document.getElementById("homeSearchForm");
    const input = document.getElementById("homeSearchInput");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const q = input.value.trim();
      if (q) location.href = "search.html?" + HN.qs({ q });
    });
  }

  async function renderDenominations() {
    const scroller = document.getElementById("homeDenomScroller");
    try {
      const list = await HN.data.getDenominations();
      scroller.innerHTML = list.map(HN.render.denomCard).join("");
    } catch (err) {
      scroller.parentElement.innerHTML = HN.render.errorState({
        title: "Couldn't load denominations",
        message: "Please check your connection and try again.",
      });
      scroller.parentElement.querySelector("[data-retry]").addEventListener("click", () => location.reload());
    }
  }

  function renderRecents() {
    const section = document.getElementById("homeRecentsSection");
    const list = document.getElementById("homeRecentsList");
    const items = HN.recents.all().slice(0, 5);
    if (!items.length) {
      section.hidden = true;
      return;
    }
    section.hidden = false;
    list.innerHTML = items
      .map(
        (r) => `
        <li>
          <a class="recent-card" href="reader.html?${HN.qs({ den: r.denominationId, num: r.number })}">
            <div class="hymn-row__number" aria-hidden="true" style="min-width:auto;color:${r.accent || "var(--accent-strong)"}">${r.number}</div>
            <div class="hymn-row__body">
              <div class="hymn-row__title">${HN.escapeHtml(r.title)}</div>
              <div class="hymn-row__meta">${HN.escapeHtml(r.denominationName)}</div>
            </div>
          </a>
        </li>`
      )
      .join("");
  }

  HN.onReady(() => {
    if (!document.getElementById("homeSearchForm")) return;
    wireSearch();
    renderDenominations();
    renderRecents();
    document.addEventListener("hn:recentschange", renderRecents);
  });
})(window);
(function (global) {
  "use strict";
  const HN = global.HN;

  async function render() {
    const grid = document.getElementById("browseGrid");
    if (!grid) return;
    grid.innerHTML = `
      <div class="skeleton" style="height:96px"></div>
      <div class="skeleton" style="height:96px"></div>
      <div class="skeleton" style="height:96px"></div>
      <div class="skeleton" style="height:96px"></div>`;
    try {
      const list = await HN.data.getDenominations();
      grid.innerHTML = list.map(HN.render.denomCard).join("");
    } catch (err) {
      grid.innerHTML = HN.render.errorState({
        title: "Couldn't load denominations",
        message: "Please check your connection and try again.",
      });
      grid.querySelector("[data-retry]").addEventListener("click", render);
    }
  }

  HN.onReady(render);
})(window);
(function (global) {
  "use strict";
  const HN = global.HN;
  const PAGE_SIZE = 30;

  let allHymns = [];
  let filtered = [];
  let visibleCount = PAGE_SIZE;
  let denId, collectionMeta;

  const els = {};

  function matches(hymn, normQuery) {
    if (!normQuery) return true;
    if (String(hymn.number).startsWith(normQuery)) return true;
    if (HN.normalize(hymn.title).includes(normQuery)) return true;
    return false;
  }

  function renderList() {
    const term = els.search.value.trim();
    if (!filtered.length) {
      els.list.innerHTML = "";
      els.empty.hidden = false;
      els.empty.innerHTML = HN.render.emptyState({
        icon: "search",
        title: term ? "No hymns match your search" : "No hymns yet",
        message: term
          ? `Nothing found for "${term}" in ${collectionMeta.denominationName}. Try a hymn number or a different word.`
          : "This collection doesn't have any hymns loaded yet.",
      });
      els.loadMoreWrap.hidden = true;
      return;
    }
    els.empty.hidden = true;
    const slice = filtered.slice(0, visibleCount);
    els.list.innerHTML = slice
      .map((h) =>
        HN.render.hymnRow(
          {
            denominationId: denId,
            denominationName: collectionMeta.denominationName,
            accent: collectionMeta.accent,
            number: h.number,
            title: h.title,
            author: h.author,
          },
          { highlightTerm: term }
        )
      )
      .join("");
    els.loadMoreWrap.hidden = visibleCount >= filtered.length;
  }

  function applyFilter() {
    const normQuery = HN.normalize(els.search.value);
    filtered = allHymns.filter((h) => matches(h, normQuery));
    visibleCount = PAGE_SIZE;
    renderList();
  }

  function wireControls() {
    els.search.addEventListener(
      "input",
      HN.debounce(() => {
        els.clearBtn.classList.toggle("is-visible", !!els.search.value);
        applyFilter();
      }, 150)
    );
    els.clearBtn.addEventListener("click", () => {
      els.search.value = "";
      els.clearBtn.classList.remove("is-visible");
      els.search.focus();
      applyFilter();
    });
    els.loadMoreBtn.addEventListener("click", () => {
      visibleCount += PAGE_SIZE;
      renderList();
    });
    HN.render.wireFavoriteToggles(els.list);
  }

  async function init() {
    denId = HN.getParam("id");
    els.list.innerHTML = HN.render.skeletonRows(6);
    if (!denId) {
      showFatalError("missing-id");
      return;
    }
    try {
      const collection = await HN.data.getCollection(denId);
      collectionMeta = {
        denominationName: collection.denominationName,
        accent: collection.meta.accent,
        bookTitle: collection.bookTitle,
      };
      allHymns = collection.hymns;
      filtered = allHymns;

      document.title = collection.denominationName + " hymns · HymnNaija";
      els.header.style.setProperty("--card-accent", collection.meta.accent || "var(--brand)");
      if (els.emblem) els.emblem.innerHTML = HN.emblem(denId);
      els.name.textContent = collection.denominationName;
      if (els.topbarTitle) els.topbarTitle.textContent = collection.denominationName;
      els.book.textContent = collection.bookTitle + " · " + collection.hymnCount + " hymns";

      wireControls();
      renderList();
    } catch (err) {
      showFatalError(err && err.message);
    }
  }

  function showFatalError(kind) {
    els.list.innerHTML = "";
    els.empty.hidden = false;
    const offline = !navigator.onLine;
    els.empty.innerHTML = HN.render.errorState({
      icon: kind === "coming-soon" ? "clock" : offline ? "wifiOff" : "alert",
      title:
        kind === "unknown-denomination"
          ? "Denomination not found"
          : kind === "coming-soon"
          ? "This church is coming soon"
          : offline
          ? "You're offline"
          : "Couldn't load this collection",
      message:
        kind === "unknown-denomination"
          ? "That denomination isn't available yet."
          : kind === "coming-soon"
          ? "We haven't added this church's hymn book yet. Head back to Browse to see what's available, or use Settings → Feedback to request it."
          : "Please check your connection and try again.",
    });
    const retry = els.empty.querySelector("[data-retry]");
    if (retry && kind !== "coming-soon") retry.addEventListener("click", init);
  }

  HN.onReady(() => {
    if (!document.getElementById("denomHymnList")) return;
    els.topbarTitle = document.getElementById("topbarTitle");
    els.header = document.getElementById("denomHeader");
    els.emblem = document.getElementById("denomEmblem");
    els.name = document.getElementById("denomName");
    els.book = document.getElementById("denomBook");
    els.search = document.getElementById("denomSearchInput");
    els.clearBtn = document.getElementById("denomSearchClear");
    els.list = document.getElementById("denomHymnList");
    els.empty = document.getElementById("denomEmpty");
    els.loadMoreWrap = document.getElementById("denomLoadMoreWrap");
    els.loadMoreBtn = document.getElementById("denomLoadMoreBtn");
    init();
  });
})(window);
/**
 * HymnNaija — hymn reader page.
 * Reads ?den=<id>&num=<n> from the URL, loads that hymn plus its sibling
 * collection (for prev/next), and wires the reading controls.
 */
(function (global) {
  "use strict";
  const HN = global.HN;

  const els = {};

  function qEl(id) {
    return document.getElementById(id);
  }

  function buildShareText(hymn, collection) {
    const lines = [
      `${collection.denominationName} Hymn ${hymn.number}: ${hymn.title}`,
      "",
      ...hymn.verses.map((v, i) => `${i + 1}. ${v}`),
      "",
      "Shared from HymnNaija",
    ];
    return lines.join("\n");
  }

  function renderHymn(hymn, collection) {
    document.title = `${hymn.title} — ${collection.denominationName} #${hymn.number} · HymnNaija`;
    els.denName.textContent = collection.denominationName;
    els.hymnNum.textContent = "#" + hymn.number;
    els.heading.innerHTML = `
      <div class="hymn-heading__number">${hymn.number}</div>
      <h1 class="hymn-heading__title">${HN.escapeHtml(hymn.title)}</h1>
      <div class="hymn-heading__meta">${[hymn.author, hymn.composer].filter(Boolean).map(HN.escapeHtml).join(" · ")}</div>
    `;
    els.body.innerHTML = hymn.verses
      .map(
        (v, i) => `
      <div class="hymn-verse">
        <div class="hymn-verse__number" aria-hidden="true">${i + 1}</div>
        <p class="hymn-verse__text">${HN.escapeHtml(v)}</p>
      </div>`
      )
      .join("");

    const isSample = hymn.copyrightStatus && hymn.copyrightStatus.indexOf("placeholder") === 0;
    const isMachineTranslated =
      collection.meta &&
      Array.isArray(collection.meta.machineTranslated) &&
      collection.meta.machineTranslated.indexOf(collection.resolvedLanguage) !== -1;
    const translationNotice = isMachineTranslated
      ? `<span class="hymn-source-note__badge">AI-translated</span> This ${HN.escapeHtml(
          (collection.resolvedLanguage || "").toUpperCase()
        )} text was machine-translated and is not an official church text. `
      : "";
    els.sourceNote.innerHTML = isSample
      ? `This is placeholder sample text for development, not a real hymn text. Source collections will be added once verified as public domain or licensed. Book: ${HN.escapeHtml(collection.bookTitle)}.`
      : `${translationNotice}Source: ${HN.escapeHtml(hymn.source || collection.bookTitle)}.`;

    const isFav = HN.favorites.isFavorite(collection.denomination, hymn.number);
    els.favBtn.setAttribute("aria-pressed", String(isFav));
    els.favBtn.innerHTML = HN.icon(isFav ? "heartFilled" : "heart") + '<span class="sr-only">Favorite</span>';

    els.main.classList.add("route-enter");
  }

  function renderPrevNext(hymn, collection) {
    const idx = collection.hymns.findIndex((h) => h.number === hymn.number);
    const prev = idx > 0 ? collection.hymns[idx - 1] : null;
    const next = idx < collection.hymns.length - 1 ? collection.hymns[idx + 1] : null;

    els.prevBtn.disabled = !prev;
    els.nextBtn.disabled = !next;
    els.prevBtn.onclick = prev
      ? () => navigateTo(collection.denomination, prev.number)
      : null;
    els.nextBtn.onclick = next
      ? () => navigateTo(collection.denomination, next.number)
      : null;
  }

  function navigateTo(denId, num) {
    const url = "reader.html?" + HN.qs({ den: denId, num });
    location.href = url;
  }

  function wireFontStepper() {
    function refresh() {
      const scale = HN.fontScale.get();
      els.fontDec.disabled = scale <= HN.fontScale.MIN + 0.001;
      els.fontInc.disabled = scale >= HN.fontScale.MAX - 0.001;
    }
    els.fontDec.addEventListener("click", () => {
      HN.fontScale.set(HN.fontScale.get() - HN.fontScale.STEP);
      refresh();
    });
    els.fontInc.addEventListener("click", () => {
      HN.fontScale.set(HN.fontScale.get() + HN.fontScale.STEP);
      refresh();
    });
    refresh();
  }

  function wireMoreSheet(hymn, collection) {
    const backdrop = qEl("readerSheetBackdrop");
    const sheet = qEl("readerSheet");

    function open() {
      backdrop.classList.add("is-open");
      sheet.classList.add("is-open");
      sheet.querySelector("button").focus();
    }
    function close() {
      backdrop.classList.remove("is-open");
      sheet.classList.remove("is-open");
    }

    els.moreBtn.addEventListener("click", open);
    backdrop.addEventListener("click", close);
    sheet.querySelectorAll("[data-close-sheet]").forEach((b) => b.addEventListener("click", close));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });

    qEl("actionShare").addEventListener("click", async () => {
      const text = buildShareText(hymn, collection);
      if (navigator.share) {
        try {
          await navigator.share({ title: hymn.title, text });
        } catch (err) {
          /* user cancelled the share sheet — no-op */
        }
      } else {
        const ok = await HN.copyText(text);
        HN.toast(ok ? "Copied — paste it to share" : "Couldn't copy. Try selecting the text manually.");
      }
      close();
    });

    qEl("actionCopy").addEventListener("click", async () => {
      const ok = await HN.copyText(buildShareText(hymn, collection));
      HN.toast(ok ? "Lyrics copied" : "Couldn't copy. Try selecting the text manually.");
      close();
    });

    qEl("actionFavorite").addEventListener("click", () => {
      const nowFav = HN.favorites.toggle({
        denominationId: collection.denomination,
        number: hymn.number,
        title: hymn.title,
        denominationName: collection.denominationName,
        accent: (collection.meta && collection.meta.accent) || "",
      });
      els.favBtn.setAttribute("aria-pressed", String(nowFav));
      els.favBtn.innerHTML = HN.icon(nowFav ? "heartFilled" : "heart") + '<span class="sr-only">Favorite</span>';
      HN.toast(nowFav ? "Added to favorites" : "Removed from favorites");
      close();
    });
  }

  function wireFavButtonTopbar(hymn, collection) {
    els.favBtn.addEventListener("click", () => {
      const nowFav = HN.favorites.toggle({
        denominationId: collection.denomination,
        number: hymn.number,
        title: hymn.title,
        denominationName: collection.denominationName,
        accent: (collection.meta && collection.meta.accent) || "",
      });
      els.favBtn.setAttribute("aria-pressed", String(nowFav));
      els.favBtn.innerHTML = HN.icon(nowFav ? "heartFilled" : "heart") + '<span class="sr-only">Favorite</span>';
      HN.toast(nowFav ? "Added to favorites" : "Removed from favorites");
    });
  }

  function showLoading() {
    els.heading.innerHTML = "";
    els.body.innerHTML = `
      <div class="skeleton" style="height:2.4em;width:60%;margin-bottom:1em;"></div>
      <div class="skeleton" style="height:1.2em;margin-bottom:.6em;"></div>
      <div class="skeleton" style="height:1.2em;margin-bottom:.6em;"></div>
      <div class="skeleton" style="height:1.2em;width:80%;"></div>
    `;
  }

  function showError(kind) {
    const offline = !navigator.onLine;
    els.body.innerHTML = HN.render.errorState({
      icon: offline ? "wifiOff" : "alert",
      title: offline ? "You're offline" : "Couldn't load this hymn",
      message:
        kind === "unknown-hymn"
          ? "That hymn number couldn't be found in this collection."
          : offline
          ? "Connect to the internet at least once so this hymn can be saved for offline reading."
          : "Please check your connection and try again.",
    });
    els.body.querySelector("[data-retry]").addEventListener("click", init);
    els.heading.innerHTML = "";
    els.prevBtn.disabled = true;
    els.nextBtn.disabled = true;
  }

  let wakeLockSentinel = null;
  async function acquireWakeLock() {
    const enabled = HN.storage.get("keepAwakeWhileReading", true);
    if (!enabled || !("wakeLock" in navigator)) return;
    try {
      wakeLockSentinel = await navigator.wakeLock.request("screen");
    } catch (err) {
      /* denied or unsupported in this context — reading still works fine */
    }
  }
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") acquireWakeLock();
  });

  function wireImmersiveToggle() {
    const shell = document.querySelector(".reader-shell");
    els.body.addEventListener("click", (e) => {
      if (e.target.closest("a, button")) return; // don't hijack real controls
      shell.classList.toggle("is-immersive");
    });
  }

  function maybeShowImmersiveHint() {
    if (HN.storage.get("seenImmersiveHint", false)) return;
    HN.storage.set("seenImmersiveHint", true);
    HN.toast("Tip: tap the hymn text to hide controls for full-screen reading");
  }

  function wireLangButton(collection) {
    const langs = (collection.meta && collection.meta.languages) || ["en"];
    if (langs.length < 2) {
      els.langBtn.hidden = true;
      return;
    }
    const labelMap = { en: "EN", yo: "YO" };
    els.langBtn.hidden = false;
    els.langBtn.innerHTML =
      '<span aria-hidden="true" style="font-weight:700;font-size:0.85em">' +
      (labelMap[collection.resolvedLanguage] || collection.resolvedLanguage.toUpperCase()) +
      '</span><span class="sr-only">Switch language</span>';
    els.langBtn.onclick = () => {
      const idx = langs.indexOf(collection.resolvedLanguage);
      const next = langs[(idx + 1) % langs.length];
      HN.language.set(next);
      init();
    };
  }

  async function init() {
    const denId = HN.getParam("den");
    const num = HN.getParam("num");
    if (!denId || !num) {
      showError("unknown-hymn");
      return;
    }
    showLoading();
    try {
      const { hymn, collection } = await HN.data.getHymn(denId, num);
      renderHymn(hymn, collection);
      renderPrevNext(hymn, collection);
      wireFavButtonTopbar(hymn, collection);
      wireMoreSheet(hymn, collection);
      wireLangButton(collection);
      HN.recents.record({
        denominationId: collection.denomination,
        number: hymn.number,
        title: hymn.title,
        denominationName: collection.denominationName,
        accent: (collection.meta && collection.meta.accent) || "",
      });
      acquireWakeLock();
      maybeShowImmersiveHint();
    } catch (err) {
      showError(err && err.message);
    }
  }

  HN.onReady(() => {
    if (!qEl("readerMain")) return;
    els.main = qEl("readerMain");
    els.denName = qEl("readerDenName");
    els.hymnNum = qEl("readerHymnNum");
    els.heading = qEl("hymnHeading");
    els.body = qEl("hymnBody");
    els.sourceNote = qEl("hymnSourceNote");
    els.favBtn = qEl("readerFavBtn");
    els.langBtn = qEl("readerLangBtn");
    els.moreBtn = qEl("readerMoreBtn");
    els.prevBtn = qEl("readerPrevBtn");
    els.nextBtn = qEl("readerNextBtn");
    els.fontDec = qEl("fontDecBtn");
    els.fontInc = qEl("fontIncBtn");

    wireFontStepper();
    wireImmersiveToggle();
    init();
  });
})(window);
(function (global) {
  "use strict";
  const HN = global.HN;

  const els = {};
  let activeFilter = null; // denomination id or null for "All"

  function renderChips(denominations) {
    const chips = [{ id: null, name: "All" }, ...denominations.map((d) => ({ id: d.id, name: d.name }))];
    els.filters.innerHTML = chips
      .map(
        (c) => `<button type="button" class="filter-chip" aria-pressed="${activeFilter === c.id}"
                  data-filter="${c.id === null ? "" : HN.escapeHtml(c.id)}">${HN.escapeHtml(c.name)}</button>`
      )
      .join("");
    els.filters.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-filter]");
      if (!btn) return;
      activeFilter = btn.dataset.filter || null;
      Array.from(els.filters.children).forEach((c) =>
        c.setAttribute("aria-pressed", String(c === btn))
      );
      runSearch();
    });
  }

  function showIdle() {
    els.count.textContent = "";
    els.results.innerHTML = HN.render.emptyState({
      icon: "search",
      title: "Search every hymnal at once",
      message: "Type a hymn number, a title, or a phrase from the lyrics.",
    });
  }

  async function runSearch() {
    const q = els.input.value.trim();
    if (!q) {
      showIdle();
      history.replaceState(null, "", "search.html");
      return;
    }
    history.replaceState(null, "", "search.html?" + HN.qs({ q }));
    els.results.innerHTML = HN.render.skeletonRows(5);
    try {
      const { results } = await HN.search.run(q, { denominationId: activeFilter, limit: 200 });
      if (!results.length) {
        els.count.textContent = "";
        els.results.innerHTML = HN.render.emptyState({
          icon: "search",
          title: "No hymns found",
          message: `Nothing matched "${q}". Try a different word, or just the hymn number.`,
        });
        return;
      }
      els.count.textContent = results.length + (results.length === 1 ? " hymn found" : " hymns found");
      els.results.innerHTML = results
        .map((r) => HN.render.hymnRow(r, { showDenomination: true, highlightTerm: q, from: "search" }))
        .join("");
    } catch (err) {
      els.count.textContent = "";
      const offline = !navigator.onLine;
      els.results.innerHTML = HN.render.errorState({
        icon: offline ? "wifiOff" : "alert",
        title: offline ? "You're offline" : "Search is unavailable",
        message: offline
          ? "Connect to the internet at least once so hymns can be indexed for offline search."
          : "Please check your connection and try again.",
      });
      els.results.querySelector("[data-retry]").addEventListener("click", runSearch);
    }
  }

  async function init() {
    if (!document.getElementById("searchResults")) return;
    els.input = document.getElementById("searchInput");
    els.clearBtn = document.getElementById("searchClear");
    els.filters = document.getElementById("searchFilters");
    els.count = document.getElementById("searchCount");
    els.results = document.getElementById("searchResults");

    HN.render.wireFavoriteToggles(els.results);

    const initialQuery = HN.getParam("q") || "";
    els.input.value = initialQuery;
    els.clearBtn.classList.toggle("is-visible", !!initialQuery);

    els.input.addEventListener(
      "input",
      HN.debounce(() => {
        els.clearBtn.classList.toggle("is-visible", !!els.input.value);
        runSearch();
      }, 200)
    );
    els.clearBtn.addEventListener("click", () => {
      els.input.value = "";
      els.clearBtn.classList.remove("is-visible");
      showIdle();
      els.input.focus();
      history.replaceState(null, "", "search.html");
    });

    try {
      const list = await HN.data.getDenominations();
      renderChips(list);
    } catch (err) {
      /* filters are a progressive enhancement; search still works without them */
    }

    if (initialQuery) runSearch();
    else showIdle();
  }

  HN.onReady(init);
})(window);
(function (global) {
  "use strict";
  const HN = global.HN;

  function render() {
    const container = document.getElementById("favoritesContainer");
    if (!container) return;
    const groups = HN.favorites.groupedByDenomination();
    if (!groups.length) {
      container.innerHTML = HN.render.emptyState({
        icon: "heart",
        title: "No favorites yet",
        message: "Tap the heart on any hymn to save it here for quick access during service.",
        actionLabel: "Explore hymns",
        actionHref: "browse.html",
      });
      return;
    }
    container.innerHTML = groups
      .map(
        (g) => `
        <div class="fav-group">
          <h2 class="fav-group__title" style="--card-accent:${g.accent || "var(--brand)"}">${HN.escapeHtml(g.denominationName)}</h2>
          <ul class="hymn-list">
            ${g.items
              .map((item) =>
                HN.render.hymnRow({
                  denominationId: item.denominationId,
                  denominationName: item.denominationName,
                  accent: item.accent,
                  number: item.number,
                  title: item.title,
                })
              )
              .join("")}
          </ul>
        </div>`
      )
      .join("");
    HN.render.wireFavoriteToggles(container);
  }

  HN.onReady(() => {
    render();
    document.addEventListener("hn:favoriteschange", render);
  });
})(window);
(function (global) {
  "use strict";
  const HN = global.HN;
  const WAKE_KEY = "keepAwakeWhileReading";

  function wireTheme() {
    const group = document.getElementById("themeSegmented");
    const current = HN.theme.get();
    Array.from(group.children).forEach((btn) => {
      btn.setAttribute("aria-pressed", String(btn.dataset.value === current));
      btn.addEventListener("click", () => {
        HN.theme.set(btn.dataset.value);
        Array.from(group.children).forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
      });
    });
  }

  function wireLanguage() {
    const group = document.getElementById("languageSegmented");
    if (!group) return;
    const current = HN.language.get();
    Array.from(group.children).forEach((btn) => {
      btn.setAttribute("aria-pressed", String(btn.dataset.value === current));
      btn.addEventListener("click", () => {
        HN.language.set(btn.dataset.value);
        Array.from(group.children).forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
      });
    });
  }

  function wireFontSize() {
    const dec = document.getElementById("settingsFontDec");
    const inc = document.getElementById("settingsFontInc");
    const value = document.getElementById("settingsFontValue");
    function refresh() {
      const scale = HN.fontScale.get();
      value.textContent = Math.round(scale * 100) + "%";
      dec.disabled = scale <= HN.fontScale.MIN + 0.001;
      inc.disabled = scale >= HN.fontScale.MAX - 0.001;
    }
    dec.addEventListener("click", () => {
      HN.fontScale.set(HN.fontScale.get() - HN.fontScale.STEP);
      refresh();
    });
    inc.addEventListener("click", () => {
      HN.fontScale.set(HN.fontScale.get() + HN.fontScale.STEP);
      refresh();
    });
    refresh();
  }

  function wireWakeLock() {
    const row = document.getElementById("wakeLockRow");
    const toggle = document.getElementById("wakeLockToggle");
    if (!("wakeLock" in navigator)) {
      row.hidden = true;
      return;
    }
    const enabled = HN.storage.get(WAKE_KEY, true);
    toggle.setAttribute("aria-checked", String(enabled));
    toggle.addEventListener("click", () => {
      const next = toggle.getAttribute("aria-checked") !== "true";
      toggle.setAttribute("aria-checked", String(next));
      HN.storage.set(WAKE_KEY, next);
    });
  }

  function wireInstall() {
    const row = document.getElementById("installRow");
    const btn = document.getElementById("installBtn");
    function refresh() {
      row.hidden = !global.__hnInstallPrompt;
    }
    refresh();
    document.addEventListener("hn:installavailable", refresh);
    btn.addEventListener("click", async () => {
      const promptEvent = global.__hnInstallPrompt;
      if (!promptEvent) return;
      promptEvent.prompt();
      await promptEvent.userChoice;
      global.__hnInstallPrompt = null;
      refresh();
    });
  }

  function wireDataActions() {
    document.getElementById("clearRecentsBtn").addEventListener("click", () => {
      HN.recents.clear();
      HN.toast("Recently viewed cleared");
    });
    document.getElementById("resetAppBtn").addEventListener("click", () => {
      if (!confirm("This clears favorites, recently viewed and preferences on this device. Continue?")) return;
      Object.keys(localStorage)
        .filter((k) => k.indexOf("hymnnaija:") === 0)
        .forEach((k) => localStorage.removeItem(k));
      HN.toast("App data reset");
      setTimeout(() => location.reload(), 800);
    });
  }

  HN.onReady(() => {
    if (!document.getElementById("themeSegmented")) return;
    wireTheme();
    wireLanguage();
    wireFontSize();
    wireWakeLock();
    wireInstall();
    wireDataActions();
  });
})(window);
