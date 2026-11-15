// World 1: First Flights. Still planets and stars only.
// The level format is explained at the top of physics.js.
(globalThis.LEVELS = globalThis.LEVELS || []).push(
  // Straight shot: a small giant off to the side barely tugs the probe.
  {
    id: 'w1-1',
    name: 'First Flight',
    hint: 'Drag away from the launch pad to aim, then let go.',
    pad: { x: -420, y: 0 },
    target: { x: 420, y: 0, r: 40 },
    bodies: [
      { x: 0, y: 230, m: 30000, fixed: true, color: '#f0a35e' },
    ],
    dust: [],
    par: 1,
    solution: { vx: 150, vy: 0 },
    allowDirect: true,
  },
  // A giant sits right on the straight line, so the probe has to curve around it.
  {
    id: 'w1-2',
    name: 'Around the Bend',
    hint: 'Gravity pulls you towards the planet, so aim a little to one side of it.',
    pad: { x: 350, y: 300 },
    target: { x: -380, y: -220, r: 35 },
    bodies: [
      { x: -10, y: 50, m: 120000, fixed: true, color: '#6fe0e0' },
    ],
    dust: [],
    par: 2,
    solution: { vx: -113.2, vy: -98.4 },
  },
  // A heavy star blocks the way completely; swing past its side like a slingshot.
  {
    id: 'w1-3',
    name: 'Star Swing',
    hint: 'Fly past the edge of the star and let its pull swing you round to the ring.',
    pad: { x: -450, y: 250 },
    target: { x: 400, y: -250, r: 25 },
    bodies: [
      { x: -25, y: 0, m: 1000000, fixed: true, color: '#ffe28a' },
    ],
    dust: [],
    par: 2,
    solution: { vx: 63.9, vy: -89.6 },
  },
  // A giant and two planets guard the way: thread the gaps between them.
  {
    id: 'w1-4',
    name: 'Planet Slalom',
    hint: 'Every body tugs you a little, so look for a gap where the pulls balance out.',
    pad: { x: 420, y: -300 },
    target: { x: -400, y: 280, r: 22 },
    bodies: [
      { x: 29, y: -134, m: 600000, fixed: true, color: '#f0a35e' },
      { x: -48, y: -89, m: 60000, fixed: true, color: '#c59bff' },
      { x: -190, y: 27, m: 60000, fixed: true, color: '#7be3a4' },
    ],
    dust: [],
    par: 3,
    solution: { vx: -75.5, vy: 93.3 },
  },
);
