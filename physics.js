// Slingshot: the gravity maths, shared by the game (index.html) and the level checker
// (check-levels.js). It has no drawing code, so it runs in the browser and in Node.
//
// ---------------------------------------------------------------------------------
// LEVEL FORMAT
// ---------------------------------------------------------------------------------
// The play area is 1200 wide and 800 tall, with (0, 0) in the middle:
//   x runs from -600 (left) to 600 (right), y from -400 (top) to 400 (bottom).
// A probe that goes past x = +/-750 or y = +/-500 is lost.
//
// {
//   id: 'w1-1',                 // world number, then level number
//   name: 'First Flight',
//   hint: 'One short sentence shown to the player.',
//   pad: { x: -450, y: 0 },     // where the probe starts
//   target: { x: 450, y: 0, r: 30 },   // ring to reach; r is its radius
//   bodies: [                   // planets and stars
//     { x: 0, y: 0, m: 400000, fixed: true, color: '#ffe28a' },   // stays still
//     { x: 0, y: 120, m: 2000, vx: 57, vy: 0, color: '#5fb4ff' }, // moves under gravity
//     { x: 200, y: 0, m: -300000, fixed: true },   // negative mass = repulsor (pushes)
//   ],
//   dust: [ { x: 100, y: -150 } ],   // stardust: ALL must be collected before the target counts
//   par: 2,                     // shots allowed for 3 stars
//   solution: { vx: 150, vy: -40 },  // a launch that wins; used by "Show solution" and tests
//   allowDirect: true,          // optional: aiming straight at the target is allowed to win
// }
//
// Rules of the physics:
// - Mass guide: asteroid 1, planet 1000, giant 30000, star 1000000. Size comes from mass
//   (see radiusFor). Speed for a circular orbit at distance d around mass M is sqrt(M / d).
// - The probe has no mass: bodies pull on it, it does not pull on them.
// - Moving bodies pull on each other and are pulled by fixed bodies. They never merge.
// - Repulsors must be fixed, and only push the probe (other bodies ignore them).
// - Launch speed is capped at MAX_SPEED. A flight lasts at most MAX_TIME seconds.
// - Time moves in fixed steps of DT, so the same launch always gives the same result.
// ---------------------------------------------------------------------------------

(function (root) {
  const DT = 1 / 120;          // seconds per physics step
  const MAX_TIME = 20;         // seconds of flight before the probe runs out of fuel
  const MAX_SPEED = 250;       // fastest allowed launch
  const SOFT = 4;              // stops gravity becoming infinite at zero distance
  const BOUNDS = { x: 750, y: 500 };
  const AREA = { x: 600, y: 400 };
  const DUST_R = 14;           // how close the probe must pass to collect stardust
  const PROBE_R = 2;

  // Size on screen grows slowly with mass.
  const radiusFor = m => Math.max(1.5, 0.4 * Math.pow(Math.abs(m), 0.28));

  // A fresh copy of a level, ready to play. Nothing moves until launch() is called.
  function createState(level) {
    return {
      level,
      bodies: level.bodies.map(b => ({
        x: b.x, y: b.y, vx: b.vx || 0, vy: b.vy || 0, m: b.m, fixed: !!b.fixed || b.m < 0,
        r: radiusFor(b.m), color: b.color || null, ax: 0, ay: 0,
      })),
      dust: (level.dust || []).map(d => ({ x: d.x, y: d.y, got: false })),
      probe: null,
      t: 0,
      result: null,            // 'win' | 'crash' | 'lost' | 'timeout' once the flight ends
    };
  }

  // Keep a launch within the speed limit.
  function clampLaunch(vx, vy) {
    const s = Math.hypot(vx, vy);
    if (s > MAX_SPEED) { vx *= MAX_SPEED / s; vy *= MAX_SPEED / s; }
    return { vx, vy };
  }

  function launch(state, vx, vy) {
    const v = clampLaunch(vx, vy);
    state.probe = { x: state.level.pad.x, y: state.level.pad.y, vx: v.vx, vy: v.vy, ax: 0, ay: 0 };
  }

  // Work out the pull on every moving thing (Newton's law of gravity).
  function accelerations(state) {
    const bodies = state.bodies, p = state.probe;
    for (const b of bodies) { b.ax = 0; b.ay = 0; }
    for (let i = 0; i < bodies.length; i++) {
      const a = bodies[i];
      if (a.m < 0) continue;                       // repulsors only act on the probe
      for (let j = i + 1; j < bodies.length; j++) {
        const b = bodies[j];
        if (b.m < 0) continue;
        const dx = b.x - a.x, dy = b.y - a.y;
        const d2 = dx * dx + dy * dy + SOFT * SOFT;
        const inv = 1 / (d2 * Math.sqrt(d2));
        a.ax += b.m * dx * inv; a.ay += b.m * dy * inv;
        b.ax -= a.m * dx * inv; b.ay -= a.m * dy * inv;
      }
    }
    if (p) {
      p.ax = 0; p.ay = 0;
      for (const b of bodies) {
        const dx = b.x - p.x, dy = b.y - p.y;
        const d2 = dx * dx + dy * dy + SOFT * SOFT;
        const inv = b.m / (d2 * Math.sqrt(d2));    // negative mass gives a push
        p.ax += dx * inv; p.ay += dy * inv;
      }
    }
  }

  // Move time forward by one step of DT ("leapfrog": half-kick, move, half-kick).
  function stepState(state) {
    if (state.result) return state.result;
    const movers = state.bodies.filter(b => !b.fixed);
    const p = state.probe;
    if (p) movers.push(p);

    accelerations(state);
    for (const o of movers) {
      o.vx += o.ax * DT / 2; o.vy += o.ay * DT / 2;
      o.x += o.vx * DT; o.y += o.vy * DT;
    }
    accelerations(state);
    for (const o of movers) { o.vx += o.ax * DT / 2; o.vy += o.ay * DT / 2; }
    state.t += DT;

    if (p) {
      for (const b of state.bodies) {
        if (Math.hypot(b.x - p.x, b.y - p.y) < b.r + PROBE_R) { state.result = 'crash'; return 'crash'; }
      }
      for (const d of state.dust) {
        if (!d.got && Math.hypot(d.x - p.x, d.y - p.y) < DUST_R) d.got = true;
      }
      const tg = state.level.target;
      if (state.dust.every(d => d.got) && Math.hypot(tg.x - p.x, tg.y - p.y) < tg.r) state.result = 'win';
      else if (Math.abs(p.x) > BOUNDS.x || Math.abs(p.y) > BOUNDS.y) state.result = 'lost';
      else if (state.t >= MAX_TIME) state.result = 'timeout';
    }
    return state.result;
  }

  // Play one whole shot and say how it ended. Used for testing and searching.
  function runShot(level, vx, vy) {
    const state = createState(level);
    launch(state, vx, vy);
    const tg = level.target;
    let closest = Infinity;
    while (!stepState(state)) {
      closest = Math.min(closest, Math.hypot(tg.x - state.probe.x, tg.y - state.probe.y));
    }
    return { result: state.result, time: state.t, closest,
      dust: state.dust.filter(d => d.got).length, dustTotal: state.dust.length };
  }

  const api = { DT, MAX_TIME, MAX_SPEED, SOFT, BOUNDS, AREA, DUST_R, PROBE_R,
    radiusFor, createState, clampLaunch, launch, stepState, runShot };
  root.Physics = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
