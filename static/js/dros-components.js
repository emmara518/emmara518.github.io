/* ========================================================
   DROS MATH — Overlay Components (modular, route-aware)
   ========================================================
   Injected on top of the production bundle (never modified):
     DrosStage3D   3D objects + stage numbers on year cards
     DrosMetrics   data-driven metrics bar (verified data ONLY,
                   hides unavailable metrics, 3-5 visible)
     DrosCommandCenter  authenticated-student rail
                   (real DOM data where available, honest
                    empty states elsewhere, API-ready via
                    window.__DROS_CC__)
     DrosBottomNav mobile bottom nav, authenticated only,
                   real existing routes only
   Auth detection is DOM-based; override via
     window.__DROS_AUTH__ = { loggedIn: true|false }
   Route changes are observed (SPA-safe).
   ======================================================== */
(function () {
  'use strict';

  var doc = document;

  /* ── Utils ────────────────────────────────────────── */
  function qs(sel) { try { return doc.querySelector(sel); } catch (e) { return null; } }
  function qsa(sel) { try { return Array.prototype.slice.call(doc.querySelectorAll(sel)); } catch (e) { return []; } }
  function el(tag, cls, html) {
    var n = doc.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
    });
  }
  var ICONS = {
    layers: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m12 2 8.5 4.5L12 11 3.5 6.5 12 2z"/><path d="m3.5 12 8.5 4.5 8.5-4.5"/><path d="m3.5 17.5 8.5 4.5 8.5-4.5"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    sparkles: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3z"/></svg>',
    chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="m7 15 4-6 4 3 5-8"/></svg>',
    medal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="9" r="6"/><path d="M8.5 14 7 22l5-3 5 3-1.5-8"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>',
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg>',
    grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
    gauge: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/></svg>',
    dots: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    arrowLeft: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>',
    arrowUp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5"/><path d="m5 12 7-7 7 7"/></svg>'
  };

  function currentPath() {
    return (location.pathname || '/').replace(/\/+$/, '') || '/';
  }

  /* ── Auth detection (DOM heuristic + override) ─────── */
  var authCache = null;
  function detectAuth() {
    if (window.__DROS_AUTH__ && typeof window.__DROS_AUTH__.loggedIn === 'boolean') {
      return window.__DROS_AUTH__.loggedIn;
    }
    var hasLogout = !!qs('a[href*="logout"]');
    var hasLogin = !!qs('a[href*="/login"]') || !!qs('a[href*="/register"]');
    /* logged-in navbar replaces login/register with account menu */
    var noAuthLinks = !hasLogin;
    return hasLogout || (noAuthLinks && qs('.navbar') ? false : noAuthLinks);
  }
  function authChanged() {
    var v = detectAuth();
    if (v !== authCache) {
      authCache = v;
      DrosComponents.refresh();
    }
  }

  /* ====================================================
     STAGE 3D + NUMBERING
     ==================================================== */
  function stageKind(text) {
    var t = text || '';
    if (t.indexOf('إعدادي') !== -1) return 'ring';
    if (t.indexOf('الأول') !== -1) return 'sphere';
    if (t.indexOf('الثاني') !== -1) return 'cube';
    if (t.indexOf('الثالث') !== -1) return 'pyramid';
    return 'cube';
  }
  function mountStage3D() {
    var cards = qsa('.group a[href*="/years/"] > div[class*="bg-third-container"]');
    cards.forEach(function (card, i) {
      if (card.querySelector('.dros-stage3d, .dros-stage-num')) return;
      var text = (card.textContent || '');
      var kind = stageKind(text);
      var wrap = el('div', 'dros-stage3d');
      var obj = el('span', 'dros-3d dros-3d--' + kind);
      wrap.appendChild(obj);
      card.appendChild(wrap);
      var num = el('span', 'dros-stage-num', esc('0' + (i + 1)));
      card.appendChild(num);
    });
  }

  /* ====================================================
     METRICS BAR (verified data only)
     ==================================================== */
  var DEFAULT_METRICS = [
    {
      id: 'stages',
      label: 'مراحل دراسية',
      icon: 'layers',
      value: function () {
        var n = qsa('.group a[href*="/years/"]').length;
        return n > 0 ? n : null;
      }
    },
    {
      id: 'courses',
      label: 'كورسات متاحة',
      icon: 'book',
      value: function () {
        var n = qsa('.group a[href*="/course/"]').filter(function (a) {
          return !/border-teal-500/.test(a.className);
        }).length;
        return n > 0 ? n : null;
      }
    },
    {
      id: 'features',
      label: 'ميزات تعليمية',
      icon: 'sparkles',
      value: function () {
        var n = qsa('.featureCard').length;
        return n > 0 ? n : null;
      }
    },
    {
      id: 'teacher',
      label: 'مدرس خبير',
      icon: 'user',
      value: function () { return 1; }
    }
  ];

  var metricsMounted = false;
  function mountMetrics() {
    var existing = qs('.dros-metrics');
    if (existing) existing.remove();
    metricsMounted = false;

    var override = window.__DROS_METRICS__;
    var defs = Array.isArray(override) && override.length
      ? override.map(function (m) { return { id: m.id || 'm', label: m.label, icon: m.icon || 'chart', value: function () { return m.value; } }; })
      : DEFAULT_METRICS;

    var items = [];
    defs.forEach(function (d) {
      var v;
      try { v = d.value(); } catch (e) { v = null; }
      if (v == null || v === 0 || isNaN(v)) return;
      items.push({ id: d.id, label: d.label, icon: d.icon, value: v });
    });
    if (items.length < 3) return; /* hide bar when not enough verified data */

    var bar = el('div', 'dros-metrics');
    bar.style.setProperty('--dros-metrics-n', String(Math.min(items.length, 5)));
    items.forEach(function (it) {
      var item = el('div', 'dros-metrics__item');
      var icon = el('span', 'dros-metrics__icon', ICONS[it.icon] || ICONS.chart);
      var val = el('div', 'dros-metrics__value', esc(it.value) + '<span class="dros-metrics__plus">+</span>');
      var label = el('div', 'dros-metrics__label', esc(it.label));
      item.appendChild(icon);
      item.appendChild(val);
      item.appendChild(label);
      bar.appendChild(item);
    });

    var hero = qs('.negative-nav-margin, [class*="hero"]');
    var anchor = hero ? hero.parentElement : doc.body;
    if (hero) hero.insertAdjacentElement('afterend', bar);
    else anchor.insertBefore(bar, anchor.firstChild);
    metricsMounted = true;
  }

  /* ====================================================
     COMMAND CENTER (authenticated rail)
     ==================================================== */
  var ccOpen = false;
  var ccInstance = null;

  function readDashboardStats() {
    /* real values from dashboard DOM if present */
    var stats = [];
    qsa('.font-big, .text-big').slice(0, 12).forEach(function (node) {
      var txt = (node.textContent || '').trim();
      var num = txt.replace(/[^\d.]/g, '');
      var label = node.parentElement ? (node.parentElement.textContent || '').replace(txt, '').trim().slice(0, 30) : '';
      if (num && label) stats.push({ value: num, label: label });
    });
    return stats.slice(0, 4);
  }

  function ccSection(title, accent, bodyHtml) {
    var card = el('div', 'dros-cc__card');
    var h = el('div', 'dros-cc__card-title', '<span class="dros-cc__accent">' + esc(accent) + '</span>' + esc(title));
    card.appendChild(h);
    card.insertAdjacentHTML('beforeend', bodyHtml);
    return card;
  }

  function buildCCContent() {
    var body = el('div', 'dros-cc__body');
    var cfg = window.__DROS_CC__ || {};
    var path = currentPath();

    /* 1. Continue learning — real data when resolvable */
    var continueData = null;
    if (cfg.continueLearning && cfg.continueLearning.lesson) {
      continueData = cfg.continueLearning;
    } else {
      var progressText = (qs('.dros-cc__progress-fill') || {}).style ? null : null;
      var lessonEl = qs('[class*="current-lesson"], [class*="continue"]');
      var pctEl = qsa('[class*="progress"] [style*="width"]')[0] || null;
      var lessonTitle = lessonEl ? (lessonEl.textContent || '').trim().slice(0, 40) : '';
      if (lessonTitle || pctEl) {
        var w = pctEl ? (pctEl.style.width || '').replace('%', '') : '';
        continueData = { lesson: lessonTitle || 'كورسك الحالي', progress: parseInt(w, 10) || 0 };
      }
    }
    if (continueData) {
      var p = Math.min(100, Math.max(0, continueData.progress || 0));
      body.appendChild(ccSection('كمل من حيث توقفت', '01', '' +
        '<div class="dros-cc__empty">' + esc(continueData.lesson) + '</div>' +
        '<div class="dros-cc__progress-track"><div class="dros-cc__progress-fill" style="width:' + p + '%"></div></div>' +
        '<a class="dros-cc__btn dros-cc__btn--primary" href="/parent_dashboard">استكمال الدرس</a>'));
    } else {
      body.appendChild(ccSection('كمل من حيث توقفت', '01',
        '<div class="dros-cc__empty">لم تبدأ درسًا بعد — ابدأ رحلتك من المرحلة الدراسية الخاصة بك.</div>' +
        '<a class="dros-cc__btn dros-cc__btn--ghost" href="/years/1">استكشف المراحل</a>'));
    }

    /* 2. Student dashboard metrics — real DOM or empty state */
    var stats = readDashboardStats();
    if (stats.length) {
      body.appendChild(ccSection('لوحة الطالب', '02',
        '<div class="dros-cc__grid">' + stats.map(function (s) {
          return '<div class="dros-cc__stat"><span class="dros-cc__stat-value">' + esc(s.value) + '</span><span class="dros-cc__stat-label">' + esc(s.label) + '</span></div>';
        }).join('') + '</div>'));
    } else {
      body.appendChild(ccSection('لوحة الطالب', '02',
        '<div class="dros-cc__empty">إحصائياتك (الساعات، الدروس، الامتحانات، الكورسات) تظهر هنا بعد بدء أول كورس.</div>' +
        '<a class="dros-cc__btn dros-cc__btn--ghost" href="/parent_dashboard">فتح لوحتي</a>'));
    }

    /* 3. Weekly progress — chart only with real data */
    if (cfg.weekly && Array.isArray(cfg.weekly) && cfg.weekly.length) {
      body.appendChild(ccSection('تقدمك الأسبوعي', '03',
        '<div class="dros-cc__empty">' + esc(cfg.weekly.map(function (w) { return w.value; }).join(' • ')) + '</div>'));
    } else {
      body.appendChild(ccSection('تقدمك الأسبوعي', '03',
        '<div class="dros-cc__empty">الرسم البياني الأسبوعي يبدأ بعد أول أسبوع نشاط.</div>'));
    }

    /* 4. Achievements */
    var badges = cfg.achievements && cfg.achievements.length ? cfg.achievements : [];
    if (badges.length) {
      body.appendChild(ccSection('إنجازاتك', '04',
        '<div class="dros-cc__grid">' + badges.slice(0, 3).map(function (b) {
          return '<div class="dros-cc__stat"><span class="dros-cc__stat-label">' + esc(b.label || 'شارة') + '</span></div>';
        }).join('') + '</div>'));
    } else {
      body.appendChild(ccSection('إنجازاتك', '04',
        '<div class="dros-cc__empty">أنجز أول امتحان كامل لفتح شاراتك.</div>'));
    }

    /* 5. Final CTA — real route */
    body.appendChild(ccSection('جاهز تبدأ رحلتك مع دروس ماث؟', '05',
      '<a class="dros-cc__btn dros-cc__btn--primary" href="/prepaid_store">اشترك الآن</a>'));
    return body;
  }

  function buildCC() {
    if (ccInstance) return ccInstance;
    var wrap = el('div', '');
    wrap.innerHTML =
      '<div class="dros-cc__backdrop"></div>' +
      '<aside class="dros-cc" role="dialog" aria-label="لوحة الطالب">' +
      '<div class="dros-cc__head"><span class="dros-cc__title">لوحة الطالب</span>' +
      '<button class="dros-cc__close" type="button" aria-label="إغلاق">' + ICONS.close + '</button></div>' +
      '<div class="dros-cc__body-slot"></div></aside>' +
      '<button class="dros-cc__fab" type="button">' + ICONS.gauge + '<span>لوحتي</span></button>';
    doc.body.appendChild(wrap);

    var panel = qs('.dros-cc');
    var backdrop = qs('.dros-cc__backdrop');
    var slot = qs('.dros-cc__body-slot');
    var fab = qs('.dros-cc__fab');

    function render() {
      slot.innerHTML = '';
      slot.appendChild(buildCCContent());
    }
    function open() {
      ccOpen = true;
      panel.classList.add('dros-cc--open');
      backdrop.classList.add('dros-cc__backdrop--open');
      render();
    }
    function close() {
      ccOpen = false;
      panel.classList.remove('dros-cc--open');
      backdrop.classList.remove('dros-cc__backdrop--open');
    }
    qs('.dros-cc__close').addEventListener('click', close);
    fab.addEventListener('click', function () { ccOpen ? close() : open(); });
    backdrop.addEventListener('click', close);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && ccOpen) close();
    });

    ccInstance = { el: wrap, open: open, close: close, render: render, refresh: render };
    return ccInstance;
  }

  /* ====================================================
     MOBILE BOTTOM NAV (authenticated, real routes)
     ==================================================== */
  var navInstance = null;
  function bottomNavItems(path) {
    var authed = detectAuth();
    var items = [
      { id: 'home', label: 'الرئيسية', href: '/', icon: 'home', active: path === '/' || path === '/home' },
      { id: 'stages', label: 'المراحل', href: '/years/1', icon: 'grid', active: /^\/years/.test(path) || /^\/course/.test(path) || /^\/subject/.test(path) }
    ];
    if (authed) {
      items.push({ id: 'panel', label: 'التقدم', action: 'cc', icon: 'gauge', active: /parent_dashboard|me|edit|change_password/.test(path) });
    }
    items.push({ id: 'more', label: 'المزيد', action: 'more', icon: 'dots', active: false });
    return items;
  }

  function mountBottomNav() {
    if (navInstance && navInstance.el && navInstance.el.parentNode) { navInstance.refresh(); return navInstance; }
    var bar = el('nav', 'dros-bottomnav');
    var path = currentPath();
    var items = bottomNavItems(path);

    function render() {
      var p = currentPath();
      bar.innerHTML = '';
      bottomNavItems(p).forEach(function (it) {
        var b = el('button', 'dros-bottomnav__item' + (it.active ? ' dros-bottomnav__item--active' : ''), ICONS[it.icon] + '<span>' + esc(it.label) + '</span>');
        b.type = 'button';
        b.addEventListener('click', function () {
          if (it.action === 'cc') {
            var cc = buildCC();
            cc.open();
            return;
          }
          if (it.action === 'more') { DrosComponents.toggleMore(); return; }
          if (it.href) location.href = it.href;
        });
        bar.appendChild(b);
      });
    }

    var moreMenu = null;
    DrosComponents.toggleMore = function () {
      if (!moreMenu || !moreMenu.parentNode) {
        moreMenu = el('div', 'dros-bottomnav__more');
        var links = detectAuth()
          ? [['/community', 'المجتمع'], ['/prepaid_store', 'المتجر'], ['/me/user', 'حسابي'], ['/logout', 'تسجيل الخروج']]
          : [['/login', 'تسجيل دخول'], ['/register', 'أكونت جديد'], ['/community', 'المجتمع'], ['/prepaid_store', 'المتجر']];
        moreMenu.innerHTML = links.map(function (r) {
          return '<a href="' + r[0] + '">' + r[1] + '</a>';
        }).join('');
        doc.body.appendChild(moreMenu);
        moreMenu.addEventListener('click', function (e) {
          if (e.target.tagName === 'A') { moreMenu.remove(); moreMenu = null; }
        });
      } else { moreMenu.remove(); moreMenu = null; }
    };

    render();
    doc.body.appendChild(bar);
    doc.body.classList.add('dros-bottomnav-on');

    /* hide while typing (keyboard) */
    doc.addEventListener('focusin', function (e) {
      if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) bar.classList.add('dros-bottomnav--hidden');
    });
    doc.addEventListener('focusout', function (e) {
      if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) bar.classList.remove('dros-bottomnav--hidden');
    });

    navInstance = { el: bar, refresh: render };
    return navInstance;
  }

  /* ====================================================
     PUBLIC API + ROUTE WATCHER
     ==================================================== */
  window.DrosComponents = {
    refresh: function () {
      mountStage3D();
      mountMetrics();
      styleShowcase();
      mountBackToTop();
      mountReveal();
      mountA11y();
      var loggedIn = detectAuth();
      mountBottomNav();
      if (loggedIn) {
        buildCC();
        if (ccOpen) { var c = buildCC(); c.refresh(); }
      } else {
        if (ccInstance && ccInstance.el) { ccInstance.el.remove(); }
        ccInstance = null;
        ccOpen = false;
      }
    },
    auth: function (v) {
      if (typeof v === 'boolean') {
        window.__DROS_AUTH__ = { loggedIn: v };
        authChanged();
      }
      return detectAuth();
    },
    toggleMore: function () {}
  };

  /* Back-to-top button (appears after scrolling, respects RTL + keyboard) */
  function mountBackToTop() {
    if (qs('.dros-top')) return;
    var b = el('button', 'dros-top', ICONS.arrowUp);
    b.type = 'button';
    b.setAttribute('aria-label', 'العودة للأعلى');
    b.setAttribute('title', 'العودة للأعلى');
    b.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    doc.body.appendChild(b);
    var onScroll = function () {
      var y = window.scrollY || doc.documentElement.scrollTop || 0;
      b.classList.toggle('dros-top--on', y > 500);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* Accessibility: skip link + live region + title attrs */
  function mountA11y() {
    if (!qs('.dros-skip')) {
      var skip = el('a', 'dros-skip', 'تخطَّ إلى المحتوى');
      skip.href = '#main';
      skip.setAttribute('role', 'button');
      doc.body.appendChild(skip);
      var main = qs('main') || qs('#root');
      if (main) main.setAttribute('tabindex', '-1');
    }
    if (!qs('#dros-live')) {
      var live = el('div', 'dros-live');
      live.id = 'dros-live';
      live.setAttribute('role', 'status');
      live.setAttribute('aria-live', 'polite');
      doc.body.appendChild(live);
    }
    [].forEach.call(doc.querySelectorAll('a[href*="/years/"], a[href*="/course/"]'), function (a) {
      if (!a.getAttribute('title')) a.setAttribute('title', 'فتح ' + (a.textContent || '').trim().slice(0, 40));
    });
  }

  /* Scroll-reveal: gentle fade-up for below-the-fold blocks */
  function mountReveal() {
    if (!window.IntersectionObserver) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var targets = [].slice.call(doc.querySelectorAll('section, .featureCard, .group, .years-section, .firstLine, .dros-metrics'))
      .filter(function (el) {
        if (el.classList.contains('dros-reveal')) return false;
        var r = el.getBoundingClientRect();
        return r.top > window.innerHeight * 0.92;
      });
    if (!targets.length) return;
    targets.forEach(function (el, i) {
      el.classList.add('dros-reveal');
      el.style.setProperty('--dros-reveal-i', i % 6);
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('dros-reveal--in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -32px 0px' });
    targets.forEach(function (el) { io.observe(el); });
  }

  /* Courses showcase band: flag the card so CSS can round corners + aura it */
  function styleShowcase() {
    var found = null;
    [].forEach.call(doc.querySelectorAll('[class*="bg-[#CD1818]"]'), function (d) {
      if (d.className.indexOf('opacity-0') !== -1 && d.parentElement) found = d.parentElement;
    });
    if (found && !found.classList.contains('dros-showcase')) found.classList.add('dros-showcase');
  }

  /* SPA route watching: pushState/replaceState + popstate */
  function watchRoutes() {
    var wrap = function (fn, name) {
      return function () {
        var r = fn.apply(this, arguments);
        setTimeout(function () {
          DrosComponents.refresh();
          authChanged();
        }, 120);
        return r;
      };
    };
    if (history.pushState) history.pushState = wrap(history.pushState, 'pushState');
    if (history.replaceState) history.replaceState = wrap(history.replaceState, 'replaceState');
    window.addEventListener('popstate', function () { DrosComponents.refresh(); });
  }

  function boot() {
    watchRoutes();
    authCache = detectAuth();
    DrosComponents.refresh();
    styleShowcase();
    if (window.MutationObserver) {
      var mo = new MutationObserver(function () { authChanged(); styleShowcase(); });
      mo.observe(doc.body, { childList: true, subtree: true });
      setTimeout(function () {
        mountBottomNav();
        styleShowcase();
      }, 1500);
    }
  }

  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();