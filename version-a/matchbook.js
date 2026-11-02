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
  function flamePath(x, y, h, w, L) {
    var tx = x + L, ty = y - h, by = y + w * 0.45;
    return 'M' + f(x) + ' ' + f(by) +
      'C' + f(x - w * 1.15) + ' ' + f(y + w * 0.3) + ' ' + f(x - w * 0.95 + L * 0.25) + ' ' + f(y - h * 0.45) + ' ' + f(tx) + ' ' + f(ty) +
      'C' + f(x + w * 0.95 + L * 0.25) + ' ' + f(y - h * 0.45) + ' ' + f(x + w * 1.15) + ' ' + f(y + w * 0.3) + ' ' + f(x) + ' ' + f(by) + 'Z';
  }
  function Flame(parent, scale, seed) {
    this.s = scale;
    this.seed = seed || 1;
    this.g = el('g', { 'class': 'fl', opacity: 0 }, parent);
    this.halo = el('circle', { fill: 'url(#haloGrad)', r: 0 }, this.g);
    this.blue = el('ellipse', { fill: '#7C98E8', opacity: 0.6, filter: 'url(#softBlur)' }, this.g);
    this.outer = el('path', { fill: 'url(#flameOuter)', filter: 'url(#softBlur)' }, this.g);
    this.mid = el('path', { fill: '#FFC24A', opacity: 0.95 }, this.g);
    this.core = el('path', { fill: '#FFF6DC' }, this.g);
  }
  Flame.prototype.draw = function (x, y, size, lean, t, flare) {
    if (size < 0.02) { this.g.setAttribute('opacity', 0); return; }
    this.g.setAttribute('opacity', 1);
    var s = this.s, sd = this.seed;
    var n1 = noise(t, sd), n2 = noise(t * 1.3, sd + 5), n3 = noise(t * 2.4, sd + 9);
    // A phosphorus flare is a round, bright puff; the steady flame is a tall teardrop.
    var h = s * 44 * size * (1 - flare * 0.42) * (1 + 0.1 * n1 + 0.05 * n3);
    var w = s * 9.5 * Math.sqrt(size) * (1 + flare * 0.7) * (1 + 0.07 * n2);
    var L = lean * s + s * 2.4 * n2;
    this.outer.setAttribute('d', flamePath(x, y, h, w, L));
    this.mid.setAttribute('d', flamePath(x, y + w * 0.15, h * (0.66 + flare * 0.15), w * 0.66, L * 0.7));
    this.core.setAttribute('d', flamePath(x, y + w * 0.25, h * (0.36 + flare * 0.3), w * (0.4 + flare * 0.25), L * 0.4));
    this.blue.setAttribute('cx', f(x)); this.blue.setAttribute('cy', f(y + w * 0.25));
    this.blue.setAttribute('rx', f(w * 0.6)); this.blue.setAttribute('ry', f(w * 0.36));
    this.halo.setAttribute('cx', f(x + L * 0.4)); this.halo.setAttribute('cy', f(y - h * 0.35));
    this.halo.setAttribute('r', f(h * (1.5 + flare * 1.6)));
    this.halo.setAttribute('opacity', f(clamp(0.55 + 0.12 * n1 + flare * 0.4, 0, 1)));
  };

  /* ---------- Sparks: short streaks with gravity ---------- */
  function Sparks(parent, n, rand, scale) {
    this.rand = rand; this.s = scale || 1; this.live = []; this.free = [];
    var g = el('g', { 'stroke-linecap': 'round' }, parent);
    for (var i = 0; i < n; i++) this.free.push(el('line', { opacity: 0 }, g));
  }
  Sparks.prototype.emit = function (x, y, t, vxMin, vxMax, vyMin, vyMax) {
    var node = this.free.pop();
    if (!node) return;
    var r = this.rand, s = this.s;
    this.live.push({ n: node, x: x, y: y, born: t, life: 160 + r() * 280,
      vx: lerp(vxMin, vxMax, r()) * s, vy: lerp(vyMin, vyMax, r()) * s, w: (0.9 + r() * 1.3) * s });
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
      var px = p.x + p.vx * age, py = p.y + p.vy * age + 0.5 * G * age * age;
      var vy = p.vy + G * age, tail = 16;
      p.n.setAttribute('x1', f(px)); p.n.setAttribute('y1', f(py));
      p.n.setAttribute('x2', f(px - p.vx * tail)); p.n.setAttribute('y2', f(py - vy * tail));
      p.n.setAttribute('stroke', k < 0.3 ? '#FFF6D2' : k < 0.65 ? '#FFC24A' : '#F0662A');
      p.n.setAttribute('stroke-width', f(p.w * (1 - k * 0.6)));
      p.n.setAttribute('opacity', f(1 - k * k));
    }
  };
  Sparks.prototype.busy = function () { return this.live.length > 0; };

  /* ---------- Smoke: soft puffs that rise, drift and spread ---------- */
  function Smoke(parent, n, rand, scale) {
    this.rand = rand; this.s = scale || 1; this.live = []; this.free = [];
    var g = el('g', { filter: 'url(#smokeBlur)' }, parent);
    for (var i = 0; i < n; i++) this.free.push(el('circle', { fill: '#8F857D', opacity: 0, r: 0 }, g));
  }
  Smoke.prototype.emit = function (x, y, t, size) {
    var node = this.free.pop();
    if (!node) return;
    var r = this.rand, s = this.s;
    this.live.push({ n: node, x: x, y: y, born: t, life: 900 + r() * 700, seed: r() * 10,
      vx: (r() - 0.45) * 0.02 * s, vy: -(0.022 + r() * 0.03) * s, r0: size * (0.5 + r() * 0.4) * s, grow: size * (1.6 + r()) * s });
  };
  Smoke.prototype.draw = function (t) {
    for (var i = this.live.length - 1; i >= 0; i--) {
      var p = this.live[i], age = t - p.born, k = age / p.life;
      if (k >= 1 || age < 0) {
        p.n.setAttribute('opacity', 0);
        if (k >= 1) { this.free.push(p.n); this.live.splice(i, 1); }
        continue;
      }
      var ease = outCubic(k);
      p.n.setAttribute('cx', f(p.x + p.vx * age + Math.sin(age * 0.004 + p.seed) * 5 * k * this.s));
      p.n.setAttribute('cy', f(p.y + p.vy * age));
      p.n.setAttribute('r', f(p.r0 + ease * p.grow));
      p.n.setAttribute('opacity', f(0.2 * (1 - k) * (1 - k) * Math.min(1, age / 160)));
    }
  };
  Smoke.prototype.busy = function () { return this.live.length > 0; };

  /* ---------- Loader: strike the match ---------- */
  var IGNITE = 1335;

  function matchPose(t) {
    var k, e;
    if (t < 750) return { x: 760, y: 100, r: -28 };
    if (t < 1200) { // hand brings the match in and sets the head on the striker
      k = outCubic(prog(t, 750, 1200));
      return { x: lerp(760, 292, k), y: lerp(100, 212, k) - Math.sin(k * Math.PI) * 16, r: lerp(-28, -6, k) };
    }
    if (t < 1265) { // press down
      k = inOutSine(prog(t, 1200, 1265));
      return { x: 292 - 2 * k, y: 212 + 3 * k, r: -6 + 2 * k };
    }
    if (t < 1400) { // swipe: fast drag with friction chatter
      k = prog(t, 1265, 1400); e = inOutSine(k);
      return { x: lerp(290, 128, e), y: 215 - k * 1.5 + Math.sin(k * 42) * 0.9, r: lerp(-4, -14, e) };
    }
    if (t < 1840) { // follow-through: lift and turn the head up
      k = outCubic(prog(t, 1400, 1840));
      var a = 1 - k;
      return { x: a * a * 128 + 2 * a * k * 150 + k * k * 318, y: a * a * 214 + 2 * a * k * 136 + k * k * 124, r: lerp(-14, 38, outBack(prog(t, 1400, 1840))) };
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
      if (t > 1270 && t < 1415) {
        carry += dt * 0.24;
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
      if (t >= IGNITE + 15 && puffs < 12 && t >= IGNITE + 15 + puffs * 45) {
        smoke.emit(p.x + (rand() - 0.5) * 4, p.y - 8, t, puffs < 4 ? 7 : 4);
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
      flame.draw(p.x, p.y - 5, size, lean, t, flare);
      sparks.draw(t);
      smoke.draw(t);
      // Warm light cast on the matchbook, flickering with the flame.
      warm.setAttribute('cx', f(p.x)); warm.setAttribute('cy', f(p.y - 20));
      warm.setAttribute('opacity', f(clamp(size, 0, 1.4) * (0.5 + 0.08 * noise(t, 2))));
      // Finally the glow swells to fill the screen and the page fades up.
      var g = prog(t, 1860, 2380);
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
      if (t < 2600 && loader.isConnected) requestAnimationFrame(frame);
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
    var flame = new Flame(fx, 0.42, 4);
    var sparks = new Sparks(fx, 16, rand, 0.4);
    var smoke = new Smoke(fx, 8, rand, 0.45);
    var HX = 20, HY = 32;
    var lit = false, changedAt = 0, sizeAtOut = 0, size = 0, raf = 0, wisps = 0;

    if (reduce) {
      trigger.addEventListener('mouseenter', function () { flame.draw(HX, HY - 5, 1, 0, 0, 0); });
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
      flame.draw(HX, HY - 5, size, 0, now, lit ? Math.max(0, 1 - a / 260) : 0);
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

  var scrubbing = playLoader();
  if (!scrubbing) SP.runLoader({ key: 'sp-loader-a', durationMs: 2050, fadeMs: 400 });
  SP.reveal('.reveal, .fan');
  SP.touchActivate('.photo-card, .mb-card');
  footerMatch();
  photoTilt();
})();
