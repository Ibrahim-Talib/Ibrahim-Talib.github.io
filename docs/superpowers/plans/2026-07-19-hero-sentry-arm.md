# Hero Sentry Arm Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hero's empty right column with an interactive procedural 3D wireframe robotic arm (cursor-tracking sentry) with a live telemetry panel, and enlarge the hero title.

**Architecture:** A lazily-imported ES module (`js/arm.js`) builds an articulated arm from Three.js primitives rendered as ink-colored line segments on a transparent canvas. `js/main.js` dynamic-imports it after `load`. A static SVG arm in the markup is the default; JS swaps it for the canvas only after WebGL init succeeds. Telemetry values are read from the live joint state. Render loop is on-demand (IntersectionObserver + visibilitychange gated).

**Tech Stack:** Vanilla HTML/CSS/JS + vendored Three.js (MIT, pinned, self-hosted, split module + core files). No build step. No test framework exists in this repo; each task's "test" is a concrete browser-eval or shell check with expected output.

**Testing caveat for this machine:** the preview pane's renderer stays `document.hidden`, so rAF never fires. `arm.js` therefore exposes `window.__armDebug = { st, step }`, and verification drives `step()` manually. The owner does the final visual check in a real browser at http://localhost:4173.

---

### Task 1: Vendor Three.js

**Files:**
- Create: `assets/vendor/three.module.min.js`
- Create: `assets/vendor/three.core.min.js` (recent Three.js builds split the module; the main file does `import "./three.core.min.js"`)
- Modify: `assets/CREDITS.md`

- [ ] **Step 1: Download the pinned build (try 0.172.0; if 404, use the latest stable shown by `curl -s https://registry.npmjs.org/three/latest | grep -o '"version":"[^"]*"'` and pin that everywhere below)**

```bash
cd "D:/Ibrahim_Talib/Documents/projects/portfolio"
mkdir -p assets/vendor
curl -sL -o assets/vendor/three.module.min.js "https://cdn.jsdelivr.net/npm/three@0.172.0/build/three.module.min.js"
head -c 300 assets/vendor/three.module.min.js
```

Expected: minified JS starting with a license banner or `import`/`const`; NOT an HTML error page.

- [ ] **Step 2: Check for the split-core import and download it if referenced**

```bash
grep -o 'three\.core[^"]*' assets/vendor/three.module.min.js | head -2
curl -sL -o assets/vendor/three.core.min.js "https://cdn.jsdelivr.net/npm/three@0.172.0/build/three.core.min.js"
ls -la assets/vendor/
```

Expected: if grep printed `three.core.min.js`, the second file must exist and be ~1MB minified. If grep printed nothing, delete `three.core.min.js` and skip it in CREDITS.

- [ ] **Step 3: Verify the MIT license**

```bash
curl -s "https://cdn.jsdelivr.net/npm/three@0.172.0/LICENSE" | head -5
```

Expected: `The MIT License` / `Copyright © 2010-20xx three.js authors`.

- [ ] **Step 4: Log it in CREDITS.md** — append under a new `## Libraries (self-hosted)` section:

```markdown
## Libraries (self-hosted)

| File | Library / version | Source (downloaded 2026-07-19) | License |
| --- | --- | --- | --- |
| `vendor/three.module.min.js` | Three.js 0.172.0 | https://cdn.jsdelivr.net/npm/three@0.172.0/build/three.module.min.js | MIT |
| `vendor/three.core.min.js` | Three.js 0.172.0 (core split) | https://cdn.jsdelivr.net/npm/three@0.172.0/build/three.core.min.js | MIT |

License text: https://github.com/mrdoob/three.js/blob/dev/LICENSE
```

Also update the intro line "No other third-party assets, libraries, or downloads are used." to "No other third-party assets or libraries are used."

- [ ] **Step 5: Commit**

```bash
git add assets/vendor assets/CREDITS.md
git commit -m "Vendor Three.js 0.172.0 (MIT, self-hosted) for the hero sentry arm"
```

---

### Task 2: Hero markup — arm bay, telemetry, fallback SVG, bigger-title prep

**Files:**
- Modify: `index.html` (hero-side block; footer note)

- [ ] **Step 1: Replace the whole `.hero-side` block** (currently `tb-mini` + `hero-arrows` svg) with:

```html
<div class="hero-side" data-reveal style="--i:2" aria-hidden="true">
  <div class="arm-bay" id="arm-bay">
    <div class="tb-mini">
      DOC NO. <span class="tb-strong">PRTF-2026-001</span><br>
      SHEET 1 OF 1 / REV C<br>
      SCALE: NTS / PEN 01
    </div>
    <canvas class="arm-canvas" id="arm-canvas"></canvas>
    <!-- static fallback: shown for no-JS, no-WebGL, tiny screens, or load failure -->
    <svg class="arm-fallback" viewBox="0 0 360 340" focusable="false">
      <rect class="g-body" x="120" y="292" width="120" height="10"/>
      <path class="g-body" d="M138 292 q4 -34 42 -38 h4 q34 4 38 38"/>
      <circle class="g-hot" cx="180" cy="252" r="8"/>
      <path class="g-body" d="M174 250 L128 138"/>
      <path class="g-body" d="M188 250 L142 132"/>
      <circle class="g-hot" cx="134" cy="134" r="9"/>
      <path class="g-body" d="M136 126 L212 74"/>
      <path class="g-body" d="M142 140 L218 86"/>
      <circle class="g-hot" cx="216" cy="80" r="7"/>
      <path class="g-body" d="M222 76 L262 62 L280 70"/>
      <path class="g-body" d="M262 62 L284 46"/>
      <path class="g-hot" d="M280 70 L296 78 M284 46 L300 40"/>
      <path class="g-weave" d="M60 320 H300"/>
      <text class="g-label" x="120" y="330">SENTRY ARM / STATIC PLOT</text>
    </svg>
    <div class="arm-tel">
      <p class="arm-tel-head"><span>SENTRY / TELEMETRY</span><span id="arm-state">STATE: STANDBY</span></p>
      <p class="arm-tel-grid">
        <span class="tk">J1 YAW</span><span class="tv" id="tel-j1">----</span>
        <span class="tk">J2 SHLD</span><span class="tv" id="tel-j2">----</span>
        <span class="tk">J3 ELBW</span><span class="tv" id="tel-j3">----</span>
        <span class="tk">TGT</span><span class="tv" id="tel-tgt">X ---- / Y ----</span>
      </p>
    </div>
  </div>
</div>
```

- [ ] **Step 2: Update the footer honesty note** — replace

```html
<p class="foot-note">No frameworks, no trackers, no build step. Two typefaces, both SIL OFL.</p>
```

with

```html
<p class="foot-note">No frameworks, no trackers, no build step. One 3D engine, self-hosted (Three.js, MIT). Two typefaces, both SIL OFL.</p>
```

- [ ] **Step 3: Sanity check ids are unique**

```bash
grep -c 'id="arm-bay"' index.html && grep -c 'id="arm-state"' index.html
```

Expected: `1` and `1`.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "Hero: arm bay markup with telemetry panel and static SVG fallback"
```

---

### Task 3: CSS — bigger title, rebalanced grid, arm bay styles

**Files:**
- Modify: `css/style.css`

- [ ] **Step 1: Enlarge the hero title.** Replace the `.hero-title` `font-size` line:

```css
  font-size: clamp(3rem, min(12vw, 14.5vh), 10rem);
```

(line-height stays 0.92; the clamp's vh term keeps three lines inside short viewports.)

- [ ] **Step 2: Rebalance the hero grid.** Replace `.hero-grid`'s `grid-template-columns` with:

```css
  grid-template-columns: minmax(0, 6.2fr) minmax(0, 5.8fr);
```

- [ ] **Step 3: Replace the `.hero-side`/`.tb-mini`/`.hero-arrows` block.** Delete the `.hero-arrows` rules entirely; replace `.hero-side` and add the bay styles:

```css
/* hero right: the sentry arm instrument bay */
.hero-side { position: relative; min-height: 100%; }
.arm-bay {
  position: relative;
  height: 100%;
  min-height: 440px;
}
.tb-mini {
  position: absolute;
  top: 0; right: 0; z-index: 2;
  text-align: right;
  font: 400 10px/1.9 var(--font-mono);
  letter-spacing: 0.14em;
  color: var(--ink-2);
  border: 1px solid var(--line);
  padding: 12px 16px;
  background: color-mix(in srgb, var(--paper-2) 55%, transparent);
}
.tb-mini .tb-strong { color: var(--ink); font-weight: 500; }

.arm-canvas {
  position: absolute; inset: 0;
  width: 100%; height: 100%;
  display: none;
  pointer-events: none; /* the hero owns the pointer; the arm only listens */
}
.arm-bay.arm-live .arm-canvas { display: block; }
.arm-bay.arm-live .arm-fallback { display: none; }
.arm-fallback {
  position: absolute;
  left: 50%; top: 54%;
  width: min(78%, 420px);
  transform: translate(-50%, -50%);
}

.arm-tel {
  position: absolute;
  left: 0; bottom: 0; z-index: 2;
  min-width: 240px;
  border: 1px solid var(--line);
  background: color-mix(in srgb, var(--paper-2) 72%, transparent);
  padding: 10px 12px;
  font: 400 10px/1.7 var(--font-mono);
  letter-spacing: 0.1em;
  color: var(--ink-2);
}
.arm-tel-head {
  display: flex; justify-content: space-between; gap: 14px;
  color: var(--ink);
  font-weight: 500;
  border-bottom: 1px solid var(--line-soft);
  padding-bottom: 6px; margin-bottom: 6px;
}
.arm-tel-head span:last-child { color: var(--signal-deep); }
.arm-tel-grid {
  display: grid;
  grid-template-columns: auto 1fr auto 1fr;
  gap: 2px 10px;
  font-variant-numeric: tabular-nums;
}
.arm-tel-grid .tv { color: var(--ink); text-align: right; white-space: nowrap; }
```

Note: the old `.tb-mini` rules (with `margin-left: auto`) are replaced by the absolute version above — remove the old block so there is exactly one `.tb-mini` rule set.

- [ ] **Step 4: Responsive + reduced motion.** In the `@media (max-width: 979px)` block, replace the old `.hero-side { flex-direction: row; ... }`, `.tb-mini { margin-left: 0 ... }` and `.hero-arrows` lines with:

```css
  .arm-bay { min-height: 320px; }
  .tb-mini { display: none; }
```

In `@media (max-width: 620px)`, delete the old `.hero-side` / `.hero-arrows` lines and add nothing (bay stays; JS refuses to init 3D below 480px so the SVG shows).

- [ ] **Step 5: Grep for dead selectors**

```bash
grep -n "hero-arrows" css/style.css index.html js/main.js
```

Expected: no matches.

- [ ] **Step 6: Commit**

```bash
git add css/style.css
git commit -m "Hero CSS: larger title, rebalanced grid, arm bay + telemetry styles"
```

---

### Task 4: `js/arm.js` — the sentry module

**Files:**
- Create: `js/arm.js`

- [ ] **Step 1: Write the module** (complete file):

```js
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
```

- [ ] **Step 2: Commit**

```bash
git add js/arm.js
git commit -m "Sentry arm module: procedural wireframe rig, patrol/track states, telemetry"
```

---

### Task 5: Wire it up in `js/main.js`

**Files:**
- Modify: `js/main.js` (append before the composer section, after the reticle block)

- [ ] **Step 1: Add the loader** (uses the existing `reduceMotion` var):

```js
  /* ---------- sentry arm: lazy 3D engine, loads after everything else ---------- */
  var armBay = document.getElementById('arm-bay');
  if (armBay && window.innerWidth >= 480) {
    var bootArm = function () {
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
    if (document.readyState === 'complete') bootArm();
    else window.addEventListener('load', bootArm, { once: true });
  }
```

- [ ] **Step 2: Verify no syntax errors by loading the page**

Start the preview server (`preview_start` name `portfolio`), then browser-eval:

```js
JSON.stringify({ errors: 'checked via read_console_messages', armLive: !!document.querySelector('.arm-bay.arm-live') })
```

Run `read_console_messages onlyErrors:true`. Expected: no errors; `armLive: true` (the pane is hidden but `load` + dynamic import still run; if `armLive` is false because `load` hasn't fired, dispatch `window.dispatchEvent(new Event('load'))` and re-check).

- [ ] **Step 3: Commit**

```bash
git add js/main.js
git commit -m "Lazy-load the sentry arm after window load, >=480px only"
```

---

### Task 6: Verification pass (hidden-renderer workarounds)

**Files:** none (fix-forward if checks fail)

- [ ] **Step 1: Simulated tracking check** — browser-eval:

```js
(function(){
  var d = window.__armDebug; if (!d) return 'NO DEBUG HOOK';
  d.st.mode = 'track'; d.st.px = 0.8; d.st.py = -0.4;
  d.st.pxAbs = 900; d.st.pyAbs = 200;
  for (var i = 0; i < 60; i++) d.step(0.016);
  d.tickTel(1); d.render();
  return JSON.stringify({
    j1: d.st.cur.j1.toFixed(2),
    telJ1: document.getElementById('tel-j1').textContent,
    state: document.getElementById('arm-state').textContent,
    tgtText: document.getElementById('tel-tgt').textContent
  });
})()
```

Expected: `j1` ≈ `0.76` (0.8 × 0.95, converged), `telJ1` like `+043.x°`, `state` `STATE: TRACK`, `tgtText` `X 0900 / Y 0200`.

- [ ] **Step 2: Patrol check** — set `d.st.mode='patrol'`, step 60 frames, expect `tel-tgt` = `SWEEP / AUTO`.

- [ ] **Step 3: Canvas actually drew** — browser-eval `window.__armDebug.render(); document.getElementById('arm-canvas').toDataURL().length > 2000` → `true`.

- [ ] **Step 4: Layout checks** — hero fits 1280×720 (CTA bottom < 720 with title enlarged), no horizontal overflow at 375 and 1280, `.arm-fallback` hidden when `arm-live`, shown when class removed. Fix any failures, then:

```bash
git add -A && git commit -m "Sentry arm: verification fixes"
```

(skip the commit if nothing changed)

- [ ] **Step 5: Owner visual check** — ask the owner to open http://localhost:4173 in a real browser: arm patrols, tracks the cursor, telemetry moves, fingers open near the CTAs. Push only after their OK (stack-levels placeholder is still unpushed and would go live too).

---

## Self-review notes

- Spec coverage: engine vendoring (T1), markup+fallback+telemetry (T2), title/grid/styles (T3), model+states+telemetry+gating (T4), lazy wiring + <480 gate (T5), fallback/perf/fit checks (T6). Reduced-motion covered in T4 (`hold` branch) + existing global CSS kill. CREDITS + footer honesty in T1/T2.
- No placeholders; all code complete.
- Name consistency checked: `arm-bay` / `arm-live` / `arm-canvas` / `arm-state` / `tel-*` consistent across T2/T3/T4/T5; `initArm` exported default, imported via `mod.default`.
