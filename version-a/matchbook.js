/* Version A: The Matchbook
 *
 * The match strike, flame, sparks and smoke are simulated in JS rather than
 * keyframed, so the flame stays upright while the match rotates, leans away
 * from motion, flares on ignition and flickers with smooth noise.
 */
(function () {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';
  var root = document.documentElement;
  var reduce = SP.reducedMotion();

  /* ---------- helpers ---------- */
  function el(name, attrs, parent) {
    var n = document.createElementNS(NS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function f(v) { return Math.round(v * 100) / 100; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function prog(t, a, b) { return clamp((t - a) / (b - a), 0, 1); }
  function outCubic(t) { return 1 - Math.pow(1 - t, 3); }
  function inOutSine(t) { return -(Math.cos(Math.PI * t) - 1) / 2; }
  function outBack(t) { var c = 1.4; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); }
  // Smooth pseudo-noise: a few incommensurate sines read as organic flicker.
  function noise(t, s) {
    return Math.sin(t * 0.0123 + s) * 0.5 + Math.sin(t * 0.0291 + s * 1.7) * 0.3 + Math.sin(t * 0.0713 + s * 2.3) * 0.2;
  }
  // Seeded RNG so the loader can be replayed or scrubbed identically.
  function rng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function mix(c1, c2, t) {
    var a = parseInt(c1.slice(1), 16), b = parseInt(c2.slice(1), 16);
    var r = Math.round(lerp(a >> 16, b >> 16, t)), g = Math.round(lerp(a >> 8 & 255, b >> 8 & 255, t)), bl = Math.round(lerp(a & 255, b & 255, t));
    return 'rgb(' + r + ',' + g + ',' + bl + ')';
  }

  /* Flame size over time after ignition: phosphorus flare, dip as the
     head burns down, then the steady flame takes hold. 1 = steady. */
  function igniteCurve(a) {
    if (a < 0) return 0;
    if (a < 45) return lerp(0, 1.75, outCubic(a / 45));
    if (a < 280) return lerp(1.75, 0.5, outCubic((a - 45) / 235));
    if (a < 760) return lerp(0.5, 1, inOutSine((a - 280) / 480));
    return 1;
  }

  /* ---------- Flame ---------- */
  /* Hand-drawn look: shapes are redrawn "on twos" (12 per second, like cel
     animation) and their ink outline boils by re-seeding a wobble filter. */
  var TWOS = 1000 / 12;
  function onTwos(t) { return Math.floor(t / TWOS) * TWOS; }
  var boilId = 0;
  function Boil(svg, amount) {
    var defs = svg.querySelector('defs') || el('defs', {}, svg);
    this.id = 'boil-' + (++boilId);
    var flt = el('filter', { id: this.id, x: '-30%', y: '-30%', width: '160%', height: '160%' }, defs);
    this.turb = el('feTurbulence', { type: 'fractalNoise', baseFrequency: '0.045', numOctaves: 2, seed: 1 }, flt);
    el('feDisplacementMap', { 'in': 'SourceGraphic', scale: amount }, flt);
    this.step = -1;
  }
  Boil.prototype.tick = function (t) {
    var step = Math.floor(t / TWOS);
    if (step !== this.step) { this.step = step; this.turb.setAttribute('seed', 1 + step % 6); }
  };

  /* ---------- Flame: an inked teardrop with flat fills ---------- */
  function flamePath(x, y, h, w, L) {
    var tx = x + L, ty = y - h, by = y + w * 0.5;
    return 'M' + f(x) + ' ' + f(by) +
      'C' + f(x - w * 1.2) + ' ' + f(y + w * 0.35) + ' ' + f(x - w * 1.05 + L * 0.2) + ' ' + f(y - h * 0.42) + ' ' + f(tx) + ' ' + f(ty) +
      'C' + f(x + w * 1.05 + L * 0.2) + ' ' + f(y - h * 0.42) + ' ' + f(x + w * 1.2) + ' ' + f(y + w * 0.35) + ' ' + f(x) + ' ' + f(by) + 'Z';
  }
  function Flame(parent, scale, seed) {
    this.s = scale;
    this.seed = seed || 1;
    var ink = Math.max(1.5, 2.3 * scale);
    this.boil = new Boil(parent.ownerSVGElement || parent, Math.max(1.4, 2.6 * scale));
    this.g = el('g', { 'class': 'fl', opacity: 0 }, parent);
    this.halo = el('circle', { fill: 'url(#haloGrad)', r: 0 }, this.g);
    var drawn = el('g', { filter: 'url(#' + this.boil.id + ')', 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, this.g);
    this.rays = el('g', { stroke: '#1F1B18', 'stroke-width': ink * 0.8, opacity: 0 }, drawn);
    this.rayLines = [];
    for (var i = 0; i < 9; i++) this.rayLines.push(el('line', {}, this.rays));
    this.outer = el('path', { fill: '#E8572C', stroke: '#1F1B18', 'stroke-width': ink }, drawn);
    this.mid = el('path', { fill: '#F7A63B' }, drawn);
    this.core = el('path', { fill: '#FFE7A8' }, drawn);
    this.lick = el('path', { fill: 'none', stroke: '#1F1B18', 'stroke-width': ink * 0.6, opacity: 0.55 }, drawn);
  }
  Flame.prototype.draw = function (x, y, size, lean, t, flare) {
    if (size < 0.02) { this.g.setAttribute('opacity', 0); return; }
    this.g.setAttribute('opacity', 1);
    this.boil.tick(t);
    var tt = onTwos(t);
    var s = this.s, sd = this.seed;
    var n1 = noise(tt, sd), n2 = noise(tt * 1.3, sd + 5), n3 = noise(tt * 2.4, sd + 9);
    // The flare is a round burst; the steady flame is a tall teardrop.
    var h = s * 46 * size * (1 - flare * 0.42) * (1 + 0.12 * n1 + 0.06 * n3);
    var w = s * 10 * Math.sqrt(size) * (1 + flare * 0.7) * (1 + 0.08 * n2);
    var L = lean * s + s * 3 * n2;
    this.outer.setAttribute('d', flamePath(x, y, h, w, L));
    this.mid.setAttribute('d', flamePath(x, y + w * 0.12, h * (0.64 + flare * 0.15), w * 0.62, L * 0.7));
    this.core.setAttribute('d', flamePath(x, y + w * 0.22, h * (0.32 + flare * 0.3), w * (0.34 + flare * 0.25), L * 0.4));
    // one little inked lick line inside the flame
    var lx = x - w * 0.35, ly = y - h * 0.15;
    this.lick.setAttribute('d', 'M' + f(lx) + ' ' + f(ly) + 'Q' + f(lx - w * 0.15 + L * 0.2) + ' ' + f(y - h * 0.45) + ' ' + f(lx + w * 0.1 + L * 0.45) + ' ' + f(y - h * 0.62));
    this.lick.setAttribute('opacity', f(size > 0.6 ? 0.55 : 0));
    // inked burst rays while it flares
    this.rays.setAttribute('opacity', f(clamp(flare * 1.6 - 0.15, 0, 1)));
    for (var i = 0; i < this.rayLines.length; i++) {
      var ang = -Math.PI / 2 + (i - 4) * 0.42, r0 = w * 1.6, r1 = r0 + s * (10 + 8 * (i % 2)) * (0.6 + flare);
      var cy = y - h * 0.35, ln = this.rayLines[i];
      ln.setAttribute('x1', f(x + Math.cos(ang) * r0)); ln.setAttribute('y1', f(cy + Math.sin(ang) * r0));
      ln.setAttribute('x2', f(x + Math.cos(ang) * r1)); ln.setAttribute('y2', f(cy + Math.sin(ang) * r1));
    }
    this.halo.setAttribute('cx', f(x + L * 0.4)); this.halo.setAttribute('cy', f(y - h * 0.35));
    this.halo.setAttribute('r', f(h * (1.4 + flare * 1.2)));
    this.halo.setAttribute('opacity', f(clamp(0.4 + 0.1 * n1 + flare * 0.3, 0, 1)));
  };

  /* ---------- Sparks: little inked dashes, on twos ---------- */
  function Sparks(parent, n, rand, scale) {
    this.rand = rand; this.s = scale || 1; this.live = []; this.free = [];
    var g = el('g', { 'stroke-linecap': 'round' }, parent);
    for (var i = 0; i < n; i++) this.free.push(el('line', { opacity: 0 }, g));
  }
  Sparks.prototype.emit = function (x, y, t, vxMin, vxMax, vyMin, vyMax) {
    var node = this.free.pop();
    if (!node) return;
    var r = this.rand, s = this.s;
    this.live.push({ n: node, x: x, y: y, born: t, life: 220 + r() * 320, red: r() < 0.55,
      vx: lerp(vxMin, vxMax, r()) * s, vy: lerp(vyMin, vyMax, r()) * s, w: (1.6 + r() * 1.2) * Math.max(s, 0.6) });
  };
  Sparks.prototype.draw = function (t) {
    var G = 0.0011 * this.s;
    for (var i = this.live.length - 1; i >= 0; i--) {
      var p = this.live[i], age = t - p.born, k = age / p.life;
      if (k >= 1 || age < 0) {
        p.n.setAttribute('opacity', 0);
        if (k >= 1) { this.free.push(p.n); this.live.splice(i, 1); }
        continue;
      }
      var a = onTwos(age);
      var px = p.x + p.vx * a, py = p.y + p.vy * a + 0.5 * G * a * a;
      var vy = p.vy + G * a, tail = 13;
      p.n.setAttribute('x1', f(px)); p.n.setAttribute('y1', f(py));
      p.n.setAttribute('x2', f(px - p.vx * tail)); p.n.setAttribute('y2', f(py - vy * tail));
      p.n.setAttribute('stroke', p.red ? '#D9442B' : k < 0.5 ? '#F7A63B' : '#1F1B18');
      p.n.setAttribute('stroke-width', f(p.w * (1 - k * 0.5)));
      p.n.setAttribute('opacity', k > 0.75 ? 0 : 1);
    }
  };
  Sparks.prototype.busy = function () { return this.live.length > 0; };

  /* ---------- Smoke: hand-drawn squiggle wisps that curl up and fade ---------- */
  function Smoke(parent, n, rand, scale) {
    this.rand = rand; this.s = scale || 1; this.live = []; this.free = [];
    var g = el('g', { filter: 'url(#wobble)', fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, parent);
    for (var i = 0; i < n; i++) this.free.push(el('path', { stroke: '#8F857D', 'stroke-width': Math.max(1.3, 2 * this.s), opacity: 0 }, g));
  }
  Smoke.prototype.emit = function (x, y, t, size) {
    var node = this.free.pop();
    if (!node) return;
    var r = this.rand, s = this.s;
    this.live.push({ n: node, x: x, y: y, born: t, life: 1000 + r() * 600, seed: r() * 10, dir: r() < 0.5 ? -1 : 1,
      vx: (r() - 0.5) * 0.012 * s, vy: -(0.03 + r() * 0.02) * s, len: size * (3.2 + r() * 1.6) * s, amp: size * (0.5 + r() * 0.35) * s });
  };
  Smoke.prototype.draw = function (t) {
    for (var i = this.live.length - 1; i >= 0; i--) {
      var p = this.live[i], age = t - p.born, k = age / p.life;
      if (k >= 1 || age < 0) {
        p.n.setAttribute('opacity', 0);
        if (k >= 1) { this.free.push(p.n); this.live.splice(i, 1); }
        continue;
      }
      var a = onTwos(age);
      var grow = outCubic(Math.min(1, a / 500));
      var bx = p.x + p.vx * a, by = p.y + p.vy * a;
      var L = p.len * grow, d = '';
      for (var j = 0; j <= 10; j++) {
        var q = j / 10, yy = by - q * L;
        var xx = bx + p.dir * Math.sin(q * 5.2 + p.seed + a * 0.006) * p.amp * (0.4 + q);
        d += (j ? 'L' : 'M') + f(xx) + ' ' + f(yy);
      }
      p.n.setAttribute('d', d);
      p.n.setAttribute('opacity', f(0.85 * (1 - k * k)));
    }
  };
  Smoke.prototype.busy = function () { return this.live.length > 0; };

  /* ---------- Loader: strike the match ---------- */
  var IGNITE = 2920;

  function matchPose(t) {
    var k, e;
    if (t < 1900) return { x: 760, y: 96, r: -28 };
    if (t < 2700) { // the hand slowly brings the match in and sets the head on the striker
      k = inOutSine(prog(t, 1900, 2700));
      return { x: lerp(760, 270, k), y: lerp(96, 212, k) - Math.sin(k * Math.PI) * 22, r: lerp(-28, -6, outCubic(k)) };
    }
    if (t < 2790) { // a beat: press down
      k = inOutSine(prog(t, 2700, 2790));
      return { x: 270 - 2 * k, y: 212 + 3 * k, r: -6 + 2 * k };
    }
    if (t < 2960) { // swipe: fast drag with friction chatter
      k = prog(t, 2790, 2960); e = inOutSine(k);
      return { x: lerp(268, 124, e), y: 215 - k * 1.5 + Math.sin(k * 42) * 0.9, r: lerp(-4, -14, e) };
    }
    if (t < 3600) { // follow-through: lift and turn the head up
      k = outCubic(prog(t, 2960, 3600));
      var a = 1 - k;
      return { x: a * a * 124 + 2 * a * k * 150 + k * k * 318, y: a * a * 214 + 2 * a * k * 132 + k * k * 124, r: lerp(-14, 38, outBack(prog(t, 2960, 3600))) };
    }
    return { x: 318 + 0.7 * noise(t, 3), y: 124 + 0.7 * noise(t, 7), r: 38 + noise(t, 11) };
  }

  function playLoader() {
    var loader = document.getElementById('loader');
    if (!loader || root.classList.contains('no-loader')) return;
    var svg = loader.querySelector('.lm');
    var match = svg.querySelector('.lm-match');
    var head = svg.querySelector('.lm-match-head');
    var charr = svg.querySelector('.lm-char');
    var warm = svg.querySelector('.lm-warm');
    var glow = svg.querySelector('.lm-glow');
    var fx = svg.querySelector('.lm-fx');
    var rand = rng(20261102);
    var smoke = new Smoke(fx, 10, rand, 1);
    var flame = new Flame(fx, 1, 2);
    var sparks = new Sparks(fx, 80, rand, 1);

    var last = 0, lean = 0, prev = matchPose(0), carry = 0, burst = false, puffs = 0;

    function step(t) {
      var dt = Math.max(1, t - last);
      var p = matchPose(t);
      var vx = (p.x - prev.x) / dt;

      // Sparks fly off the head while it drags across the striker.
      if (t > 2795 && t < 2975) {
        carry += dt * 0.2;
        while (carry >= 1) {
          carry -= 1;
          sparks.emit(p.x + (rand() - 0.5) * 6, p.y - 2 + rand() * 5, t, -0.45, 0.12, -0.38, 0.06);
        }
      }
      if (!burst && t >= IGNITE) { // the head catches: radial burst + smoke puff
        burst = true;
        for (var i = 0; i < 22; i++) {
          var ang = rand() * Math.PI * 2, sp = 0.08 + rand() * 0.3;
          sparks.emit(p.x, p.y - 3, t, Math.cos(ang) * sp, Math.cos(ang) * sp, Math.sin(ang) * sp - 0.08, Math.sin(ang) * sp - 0.08);
        }
      }
      if (t >= IGNITE + 15 && puffs < 3 && t >= IGNITE + 15 + puffs * 140) {
        smoke.emit(p.x + (rand() - 0.5) * 6, p.y - 10, t, puffs < 2 ? 7 : 5);
        puffs++;
      }

      // Flame leans away from the direction of travel, with a little lag.
      lean += (clamp(-vx * 30, -16, 16) - lean) * Math.min(1, dt / 90);
      prev = p; last = t;
      return p;
    }

    function render(t, p) {
      match.setAttribute('transform', 'translate(' + f(p.x) + ' ' + f(p.y) + ') rotate(' + f(p.r) + ')');
      var a = t - IGNITE;
      var size = igniteCurve(a);
      var flare = a >= 0 ? Math.max(0, 1 - a / 260) : 0;
      var burnt = clamp(a / 800, 0, 1);
      head.setAttribute('fill', mix('#D9442B', '#3B241A', burnt));
      charr.setAttribute('opacity', f(burnt * 0.8));
      flame.draw(p.x, p.y - 6, size, lean, t, flare);
      sparks.draw(t);
      smoke.draw(t);
      // Warm light cast on the matchbook, flickering with the flame.
      warm.setAttribute('cx', f(p.x)); warm.setAttribute('cy', f(p.y - 20));
      warm.setAttribute('opacity', f(clamp(size, 0, 1.4) * (0.5 + 0.08 * noise(t, 2))));
      // Finally the glow swells to fill the screen and the page fades up.
      var g = prog(t, 4250, 4950);
      glow.setAttribute('cx', f(p.x)); glow.setAttribute('cy', f(p.y - 24));
      glow.setAttribute('r', f(lerp(30, 980, g * g)));
      glow.setAttribute('opacity', f(g > 0 ? Math.min(1, g * 2.4) : 0));
    }

    // Debug/scrub: #loader-at=1500 freezes the loader at that moment.
    var m = /loader-at=(\d+)/.exec(location.hash);
    if (m) {
      var target = +m[1], p;
      for (var t = 0; t <= target; t += 16) p = step(t);
      render(target, p);
      loader.getAnimations({ subtree: true }).forEach(function (an) { an.pause(); an.currentTime = target; });
      return true;
    }

    var start = performance.now();
    (function frame(now) {
      var t = now - start;
      render(t, step(t));
      if (t < 5400 && loader.isConnected) requestAnimationFrame(frame);
    })(start);
    return false;
  }

  /* ---------- Footer match: lights on hover, goes out with a wisp ---------- */
  function footerMatch() {
    var icon = document.querySelector('.match-icon');
    var trigger = document.querySelector('.footer-name');
    if (!icon || !trigger) return;
    var fx = icon.querySelector('.mi-fx');
    var head = icon.querySelector('.mi-head');
    var rand = rng(7);
    var flame = new Flame(fx, 0.46, 4);
    var sparks = new Sparks(fx, 16, rand, 0.4);
    var smoke = new Smoke(fx, 8, rand, 0.45);
    var HX = 20, HY = 32;
    var lit = false, changedAt = 0, sizeAtOut = 0, size = 0, raf = 0, wisps = 0;

    if (reduce) {
      trigger.addEventListener('mouseenter', function () { flame.draw(HX, HY - 7, 1, 0, 0, 0); });
      trigger.addEventListener('mouseleave', function () { flame.draw(HX, HY, 0, 0, 0, 0); });
      return;
    }

    function frame(now) {
      raf = 0;
      var a = now - changedAt;
      if (lit) size = igniteCurve(a);
      else size = sizeAtOut * Math.max(0, 1 - a / 160);
      if (!lit && size === 0 && wisps < 4 && a > wisps * 90) { smoke.emit(HX, HY - 6, now, wisps ? 3 : 5); wisps++; }
      head.setAttribute('fill', mix('#D9442B', '#3B241A', lit ? clamp(a / 900, 0, 0.85) : 0.85));
      flame.draw(HX, HY - 7, size, 0, now, lit ? Math.max(0, 1 - a / 260) : 0);
      sparks.draw(now);
      smoke.draw(now);
      if (lit || size > 0 || sparks.busy() || smoke.busy() || wisps < 4) raf = requestAnimationFrame(frame);
    }
    function run() { if (!raf) raf = requestAnimationFrame(frame); }
    function ignite() {
      if (lit) return;
      lit = true; changedAt = performance.now();
      for (var i = 0; i < 9; i++) {
        var ang = -Math.PI / 2 + (rand() - 0.5) * 2.4, sp = 0.15 + rand() * 0.25;
        sparks.emit(HX, HY - 4, changedAt, Math.cos(ang) * sp, Math.cos(ang) * sp, Math.sin(ang) * sp, Math.sin(ang) * sp);
      }
      smoke.emit(HX, HY - 8, changedAt, 6);
      run();
    }
    function douse() {
      if (!lit) return;
      lit = false; sizeAtOut = size; changedAt = performance.now(); wisps = 0;
      run();
    }

    if (SP.canHover()) {
      trigger.addEventListener('mouseenter', ignite);
      trigger.addEventListener('mouseleave', douse);
    } else if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) setTimeout(ignite, 500); else douse(); });
      }, { threshold: 0.6 }).observe(trigger);
    }
  }

  /* ---------- Photo cards: tilt toward the pointer while held ---------- */
  function photoTilt() {
    if (reduce || !SP.canHover()) return;
    document.querySelectorAll('.photo-card').forEach(function (card) {
      var raf = 0, px = 0.5, py = 0.5;
      function apply() {
        raf = 0;
        card.style.setProperty('--rx', f((0.5 - py) * 12) + 'deg');
        card.style.setProperty('--ry', f((px - 0.5) * 14) + 'deg');
        card.style.setProperty('--gx', f(px * 100) + '%');
        card.style.setProperty('--gy', f(py * 100) + '%');
      }
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        px = clamp((e.clientX - r.left) / r.width, 0, 1);
        py = clamp((e.clientY - r.top) / r.height, 0, 1);
        if (!raf) raf = requestAnimationFrame(apply);
      });
      card.addEventListener('pointerleave', function () {
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
      });
    });
  }

  /* ---------- Matchbook jar: pull one out to see what she did there ---------- */
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
  creditFocus(null);

  var scrubbing = playLoader();
  if (!scrubbing) SP.runLoader({ key: 'sp-loader-a', durationMs: 4650, fadeMs: 550 });
  SP.reveal('.reveal');
  SP.touchActivate('.photo-card, .mb-card');
  footerMatch();
  photoTilt();
  matchJar();
})();
