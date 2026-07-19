# Hero Sentry Arm + Enlarged Title — Design Spec

Date: 2026-07-19
Status: approved direction (procedural wireframe arm on vendored Three.js); spec pending user review.

## Goal

Fill the empty right side of the hero with a professional, interactive 3D
wireframe robotic arm ("the sentry") that tracks the visitor's pointer, plus a
small live telemetry readout showing the arm's real joint positions. Enlarge
the hero title. Everything stays on the drafting-sheet concept: ink linework
on paper, one plotter-orange signal color.

## Constraints carried over from the site brief

- Vanilla site, no build step. Three.js is the first of the two permitted
  libraries; nothing else gets added.
- Zero fabricated content. Telemetry values must be the model's actual state.
- 60fps target, transform/opacity-only DOM animation, lazy heavy assets.
- Full fallback chain: no JS, no WebGL, reduced motion.
- All content readable with JS disabled.

## Engine and vendoring

- `assets/vendor/three.module.min.js`, pinned to the current stable release,
  downloaded from the official three.js npm/CDN distribution.
- License: MIT. Verify and record source URL + license in `assets/CREDITS.md`.
- Loaded with `import()` after the `window` load event in every case; under
  reduced motion the module renders a single static frame and never starts
  the loop.
- Footer note updated so it stays honest: "No frameworks, no trackers, no
  build step. One 3D engine (Three.js, MIT, self-hosted)."

## The arm — procedural model, reference-matched

Built entirely from Three.js primitives; no downloaded mesh. Visual targets
from the user's three reference images:

- **Base**: square plate + stepped round pedestal (LatheGeometry) with a
  bolt-circle of small cylinders; rendered as full triangulated wireframe
  (`WireframeGeometry`) so it reads dense like the references.
- **Joint hubs**: high-radial-segment cylinders/discs at shoulder and elbow,
  full wireframe for the spoke-disc look; thin orange torus ring on each hub.
- **Links**: tapered box/cylinder segments with chamfers, rendered as
  silhouette edges (`EdgesGeometry`, low threshold) so they stay crisp, with
  a few greeble boxes.
- **Boot sleeves**: stacks of shallow rings between joints (like the rubber
  boots in reference 1).
- **Gripper**: wrist cone + three articulated two-segment fingers with orange
  tips.

Hierarchy (what animates):

```
root (canvas-fit scale)
└── J1 turret     — yaw,   range ±55°
    └── J2 shoulder — pitch, range -20°..+30°
        └── J3 elbow  — pitch, range -35°..+25°
            └── J4 wrist — pitch, subtle counter-lean
                └── fingers — open/close 0..1
```

Materials: `LineBasicMaterial` in ink `#1a1611` at ~55% opacity for the dense
wireframe, full opacity for silhouettes, `#e04416` for joint rings, finger
tips and the small target reticle. Transparent canvas background — the paper
and its registration grid show through. No lights, no faces (a single
near-invisible dark fill mesh may be added inside links if line overlap reads
muddy; decision left to implementation, must keep the "drawing" look).

## Behavior

- **Idle / patrol**: slow sinusoidal sweep (J1 ±25°, gentle J2/J3 breathing),
  gripper closed. State label: `PATROL`.
- **Track**: pointer inside the hero → arm eases toward the cursor: J1 yaw
  follows X, J2/J3 lean follows Y, J4 counter-leans, fingers open as the
  pointer nears the CTA row. Servo lag via exponential smoothing (~0.08/frame
  at 60fps). State label: `TRACK`.
- Pointer leaves → ease back to patrol after 1.5s.
- **Touch / coarse pointers**: patrol only.
- **Render on demand**: rAF loop runs only while angles are changing or
  patrol is active AND the hero is on screen (IntersectionObserver) AND the
  document is visible. Otherwise fully parked.
- DPR capped at 2. Canvas sized to the hero-side column (~520×470 desktop).

## Telemetry panel (the "bench table")

Small mono panel pinned to the canvas' bottom-left corner, styled like the
title block (hairline border, paper-2 wash):

```
SENTRY / TELEMETRY          STATE: TRACK
J1 YAW   +012.4°    J2 SHLD  -004.2°
J3 ELBW  +008.9°    TGT      X 0412 / Y 0233
```

- Values read from the live model; text updated at ~10Hz (not every frame)
  with `font-variant-numeric: tabular-nums` so nothing jitters; fixed-width
  cells so the panel never reflows.
- With JS but no WebGL: panel shows `STATE: OFFLINE` over the SVG fallback.
- Reduced motion: frozen at the static pose, `STATE: HOLD`.

## Layout changes

- **Hero title enlarged** (explicit user request): from
  `clamp(2.7rem, min(10.6vw, 12.5vh), 8.4rem)` to approximately
  `clamp(3rem, min(12vw, 14.5vh), 10rem)`, line-height 0.9. Hero must still
  fit one viewport at 1280×720 and 1440×900; verify CTA remains above the
  fold and nothing wraps at 360px.
- Hero grid rebalanced ~ `6.2fr / 5.8fr` so the arm gets real width; the
  tb-mini block moves to the top-right of the arm canvas (overlay) so the
  side column is one coherent instrument.
- The pointer reticle (crosshair) keeps working across the hero; the arm
  canvas sits below it (`pointer-events: none` on the canvas — tracking reads
  the hero's pointermove, so the arm never steals clicks).
- Existing static hero-arrows SVG is removed (replaced by the arm).
- Mobile (<980px): canvas block appears after the CTA at ~300px height,
  patrol mode. Below 480px the 3D block is not initialized at all; the
  static SVG arm shows instead (saves the engine download on small phones).

## Fallback chain

1. **No JS**: hero-side renders the static 2D SVG arm (hand-authored, in the
   drafting style) — same footprint, no telemetry values (dashes).
2. **JS, no WebGL / import() fails**: same SVG, telemetry `STATE: OFFLINE`.
3. **Reduced motion**: 3D arm renders exactly one frame in a considered pose,
   loop never starts, telemetry frozen, `STATE: HOLD`.
4. **Save-Data / slow**: not detected separately; the lazy load after
   `load` event already keeps first paint clean.

## Files touched

- `assets/vendor/three.module.min.js` (new, vendored, pinned)
- `assets/CREDITS.md` (Three.js entry: version, source URL, MIT)
- `js/arm.js` (new ES module: model build, states, telemetry, fallbacks)
- `js/main.js` (dynamic import wiring after load; hero pointer plumbing
  shared with the reticle)
- `index.html` (hero-side markup: canvas mount, telemetry panel, fallback
  SVG, module script tag; footer note)
- `css/style.css` (title size, hero grid, arm panel + telemetry styles,
  reduced-motion rules)

## Success criteria

- Arm visibly tracks the cursor with servo lag on desktop; patrols on touch.
- Telemetry numbers move with the arm and match its pose.
- Zero console errors; no layout shift when the arm loads (reserved box).
- Page weight before interaction unchanged except the deferred engine
  (~170KB gzipped, post-load).
- JS-disabled and WebGL-less visitors see the styled SVG fallback.
- Hero fits the viewport at common desktop sizes with the larger title.

## Testing notes

This machine's preview renderer stays hidden (no rAF/paint), so tracking
behavior is verified by instrumenting state (joint angles via a debug hook)
and by the owner checking localhost in a real browser before push.
