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
  var cam = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
  /* the camera is auto-fitted: distance is computed from a bounding sphere
     so the base plate and gripper always stay in frame at any aspect */
  var CENTER = new THREE.Vector3(0, 1.06, 0);
  var FIT_R = 1.74;
  var camDir = new THREE.Vector3(2.7, 1.1, 3.6).normalize();
  var camBase = new THREE.Vector3();

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
  var link1 = edges(new THREE.CylinderGeometry(0.09, 0.14, 0.78, 8));
  link1.position.y = 0.39; j2.add(link1);
  var g1 = edges(new THREE.BoxGeometry(0.10, 0.22, 0.16), 12);
  g1.position.set(0.10, 0.34, 0); j2.add(g1);

  /* boot sleeve under the elbow */
  for (var s = 0; s < 4; s++) {
    var sleeve = edges(new THREE.CylinderGeometry(0.10 + (s % 2) * 0.025, 0.10 + (s % 2) * 0.025, 0.03, 12), 30);
    sleeve.position.y = 0.60 + s * 0.045; j2.add(sleeve);
  }

  /* J3 elbow */
  var j3 = new THREE.Group(); j3.position.y = 0.78; j2.add(j3);
  var hub3 = wire(new THREE.CylinderGeometry(0.19, 0.19, 0.24, 20));
  hub3.rotation.z = Math.PI / 2; j3.add(hub3);
  var r3 = ring(0.22); r3.rotation.z = Math.PI / 2; j3.add(r3);
  var link2 = edges(new THREE.CylinderGeometry(0.07, 0.10, 0.62, 8));
  link2.position.y = 0.31; j3.add(link2);

  /* J4 wrist + gripper */
  var j4 = new THREE.Group(); j4.position.y = 0.62; j3.add(j4);
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
    cur: { j1: 0, j2: 0.35, j3: 1.15, j4: 0.45, grip: 0.15 },
    tgt: { j1: 0, j2: 0.35, j3: 1.15, j4: 0.45, grip: 0.15 },
    px: 0, py: 0, pinch: 0, aim: { x: 0, y: 0.9, z: 0.95 }
  };
  var LIM = {
    j1: 1.35,
    j2lo: -0.35, j2hi: 1.05,
    j3lo: 0.15, j3hi: 2.10,
    j4lo: 0.15, j4hi: 1.40
  };
  /* two-link reach: shoulder->elbow and elbow->claw tip */
  var L1 = 0.78, L2 = 0.84, SY = 0.74;

  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

  /* analytic IK: yaw at the base, then a planar 2-link solve in the
     yawed vertical plane. the claw lands as close to the target as the
     servo limits allow. */
  function solveIK(tx, ty, tz) {
    var yaw = Math.atan2(tx, tz);
    var rho = Math.sqrt(tx * tx + tz * tz);
    var h = ty - SY;
    var D = clamp(Math.sqrt(rho * rho + h * h), Math.abs(L1 - L2) + 0.02, L1 + L2 - 0.02);
    var phi = Math.atan2(rho, h);               /* from vertical, toward reach */
    var c3 = clamp((D * D - L1 * L1 - L2 * L2) / (2 * L1 * L2), -1, 1);
    var elbow = Math.acos(c3);
    var sh = phi - Math.atan2(L2 * Math.sin(elbow), L1 + L2 * Math.cos(elbow));
    st.tgt.j1 = clamp(yaw, -LIM.j1, LIM.j1);
    st.tgt.j2 = clamp(sh, LIM.j2lo, LIM.j2hi);
    st.tgt.j3 = clamp(elbow, LIM.j3lo, LIM.j3hi);
    /* wrist curls the claw down toward the target line, never up */
    st.tgt.j4 = clamp(0.35 + (phi - st.tgt.j2 - st.tgt.j3) * 0.5, LIM.j4lo, LIM.j4hi);
  }

  function step(dt) {
    st.t += dt;
    if (st.mode === 'patrol') {
      /* patrol is the same reach, chasing a slow wandering target */
      st.aim.x = Math.sin(st.t * 0.38) * 0.85;
      st.aim.y = 0.85 + Math.sin(st.t * 0.22) * 0.28;
      st.aim.z = 0.95;
      solveIK(st.aim.x, st.aim.y, st.aim.z);
      st.tgt.grip = 0.15;
      /* camera drifts back to center once the pointer is gone */
      st.px += (0 - st.px) * Math.min(1, dt * 2);
      st.py += (0 - st.py) * Math.min(1, dt * 2);
    } else if (st.mode === 'track') {
      st.aim.x = st.px * 1.30;
      st.aim.y = 1.66 - (st.py + 1) * 0.78;
      st.aim.z = 0.95;
      solveIK(st.aim.x, st.aim.y, st.aim.z);
    }
    if (st.pinch > 0) { st.pinch -= dt; st.tgt.grip = 1; }
    var k = Math.min(1, dt * 7.2); /* servo response */
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
      tgt.position.set(st.aim.x, st.aim.y, st.aim.z);
    }
    /* pointer parallax on the camera, never in hold */
    if (st.mode !== 'hold') {
      cam.position.set(camBase.x + st.px * 0.26, camBase.y - st.py * 0.18, camBase.z);
      cam.lookAt(CENTER);
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
    /* fit the bounding sphere in whichever field of view is tighter */
    var vFov = cam.fov * Math.PI / 180;
    var hFov = 2 * Math.atan(Math.tan(vFov / 2) * cam.aspect);
    var dist = FIT_R / Math.sin(Math.min(vFov, hFov) / 2) * 1.04;
    camBase.copy(CENTER).addScaledVector(camDir, dist);
    cam.position.copy(camBase);
    cam.lookAt(CENTER);
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
    /* a press makes the gripper snap shut for a beat */
    hero.addEventListener('pointerdown', function () {
      st.pinch = 0.45;
      kick();
    });
  }

  /* ---------- go ---------- */
  bay.classList.add('arm-live');
  if (reduce) {
    st.mode = 'hold';
    solveIK(0.55, 0.85, 0.95); /* a considered reach, claw down */
    st.tgt.grip = 0.15;
    for (var hk in st.tgt) st.cur[hk] = st.tgt[hk];
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
  window.__armDebug = {
    st: st, step: step, render: render, tickTel: tickTel,
    /* projects the rig's bounding box to NDC; all values in [-1,1] = fully framed */
    frameCheck: function () {
      root.updateWorldMatrix(true, true);
      var box = new THREE.Box3().setFromObject(root);
      var ndc = { x0: 9, x1: -9, y0: 9, y1: -9 };
      [box.min.x, box.max.x].forEach(function (x) {
        [box.min.y, box.max.y].forEach(function (y) {
          [box.min.z, box.max.z].forEach(function (z) {
            var v = new THREE.Vector3(x, y, z).project(cam);
            ndc.x0 = Math.min(ndc.x0, v.x); ndc.x1 = Math.max(ndc.x1, v.x);
            ndc.y0 = Math.min(ndc.y0, v.y); ndc.y1 = Math.max(ndc.y1, v.y);
          });
        });
      });
      return ndc;
    }
  };
}
