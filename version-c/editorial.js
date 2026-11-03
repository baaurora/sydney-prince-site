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
    gsap.set(win, { clipPath: 'inset(100% 0% 0% 0% round 4px)' });
    gsap.set([n1, n2, roles], { autoAlpha: 0 });
    root.classList.add('motion-ready');

    var welcome = hero.querySelector('.hero-welcome');
    var c1 = split(n1, 'chars'), c2 = split(n2, 'chars');
    gsap.set([n1, n2], { autoAlpha: 1 });

    /* entrance: the window opens, each name rises letter by letter, the roles follow */
    heroReady = function () {
      gsap.timeline({ defaults: { ease: 'expo.out' } })
        .to(win, { clipPath: 'inset(0% 0% 0% 0% round 4px)', duration: 1.5, ease: 'expo.inOut' }, 0)
        .from(photo, { scale: 1.18, duration: 2.2 }, 0)
        .from(c1 ? c1.chars : n1, { yPercent: 110, duration: 1.3, stagger: 0.04 }, 0.5)
        .from(c2 ? c2.chars : n2, { yPercent: 110, duration: 1.3, stagger: 0.04 }, 0.62)
        .fromTo(roles, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 1.2 }, 1.05)
        .to(header, { autoAlpha: 1, duration: 1 }, 1.1);
    };

    /* scroll (desktop): the hero holds while the names part, the photo glides left at the same size,
       and the welcome line arrives on the right. No zoom. */
    mm.add('(min-width: 900px)', function () {
      var tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: hero, start: 'top top', end: '+=110%', scrub: 1, pin: true, anticipatePin: 1 }
      });
      tl.to(n1, { xPercent: -60, autoAlpha: 0, duration: 0.5 }, 0)
        .to(n2, { xPercent: 60, autoAlpha: 0, duration: 0.5 }, 0)
        .fromTo(roles, { autoAlpha: 1, y: 0 }, { autoAlpha: 0, y: 30, duration: 0.4, immediateRender: false }, 0)
        .to(win, { left: '27%', duration: 1 }, 0.1)
        .fromTo(welcome, { autoAlpha: 0, y: 50 }, { autoAlpha: 1, y: 0, duration: 0.6 }, 0.45)
        .to({}, { duration: 0.25 });
    });
  }

  if (loaderActive) {
    var video = loader.querySelector('.ld-video');
    var ldName = loader.querySelector('.ld-name');
    var glow = document.createElement('div');
    glow.className = 'ld-glow';
    document.body.appendChild(glow);   /* above the dark layer, so the revealed page looks lit by it */

    /* where the flame sits on screen: the video is 1920x1080, cover-fitted at object-position 62% 50%,
       and the lit match settles at about 69% across, 40% down the frame */
    var flame = function () {
      var vw = window.innerWidth, vh = window.innerHeight;
      var sc = Math.max(vw / 1920, vh / 1080), w = 1920 * sc, h = 1080 * sc;
      return { x: (vw - w) * 0.62 + 0.69 * w, y: (vh - h) * 0.5 + 0.40 * h };
    };
    var place = function () {
      var f = flame();
      loader.style.setProperty('--fx', f.x + 'px');
      loader.style.setProperty('--fy', f.y + 'px');
      glow.style.left = f.x + 'px'; glow.style.top = f.y + 'px';
      /* her name sits just left of the flame, at its height, as if lit by it */
      var nw = ldName.offsetWidth;
      ldName.style.left = Math.max(16, f.x - nw - Math.max(28, window.innerWidth * 0.035)) + 'px';
      ldName.style.top = (f.y - ldName.offsetHeight * 0.55) + 'px';
    };
    place();
    window.addEventListener('resize', place);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(place);

    var finish = function () {
      if (finish.done) return; finish.done = true;
      place();
      gsap.timeline({ onComplete: function () { window.removeEventListener('resize', place); loader.remove(); glow.remove(); root.classList.add('is-loaded'); } })
        /* the warm light swells... */
        .to(glow, { scale: 3.2, autoAlpha: 0.9, duration: 1.1, ease: 'power2.in' }, 0)
        /* ...and spreads outward from the flame, dissolving the dark into the page */
        .fromTo(loader, { '--r': '-26vmax' }, { '--r': '150vmax', duration: 2, ease: 'power2.inOut' }, 0.35)
        .to(ldName, { autoAlpha: 0, duration: 0.9, ease: 'power1.in' }, 0.9)
        .to(glow, { autoAlpha: 0, duration: 0.9, ease: 'power1.out' }, 1.5)
        .call(heroReady, null, 1.2);
    };
    var start = function () {
      try { video.currentTime = 0; } catch (e) {}
      var p = video.play();
      video.classList.add('is-on');
      if (p && p.catch) p.catch(function () { finish(); });
      /* the name catches the light just after the match does, with a faint flicker */
      gsap.timeline({ delay: 1.15 })
        .to(glow, { autoAlpha: 0.55, duration: 0.6, ease: 'power2.out' }, 0)
        .fromTo(ldName, { autoAlpha: 0, filter: 'blur(6px)' }, { autoAlpha: 1, filter: 'blur(0px)', duration: 1.3, ease: 'power2.out' }, 0.15)
        .to(ldName, { opacity: 0.86, duration: 0.12, repeat: 7, yoyo: true, ease: 'sine.inOut' }, 1.5);
      gsap.delayedCall(3.7, finish);
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
