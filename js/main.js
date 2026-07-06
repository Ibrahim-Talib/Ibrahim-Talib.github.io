/* Portfolio, one sheet. Hand-routed JS: no libraries, no listeners on scroll. */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var docEl = document.documentElement;

  /* ---------- boot sequence (once per session, skippable) ---------- */
  var boot = document.getElementById('boot');
  function endBoot(instant) {
    if (!boot) return;
    try { sessionStorage.setItem('it-booted', '1'); } catch (e) { /* private mode */ }
    docEl.classList.add('booted');
    if (instant) {
      if (boot.parentNode) boot.parentNode.removeChild(boot);
    } else {
      boot.classList.add('done');
      window.setTimeout(function () {
        if (boot.parentNode) boot.parentNode.removeChild(boot);
      }, 360);
    }
    boot = null;
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

  /* ---------- reveal on approach ---------- */
  var revealables = [].slice.call(
    document.querySelectorAll('[data-reveal], [data-reveal-group], .board')
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

    /* looping animations (pulses, pings, servo) run only while on screen */
    var liveIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        entry.target.classList.toggle('live', entry.isIntersecting);
      });
    }, { threshold: 0.15 });
    document.querySelectorAll('.board, .module').forEach(function (el) { liveIO.observe(el); });

    /* header hairline appears once the page has scrolled */
    var head = document.querySelector('.site-head');
    var sentinel = document.createElement('div');
    sentinel.setAttribute('aria-hidden', 'true');
    sentinel.style.cssText = 'position:absolute;top:0;left:0;height:2px;width:1px;pointer-events:none;';
    document.body.prepend(sentinel);
    new IntersectionObserver(function (entries) {
      head.classList.toggle('scrolled', !entries[0].isIntersecting);
    }).observe(sentinel);

    /* scrollspy: light the active net label */
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
    function closeReadout() {
      readout.hidden = true;
      tp.setAttribute('aria-expanded', 'false');
    }
    tp.setAttribute('aria-expanded', 'false');
    tp.addEventListener('click', function () {
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
    closeBtn.addEventListener('click', function () {
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
