/* Shared utilities for both versions. No dependencies. */
(function () {
  'use strict';

  var root = document.documentElement;
  var mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var mqHover = window.matchMedia('(hover: hover) and (pointer: fine)');

  var store = {
    get: function (k) { try { return window.sessionStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { window.sessionStorage.setItem(k, v); } catch (e) { /* storage blocked */ } }
  };

  /*
   * Loader: plays once per session. The inline <head> snippet adds
   * `no-loader` to <html> before first paint when the loader should be
   * skipped, so there is never a flash. This finishes the job.
   */
  function runLoader(opts) {
    var el = document.getElementById('loader');
    var done = function () {
      root.classList.add('is-loaded');
      if (el && el.parentNode) el.parentNode.removeChild(el);
    };
    if (!el || root.classList.contains('no-loader')) { done(); return; }

    store.set(opts.key, '1');
    var finished = false;
    var finish = function () {
      if (finished) return;
      finished = true;
      root.classList.add('loader-out');
      window.setTimeout(done, opts.fadeMs || 450);
    };
    window.setTimeout(finish, opts.durationMs || 2400);
    el.addEventListener('click', finish);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') finish(); }, { once: true });
  }

  /* Adds `is-in` to elements as they scroll into view. */
  function reveal(selector, options) {
    var els = Array.prototype.slice.call(document.querySelectorAll(selector));
    if (!els.length) return;
    if (mqReduce.matches || !('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, options || { rootMargin: '0px 0px -12% 0px', threshold: 0.15 });
    els.forEach(function (el) { io.observe(el); });
  }

  /*
   * Touch stand-in for hover: tapping toggles `is-active`, and elements
   * near the middle of the viewport get `is-centered` while scrolling.
   */
  function touchActivate(selector) {
    if (mqHover.matches) return;
    var els = Array.prototype.slice.call(document.querySelectorAll(selector));
    els.forEach(function (el) {
      el.addEventListener('click', function () {
        var on = !el.classList.contains('is-active');
        els.forEach(function (o) { o.classList.remove('is-active'); });
        if (on) el.classList.add('is-active');
      });
    });
    if (!('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        entry.target.classList.toggle('is-centered', entry.isIntersecting);
      });
    }, { rootMargin: '-38% 0px -38% 0px' });
    els.forEach(function (el) { io.observe(el); });
  }

  /* Marks the current page's nav link. */
  function markNav() {
    var page = (location.pathname.split('/').pop() || 'index.html');
    document.querySelectorAll('[data-nav] a').forEach(function (a) {
      if (a.getAttribute('href') === page) a.setAttribute('aria-current', 'page');
    });
  }

  /* Static hosting has no form backend, so the contact form opens a mail draft. */
  function mailtoForm(form) {
    if (!form) return;
    form.addEventListener('submit', function (e) {
      if (form.getAttribute('action')) return; // a real endpoint was configured
      e.preventDefault();
      var d = new FormData(form);
      var body = d.get('message') + '\n\n' + d.get('name') + '\n' + d.get('email');
      location.href = 'mailto:' + form.dataset.mailto +
        '?subject=' + encodeURIComponent('Website inquiry from ' + d.get('name')) +
        '&body=' + encodeURIComponent(body);
    });
  }

  window.SP = {
    store: store,
    reducedMotion: function () { return mqReduce.matches; },
    canHover: function () { return mqHover.matches; },
    runLoader: runLoader,
    reveal: reveal,
    touchActivate: touchActivate,
    markNav: markNav,
    mailtoForm: mailtoForm
  };

  markNav();
  mailtoForm(document.querySelector('form[data-mailto]'));
})();
