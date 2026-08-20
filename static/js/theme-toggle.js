/* ========================================================
   DROS MATH — Theme Toggle Shim v2026
   ========================================================
   Dark mode is the PRIMARY identity.
   React's own switch is the SINGLE SOURCE OF TRUTH for theme.
   This shim:
     1. Applies the initial theme BEFORE React mounts (no FOUC).
     2. Syncs <html class="darkmode" data-theme> with body classes
        that React manages (MutationObserver).
     3. Injects a visible toggle button that drives the REAL
        React switch (so React Context state stays correct).
     4. Writes the SAME localStorage key ("darkmode") React uses.
   ======================================================== */
(function () {
  'use strict';

  var KEY = 'darkmode';
  var html = document.documentElement;
  var getBody = function () { return document.body; };

  /* ── Storage ──────────────────────────────────────── */
  function getStored() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function storeTheme(dark) {
    try { localStorage.setItem(KEY, dark ? 'true' : 'false'); } catch (e) {}
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

  /* ── Resolve initial theme: stored → default dark ──── */
  function resolveTheme() {
    var stored = getStored();
    if (stored === 'true' || stored === true) return true;
    if (stored === 'false' || stored === false) return false;
    return true; /* Dark = primary identity */
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
      updateToggleIcon();
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

  /* ── Inject visible toggle button into navbar ──────── */
  function buildIcon() {
    return '<svg class="dros-theme-toggle__icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
      '<path class="dros-icon--moon" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>' +
      '<circle class="dros-icon--sun" cx="12" cy="12" r="4" style="display:none"/>' +
      '<g class="dros-icon--rays" style="display:none">' +
      '<line x1="12" y1="2" x2="12" y2="4"/><line x1="4.93" y1="4.93" x2="6.34" y2="6.34"/>' +
      '<line x1="2" y1="12" x2="4" y2="12"/><line x1="4.93" y1="19.07" x2="6.34" y2="17.66"/>' +
      '<line x1="12" y1="22" x2="12" y2="20"/><line x1="19.07" y1="19.07" x2="17.66" y2="17.66"/>' +
      '<line x1="22" y1="12" x2="20" y2="12"/><line x1="19.07" y1="4.93" x2="17.66" y2="6.34"/>' +
      '</g></svg>';
  }

  var toggleBtn = null;
  function updateToggleIcon() {
    if (!toggleBtn) return;
    var dark = html.classList.contains('darkmode');
    var moon = toggleBtn.querySelector('.dros-icon--moon');
    var sun = toggleBtn.querySelector('.dros-icon--sun');
    var rays = toggleBtn.querySelector('.dros-icon--rays');
    if (moon) moon.style.display = dark ? '' : 'none';
    if (sun) sun.style.display = dark ? 'none' : '';
    if (rays) rays.style.display = dark ? 'none' : '';
    toggleBtn.setAttribute('aria-label', dark ? 'التبديل إلى الوضع الفاتح' : 'التبديل إلى الوضع الليلي');
  }

  function injectToggle() {
    var nav = document.querySelector('.navbar, nav, header');
    if (!nav) return false;
    if (toggleBtn) return true;

    toggleBtn = document.createElement('button');
    toggleBtn.className = 'dros-theme-toggle';
    toggleBtn.setAttribute('type', 'button');
    toggleBtn.setAttribute('aria-label', 'التبديل إلى الوضع الليلي');
    toggleBtn.innerHTML = buildIcon();
    toggleBtn.addEventListener('click', function () {
      window.DrosMathTheme.toggle();
    });

    var anchor = nav.querySelector('[class*="login"], [class*="auth"], [class*="account"], [class*="btn"]') || nav.lastElementChild;
    if (anchor && anchor.parentNode === nav) {
      nav.insertBefore(toggleBtn, anchor);
    } else {
      nav.appendChild(toggleBtn);
    }
    updateToggleIcon();
    return true;
  }

  if (!injectToggle()) {
    var attempts = 0;
    var obs = new MutationObserver(function () {
      attempts++;
      if (injectToggle() || attempts > 40) obs.disconnect();
    });
    obs.observe(document.documentElement, { childList: true, subtree: true });
  }
})();