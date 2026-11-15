// Checks every Slingshot level. Run from this folder:
//
//   node check-levels.js                 check all levels
//   node check-levels.js w2              check only levels whose id starts with "w2"
//   node check-levels.js --search w2-3   try thousands of launches on one level and list the winners
//   node check-levels.js --shot w2-3 120 -45    play one launch (vx vy) and say what happened
//
// A level passes when:
//   1. its data is well formed and nothing sits outside the play area,
//   2. its built-in solution wins,
//   3. the solution still wins when the launch is slightly off (1% speed, half a degree),
//   4. aiming straight at the target does NOT win (unless the level says allowDirect: true).

const fs = require('fs');
const path = require('path');
const P = require('./physics.js');

globalThis.LEVELS = [];
const dir = path.join(__dirname, 'levels');
for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.js')).sort()) require(path.join(dir, f));
const LEVELS = globalThis.LEVELS;

const rad = d => d * Math.PI / 180;
const wins = (level, vx, vy) => P.runShot(level, vx, vy).result === 'win';

// Does this launch win, and still win when nudged a little?
function robust(level, vx, vy) {
  const sp = Math.hypot(vx, vy), ang = Math.atan2(vy, vx);
  const tries = [[sp, ang], [sp * 0.99, ang], [Math.min(sp * 1.01, P.MAX_SPEED), ang], [sp, ang + rad(0.5)], [sp, ang - rad(0.5)]];
  return tries.every(([s, a]) => wins(level, Math.cos(a) * s, Math.sin(a) * s));
}

// Can you win by simply pointing at the target?
function directWin(level) {
  const base = Math.atan2(level.target.y - level.pad.y, level.target.x - level.pad.x);
  for (let d = -3; d <= 3; d += 0.5)
    for (let s = 30; s <= P.MAX_SPEED; s += 10)
      if (wins(level, Math.cos(base + rad(d)) * s, Math.sin(base + rad(d)) * s)) return { deg: d, speed: s };
  return null;
}

function validate(level) {
  const errs = [];
  const num = v => typeof v === 'number' && isFinite(v);
  const inArea = (o, pad = 0) => num(o.x) && num(o.y) && Math.abs(o.x) <= P.AREA.x - pad && Math.abs(o.y) <= P.AREA.y - pad;
  if (!/^w\d+-\d+$/.test(level.id || '')) errs.push('id must look like w1-1');
  if (!level.name) errs.push('missing name');
  if (!level.hint) errs.push('missing hint');
  if (!level.pad || !inArea(level.pad, 20)) errs.push('pad missing or outside the play area');
  if (!level.target || !inArea(level.target, 20) || !(level.target.r >= 15 && level.target.r <= 60)) errs.push('target missing, outside the area, or r not in 15..60');
  if (!Array.isArray(level.bodies)) { errs.push('bodies must be a list'); return errs; }
  if (!Number.isInteger(level.par) || level.par < 1) errs.push('par must be a whole number, 1 or more');
  if (!level.solution || !num(level.solution.vx) || !num(level.solution.vy)) errs.push('missing solution');
  else if (Math.hypot(level.solution.vx, level.solution.vy) > P.MAX_SPEED + 1e-6) errs.push('solution is faster than MAX_SPEED');
  if (errs.length) return errs;

  level.bodies.forEach((b, i) => {
    const r = P.radiusFor(b.m);
    if (!num(b.m) || b.m === 0) errs.push(`body ${i}: bad mass`);
    if (!inArea(b)) errs.push(`body ${i}: starts outside the play area`);
    if (b.m < 0 && !b.fixed) errs.push(`body ${i}: repulsors must have fixed: true`);
    if (Math.hypot(b.x - level.pad.x, b.y - level.pad.y) < r + 25) errs.push(`body ${i}: too close to the pad`);
    if (b.fixed && Math.hypot(b.x - level.target.x, b.y - level.target.y) < r + level.target.r) errs.push(`body ${i}: overlaps the target`);
    level.bodies.forEach((c, j) => {
      if (j > i && Math.hypot(b.x - c.x, b.y - c.y) < r + P.radiusFor(c.m)) errs.push(`bodies ${i} and ${j} overlap`);
    });
  });
  (level.dust || []).forEach((d, i) => {
    if (!inArea(d, 10)) errs.push(`dust ${i}: outside the play area`);
    level.bodies.forEach((b, j) => {
      if (b.fixed && Math.hypot(b.x - d.x, b.y - d.y) < P.radiusFor(b.m) + 6) errs.push(`dust ${i}: inside body ${j}`);
    });
  });
  if (Math.hypot(level.target.x - level.pad.x, level.target.y - level.pad.y) < 150) errs.push('pad and target are too close together');

  // The extras from World 4 onwards: wormholes, mirror walls and speed gates.
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const fixedBodies = level.bodies.filter(b => b.fixed);
  const spot = (o, r, what) => {                 // a round thing of radius r at o must sit in clear space
    if (!o || !inArea(o, 20)) { errs.push(`${what}: missing or outside the play area`); return; }
    if (dist(o, level.pad) < r + 15) errs.push(`${what}: too close to the pad`);
    if (dist(o, level.target) < r + level.target.r) errs.push(`${what}: overlaps the target`);
    if (fixedBodies.some(b => dist(o, b) < r + P.radiusFor(b.m))) errs.push(`${what}: overlaps a fixed body`);
  };
  const ends = [];
  (level.portals || []).forEach((p, i) => {
    spot(p.a, P.PORTAL_R, `portal ${i} end a`); spot(p.b, P.PORTAL_R, `portal ${i} end b`);
    if (p.a && p.b) ends.push(p.a, p.b);
  });
  ends.forEach((e, i) => ends.forEach((f, j) => {
    if (j > i && dist(e, f) < P.PORTAL_R * 2 + 20) errs.push('two wormhole ends are too close together');
  }));
  (level.walls || []).forEach((w, i) => {
    const a = { x: w.x1, y: w.y1 }, b = { x: w.x2, y: w.y2 };
    if (!inArea(a) || !inArea(b)) { errs.push(`wall ${i}: outside the play area`); return; }
    const len = dist(a, b);
    if (len < 30) { errs.push(`wall ${i}: shorter than 30`); return; }
    const toWall = o => {                        // shortest distance from a point to the wall
      const t = Math.max(0, Math.min(1, ((o.x - a.x) * (b.x - a.x) + (o.y - a.y) * (b.y - a.y)) / (len * len)));
      return Math.hypot(a.x + t * (b.x - a.x) - o.x, a.y + t * (b.y - a.y) - o.y);
    };
    if (toWall(level.pad) < 20) errs.push(`wall ${i}: too close to the pad`);
    if (toWall(level.target) < level.target.r) errs.push(`wall ${i}: cuts through the target`);
  });
  (level.gates || []).forEach((g, i) => {
    spot(g, P.GATE_R, `gate ${i}`);
    if (!num(g.boost) || g.boost < 0.3 || g.boost > 2.5 || Math.abs(g.boost - 1) < 0.1) errs.push(`gate ${i}: boost must be 0.3 to 2.5 and not close to 1`);
  });

  // Moving bodies must stay in play, and never pass through each other, for a whole flight.
  const st = P.createState(level);
  const touched = new Set();
  for (let i = 0; i < P.MAX_TIME / P.DT; i++) {
    P.stepState(st);
    st.bodies.forEach((b, bi) => st.bodies.forEach((c, ci) => {
      if (ci > bi && Math.hypot(b.x - c.x, b.y - c.y) < b.r + c.r) touched.add(`bodies ${bi} and ${ci} pass through each other`);
    }));
    st.bodies.forEach((b, bi) => {
      if (!isFinite(b.x) || !isFinite(b.y)) touched.add(`body ${bi}: its position stops being a number`);
      if (Math.hypot(b.x - level.pad.x, b.y - level.pad.y) < b.r + 25) touched.add(`body ${bi}: passes over the pad`);
    });
  }
  errs.push(...touched);
  st.bodies.forEach((b, i) => {
    if (Math.abs(b.x) > P.BOUNDS.x || Math.abs(b.y) > P.BOUNDS.y) errs.push(`body ${i}: drifts out of bounds during a flight`);
  });
  return errs;
}

function checkLevel(level) {
  const errs = validate(level);
  if (errs.length) return errs;
  const s = level.solution;
  const r = P.runShot(level, s.vx, s.vy);
  if (r.result !== 'win') return [`solution does not win (${r.result}, closest ${r.closest.toFixed(0)}, dust ${r.dust}/${r.dustTotal})`];
  if (!robust(level, s.vx, s.vy)) errs.push('solution is too fiddly: it fails when nudged by 1% speed or 0.5 degrees');
  const d = directWin(level);
  if (d && !level.allowDirect) errs.push(`aiming straight at the target wins (offset ${d.deg} deg, speed ${d.speed})`);

  // Worlds 4 to 6 each have their own ingredient. It must be part of the puzzle, not decoration:
  // the solution has to use it, and has to stop winning when it is taken away.
  const key = { 4: 'portals', 5: 'walls', 6: 'gates' }[+level.id.match(/^w(\d+)/)[1]];
  if (key) {
    if (!(level[key] || []).length) errs.push(`a world ${level.id[1]} level needs ${key}`);
    else if (!r.used[key]) errs.push(`the solution never uses the ${key}`);
    else if (wins({ ...level, [key]: [] }, s.vx, s.vy)) errs.push(`the solution still wins with the ${key} removed`);
  }
  return errs;
}

function search(level) {
  const found = [];
  let total = 0, winCount = 0;
  for (let a = 0; a < 360; a += 0.5) {
    for (let s = 40; s <= P.MAX_SPEED; s += 10) {
      total++;
      const vx = Math.cos(rad(a)) * s, vy = Math.sin(rad(a)) * s;
      const r = P.runShot(level, vx, vy);
      if (r.result === 'win') { winCount++; if (robust(level, vx, vy)) found.push({ a, s, vx, vy, time: r.time }); }
    }
  }
  console.log(`${level.id} "${level.name}": ${winCount} of ${total} launches win (${(100 * winCount / total).toFixed(2)}%), ${found.length} of them robust.`);
  // Print a spread of robust winners rather than hundreds of near-identical ones.
  const shown = [];
  for (const f of found) {
    if (shown.every(g => Math.abs(g.a - f.a) > 4 || Math.abs(g.s - f.s) > 30)) shown.push(f);
  }
  for (const f of shown.slice(0, 25))
    console.log(`  angle ${f.a.toFixed(1)}  speed ${f.s}  ->  solution: { vx: ${f.vx.toFixed(1)}, vy: ${f.vy.toFixed(1)} }   flight ${f.time.toFixed(1)}s`);
}

const args = process.argv.slice(2);
const byId = id => { const l = LEVELS.find(l => l.id === id); if (!l) { console.error('No level with id ' + id); process.exit(1); } return l; };

if (args[0] === '--search') {
  search(byId(args[1]));
} else if (args[0] === '--shot') {
  console.log(P.runShot(byId(args[1]), +args[2], +args[3]));
} else {
  const list = LEVELS.filter(l => !args[0] || (l.id || '').startsWith(args[0]));
  if (!list.length) { console.error('No levels found to check.'); process.exit(1); }
  const ids = LEVELS.map(l => l.id);
  let bad = 0;
  for (const level of list) {
    const errs = checkLevel(level);
    if (ids.filter(i => i === level.id).length > 1) errs.push('duplicate id');
    if (errs.length) bad++;
    console.log(`${errs.length ? 'FAIL' : 'ok  '}  ${level.id}  ${level.name}`);
    for (const e of errs) console.log('        - ' + e);
  }
  console.log(`\n${list.length - bad} of ${list.length} levels pass.`);
  process.exit(bad ? 1 : 0);
}
