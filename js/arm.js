/* The sentry: a procedural wireframe arm on vendored Three.js.
   Density rule: full wireframe only on the pedestal and joint hubs
   (radial <= 24); everything else is silhouette edges. */
import * as THREE from '../assets/vendor/three.module.min.js';

export default function initArm(opts) {
  var bay = opts.bay;
  var hero = opts.hero;
  var reduce = opts.reduceMotion;
  var canvas = bay.querySelector('#arm-canvas');
  var stateEl = document.getElementById('arm-state');
  var telJ1 = document.getElementById('tel-j1');
  var telJ2 = document.getElementById('tel-j2');
  var telJ3 = document.getElementById('tel-j3');
  var telTgt = document.getElementById('tel-tgt');

  function offline() { if (stateEl) stateEl.textContent = 'STATE: OFFLINE'; }

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
  } catch (e) { offline(); return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  var scene = new THREE.Scene();
  var cam = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  cam.position.set(2.7, 2.0, 3.6);
  cam.lookAt(0, 1.02, 0);

  var INK = 0x1a1611, SIG = 0xe04416;
  var matEdge = new THREE.LineBasicMaterial({ color: INK });
  var matWire = new THREE.LineBasicMaterial({ color: INK, transparent: true, opacity: 0.34 });
  var matSig = new THREE.LineBasicMaterial({ color: SIG });

  function edges(geo, thresh) {
    return new THREE.LineSegments(new THREE.EdgesGeometry(geo, thresh || 24), matEdge);
  }
  function wire(geo) {
    return new THREE.LineSegments(new THREE.WireframeGeometry(geo), matWire);
  }
  function ring(r, mat, segs) {
    var pts = [];
    for (var i = 0; i < (segs || 40); i++) {
      var a = i / (segs || 40) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r));
    }
    return new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), mat || matSig);
  }

  /* ---------- build ---------- */
  var root = new THREE.Group();
  scene.add(root);

  /* base plate + pedestal (wireframe zone) */
  root.add(edges(new THREE.BoxGeometry(1.5, 0.06, 1.5)));
  var pedestal = wire(new THREE.LatheGeometry([
    new THREE.Vector2(0.60, 0.03), new THREE.Vector2(0.60, 0.10),
    new THREE.Vector2(0.44, 0.16), new THREE.Vector2(0.36, 0.26),
    new THREE.Vector2(0.40, 0.34), new THREE.Vector2(0.30, 0.40)
  ], 24));
  root.add(pedestal);
  for (var b = 0; b < 8; b++) {
    var bolt = edges(new THREE.CylinderGeometry(0.035, 0.035, 0.05, 10), 12);
    bolt.position.set(Math.cos(b / 8 * Math.PI * 2) * 0.5, 0.07, Math.sin(b / 8 * Math.PI * 2) * 0.5);
    root.add(bolt);
  }

  /* J1 turret: yaw */
  var j1 = new THREE.Group(); j1.position.y = 0.40; root.add(j1);
  var turret = edges(new THREE.CylinderGeometry(0.27, 0.31, 0.24, 16));
  turret.position.y = 0.12; j1.add(turret);
  var r1 = ring(0.33); r1.position.y = 0.24; j1.add(r1);

  /* J2 shoulder: pitch. hub disc is a wireframe cylinder on its side */
  var j2 = new THREE.Group(); j2.position.y = 0.34; j1.add(j2);
  var hub2 = wire(new THREE.CylinderGeometry(0.24, 0.24, 0.3, 20));
  hub2.rotation.z = Math.PI / 2; j2.add(hub2);
  var r2 = ring(0.27); r2.rotation.z = Math.PI / 2; j2.add(r2);
  var link1 = edges(new THREE.CylinderGeometry(0.09, 0.14, 0.95, 8));
  link1.position.y = 0.475; j2.add(link1);
  var g1 = edges(new THREE.BoxGeometry(0.10, 0.22, 0.16), 12);
  g1.position.set(0.10, 0.42, 0); j2.add(g1);

  /* boot sleeve under the elbow */
  for (var s = 0; s < 4; s++) {
    var sleeve = edges(new THREE.CylinderGeometry(0.10 + (s % 2) * 0.025, 0.10 + (s % 2) * 0.025, 0.03, 12), 30);
    sleeve.position.y = 0.78 + s * 0.045; j2.add(sleeve);
  }

  /* J3 elbow */
  var j3 = new THREE.Group(); j3.position.y = 0.95; j2.add(j3);
  var hub3 = wire(new THREE.CylinderGeometry(0.19, 0.19, 0.24, 20));
  hub3.rotation.z = Math.PI / 2; j3.add(hub3);
  var r3 = ring(0.22); r3.rotation.z = Math.PI / 2; j3.add(r3);
  var link2 = edges(new THREE.CylinderGeometry(0.07, 0.10, 0.80, 8));
  link2.position.y = 0.40; j3.add(link2);

  /* J4 wrist + gripper */
  var j4 = new THREE.Group(); j4.position.y = 0.80; j3.add(j4);
  var wrist = edges(new THREE.CylinderGeometry(0.09, 0.055, 0.16, 8));
  wrist.position.y = 0.08; j4.add(wrist);
  var r4 = ring(0.10, matSig, 24); r4.position.y = 0.17; j4.add(r4);
  var fingers = [];
  for (var f = 0; f < 3; f++) {
    var fRoot = new THREE.Group();
    fRoot.position.y = 0.18;
    fRoot.rotation.y = f / 3 * Math.PI * 2;
    var seg1 = edges(new THREE.BoxGeometry(0.035, 0.16, 0.05), 12);
    seg1.position.set(0.05, 0.08, 0);
    seg1.rotation.z = -0.5;
    fRoot.add(seg1);
    var tipG = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0.10, 0.15, 0), new THREE.Vector3(0.05, 0.30, 0)
    ]);
    fRoot.add(new THREE.Line(tipG, matSig));
    j4.add(fRoot);
    fingers.push(fRoot);
  }

  /* the tracked-target reticle */
  var tgt = new THREE.Group();
  tgt.add(ring(0.07, matSig, 24));
  var crossG = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-0.11, 0, 0), new THREE.Vector3(0.11, 0, 0),
    new THREE.Vector3(0, 0, -0.11), new THREE.Vector3(0, 0, 0.11)
  ]);
  tgt.add(new THREE.LineSegments(crossG, matSig));
  tgt.rotation.x = Math.PI / 2; /* face the camera-ish */
  tgt.visible = false;
  scene.add(tgt);

  /* ---------- state ---------- */
  var st = {
    mode: 'patrol', t: 0,
    cur: { j1: 0, j2: -0.25, j3: 0.55, j4: -0.30, grip: 0.15 },
    tgt: { j1: 0, j2: -0.25, j3: 0.55, j4: -0.30, grip: 0.15 },
    px: 0, py: 0, hasPointer: false
  };
  var LIM = { j1: 0.96, j2lo: -0.55, j2hi: 0.30, j3lo: -0.10, j3hi: 1.05 };

  function step(dt) {
    st.t += dt;
    if (st.mode === 'patrol') {
      st.tgt.j1 = Math.sin(st.t * 0.40) * 0.45;
      st.tgt.j2 = -0.25 + Math.sin(st.t * 0.23) * 0.07;
      st.tgt.j3 = 0.55 + Math.sin(st.t * 0.31) * 0.09;
      st.tgt.j4 = -0.30;
      st.tgt.grip = 0.15;
    } else if (st.mode === 'track') {
      st.tgt.j1 = Math.max(-LIM.j1, Math.min(LIM.j1, st.px * 0.95));
      st.tgt.j2 = Math.max(LIM.j2lo, Math.min(LIM.j2hi, -0.25 - st.py * 0.26));
      st.tgt.j3 = Math.max(LIM.j3lo, Math.min(LIM.j3hi, 0.55 + st.py * 0.34));
      st.tgt.j4 = -0.30 - st.py * 0.18;
    }
    var k = Math.min(1, dt * 4.6); /* servo lag */
    for (var key in st.cur) st.cur[key] += (st.tgt[key] - st.cur[key]) * k;

    j1.rotation.y = st.cur.j1;
    j2.rotation.x = st.cur.j2;
    j3.rotation.x = st.cur.j3;
    j4.rotation.x = st.cur.j4;
    for (var i = 0; i < fingers.length; i++) {
      fingers[i].children[0].rotation.z = -0.5 + st.cur.grip * 0.55;
    }
    tgt.visible = st.mode === 'track';
    if (tgt.visible) {
      tgt.position.set(st.px * 1.15, 1.85 - (st.py + 1) * 0.72, 1.05);
    }
  }

  /* ---------- telemetry (10Hz) ---------- */
  function fmtDeg(rad) {
    var d = rad * 180 / Math.PI;
    var sign = d < 0 ? '-' : '+';
    var a = Math.abs(d);
    var whole = String(Math.floor(a));
    while (whole.length < 3) whole = '0' + whole;
    return sign + whole + '.' + Math.floor((a - Math.floor(a)) * 10) + '°';
  }
  function pad4(n) {
    var s = String(Math.max(0, Math.round(n)));
    while (s.length < 4) s = '0' + s;
    return s;
  }
  var telAcc = 0;
  function tickTel(dt) {
    telAcc += dt;
    if (telAcc < 0.1) return;
    telAcc = 0;
    telJ1.textContent = fmtDeg(st.cur.j1);
    telJ2.textContent = fmtDeg(st.cur.j2);
    telJ3.textContent = fmtDeg(st.cur.j3);
    telTgt.textContent = st.mode === 'track'
      ? 'X ' + pad4(st.pxAbs) + ' / Y ' + pad4(st.pyAbs)
      : 'SWEEP / AUTO';
    stateEl.textContent = 'STATE: ' + (st.mode === 'patrol' ? 'PATROL' : st.mode === 'track' ? 'TRACK' : 'HOLD');
  }

  /* ---------- sizing ---------- */
  function fit() {
    var w = bay.clientWidth, h = bay.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    cam.aspect = w / h;
    /* keep the whole arm in frame on narrow bays */
    cam.fov = w / h < 0.9 ? 38 : 30;
    cam.updateProjectionMatrix();
  }
  fit();
  if ('ResizeObserver' in window) new ResizeObserver(function () { fit(); render(); }).observe(bay);

  function render() { renderer.render(scene, cam); }

  /* ---------- loop, gated ---------- */
  var rafId = 0, lastTs = 0, visible = true;
  function loop(ts) {
    rafId = 0;
    var dt = Math.min(0.05, (ts - lastTs) / 1000 || 0.016);
    lastTs = ts;
    step(dt);
    tickTel(dt);
    render();
    if (visible && !document.hidden && st.mode !== 'hold') {
      rafId = window.requestAnimationFrame(loop);
    }
  }
  function kick() {
    if (!rafId && visible && !document.hidden && st.mode !== 'hold') {
      lastTs = performance.now();
      rafId = window.requestAnimationFrame(loop);
    }
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible) kick();
    }, { threshold: 0.05 }).observe(bay);
  }
  document.addEventListener('visibilitychange', kick);

  /* ---------- pointer ---------- */
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var leaveTimer = null;
  if (!reduce && finePointer) {
    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      st.px = ((e.clientX - r.left) / r.width) * 2 - 1;
      st.py = ((e.clientY - r.top) / r.height) * 2 - 1;
      st.pxAbs = e.clientX - r.left;
      st.pyAbs = e.clientY - r.top;
      var cta = hero.querySelector('.hero-cta');
      if (cta) {
        var cr = cta.getBoundingClientRect();
        st.tgt.grip = (e.clientY > cr.top - 50 && e.clientY < cr.bottom + 50 &&
                       e.clientX > cr.left - 50 && e.clientX < cr.right + 50) ? 0.9 : 0.15;
      }
      st.mode = 'track';
      window.clearTimeout(leaveTimer);
      kick();
    });
    hero.addEventListener('pointerleave', function () {
      window.clearTimeout(leaveTimer);
      leaveTimer = window.setTimeout(function () { st.mode = 'patrol'; }, 1500);
    });
  }

  /* ---------- go ---------- */
  bay.classList.add('arm-live');
  if (reduce) {
    st.mode = 'hold';
    step(0.016); /* settle one pose */
    st.cur = st.tgt = { j1: 0.35, j2: -0.28, j3: 0.62, j4: -0.34, grip: 0.15 };
    step(0.016);
    telAcc = 1; tickTel(1);
    render();
  } else {
    stateEl.textContent = 'STATE: PATROL';
    render();
    kick();
  }

  /* debug hook: this machine's preview pane never fires rAF, so tests
     drive the sim manually. harmless in production. */
  window.__armDebug = { st: st, step: step, render: render, tickTel: tickTel };
}
