/* Version C: Editorial motion.
 * Framer-style effects rebuilt with GSAP (ScrollTrigger, SplitText) and Lenis:
 *   appear-on-load sequence, scroll-linked transforms, a pinned horizontal track,
 *   masked line/character reveals, clip-path image reveals and smooth scrolling.
 * One easing family throughout (expo-out), no bounce.
 */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduce = SP.reducedMotion();
  var hasGsap = !!(window.gsap && window.ScrollTrigger);

  /* ---------- matchbook jar (works with or without motion) ---------- */
  function matchJar() {
    var btns = Array.prototype.slice.call(document.querySelectorAll('.jbk'));
    if (!btns.length) return;
    var nameEl = document.querySelector('.jar-name');
    var showsEl = document.querySelector('.jar-shows');
    function pick(b) {
      btns.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      nameEl.textContent = b ? b.dataset.name : '';
      showsEl.textContent = b ? b.dataset.shows : '';
    }
    btns.forEach(function (b) {
      b.addEventListener('click', function (e) {
        e.stopPropagation();
        pick(b.getAttribute('aria-pressed') === 'true' ? null : b);
      });
    });
    document.addEventListener('click', function (e) { if (!e.target.closest('.jar-wrap')) pick(null); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') pick(null); });
  }
  matchJar();

  /* tap or press Enter on a matchbook to open or close it */
  document.querySelectorAll('.book').forEach(function (b) {
    var toggle = function () { b.closest('.track-card').classList.toggle('is-open'); };
    b.addEventListener('click', toggle);
    b.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
  });

  /* red-pen circles: draw a hand-made loop sized to the word, measured so it always closes */
  function sizeCircles() {
    document.querySelectorAll('.mk-circle').forEach(function (svg) {
      var r = svg.getBoundingClientRect(), w = r.width, h = r.height;
      if (!w || !h) return;
      svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
      svg.setAttribute('preserveAspectRatio', 'none');
      var p = svg.querySelector('path'), m = 2.5;
      p.removeAttribute('pathLength');
      p.setAttribute('d', 'M' + (w * .52) + ' ' + m +
        ' C' + (w * .82) + ' ' + (m - 1) + ' ' + (w - m) + ' ' + (h * .22) + ' ' + (w - m) + ' ' + (h * .5) +
        ' C' + (w - m) + ' ' + (h * .82) + ' ' + (w * .76) + ' ' + (h - m) + ' ' + (w * .48) + ' ' + (h - m) +
        ' C' + (w * .2) + ' ' + (h - m) + ' ' + m + ' ' + (h * .78) + ' ' + m + ' ' + (h * .48) +
        ' C' + m + ' ' + (h * .18) + ' ' + (w * .24) + ' ' + (m + 1) + ' ' + (w * .56) + ' ' + (m + 1.5) +
        ' C' + (w * .74) + ' ' + (m + 2.5) + ' ' + (w * .86) + ' ' + (h * .16) + ' ' + (w * .92) + ' ' + (h * .28));
      var len = Math.ceil(p.getTotalLength()) + 2;
      p.style.setProperty('--len', len);
    });
  }
  sizeCircles();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(sizeCircles);
  window.addEventListener('resize', sizeCircles);

  /* red-pen markup draws itself when it scrolls into view */
  SP.reveal('.mk', { rootMargin: '0px 0px -15% 0px', threshold: 0.6 });

  /* header gets a soft paper backing once the page scrolls (works without GSAP too) */
  var hdr = document.querySelector('.site-header');
  if (hdr) {
    var onScroll = function () { hdr.classList.toggle('is-scrolled', window.scrollY > 40); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  if (reduce || !hasGsap) {
    root.classList.add('no-motion', 'is-loaded');
    var ld = document.getElementById('loader'); if (ld) ld.remove();
    return;
  }

  var gsap = window.gsap;
  gsap.registerPlugin(window.ScrollTrigger);
  if (window.SplitText) gsap.registerPlugin(window.SplitText);
  var ScrollTrigger = window.ScrollTrigger;
  var EASE = 'expo.out';

  /* ---------- smooth scroll (Lenis) driven by GSAP's ticker ---------- */
  if (window.Lenis) {
    var lenis = new window.Lenis({ lerp: 0.11, wheelMultiplier: 0.95 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  function split(el, type) {
    if (!window.SplitText || !el) return null;
    // keep words intact when splitting into characters so titles never break mid-word
    var t = type === 'chars' ? 'words,chars' : type;
    return window.SplitText.create(el, { type: t, mask: type, linesClass: 'sl', wordsClass: 'sw', charsClass: 'sc' });
  }

  var mm = gsap.matchMedia();

  /* ---------- loading screen (home, once per session): a match strikes, the curtain rises ---------- */
  var loader = document.getElementById('loader');
  var loaderActive = !!loader && !root.classList.contains('no-loader');
  var heroReady = function () {};   // replaced below; called when the page is revealed

  /* ---------- home hero: name either side of the window; pinned, the window grows to full bleed ---------- */
  var hero = document.querySelector('.hero');
  if (hero) {
    var win = hero.querySelector('.hero-window');
    var photo = hero.querySelector('.hero-photo');
    var n1 = hero.querySelector('.hn-1');
    var n2 = hero.querySelector('.hn-2');
    var roles = hero.querySelector('.hero-roles');
    var header = document.querySelector('.site-header');
    gsap.set(header, { autoAlpha: 0 });
    gsap.set(win, { clipPath: 'inset(100% 0% 0% 0% round 14px)' });
    gsap.set([n1, n2, roles], { autoAlpha: 0 });
    root.classList.add('motion-ready');

    heroReady = function () {
      gsap.timeline({ defaults: { ease: EASE } })
        .to(win, { clipPath: 'inset(0% 0% 0% 0% round 14px)', duration: 1.3, ease: 'expo.inOut' }, 0)
        .from(photo, { scale: 1.25, duration: 1.8 }, 0.1)
        .fromTo(n1, { autoAlpha: 0, x: 60 }, { autoAlpha: 1, x: 0, duration: 1.3 }, 0.55)
        .fromTo(n2, { autoAlpha: 0, x: -60 }, { autoAlpha: 1, x: 0, duration: 1.3 }, 0.55)
        .fromTo(roles, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.9 }, 1.0)
        .to(header, { autoAlpha: 1, duration: 0.9 }, 1.0);
    };

    /* scrolling away: the two words drift apart and the photo rises a little. No zoom. */
    mm.add('(min-width: 900px)', function () {
      var st = { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.6 };
      gsap.to(n1, { xPercent: -14, autoAlpha: 0.15, ease: 'none', scrollTrigger: st });
      gsap.to(n2, { xPercent: 14, autoAlpha: 0.15, ease: 'none', scrollTrigger: st });
      gsap.to(win, { yPercent: -12, ease: 'none', scrollTrigger: st });
    });
  }

  if (loaderActive) {
    var video = loader.querySelector('.ld-video');
    var ldName = loader.querySelector('.ld-name');
    var finish = function () {
      if (finish.done) return; finish.done = true;
      gsap.timeline({ onComplete: function () { loader.remove(); root.classList.add('is-loaded'); } })
        .to(ldName, { autoAlpha: 0, y: -20, duration: 0.5, ease: 'power2.in' }, 0)
        .to(loader, { yPercent: -100, duration: 1.1, ease: 'expo.inOut' }, 0.15)   /* the curtain rises */
        .call(heroReady, null, 0.6);
    };
    var start = function () {
      try { video.currentTime = 0; } catch (e) {}
      var p = video.play();
      video.classList.add('is-on');
      if (p && p.catch) p.catch(function () { finish(); });
      gsap.fromTo(ldName, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 1, ease: EASE, delay: 1.1 });
      gsap.delayedCall(3.2, finish);
    };
    if (video.readyState >= 2) start(); else { video.addEventListener('loadeddata', start, { once: true }); gsap.delayedCall(2.5, function () { if (!video.classList.contains('is-on')) finish(); }); }
    loader.addEventListener('click', finish);
  } else {
    if (loader) loader.remove();
    root.classList.add('is-loaded');
    heroReady();
  }

  /* ---------- pinned sideways track (desktop) ---------- */
  mm.add('(min-width: 900px)', function () {
    var track = document.querySelector('.track');
    var list = document.querySelector('.track-list');
    if (!track || !list) return;
    var distance = function () { return Math.max(0, list.scrollWidth - window.innerWidth); };
    var move = gsap.to(list, {
      x: function () { return -distance(); }, ease: 'none',
      scrollTrigger: { trigger: track, start: 'top top', end: function () { return '+=' + distance(); }, scrub: 0.8, pin: true, anticipatePin: 1, invalidateOnRefresh: true }
    });
    /* each matchbook opens as it slides through the middle of the screen */
    list.querySelectorAll('.track-card').forEach(function (card) {
      ScrollTrigger.create({ trigger: card, containerAnimation: move, start: 'center 72%', end: 'center 28%', toggleClass: 'is-open' });
    });
  });

  /* phones: each matchbook opens when it reaches the middle of the screen */
  mm.add('(max-width: 899px)', function () {
    gsap.utils.toArray('.track-card').forEach(function (card) {
      ScrollTrigger.create({ trigger: card.querySelector('.book'), start: 'top 55%', end: 'bottom 35%', toggleClass: { targets: card, className: 'is-open' } });
    });
  });

  /* fonts change line breaks; re-measure once they're in */
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
})();
