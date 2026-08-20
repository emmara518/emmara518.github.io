/* ========================================================
   DROS MATH — Theme Shim v2026
   ========================================================
   Dark mode is the PRIMARY identity (first visit = dark).
   React's own navbar switch is the SINGLE SOURCE OF TRUTH.
   This shim only:
     1. Applies the initial theme BEFORE React mounts (no FOUC).
     2. Syncs <html class="darkmode" data-theme> with body classes
        that React manages (MutationObserver).
     3. Persists theme choice:
        - dark  → writes localStorage["darkmode"]="true"  (React's key)
        - light → REMOVES the key (React treats stored "false"
                  as truthy → would show dark), remembers the
                  choice in a private key instead.
   No extra toggle button is injected — the app's own switch is used.
   ======================================================== */
(function () {
  'use strict';

  var KEY = 'darkmode';          /* React's own storage key */
  var CHOICE = 'dros-theme-choice'; /* our private persistence */
  var html = document.documentElement;
  var getBody = function () { return document.body; };

  /* ── Storage ──────────────────────────────────────── */
  function getStored() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function getChoice() {
    try { return localStorage.getItem(CHOICE); } catch (e) { return null; }
  }
  function storeTheme(dark) {
    try {
      if (dark) {
        localStorage.setItem(KEY, 'true');
        localStorage.setItem(CHOICE, 'dark');
      } else {
        localStorage.removeItem(KEY); /* never store "false": React reads it as truthy */
        localStorage.setItem(CHOICE, 'light');
      }
    } catch (e) {}
  }

  /* ── Apply classes on <html> (early, prevents flash) ── */
  function applyHtml(dark) {
    if (dark) {
      html.classList.add('darkmode');
      html.setAttribute('data-theme', 'dark');
    } else {
      html.classList.remove('darkmode');
      html.setAttribute('data-theme', 'light');
    }
  }

  /* ── Resolve initial theme ────────────────────────── */
  function resolveTheme() {
    if (getStored() === 'true') return true;  /* React wrote dark */
    if (getChoice() === 'light') return false; /* user picked light */
    return true; /* first visit: dark = primary identity */
  }

  var isDark = resolveTheme();
  applyHtml(isDark);
  storeTheme(isDark);

  /* ── Keep <html> in sync with React-managed <body> ─── */
  var lastBodyClass = null;
  function syncFromBody() {
    var b = getBody();
    if (!b) return;
    var c = b.className;
    if (c === lastBodyClass) return;
    lastBodyClass = c;
    var dark = b.classList.contains('darkmode') || b.classList.contains('dark');
    if (dark !== isDark) {
      isDark = dark;
      applyHtml(dark);
      storeTheme(dark);
    }
  }
  if (window.MutationObserver) {
    var mo = new MutationObserver(function () { syncFromBody(); });
    var watchBody = function () {
      var b = getBody();
      if (b) mo.observe(b, { attributes: true, attributeFilter: ['class'] });
    };
    watchBody();
    if (document.readyState !== 'complete') {
      document.addEventListener('DOMContentLoaded', watchBody);
    }
  }

  /* ── Find the real React switch (visible one) ───────── */
  function findReactSwitch() {
    var all = document.querySelectorAll('[role="switch"]');
    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      if (el.offsetParent !== null || el.getBoundingClientRect().width > 0) return el;
    }
    return all[0] || null;
  }

  /* ── Public API ────────────────────────────────────── */
  window.DrosMathTheme = {
    toggle: function () {
      var sw = findReactSwitch();
      if (sw) { sw.click(); return !isDark; }
      isDark = !isDark;
      applyHtml(isDark);
      storeTheme(isDark);
      return isDark;
    },
    isDark: function () { return html.classList.contains('darkmode'); },
    set: function (dark) {
      var sw = findReactSwitch();
      if (sw) {
        var targetOn = sw.getAttribute('aria-checked') === 'true';
        if (dark !== targetOn) sw.click();
        return;
      }
      applyHtml(dark);
      storeTheme(dark);
      isDark = dark;
    }
  };
})();