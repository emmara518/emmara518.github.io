/* ========================================================
   DROS MATH — Theme Toggle Shim v2026
   ========================================================
   Injected via <script> in index.html.
   Reads/writes the SAME localStorage key ("darkmode") that the
   existing React Context uses — so the SPA and our CSS layer
   stay perfectly synchronized.
   ======================================================== */
(function () {
  'use strict';

  var KEY = 'darkmode';
  var html = document.documentElement;
  var body = document.body;

  /* ── Determine initial theme ──────────────────────── */
  function getStored() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }

  function prefersDark() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  function resolveTheme() {
    var stored = getStored();
    if (stored === 'true' || stored === true) return true;
    if (stored === 'false' || stored === false) return false;
    return prefersDark();
  }

  /* ── Apply theme immediately (prevents FOUC) ─────── */
  function applyTheme(dark) {
    if (dark) {
      html.classList.add('darkmode');
      html.setAttribute('data-theme', 'dark');
      body.classList.add('darkmode');
    } else {
      html.classList.remove('darkmode');
      html.setAttribute('data-theme', 'light');
      body.classList.remove('darkmode');
    }
  }

  /* ── Persist ─────────────────────────────────────── */
  function storeTheme(dark) {
    try { localStorage.setItem(KEY, dark ? 'true' : 'false'); } catch (e) {}
  }

  /* ── Initialize ──────────────────────────────────── */
  var isDark = resolveTheme();
  applyTheme(isDark);
  storeTheme(isDark);

  /* ── Listen for system changes ───────────────────── */
  if (window.matchMedia) {
    var mq = window.matchMedia('(prefers-color-scheme: dark)');
    var handler = function (e) {
      var stored = getStored();
      if (stored === null) {
        applyTheme(e.matches);
      }
    };
    if (mq.addEventListener) mq.addEventListener('change', handler);
    else if (mq.addListener) mq.addListener(handler);
  }

  /* ── Expose toggle for manual use ────────────────── */
  window.DrosMathTheme = {
    toggle: function () {
      isDark = !html.classList.contains('darkmode');
      applyTheme(isDark);
      storeTheme(isDark);
      return isDark;
    },
    isDark: function () {
      return html.classList.contains('darkmode');
    },
    set: function (dark) {
      applyTheme(dark);
      storeTheme(dark);
      isDark = dark;
    }
  };

  /* ── Inject toggle button into navbar when ready ─── */
  function injectToggle() {
    var nav = document.querySelector('.navbar, nav, [class*="navbar"], header');
    if (!nav) return false;

    var btn = document.createElement('button');
    btn.className = 'dros-theme-toggle';
    btn.setAttribute('aria-label', 'تبديل الوضع الليلي');
    btn.setAttribute('type', 'button');
    btn.innerHTML = '<svg class="dros-theme-toggle__icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path class="dros-icon--moon" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/><circle class="dros-icon--sun" cx="12" cy="12" r="5" style="display:none"/><line class="dros-icon--ray1" x1="12" y1="1" x2="12" y2="3" style="display:none"/><line class="dros-icon--ray2" x1="19.07" y1="4.93" x2="17.66" y2="6.34" style="display:none"/><line class="dros-icon--ray3" x1="23" y1="12" x2="21" y2="12" style="display:none"/><line class="dros-icon--ray4" x1="19.07" y1="19.07" x2="17.66" y2="17.66" style="display:none"/><line class="dros-icon--ray5" x1="12" y1="23" x2="12" y2="21" style="display:none"/><line class="dros-icon--ray6" x1="4.93" y1="19.07" x2="6.34" y2="17.66" style="display:none"/><line class="dros-icon--ray7" x1="1" y1="12" x2="3" y2="12" style="display:none"/><line class="dros-icon--ray8" x1="4.93" y1="4.93" x2="6.34" y2="6.34" style="display:none"/></svg>';

    btn.addEventListener('click', function () {
      var nowDark = window.DrosMathTheme.toggle();
      updateIcon(nowDark);
      /* Also toggle the SPA's own context if available */
      try {
        var evt = new CustomEvent('dros:theme-toggle', { detail: { dark: nowDark } });
        document.dispatchEvent(evt);
      } catch (e) {}
    });

    function updateIcon(dark) {
      var moon = btn.querySelector('.dros-icon--moon');
      var sun  = btn.querySelector('.dros-icon--sun');
      var rays = btn.querySelectorAll('[class^="dros-icon--ray"]');
      if (dark) {
        if (moon) moon.style.display = '';
        if (sun)  sun.style.display  = 'none';
        rays.forEach(function(r){ r.style.display = 'none'; });
      } else {
        if (moon) moon.style.display = 'none';
        if (sun)  sun.style.display  = '';
        rays.forEach(function(r){ r.style.display = ''; });
      }
    }

    updateIcon(html.classList.contains('darkmode'));

    /* Insert near login area or at end of nav */
    var loginArea = nav.querySelector('[class*="login"], [class*="auth"], [class*="account"]') || nav.lastElementChild;
    if (loginArea && loginArea.parentNode === nav) {
      nav.insertBefore(btn, loginArea);
    } else {
      nav.appendChild(btn);
    }
    return true;
  }

  /* Try immediately, retry with MutationObserver if SPA hasn't mounted yet */
  if (!injectToggle()) {
    var attempts = 0;
    var observer = new MutationObserver(function () {
      attempts++;
      if (injectToggle() || attempts > 30) {
        observer.disconnect();
      }
    });
    observer.observe(document.body || document.documentElement, {
      childList: true, subtree: true
    });
  }
})();
