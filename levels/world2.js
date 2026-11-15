// World 2: Moving Targets. Planets, moons and stars that move.
// The level format is explained at the top of physics.js.
(globalThis.LEVELS = globalThis.LEVELS || []).push(
  // A star sits on the straight line, and a heavy planet circles it, crossing the curves around it.
  {
    id: 'w2-1',
    name: 'Moonrise',
    hint: 'The planet keeps moving after you launch, so aim for where it will not be.',
    pad: { x: -460, y: 220 },
    target: { x: 460, y: -180, r: 24 },
    bodies: [
      { x: 0, y: 0, m: 1000000, fixed: true, color: '#ffe28a' },
      { x: 0, y: 180, m: 100000, vx: -74.5, vy: 0, color: '#5fb4ff' },
    ],
    dust: [],
    par: 2,
    solution: { vx: 157.6, vy: -123.1 },
  },
  // A big planet swoops down under its star into the space you fly through, so its pull depends on your timing.
  {
    id: 'w2-2',
    name: 'Swoop',
    hint: 'Launching faster or slower changes where you meet the green planet, so try a new speed, not just a new aim.',
    pad: { x: -480, y: 250 },
    target: { x: 480, y: 120, r: 19 },
    bodies: [
      { x: 0, y: -160, m: 1000000, fixed: true, color: '#ff9a6b' },
      { x: -190.5, y: -50, m: 200000, vx: 33.7, vy: 58.4, color: '#7be3a4' },
    ],
    dust: [],
    par: 2,
    solution: { vx: 119.7, vy: 8.4 },
  },
  // Two stars dance around each other in the middle, so the pull keeps changing direction.
  {
    id: 'w2-3',
    name: 'Twin Waltz',
    hint: 'The two stars spin around each other, so watch where they will be when you fly past.',
    pad: { x: -480, y: -200 },
    target: { x: 480, y: -50, r: 17 },
    bodies: [
      { x: 77.9, y: 105, m: 600000, vx: -20.4, vy: 35.4, color: '#ffe28a' },
      { x: -77.9, y: 15, m: 600000, vx: 20.4, vy: -35.4, color: '#ff9a6b' },
    ],
    dust: [],
    par: 3,
    solution: { vx: 98.9, vy: -14.8 },
  },
  // A small solar system: three planets circle one star, and you must thread a path between them.
  {
    id: 'w2-4',
    name: 'Clockwork',
    hint: 'Each planet circles at its own pace, so a slower shot finds them in new places and can open a way through.',
    pad: { x: -420, y: 340 },
    target: { x: 480, y: 60, r: 15 },
    bodies: [
      { x: 0, y: 0, m: 1000000, fixed: true, color: '#ffe28a' },
      { x: -91.9, y: 91.9, m: 20000, vx: -62.0, vy: -62.0, color: '#e87f7f' },
      { x: -219.9, y: -67.2, m: 20000, vx: 19.3, vy: -63.1, color: '#c59bff' },
      { x: -276.2, y: 117.2, m: 30000, vx: -22.5, vy: -53.1, color: '#6fe0e0' },
    ],
    dust: [],
    par: 3,
    solution: { vx: 119.5, vy: -10.5 },
  },
);