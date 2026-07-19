/* Portfolio, one sheet, REV C. Hand-routed JS: no libraries.
   The one scroll listener feeds a rAF-throttled plotter; everything else
   runs on IntersectionObserver. */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var docEl = document.documentElement;

  function pad(n, w) {
    var s = String(n);
    while (s.length < w) s = '0' + s;
    return s;
  }

  /* ---------- boot sequence (once per session, skippable) ---------- */
  var boot = document.getElementById('boot');
  function endBoot(instant) {
    if (!boot) return;
    var el = boot;
    boot = null;
    try { sessionStorage.setItem('it-booted', '1'); } catch (e) { /* private mode */ }
    if (instant) {
      docEl.classList.add('booted');
      if (el.parentNode) el.parentNode.removeChild(el);
    } else {
      /* fade first; the 'booted' class would hide the overlay instantly */
      el.classList.add('done');
      window.setTimeout(function () {
        docEl.classList.add('booted');
        if (el.parentNode) el.parentNode.removeChild(el);
      }, 360);
    }
  }
  if (boot) {
    if (docEl.classList.contains('booted') || reduceMotion) {
      endBoot(true);
    } else {
      var skip = function () { endBoot(true); };
      boot.addEventListener('click', skip, { once: true });
      window.addEventListener('keydown', skip, { once: true });
      window.setTimeout(function () { endBoot(false); }, 1250);
    }
  }

  /* ---------- header clock: local time, like a plotter console ---------- */
  var clockEl = document.getElementById('clock');
  function tickClock() {
    var d = new Date();
    clockEl.textContent = pad(d.getHours(), 2) + ':' + pad(d.getMinutes(), 2) + ':' + pad(d.getSeconds(), 2) + ' LOC';
  }
  if (clockEl) {
    tickClock();
    window.setInterval(tickClock, 1000);
  }

  /* ---------- reveal on approach ---------- */
  var revealables = [].slice.call(
    document.querySelectorAll('[data-reveal], [data-reveal-group]')
  );
  document.querySelectorAll('[data-reveal-group]').forEach(function (group) {
    [].slice.call(group.children).forEach(function (child, i) {
      child.style.setProperty('--i', i);
    });
  });

  function revealAll() {
    revealables.forEach(function (el) { el.classList.add('in'); });
  }

  if (!('IntersectionObserver' in window)) {
    revealAll();
  } else {
    var revealIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          revealIO.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealables.forEach(function (el) { revealIO.observe(el); });
    /* safety: never leave content hidden if observation misfires */
    window.setTimeout(function () {
      if (document.querySelectorAll('[data-reveal].in').length === 0) revealAll();
    }, 2500);

    /* looping figure animations run only while on screen */
    var liveIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        entry.target.classList.toggle('live', entry.isIntersecting);
      });
    }, { threshold: 0.15 });
    document.querySelectorAll('.module').forEach(function (el) { liveIO.observe(el); });

    /* header rule thickens once the page has scrolled */
    var head = document.querySelector('.site-head');
    var sentinel = document.createElement('div');
    sentinel.setAttribute('aria-hidden', 'true');
    sentinel.style.cssText = 'position:absolute;top:0;left:0;height:2px;width:1px;pointer-events:none;';
    document.body.prepend(sentinel);
    new IntersectionObserver(function (entries) {
      head.classList.toggle('scrolled', !entries[0].isIntersecting);
    }).observe(sentinel);

    /* scrollspy: light the active sheet label */
    var navLinks = [].slice.call(document.querySelectorAll('.site-nav a'));
    var byHash = {};
    navLinks.forEach(function (a) { byHash[a.getAttribute('href')] = a; });
    var spyIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var link = byHash['#' + entry.target.id];
        if (!link) return;
        if (entry.isIntersecting) {
          navLinks.forEach(function (a) { a.removeAttribute('aria-current'); });
          link.setAttribute('aria-current', 'true');
        }
      });
    }, { rootMargin: '-35% 0px -55% 0px' });
    ['profile', 'projects', 'skills', 'contact'].forEach(function (id) {
      var sec = document.getElementById(id);
      if (sec) spyIO.observe(sec);
    });
  }

  /* ---------- project figures fold on small screens ---------- */
  var modules = [].slice.call(document.querySelectorAll('details.module'));
  var mqMobile = window.matchMedia('(max-width: 759px)');

  var lastFold = null;
  function applyFold() {
    var mob = mqMobile.matches;
    if (mob === lastFold) return;   /* don't stomp user toggles on same-mode resizes */
    lastFold = mob;
    modules.forEach(function (d) {
      var s = d.querySelector('summary');
      if (!s) return;
      if (mob) {
        /* JS visitors on phones get folded figures; no-JS markup stays open */
        d.open = false;
        s.removeAttribute('tabindex');
      } else {
        d.open = true;               /* figures never fold on wide sheets */
        s.setAttribute('tabindex', '-1');
      }
    });
  }
  applyFold();
  if (mqMobile.addEventListener) mqMobile.addEventListener('change', applyFold);
  else if (mqMobile.addListener) mqMobile.addListener(applyFold);
  window.addEventListener('resize', applyFold);

  modules.forEach(function (d) {
    var s = d.querySelector('summary');
    if (!s) return;
    s.addEventListener('click', function (e) {
      if (!mqMobile.matches) e.preventDefault();
    });
    d.addEventListener('toggle', scheduleSpineRebuild);
  });

  /* deep links (#u2 ... #u6) must open a folded figure */
  function openHashTarget() {
    var id = window.location.hash.slice(1);
    if (!id) return;
    var el = document.getElementById(id);
    if (el && el.tagName === 'DETAILS' && !el.open) el.open = true;
  }
  window.addEventListener('hashchange', openHashTarget);
  openHashTarget();

  /* tapping a figure nudges it back to life */
  document.querySelectorAll('.module-media').forEach(function (media) {
    var kickTimer = null;
    media.addEventListener('click', function () {
      if (reduceMotion) return;
      var mod = media.closest('.module');
      if (!mod) return;
      window.clearTimeout(kickTimer);
      mod.classList.remove('kick');
      void mod.offsetWidth;
      mod.classList.add('kick');
      kickTimer = window.setTimeout(function () { mod.classList.remove('kick'); }, 520);
    });
  });

  /* ---------- the spine: a plotter pen draws the net as you scroll ---------- */
  var SVGNS = 'http://www.w3.org/2000/svg';
  var spine = document.getElementById('spine');
  var rail = document.getElementById('spine-rail');
  var ghost = document.getElementById('spine-ghost');
  var nodesG = document.getElementById('spine-nodes');
  var endArrow = document.getElementById('spine-end');
  var pen = document.getElementById('spine-pen');
  var plotted = document.getElementById('plotted');

  var verts = [], nodes = [], totalLen = 0, spineBuilt = false, vertIdx = 0, lastL = -1;

  function buildSpine() {
    if (!spine || !rail) return;
    applyFold();   /* self-heal fold state even if a resize event was missed */
    /* phones do without the plotter line entirely (CSS hides it too) */
    if (window.matchMedia('(max-width: 759px)').matches) {
      spineBuilt = false;
      spine.setAttribute('width', 0);
      spine.setAttribute('height', 0);
      return;
    }
    /* collapse the spine before measuring, or its own height inflates the sheet */
    spine.setAttribute('width', 0);
    spine.setAttribute('height', 0);
    var docW = docEl.clientWidth;
    var docH = Math.max(document.body.scrollHeight, docEl.scrollHeight);
    spine.setAttribute('width', docW);
    spine.setAttribute('height', docH);
    spine.setAttribute('viewBox', '0 0 ' + docW + ' ' + docH);

    var wrap = document.querySelector('.sec .wrap') || document.querySelector('.wrap');
    var targets = [].slice.call(document.querySelectorAll('[data-spine]'));
    if (!wrap || targets.length < 2) return;

    var wl = wrap.getBoundingClientRect().left;
    var railX = wl > 62 ? Math.round(wl - 34) : 11;
    var sy = window.pageYOffset;

    verts = []; nodes = []; totalLen = 0; vertIdx = 0; lastL = -1;
    var d = '';
    function moveTo(x, y) { d += 'M' + x + ' ' + y; verts = [{ x: x, y: y, len: 0 }]; totalLen = 0; }
    function lineTo(x, y) {
      var p = verts[verts.length - 1];
      totalLen += Math.abs(x - p.x) + Math.abs(y - p.y);
      d += 'L' + x + ' ' + y;
      verts.push({ x: x, y: y, len: totalLen });
    }

    /* start under the hero CTA, drop to the rail */
    var first = targets[0].getBoundingClientRect();
    var startX = Math.round(first.left + 26);
    var startY = Math.round(first.bottom + sy + 28);
    moveTo(startX, startY);
    lineTo(startX, startY + 26);
    lineTo(railX, startY + 26);
    var lastY = startY + 26;

    /* visit every marked object: out to it, mark it, back to the rail */
    for (var i = 1; i < targets.length; i++) {
      var r = targets[i].getBoundingClientRect();
      var y = Math.round(r.top + sy + Math.min(30, r.height / 2));
      if (y < lastY + 34) y = lastY + 34;
      var reach = Math.round(Math.max(railX + 22, Math.min(r.left - 10, railX + 64)));
      lineTo(railX, y);
      lineTo(reach, y);
      nodes.push({ x: reach, y: y, len: totalLen, lit: false, el: null });
      lineTo(railX, y);
      lastY = y;
    }

    /* terminate: short drop, arrowhead */
    lineTo(railX, lastY + 56);
    rail.setAttribute('d', d);
    ghost.setAttribute('d', d);
    rail.style.strokeDasharray = totalLen + ' ' + totalLen;
    endArrow.setAttribute('points',
      (railX - 5) + ',' + (lastY + 56) + ' ' + (railX + 5) + ',' + (lastY + 56) + ' ' + railX + ',' + (lastY + 65));

    while (nodesG.firstChild) nodesG.removeChild(nodesG.firstChild);
    nodes.forEach(function (n) {
      var g = document.createElementNS(SVGNS, 'g');
      g.setAttribute('class', 'spine-node');
      var c = document.createElementNS(SVGNS, 'circle');
      c.setAttribute('cx', n.x); c.setAttribute('cy', n.y); c.setAttribute('r', 4.5);
      var q = document.createElementNS(SVGNS, 'rect');
      q.setAttribute('x', n.x + 7); q.setAttribute('y', n.y - 3);
      q.setAttribute('width', 6); q.setAttribute('height', 6);
      g.appendChild(c); g.appendChild(q);
      nodesG.appendChild(g);
      n.el = g;
    });

    spineBuilt = true;
    if (reduceMotion) {
      /* the sheet arrives fully plotted; CSS hides the pen */
      rail.style.strokeDashoffset = 0;
      nodes.forEach(function (n) { n.el.classList.add('lit'); });
      endArrow.classList.add('lit');
      if (plotted) plotted.textContent = 'PLOT 100%';
    } else {
      lastL = -1;
      spineStep();   /* paint the current state synchronously; scrolling uses rAF */
    }
  }

  function lengthAtY(targetY) {
    if (!verts.length) return 0;
    if (targetY <= verts[0].y) return 0;
    var i = vertIdx;
    if (i > verts.length - 2) i = verts.length - 2;
    while (i > 0 && verts[i].y > targetY) i--;
    while (i < verts.length - 1 && verts[i + 1].y <= targetY) i++;
    vertIdx = i;
    if (i >= verts.length - 1) return totalLen;
    var a = verts[i], b = verts[i + 1];
    if (b.y === a.y) return a.len;
    var f = (targetY - a.y) / (b.y - a.y);
    if (f < 0) f = 0; if (f > 1) f = 1;
    return a.len + (b.len - a.len) * f;
  }

  var spineRaf = 0;
  function requestSpine() {
    if (reduceMotion || !spineBuilt) return;
    if (!spineRaf) spineRaf = window.requestAnimationFrame(spineStep);
  }
  function spineStep() {
    spineRaf = 0;
    var targetY = window.pageYOffset + window.innerHeight * 0.72;
    var L = lengthAtY(targetY);
    if (L === lastL) return;
    lastL = L;
    rail.style.strokeDashoffset = totalLen - L;
    var pt = rail.getPointAtLength(L);
    pen.setAttribute('transform', 'translate(' + pt.x.toFixed(1) + ',' + pt.y.toFixed(1) + ')');
    for (var i = 0; i < nodes.length; i++) {
      var lit = L >= nodes[i].len - 1;
      if (lit !== nodes[i].lit) {
        nodes[i].lit = lit;
        nodes[i].el.classList.toggle('lit', lit);
      }
    }
    endArrow.classList.toggle('lit', L >= totalLen - 2);
    if (plotted) plotted.textContent = 'PLOT ' + pad(Math.round(100 * L / totalLen), 3) + '%';
  }
  window.addEventListener('scroll', requestSpine, { passive: true });

  var rebuildT = 0;
  function scheduleSpineRebuild() {
    window.clearTimeout(rebuildT);
    rebuildT = window.setTimeout(buildSpine, 180);
  }
  window.addEventListener('resize', scheduleSpineRebuild);
  window.addEventListener('load', scheduleSpineRebuild);
  if ('ResizeObserver' in window) {
    new ResizeObserver(scheduleSpineRebuild).observe(document.body);
  }
  if (document.fonts && document.fonts.ready && document.fonts.ready.then) {
    document.fonts.ready.then(scheduleSpineRebuild);
  }
  buildSpine();

  /* ---------- hero reticle: crosshair + coordinates on fine pointers ---------- */
  var hero = document.querySelector('.hero');
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (hero && finePointer && !reduceMotion) {
    var retH = document.getElementById('ret-h');
    var retV = document.getElementById('ret-v');
    var retDot = document.getElementById('ret-dot');
    var retRead = document.getElementById('ret-read');
    var tx = 0, ty = 0, cx = 0, cy = 0, retRaf = 0;

    hero.addEventListener('pointermove', function (e) {
      if (window.innerWidth < 980) return;
      var r = hero.getBoundingClientRect();
      tx = e.clientX - r.left;
      ty = e.clientY - r.top;
      if (!hero.classList.contains('ret-on')) {
        hero.classList.add('ret-on');
        cx = tx; cy = ty;
      }
      if (!retRaf) retRaf = window.requestAnimationFrame(retStep);
    });
    hero.addEventListener('pointerleave', function () {
      hero.classList.remove('ret-on');
    });
    var retStep = function () {
      retRaf = 0;
      cx += (tx - cx) * 0.24;
      cy += (ty - cy) * 0.24;
      retH.style.transform = 'translateY(' + cy.toFixed(1) + 'px)';
      retV.style.transform = 'translateX(' + cx.toFixed(1) + 'px)';
      retDot.style.transform = 'translate(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px)';
      retRead.style.transform = 'translate(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px)';
      retRead.textContent = 'X ' + pad(Math.round(cx), 4) + ' / Y ' + pad(Math.round(cy), 4);
      if (Math.abs(tx - cx) > 0.5 || Math.abs(ty - cy) > 0.5) {
        retRaf = window.requestAnimationFrame(retStep);
      }
    };
  }

  /* ---------- sentry arm: lazy 3D engine, loads after everything else ---------- */
  var armBay = document.getElementById('arm-bay');
  if (armBay) {
    var armBooted = false;
    var bootArm = function () {
      if (armBooted) return;
      /* phones and tablets skip the arm entirely (the bay is display:none
         there). width is re-checked on resize because a viewport can start
         narrow (or misreport) and widen later */
      if (window.innerWidth < 980) return;
      armBooted = true;
      import('./arm.js').then(function (mod) {
        mod.default({
          bay: armBay,
          hero: document.querySelector('.hero'),
          reduceMotion: reduceMotion
        });
      }).catch(function () {
        var s = document.getElementById('arm-state');
        if (s) s.textContent = 'STATE: OFFLINE';
      });
    };
    window.addEventListener('resize', bootArm);
    if (document.readyState === 'complete') bootArm();
    else window.addEventListener('load', bootArm, { once: true });
  }

  /* ---------- composer: prefill WhatsApp / email, nothing leaves the page ---------- */
  var msgEl = document.getElementById('c-msg');
  var nameEl = document.getElementById('c-name');
  var waBtn = document.getElementById('send-wa');
  var mailBtn = document.getElementById('send-mail');
  var DEFAULT_MSG = 'Hi Ibrahim, I found your portfolio and would like to connect.';

  function updateComposer() {
    var msg = (msgEl.value || '').trim() || DEFAULT_MSG;
    var name = (nameEl.value || '').trim();
    var full = name ? msg + '\n\n' + name : msg;
    waBtn.href = 'https://wa.me/923094455101?text=' + encodeURIComponent(full);
    var subject = name ? 'Portfolio contact from ' + name : 'Portfolio contact';
    mailBtn.href = 'mailto:ibrahimtalib.official@gmail.com' +
      '?subject=' + encodeURIComponent(subject) +
      '&body=' + encodeURIComponent(full.replace(/\n/g, '\r\n'));
  }
  if (msgEl && nameEl && waBtn && mailBtn) {
    msgEl.addEventListener('input', updateComposer);
    nameEl.addEventListener('input', updateComposer);
    updateComposer();
    document.getElementById('composer').addEventListener('submit', function (e) {
      e.preventDefault();
    });
  }

  /* ---------- TP611: reproduce the power-noise story ---------- */
  var tp = document.getElementById('tp611');
  var readout = document.getElementById('tp611-readout');
  if (tp && readout) {
    var closeBtn = readout.querySelector('.tp611-close');
    var noiseTimer = null;
    var closeReadout = function () {
      readout.hidden = true;
      tp.setAttribute('aria-expanded', 'false');
    };
    tp.setAttribute('aria-expanded', 'false');
    tp.addEventListener('click', function (e) {
      e.stopPropagation(); /* keep the media "kick" out of it */
      if (!readout.hidden) { closeReadout(); return; }
      if (!reduceMotion) {
        document.body.classList.add('power-noise');
        window.clearTimeout(noiseTimer);
        noiseTimer = window.setTimeout(function () {
          document.body.classList.remove('power-noise');
        }, 1200);
      }
      readout.hidden = false;
      tp.setAttribute('aria-expanded', 'true');
    });
    closeBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      closeReadout();
      tp.focus();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !readout.hidden) {
        closeReadout();
        tp.focus();
      }
    });
  }
})();
