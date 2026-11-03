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

    mm.add('(min-width: 900px)', function () {
      var tl = gsap.timeline({
        scrollTrigger: { trigger: hero, start: 'top top', end: '+=120%', scrub: 0.7, pin: true, anticipatePin: 1 }
      });
      tl.to(n1, { xPercent: -40, autoAlpha: 0, ease: 'none' }, 0)
        .to(n2, { xPercent: 40, autoAlpha: 0, ease: 'none' }, 0)
        .to(roles, { autoAlpha: 0, y: 20, ease: 'none' }, 0)
        .to(win, { width: '100vw', height: '100svh', borderRadius: 0, ease: 'none' }, 0)
        .to(photo, { scale: 1.06, ease: 'none' }, 0);
    });
  }

  if (loaderActive) {
    SP.store.set('sp-loader-c', '1');
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

  /* ---------- masked line reveals for statement text ---------- */
  document.querySelectorAll('.split-lines, .lead-2, .welcome-title').forEach(function (el) {
    var s = split(el, 'lines');
    gsap.from(s ? s.lines : el, {
      yPercent: 110, duration: 1.2, ease: EASE, stagger: 0.08,
      scrollTrigger: { trigger: el, start: 'top 82%', once: true }
    });
  });

  /* ---------- page titles: characters rise on load ---------- */
  document.querySelectorAll('.page-title, .lead').forEach(function (el, i) {
    var s = split(el, 'chars');
    gsap.from(s ? s.chars : el, {
      yPercent: 115, duration: 1.1, ease: EASE, stagger: 0.025, delay: i === 0 ? 0.15 : 0,
      scrollTrigger: i === 0 ? null : { trigger: el, start: 'top 85%', once: true }
    });
  });

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
    list.querySelectorAll('.tc-media:not(.tc-logo) img').forEach(function (img) {
      gsap.fromTo(img, { xPercent: -5 }, {
        xPercent: 5, ease: 'none',
        scrollTrigger: { trigger: img.parentNode, containerAnimation: move, start: 'left right', end: 'right left', scrub: true }
      });
    });
  });
  mm.add('(max-width: 899px)', function () {
    gsap.utils.toArray('.track-card').forEach(function (c) {
      gsap.from(c, { y: 40, autoAlpha: 0, duration: 1, ease: EASE, scrollTrigger: { trigger: c, start: 'top 88%', once: true } });
    });
  });

  /* ---------- photos: clip open from the bottom, image settles ---------- */
  gsap.utils.toArray('.pic .ph, .outro').forEach(function (ph) {
    var img = ph.querySelector('img');
    var tl = gsap.timeline({ scrollTrigger: { trigger: ph, start: 'top 88%', once: true } });
    tl.from(ph, { clipPath: 'inset(100% 0% 0% 0%)', duration: 1.3, ease: 'expo.inOut' });
    if (img) tl.from(img, { scale: 1.25, duration: 1.6, ease: EASE }, 0.1);
  });

  /* stage band parallax */
  var band = document.querySelector('.band-img');
  if (band) gsap.fromTo(band, { yPercent: -8 }, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: '.band', start: 'top bottom', end: 'bottom top', scrub: true } });

  /* outro photo parallax */
  var outroPhoto = document.querySelector('.outro-photo');
  if (outroPhoto) {
    gsap.fromTo(outroPhoto, { yPercent: -8 }, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: '.outro', start: 'top bottom', end: 'bottom top', scrub: true } });
  }

  /* ---------- credits rows and cue marks arrive in sequence ---------- */
  ScrollTrigger.batch('.credit, .cue, .jar-wrap', {
    start: 'top 90%', once: true,
    onEnter: function (els) { gsap.from(els, { y: 18, autoAlpha: 0, duration: 0.9, ease: EASE, stagger: 0.05 }); }
  });

  /* ---------- footer wordmark rises as you reach the bottom ---------- */
  var fname = document.querySelector('.footer-name');
  if (fname) {
    var fs = split(fname, 'chars');
    gsap.from(fs ? fs.chars : fname, { yPercent: 100, duration: 1.2, ease: EASE, stagger: 0.03, scrollTrigger: { trigger: '.site-footer', start: 'top 85%', once: true } });
  }

  /* fonts change line breaks; re-measure once they're in */
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
})();
