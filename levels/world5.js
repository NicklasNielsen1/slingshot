// World 5: Mirror Walls.
// A mirror wall bounces the probe like a ball off a cushion: it leaves at the same angle it
// arrived, at the same speed, from either side. The level format is explained at the top of physics.js.
(globalThis.LEVELS = globalThis.LEVELS || []).push(
  // No gravity at all: a wall hides the ring, and one bank shot off the ceiling wall drops you in.
  {
    id: 'w5-1',
    name: 'Bank Shot',
    hint: 'You cannot fly through the wall in the way, so aim up at the mirror wall above and let it bounce you down into the ring.',
    pad: { x: -450, y: 250 },
    target: { x: 450, y: 250, r: 36 },
    bodies: [],
    walls: [
      { x1: 0, y1: 60, x2: 0, y2: 400 },
      { x1: -250, y1: -250, x2: 250, y2: -250 },
    ],
    dust: [],
    par: 2,
    solution: { vx: 120.4, vy: -133.8 },
  },
  // The ring sits above a shelf; the planet bends you onto the far wall, which sends you back over the shelf.
  {
    id: 'w5-2',
    name: 'Cushion Curve',
    hint: 'The planet bends your path on the way out, so aim for the far wall where the bend and the bounce together send you home.',
    pad: { x: -450, y: 300 },
    target: { x: -450, y: -260, r: 35 },
    bodies: [
      { x: 50, y: 0, m: 150000, fixed: true, color: '#e87f7f' },
    ],
    walls: [
      { x1: -600, y1: 0, x2: -280, y2: 0 },
      { x1: 350, y1: -250, x2: 350, y2: 250 },
    ],
    dust: [],
    par: 2,
    solution: { vx: 199.1, vy: -66.6 },
  },
  // Two walls in a right-angle corner send the probe straight back the way it came, shifted sideways.
  {
    id: 'w5-3',
    name: 'Corner Pocket',
    hint: 'A corner made of two mirror walls throws you back the way you came, so where you hit the corner decides where you come back.',
    pad: { x: -300, y: -120 },
    target: { x: -300, y: 130, r: 26 },
    bodies: [
      { x: 0, y: -300, m: 80000, fixed: true, color: '#7be3a4' },
    ],
    walls: [
      { x1: -410, y1: 5, x2: -190, y2: 5 },
      { x1: 200, y1: -150, x2: 350, y2: 0 },
      { x1: 350, y1: 0, x2: 200, y2: 150 },
    ],
    dust: [],
    par: 2,
    solution: { vx: 180.0, vy: 1.6 },
  },
  // The stardust sits against the far wall, past a repulsor: rebound off the wall, and the push sweeps you down to the ring.
  {
    id: 'w5-4',
    name: 'Pinball',
    hint: 'Launch hard and slip past the repulsor to the stardust by the far wall, then let the bounce and the push carry you round to the ring.',
    pad: { x: 400, y: -280 },
    target: { x: 400, y: 280, r: 32 },
    bodies: [
      { x: 0, y: 0, m: -600000, fixed: true },
    ],
    walls: [
      { x1: -500, y1: -130, x2: -500, y2: 130 },
    ],
    dust: [ { x: -440, y: 0 } ],
    par: 3,
    solution: { vx: -209.3, vy: 95.4 },
  },
);
