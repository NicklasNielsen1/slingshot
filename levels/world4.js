// World 4: Wormholes.
// Fly into one end of a wormhole and you come out of the other end, at the same speed and
// heading the same way. The level format is explained at the top of physics.js.
(globalThis.LEVELS = globalThis.LEVELS || []).push(
  // The pad sits deep in a star's pull, too deep to fly out of; a wormhole next to the pad is the only way out.
  {
    id: 'w4-1',
    name: 'Gravity Well',
    hint: 'The star holds you too tightly to fly away, so dive into the wormhole: you leave the other end heading the same way.',
    pad: { x: -350, y: 270 },
    target: { x: 500, y: -250, r: 30 },
    bodies: [
      { x: -350, y: 150, m: 4000000, fixed: true, color: '#ff9a6b' },
    ],
    portals: [ { a: { x: -200, y: 240 }, b: { x: 300, y: -150 } } ],
    dust: [],
    par: 2,
    solution: { vx: 214.8, vy: 47.6 },
  },
  // A huge repulsor guards the ring; the wormhole drops you in behind it, and its push steers you sideways into the ring.
  {
    id: 'w4-2',
    name: 'Back Door',
    hint: 'Nothing gets past the repulsor from outside, so take the wormhole round the back and let the push curve you into the ring.',
    pad: { x: 350, y: -330 },
    target: { x: -470, y: -100, r: 25 },
    bodies: [
      { x: -300, y: -100, m: -6000000, fixed: true },
    ],
    portals: [ { a: { x: 420, y: -180 }, b: { x: -470, y: -280 } } ],
    dust: [],
    par: 2,
    solution: { vx: 82.4, vy: 204.0 },
  },
  // Two wormholes: the one straight ahead is a decoy that dumps you in a far corner; the other curls you round the repulsor.
  {
    id: 'w4-3',
    name: 'Two Doors',
    hint: 'Only one wormhole is any use: look where each one comes out, then let the repulsor curl you round to the ring.',
    pad: { x: 450, y: 100 },
    target: { x: 0, y: -190, r: 25 },
    bodies: [
      { x: 0, y: 0, m: -6000000, fixed: true },
    ],
    portals: [
      { a: { x: 327, y: 186 }, b: { x: 250, y: -300 } },
      { a: { x: 324, y: 18 }, b: { x: -450, y: 300 } },
    ],
    dust: [],
    par: 3,
    solution: { vx: -201.3, vy: 130.7 },
  },
  // The stardust sits too close to the repulsor to reach from outside; the wormhole drops you in beside it.
  {
    id: 'w4-4',
    name: 'Inside Job',
    hint: 'The stardust is too close to the repulsor to reach from outside, so use the wormhole to slip in, grab it, and ride the push out to the ring.',
    pad: { x: -450, y: -250 },
    target: { x: 150, y: 180, r: 35 },
    bodies: [
      { x: 300, y: -100, m: -4000000, fixed: true },
    ],
    portals: [ { a: { x: -303, y: -189 }, b: { x: 120, y: -100 } } ],
    dust: [ { x: 190, y: 0 } ],
    par: 3,
    solution: { vx: 170.8, vy: 83.3 },
  },
);
