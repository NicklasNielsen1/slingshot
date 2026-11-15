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
//
//   // Optional extras, used from World 4 onwards. They affect ONLY the probe;
//   // planets and stars ignore them.
//   portals: [ { a: { x: -200, y: 100 }, b: { x: 300, y: -150 } } ],
//       // A wormhole pair. Fly within PORTAL_R of one end and you come out of the other
//       // end, at the same speed and direction. Works both ways, any number of times.
//   walls: [ { x1: -100, y1: -200, x2: 100, y2: -200 } ],
//       // A straight mirror wall from (x1, y1) to (x2, y2). The probe bounces off it
//       // like a ball off a cushion, keeping its speed. Both sides bounce.
//   gates: [ { x: 0, y: 150, boost: 1.5 } ],
//       // A speed gate. Fly within GATE_R of it and your speed is multiplied by boost
//       // (more than 1 = faster, less than 1 = a brake). Each gate works once per shot.
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
  const PORTAL_R = 18;         // size of a wormhole end
  const GATE_R = 22;           // size of a speed gate

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
      portals: (level.portals || []).map(p => ({ a: { x: p.a.x, y: p.a.y }, b: { x: p.b.x, y: p.b.y } })),
      walls: (level.walls || []).map(w => ({ x1: w.x1, y1: w.y1, x2: w.x2, y2: w.y2 })),
      gates: (level.gates || []).map(g => ({ x: g.x, y: g.y, boost: g.boost, used: false })),
      used: { portals: 0, walls: 0, gates: 0 },   // how many times each extra was triggered
      events: [],              // things that just happened, for the game to draw a flash
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
    state.probe = { x: state.level.pad.x, y: state.level.pad.y, vx: v.vx, vy: v.vy, ax: 0, ay: 0, inPortal: null };
  }

  // Mirror walls. The probe moved from (x0, y0) to where it is now; if that path crosses
  // a wall, fold the rest of the path back off the wall and flip the speed the same way.
  function bounceOffWalls(state, x0, y0) {
    const p = state.probe;
    let lastWall = null;
    for (let pass = 0; pass < 3; pass++) {           // up to 3 bounces in one step (corners)
      let best = null, bestT = Infinity;
      for (const w of state.walls) {
        if (w === lastWall) continue;
        const rx = p.x - x0, ry = p.y - y0, sx = w.x2 - w.x1, sy = w.y2 - w.y1;
        const den = rx * sy - ry * sx;
        if (Math.abs(den) < 1e-12) continue;         // moving parallel to the wall
        const t = ((w.x1 - x0) * sy - (w.y1 - y0) * sx) / den;   // how far along the probe's path
        const u = ((w.x1 - x0) * ry - (w.y1 - y0) * rx) / den;   // how far along the wall
        if (t > 0 && t <= 1 && u >= 0 && u <= 1 && t < bestT) { best = w; bestT = t; }
      }
      if (!best) return;
      const len = Math.hypot(best.x2 - best.x1, best.y2 - best.y1);
      const dx = (best.x2 - best.x1) / len, dy = (best.y2 - best.y1) / len;
      const hx = x0 + (p.x - x0) * bestT, hy = y0 + (p.y - y0) * bestT;   // the point of impact
      const along = (p.x - best.x1) * dx + (p.y - best.y1) * dy;
      p.x = 2 * (best.x1 + along * dx) - p.x; p.y = 2 * (best.y1 + along * dy) - p.y;
      const va = p.vx * dx + p.vy * dy;
      p.vx = 2 * va * dx - p.vx; p.vy = 2 * va * dy - p.vy;
      state.used.walls++; state.events.push({ type: 'wall', x: hx, y: hy });
      x0 = hx; y0 = hy; lastWall = best;
    }
  }

  // Wormholes. After coming out of an end, the probe must fly clear of it before any
  // wormhole can take it again; otherwise it would bounce back and forth forever.
  function usePortals(state) {
    const p = state.probe;
    if (p.inPortal) {
      if (Math.hypot(p.inPortal.x - p.x, p.inPortal.y - p.y) < PORTAL_R) return;
      p.inPortal = null;
    }
    for (const pair of state.portals) {
      for (const [from, to] of [[pair.a, pair.b], [pair.b, pair.a]]) {
        if (Math.hypot(from.x - p.x, from.y - p.y) < PORTAL_R) {
          state.events.push({ type: 'portal', x: p.x, y: p.y });
          p.x += to.x - from.x; p.y += to.y - from.y;
          p.inPortal = to; state.used.portals++;
          return;
        }
      }
    }
  }

  function useGates(state) {
    const p = state.probe;
    for (const g of state.gates) {
      if (!g.used && Math.hypot(g.x - p.x, g.y - p.y) < GATE_R) {
        g.used = true; p.vx *= g.boost; p.vy *= g.boost;
        state.used.gates++; state.events.push({ type: 'gate', x: g.x, y: g.y });
      }
    }
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
    const x0 = p ? p.x : 0, y0 = p ? p.y : 0;        // where the probe was before this step

    accelerations(state);
    for (const o of movers) {
      o.vx += o.ax * DT / 2; o.vy += o.ay * DT / 2;
      o.x += o.vx * DT; o.y += o.vy * DT;
    }
    accelerations(state);
    for (const o of movers) { o.vx += o.ax * DT / 2; o.vy += o.ay * DT / 2; }
    state.t += DT;

    if (p) {
      if (state.walls.length) bounceOffWalls(state, x0, y0);
      if (state.portals.length) usePortals(state);
      if (state.gates.length) useGates(state);
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
      dust: state.dust.filter(d => d.got).length, dustTotal: state.dust.length,
      used: state.used };     // how many portal trips, wall bounces and gates the shot used
  }

  const api = { DT, MAX_TIME, MAX_SPEED, SOFT, BOUNDS, AREA, DUST_R, PROBE_R, PORTAL_R, GATE_R,
    radiusFor, createState, clampLaunch, launch, stepState, runShot };
  root.Physics = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
