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

  /* ---------- home intro: words land, window opens, name rises ---------- */
  var intro = document.querySelector('.intro');
  if (intro) {
    var words = intro.querySelectorAll('.intro-words span');
    var win = intro.querySelector('.intro-window');
    var photo = intro.querySelector('.intro-photo');
    var video = intro.querySelector('.intro-video');
    var name = intro.querySelector('.intro-name [aria-hidden]');
    var foot = intro.querySelector('.intro-foot');
    var header = document.querySelector('.site-header');
    var chars = split(name, 'chars');

    gsap.set([header, foot], { autoAlpha: 0 });
    gsap.set(win, { clipPath: 'inset(50% 50% 50% 50% round 10px)' });
    root.classList.add('motion-ready');

    var tl = gsap.timeline({ defaults: { ease: EASE } });
    tl.from(words, { yPercent: 120, autoAlpha: 0, duration: 1, stagger: 0.14 }, 0.15)
      .to(win, { clipPath: 'inset(0% 0% 0% 0% round 10px)', duration: 1.4, ease: 'expo.inOut' }, 0.75)
      .from(video || photo, { scale: 1.3, duration: 1.8 }, 0.9)
      .from(chars ? chars.chars : name, { yPercent: 115, duration: 1.1, stagger: 0.03 }, 1.35)
      .to([header, foot], { autoAlpha: 1, duration: 0.9 }, 1.9);
    /* the match strikes as the window opens, burns a beat, then Sydney fades in */
    if (video) {
      gsap.set(photo, { autoAlpha: 0 });
      tl.call(function () { try { video.currentTime = 0; video.play().catch(function () { gsap.set(photo, { autoAlpha: 1 }); }); } catch (e) { gsap.set(photo, { autoAlpha: 1 }); } }, null, 0.7)
        .to(photo, { autoAlpha: 1, duration: 1.4, ease: 'power2.inOut' }, 4.1)
        .from(photo, { scale: 1.12, duration: 2.4, ease: EASE }, 4.1)
        .call(function () { video.pause(); }, null, 5.6);
    }

    /* scroll: the name lifts away, the words slide to the top, the window grows to full bleed */
    mm.add('(min-width: 800px)', function () {
      var st = gsap.timeline({
        scrollTrigger: { trigger: intro, start: 'top top', end: '+=110%', scrub: 0.6, pin: true, anticipatePin: 1 }
      });
      st.to(name, { yPercent: -70, autoAlpha: 0, ease: 'none' }, 0)
        .to(foot, { autoAlpha: 0, y: 30, ease: 'none' }, 0)
        .to('.intro-words', { top: 92, ease: 'none' }, 0)
        .to(win, { width: '100vw', height: '100svh', borderRadius: 0, ease: 'none' }, 0)
        .to(photo, { scale: 1.08, ease: 'none' }, 0);
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

  /* ---------- pinned horizontal track (desktop) ---------- */
  mm.add('(min-width: 800px)', function () {
    var track = document.querySelector('.track');
    var list = document.querySelector('.track-list');
    if (!track || !list) return;
    var distance = function () { return Math.max(0, list.scrollWidth - window.innerWidth); };
    var move = gsap.to(list, {
      x: function () { return -distance(); }, ease: 'none',
      scrollTrigger: { trigger: track, start: 'top top', end: function () { return '+=' + distance(); }, scrub: 0.8, pin: true, anticipatePin: 1, invalidateOnRefresh: true }
    });
    /* each card's image drifts inside its frame as the track moves */
    list.querySelectorAll('.tc-media:not(.tc-logo) img').forEach(function (img) {
      gsap.fromTo(img, { xPercent: -5 }, {
        xPercent: 5, ease: 'none',
        scrollTrigger: { trigger: img.parentNode, containerAnimation: move, start: 'left right', end: 'right left', scrub: true }
      });
    });
  });
  /* phones: cards rise in as they arrive */
  mm.add('(max-width: 799px)', function () {
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
