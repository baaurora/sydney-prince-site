/* Version C: Editorial motion.
 * Framer-style effects rebuilt with GSAP (ScrollTrigger, SplitText) and Lenis:
 *   appear-on-load sequence, scroll-linked transforms, a pinned horizontal track,
 *   masked line/character reveals, clip-path image reveals and smooth scrolling.
 * One easing family throughout (expo-out), no bounce.
 */
(function () {
  'use strict';

  var root = document.documentElement;
  root.classList.add('is-loaded'); // no loader screen on this version; the home intro plays instead
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

  if (reduce || !hasGsap) { root.classList.add('no-motion'); return; }

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

  /* ---------- home intro: the matchbook arrives, its lid flips open, the match strikes ---------- */
  var intro = document.querySelector('.intro');
  if (intro) {
    var roles = intro.querySelectorAll('.intro-roles li');
    var name = intro.querySelector('.intro-name .nm');
    var line = intro.querySelector('.intro-line');
    var book = intro.querySelector('.matchbook');
    var lid = intro.querySelector('.mb-lid');
    var photo = intro.querySelector('.intro-photo');
    var video = intro.querySelector('.intro-video');
    var header = document.querySelector('.site-header');
    var chars = split(name, 'chars');

    gsap.set(header, { autoAlpha: 0 });
    if (video) gsap.set(photo, { autoAlpha: 0 });
    root.classList.add('motion-ready');

    var tl = gsap.timeline({ defaults: { ease: EASE } });
    tl.from(book, { y: 80, rotation: -7, autoAlpha: 0, duration: 1.3 }, 0.1)
      .from(chars ? chars.chars : name, { yPercent: 115, duration: 1.15, stagger: 0.028 }, 0.3)
      .from(roles, { y: 14, autoAlpha: 0, duration: 0.8, stagger: 0.08 }, 0.85)
      .from(line, { y: 14, autoAlpha: 0, duration: 0.8 }, 1.0)
      /* the cover swings toward you and up over the top, like opening a matchbook */
      .to(lid, { rotationX: 120, duration: 1.4, ease: 'expo.inOut' }, 1.1)
      /* ...and once the match is lit it folds the rest of the way back and falls away, leaving a clean frame */
      .to(lid, { rotationX: 178, autoAlpha: 0, duration: 1.1, ease: 'power2.in' }, 3.1)
      .to(header, { autoAlpha: 1, duration: 0.9 }, 1.5);
    if (video) {
      tl.call(function () { try { video.currentTime = 0; video.play().catch(function () { gsap.set(photo, { autoAlpha: 1 }); }); } catch (e) { gsap.set(photo, { autoAlpha: 1 }); } }, null, 1.2)
        .to(photo, { autoAlpha: 1, duration: 1.4, ease: 'power2.inOut' }, 4.4)
        .from(photo, { scale: 1.12, duration: 2.4 }, 4.4)
        .call(function () { video.pause(); }, null, 6);
    }

    /* scrolling away: the two lines of the name drift apart, the matchbook lifts and tilts */
    mm.add('(min-width: 960px)', function () {
      var st = { trigger: intro, start: 'top top', end: 'bottom top', scrub: 0.6 };
      gsap.to('.nm-1', { xPercent: -5, ease: 'none', scrollTrigger: st });
      gsap.to('.nm-2', { xPercent: 7, ease: 'none', scrollTrigger: st });
      gsap.to('.book-wrap', { yPercent: -14, rotation: 3, ease: 'none', scrollTrigger: st });
    });
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

  /* ---------- stacked cards: each settles back as the next slides over it ---------- */
  mm.add('(min-width: 960px)', function () {
    var cards = gsap.utils.toArray('.stack-card');
    cards.forEach(function (card, i) {
      var next = cards[i + 1];
      if (!next) return;
      gsap.to(card.querySelector('.sc-inner'), {
        scale: 0.93, filter: 'brightness(.97)', ease: 'none',
        scrollTrigger: { trigger: next, start: 'top bottom', end: 'top 20%', scrub: true }
      });
    });
  });
  mm.add('(max-width: 959px)', function () {
    gsap.utils.toArray('.stack-card').forEach(function (c) {
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
