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
    /* a picked matchbook links to where that venue appears on the resume */
    var KEYS = { 'Spellbound Theatre': 'Spellbound', 'NYC Children’s Theater': 'Children', 'The Public Theater': 'Public Theater' };
    var link = document.createElement('a');
    link.className = 'jar-link';
    link.hidden = true;
    link.textContent = 'See it on the resume';
    nameEl.parentNode.appendChild(link);
    function resumeUrl(b) { return 'resume.html#at=' + encodeURIComponent(KEYS[b.dataset.name] || b.dataset.name); }
    function pick(b) {
      btns.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      nameEl.textContent = b ? b.dataset.name : '';
      showsEl.textContent = b ? b.dataset.shows : '';
      link.hidden = !b;
      if (b) link.href = resumeUrl(b);
    }
    btns.forEach(function (b) {
      b.addEventListener('click', function (e) {
        e.stopPropagation();
        /* clicking the matchbook that's already out opens the resume at that venue */
        if (b.getAttribute('aria-pressed') === 'true') { window.location.href = resumeUrl(b); return; }
        pick(b);
      });
    });
    document.addEventListener('click', function (e) { if (!e.target.closest('.jar-wrap')) pick(null); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') pick(null); });
  }
  matchJar();

  /* resume: arriving from the jar (#at=Venue) scrolls to that venue's credits and marks them */
  function creditFocus(scroller) {
    var m = window.location.hash.match(/^#at=(.+)$/);
    if (!m) return;
    var key = decodeURIComponent(m[1]).toLowerCase();
    var rows = Array.prototype.filter.call(document.querySelectorAll('.credit'), function (r) {
      return r.textContent.toLowerCase().indexOf(key) > -1;
    });
    if (!rows.length) return;
    rows.forEach(function (r) { r.classList.add('is-focus'); });
    setTimeout(function () {
      var y = rows[0].getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.28;
      if (scroller) scroller.scrollTo(y, { duration: 1.4 }); else window.scrollTo({ top: y, behavior: 'smooth' });
    }, 700);
  }

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
    creditFocus(null);
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
  creditFocus(lenis || null);

  function split(el, type) {
    if (!window.SplitText || !el) return null;
    // keep words intact when splitting into characters so titles never break mid-word
    var t = type === 'chars' ? 'words,chars' : type;
    return window.SplitText.create(el, { type: t, mask: type, linesClass: 'sl', wordsClass: 'sw', charsClass: 'sc' });
  }

  var mm = gsap.matchMedia();

  /* ---------- home hero: her name runs across the screen in front of the photo ---------- */
  var loader = document.getElementById('loader');
  var loaderActive = !!loader && !root.classList.contains('no-loader');
  var heroReady = function () {};
  var hero = document.querySelector('.hero');
  var nameEl = hero && hero.querySelector('.hero-name');

  if (hero) {
    var inner = hero.querySelector('.hn-in');
    var win = hero.querySelector('.hero-window');
    var photo = hero.querySelector('.hero-photo');
    var roles = hero.querySelector('.hero-roles');
    var header = document.querySelector('.site-header');
    var chars = split(inner, 'chars');
    gsap.set(header, { autoAlpha: 0 });
    gsap.set(win, { autoAlpha: 0, y: -90, filter: 'blur(10px)' });
    gsap.set(roles, { autoAlpha: 0 });
    root.classList.add('motion-ready');

    /* entrance: the photo opens behind the name, the roles follow. When there was no loading
       screen the name also rises in letter by letter; after the loader it is already in place. */
    heroReady = function (afterLoader) {
      var tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
      /* the photo fades up out of the blue first, then drops softly into place */
      tl.to(win, { autoAlpha: 1, filter: 'blur(0px)', duration: 1.3, ease: 'power1.out' }, 0)
        .to(win, { y: 0, duration: 1.5, ease: 'power3.inOut' }, 0.35)
        .to(header, { autoAlpha: 1, duration: 1 }, 1.0);
      if (!afterLoader) tl.from(chars ? chars.chars : inner, { yPercent: 110, duration: 1.3, stagger: 0.035 }, 0.35);
      /* on phones the roles sit under the name from the start; on desktop they wait for the scroll */
      if (!window.matchMedia('(min-width: 900px)').matches) tl.fromTo(roles, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 1.2 }, afterLoader ? 0.2 : 0.9);
    };

    /* scroll (desktop): the hero holds; the photo and her name glide to the left (the name a touch
       further, like a marquee) and her three roles arrive stacked in the space they leave. No zoom. */
    mm.add('(min-width: 900px)', function () {
      var lines = roles.querySelectorAll('.hr-1, .hr-2, .hr-3');
      var shift = function () { return -window.innerWidth * 0.2; };
      gsap.set(roles, { autoAlpha: 1 });
      gsap.set(lines, { autoAlpha: 0, y: 50 });
      gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: hero, start: 'top top', end: '+=130%', scrub: 1, pin: true, anticipatePin: 1, invalidateOnRefresh: true }
      })
        .fromTo(win, { x: 0 }, { x: shift, duration: 0.6, ease: 'power1.inOut', immediateRender: false }, 0)
        .fromTo(inner, { x: 0 }, { x: function () { return shift() - window.innerWidth * 0.03; }, duration: 0.7, ease: 'power1.inOut', immediateRender: false }, 0)
        .fromTo(lines, { autoAlpha: 0, y: 50 }, { autoAlpha: 1, y: 0, duration: 0.3, stagger: 0.12, ease: 'power2.out', immediateRender: false }, 0.4)
        .to({}, { duration: 0.25 });
    });
    /* phones: the name drifts as you scroll past */
    mm.add('(max-width: 899px)', function () {
      gsap.fromTo(inner, { xPercent: 0 }, { xPercent: -22, ease: 'none', immediateRender: false, scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
    });
  }

  /* ---------- loading screen: the match lights her name, then the dark fades away around it ---------- */
  if (loaderActive) {
    var video = loader.querySelector('.ld-video');
    root.classList.add('ld-lit');
    gsap.set(hero, { backgroundColor: 'rgba(166, 198, 229, 0)' });
    if (nameEl) gsap.set(nameEl, { autoAlpha: 0 });
    var finish = function () {
      if (finish.done) return; finish.done = true;
      gsap.timeline({ onComplete: function () { loader.remove(); root.classList.remove('ld-lit'); gsap.set(nameEl, { clearProps: 'color' }); gsap.set(hero, { clearProps: 'backgroundColor' }); root.classList.add('is-loaded'); } })
        .to(loader, { autoAlpha: 0, duration: 1.8, ease: 'power2.inOut' }, 0)
        .to(hero, { backgroundColor: 'rgba(166, 198, 229, 1)', duration: 1.8, ease: 'power2.inOut' }, 0)
        .to(nameEl, { autoAlpha: 1, color: "#1C1F3F", duration: 1.8, ease: "power2.inOut" }, 0)
        .call(function () { heroReady(true); }, null, 1.1);
    };
    var start = function () {
      try { video.currentTime = 0; } catch (e) {}
      var p = video.play();
      video.classList.add('is-on');
      if (p && p.catch) p.catch(function () { finish(); });
      if (nameEl) gsap.to(nameEl, { autoAlpha: 1, duration: 1.4, ease: 'power2.out', delay: 1.0 });
      gsap.delayedCall(3.8, finish);
    };
    if (video.readyState >= 2) start(); else { video.addEventListener('loadeddata', start, { once: true }); gsap.delayedCall(2.5, function () { if (!video.classList.contains('is-on')) finish(); }); }
    loader.addEventListener('click', finish);
  } else {
    if (loader) loader.remove();
    root.classList.add('is-loaded');
    heroReady(false);
  }

  /* ---------- pinned sideways track (desktop) ---------- */
  mm.add('(min-width: 900px)', function () {
    var track = document.querySelector('.track');
    var list = document.querySelector('.track-list');
    if (!track || !list) return;
    var distance = function () { return Math.max(0, list.scrollWidth - window.innerWidth); };
    /* the heading scrolls away first, so the pinned view is all matchbooks and their names */
    var head = track.querySelector('.track-title');
    var headOffset = function () { return head ? Math.round(head.offsetTop + head.offsetHeight) : 0; };
    var move = gsap.to(list, {
      x: function () { return -distance(); }, ease: 'none',
      scrollTrigger: { trigger: track, start: function () { return 'top+=' + headOffset() + ' top'; }, end: function () { return '+=' + distance(); }, scrub: 0.8, pin: true, anticipatePin: 1, invalidateOnRefresh: true }
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

  /* ---------- About: the photos land like prints dropped on a table, then drift at their own pace ---------- */
  var intro = document.querySelector('.about-intro');
  if (intro) {
    var title = intro.querySelector('.page-title');
    var tsplit = split(title, 'chars');
    var prints = gsap.utils.toArray('.about-intro .pic');
    var tl = gsap.timeline({ defaults: { ease: 'expo.out' }, delay: 0.15 });
    if (tsplit) tl.from(tsplit.chars, { yPercent: 110, duration: 1.2, stagger: 0.025 }, 0);
    tl.from(intro.querySelector('.tagline'), { autoAlpha: 0, y: 16, duration: 1 }, 0.4);
    prints.forEach(function (pic, i) {
      var dir = i % 2 ? 1 : -1;
      tl.from(pic, { y: 160, x: dir * 60, rotation: dir * 12, scale: 0.86, autoAlpha: 0, duration: 1.7 }, 0.25 + i * 0.16);
      tl.from(pic.querySelector('img'), { scale: 1.25, duration: 2.2 }, 0.25 + i * 0.16);
    });
    mm.add('(min-width: 900px)', function () {
      prints.forEach(function (pic, i) {
        gsap.to(pic, { yPercent: [-14, -6, -22][i % 3], ease: 'none', scrollTrigger: { trigger: intro, start: 'top top', end: 'bottom top', scrub: true } });
      });
    });
  }
  gsap.utils.toArray('.book .pic').forEach(function (pic) {
    var dir = pic.classList.contains('l') ? -1 : 1;
    gsap.from(pic, { y: 120, x: dir * 50, rotation: dir * 9, autoAlpha: 0, duration: 1.5, ease: 'expo.out', scrollTrigger: { trigger: pic, start: 'top 88%', once: true } });
    gsap.from(pic.querySelector('img'), { scale: 1.2, duration: 2, ease: 'expo.out', scrollTrigger: { trigger: pic, start: 'top 88%', once: true } });
  });
  var jarEl = document.querySelector('.jar');
  if (jarEl) gsap.from(jarEl, { y: 80, scale: 0.92, autoAlpha: 0, duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger: jarEl, start: 'top 85%', once: true } });

  /* fonts change line breaks; re-measure once they're in */
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
})();
