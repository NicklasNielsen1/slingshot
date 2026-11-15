// World 6: Speed Gates.
// Fly through a speed gate and your speed is multiplied: a boost gate makes you faster than
// any launch can, a brake gate slows you down so gravity can catch you. Each gate works once
// per shot. The level format is explained at the top of physics.js.
(globalThis.LEVELS = globalThis.LEVELS || []).push(
  // The ring sits high on a repulsor's hill; no launch is fast enough to climb it, but the boost gate is.
  {
    id: 'w6-1',
    name: 'Uphill',
    hint: 'Even your fastest launch rolls back down the hill, so fly through the boost gate first and let the extra speed carry you up to the ring.',
    pad: { x: -450, y: 200 },
    target: { x: 280, y: -140, r: 50 },
    bodies: [
      { x: 300, y: 0, m: -6000000, fixed: true },
    ],
    gates: [ { x: -166, y: 110, boost: 2.5 } ],
    dust: [],
    par: 2,
    solution: { vx: 179.6, vy: -61.9 },
  },
  // Everything falls past the star far too fast to stay; brake at the gate and the star wraps you into an orbit through the stardust.
  {
    id: 'w6-2',
    name: 'Air Brake',
    hint: 'You always reach the star too fast to circle it, so slow down at the brake gate and let the star swing you round past the stardust to the ring.',
    pad: { x: -480, y: 280 },
    target: { x: 25, y: 80, r: 35 },
    bodies: [
      { x: 150, y: 0, m: 1500000, fixed: true, color: '#ffe28a' },
    ],
    gates: [ { x: 150, y: 110, boost: 0.5 } ],
    dust: [ { x: 130, y: -40 } ],
    par: 3,
    solution: { vx: 108.2, vy: -20.0 },
  },
  // Two gates near the pad: the brake gate looks closer to the ring, but only the boost gate gets you up the hill.
  {
    id: 'w6-3',
    name: 'Fork in the Road',
    hint: 'One of these speed gates helps and one does not: think about whether you need more speed or less to climb the repulsor hill.',
    pad: { x: 450, y: 220 },
    target: { x: -280, y: -140, r: 40 },
    bodies: [
      { x: -300, y: 0, m: -6000000, fixed: true },
    ],
    gates: [ { x: 166, y: 130, boost: 2.5 }, { x: 230, y: 40, boost: 0.4 } ],
    dust: [],
    par: 3,
    solution: { vx: -187.9, vy: -68.4 },
  },
  // The finale: a mirror wall seals off the star, a wormhole slips you under it, a brake gate lets the star catch you, and an orbit gathers the stardust.
  {
    id: 'w6-4',
    name: 'Grand Finale',
    hint: 'The wall keeps you out, so find the way under it, then brake beside the star and let its orbit sweep up the stardust before the ring.',
    pad: { x: 450, y: -300 },
    target: { x: 100, y: 195, r: 30 },
    bodies: [
      { x: 150, y: 100, m: 1500000, fixed: true, color: '#ff9a6b' },
    ],
    walls: [ { x1: -560, y1: -40, x2: 560, y2: -40 } ],
    portals: [ { a: { x: 560, y: -320 }, b: { x: 0, y: 240 } } ],
    gates: [ { x: 150, y: 210, boost: 0.5 } ],
    dust: [ { x: 125, y: 62 }, { x: 55, y: 135 } ],
    par: 4,
    solution: { vx: 128.9, vy: -17.0 },
  },
);
