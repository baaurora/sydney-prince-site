/* Version B: Standby / Spotlight */
(function () {
  'use strict';
  SP.runLoader({ key: 'sp-loader-b', durationMs: 2300, fadeMs: 200 });
  SP.reveal('.cue, .credit, .orgs li', { rootMargin: '0px 0px -10% 0px', threshold: 0.2 });

  if (SP.reducedMotion()) return;
  if (!SP.canHover()) { SP.touchActivate('.lit'); return; }

  // A soft spotlight follows the cursor; photos brighten as it nears them.
  var lit = Array.prototype.slice.call(document.querySelectorAll('.lit'));
  var spot = document.createElement('div');
  spot.className = 'spot';
  spot.setAttribute('aria-hidden', 'true');
  document.body.appendChild(spot);

  var x = window.innerWidth * 0.3;
  var y = window.innerHeight * 0.4;
  var raf = 0;
  var REACH = 240;

  function frame() {
    raf = 0;
    spot.style.setProperty('--x', x + 'px');
    spot.style.setProperty('--y', y + 'px');
    var vh = window.innerHeight;
    for (var i = 0; i < lit.length; i++) {
      var r = lit[i].getBoundingClientRect();
      if (r.bottom < -REACH || r.top > vh + REACH) continue;
      var dx = Math.max(r.left - x, 0, x - r.right);
      var dy = Math.max(r.top - y, 0, y - r.bottom);
      var v = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy) / REACH);
      lit[i].style.setProperty('--lit', v.toFixed(3));
    }
  }
  function queue() { if (!raf) raf = window.requestAnimationFrame(frame); }

  window.addEventListener('pointermove', function (e) {
    x = e.clientX; y = e.clientY;
    spot.classList.remove('is-off');
    queue();
  }, { passive: true });
  window.addEventListener('scroll', queue, { passive: true });
  document.documentElement.addEventListener('pointerleave', function () { spot.classList.add('is-off'); });
  queue();
})();
