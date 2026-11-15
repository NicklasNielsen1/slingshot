// World 3: Stardust and Repulsors. The final and hardest world.
// Stardust must all be collected before the target counts, and repulsors push instead of pull.
// The level format is explained at the top of physics.js.
(globalThis.LEVELS = globalThis.LEVELS || []).push(
  // Stardust below a star marks the route: dip under it and let its pull lift you to the ring.
  {
    id: 'w3-1',
    name: 'Dust Trail',
    hint: 'Grab the stardust first: dip under the star and let its pull bend you up to the ring.',
    pad: { x: -480, y: 250 },
    target: { x: 430, y: 220, r: 45 },
    bodies: [
      { x: 0, y: 200, m: 600000, fixed: true, color: '#ffe28a' },
    ],
    dust: [ { x: -10, y: 290 } ],
    par: 2,
    solution: { vx: 208.8, vy: 22.0 },
  },
  // A small repulsor blocks the way up; the big one beside it pushes you back behind it.
  {
    id: 'w3-2',
    name: 'Bumper Lane',
    hint: 'Repulsors push you away: slip between the two and let the big one shove you back towards the ring.',
    pad: { x: -420, y: 280 },
    target: { x: -420, y: -260, r: 40 },
    bodies: [
      { x: -420, y: 10, m: -250000, fixed: true },
      { x: -200, y: 0, m: -600000, fixed: true },
    ],
    dust: [],
    par: 2,
    solution: { vx: 39.4, vy: -102.7 },
  },
  // Push then pull: skim under the repulsor, then swing under the star, which lifts you to the ring.
  {
    id: 'w3-3',
    name: 'Push and Pull',
    hint: 'First let the repulsor push you down, then let the star pull you back up.',
    pad: { x: 460, y: 60 },
    target: { x: -460, y: 60, r: 35 },
    bodies: [
      { x: 150, y: 40, m: -300000, fixed: true },
      { x: -150, y: 140, m: 1500000, fixed: true, color: '#ff9a6b' },
    ],
    dust: [ { x: 150, y: 105 }, { x: -180, y: 200 } ],
    par: 3,
    solution: { vx: -159.0, vy: 18.1 },
  },
  // The finale: loop round the right of the star, past its orbiting planet, and let the repulsor turn you home.
  {
    id: 'w3-4',
    name: 'Grand Tour',
    hint: 'Swing wide round the right side of the star; the repulsor will turn you back, but watch out for the planet.',
    pad: { x: 0, y: 330 },
    target: { x: 0, y: -320, r: 50 },
    bodies: [
      { x: 0, y: 0, m: 800000, fixed: true, color: '#ffe28a' },
      { x: 0, y: -160, m: 20000, vx: 70.7, vy: 0, color: '#c59bff' },
      { x: 300, y: -150, m: -600000, fixed: true },
    ],
    dust: [ { x: 60, y: 250 }, { x: 170, y: 60 }, { x: 130, y: -220 } ],
    par: 4,
    solution: { vx: 77.0, vy: -98.5 },
  },
);
