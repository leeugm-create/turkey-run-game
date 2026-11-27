// The world: one run of Pardon Run as pure state and rules, stepped at a fixed rate. The turkey
// runs on the spot while the farm scrolls past; the farmer runs behind it, gains on every
// stumble and throws carving knives. Obstacles, pickups, stages, collisions and both endings
// (caught at the farmer's hand, pardoned at the Freedom Fence) are decided here; render.js
// only draws what this state says.

import { ESCAPE_METERS, EVENT, FARMER, GROUND_Y, KIND, METER_PX, RUN, SCORE, STAGES, TURKEY, VIEW } from './config.js';
import { createRandom } from './random.js';

const OBSTACLE_SIZE = {
  [KIND.HAY]: { w: 66, h: 52 },
  [KIND.CRATE]: { w: 58, h: 58 },
  [KIND.FENCE]: { w: 76, h: 64 },
  [KIND.BARREL]: { w: 54, h: 72 },
  [KIND.OVEN]: { w: 98, h: 112 },
};
const GROUND_KINDS = Object.keys(OBSTACLE_SIZE);
const PICKUP_SIZE = { w: 34, h: 34 };

export function createWorld(seed) {
  const rng = createRandom(seed);
  const state = {
    time: 0,
    distancePx: 0,
    score: 0,
    cornEaten: 0,
    lives: RUN.startLives,
    gap: FARMER.startGap,
    speed: RUN.baseSpeed,
    stageIndex: 0,
    stageBannerT: 0,
    over: false,
    escaped: false,
    caughtByHand: false,
    turkey: { yOff: 0, vy: 0, jumps: 0, ducking: false, invincibleUntil: -1, runPhase: 0, blink: 0 },
    farmer: { throwTimer: 2.4, armRaise: 0, bobPhase: 0 },
    entities: [],
    particles: [],
    spawnInPx: 620,
    shake: 0,
  };

  function meters() { return state.distancePx / METER_PX; }
  function stage() { return STAGES[state.stageIndex]; }

  function turkeyBox() {
    const t = state.turkey;
    const h = t.ducking && t.yOff === 0 ? TURKEY.duckHeight : TURKEY.height;
    return { x: TURKEY.x + 10, y: GROUND_Y - t.yOff - h + 6, w: TURKEY.width - 20, h: h - 8 };
  }

  function spawnEntity(kind, x, extra = {}) {
    const e = { kind, x, dead: false, spin: rng.range(0, Math.PI * 2), ...extra };
    if (OBSTACLE_SIZE[kind]) {
      e.w = OBSTACLE_SIZE[kind].w;
      e.h = OBSTACLE_SIZE[kind].h;
      e.y = GROUND_Y - e.h;
    } else if (kind === KIND.KNIFE_HIGH) {
      e.w = 58; e.h = 20; e.y = GROUND_Y - 74; e.vx = 300;
    } else if (kind === KIND.KNIFE_LOW) {
      e.w = 58; e.h = 20; e.y = GROUND_Y - 30; e.vx = 300;
    } else {
      e.w = PICKUP_SIZE.w;
      e.h = PICKUP_SIZE.h;
      e.y = extra.y !== undefined ? extra.y : GROUND_Y - e.h - 6;
    }
    state.entities.push(e);
    return e;
  }

  function burst(x, y, colour, count, spread = 130, up = 190) {
    for (let i = 0; i < count; i += 1) {
      state.particles.push({
        x, y,
        vx: rng.range(-spread, spread),
        vy: rng.range(-up, -20),
        life: rng.range(0.35, 0.8),
        age: 0,
        size: rng.range(2.5, 6),
        colour,
        gravity: 620,
      });
    }
  }

  // Deal the next piece of farm: an obstacle to dodge, a snack to grab, or a snack arc over an
  // obstacle as the prize for a good jump. Spacing is in pixels of run so the game stays fair
  // as it speeds up.
  function dealNext() {
    const st = stage();
    const roll = rng.next();
    const x = VIEW.width + 90;
    if (roll < 0.16) {
      // a line of corn on the ground
      const n = rng.int(3, 4);
      for (let i = 0; i < n; i += 1) spawnEntity(KIND.CORN, x + i * 52);
      state.spawnInPx = rng.range(430, 620);
    } else if (roll < 0.24) {
      spawnEntity(rng.chance(0.3) ? KIND.GOLD_CORN : KIND.PUMPKIN, x);
      state.spawnInPx = rng.range(430, 620);
    } else {
      let kind;
      if (st.ovenChance > 0 && rng.chance(st.ovenChance)) kind = KIND.OVEN;
      else kind = rng.pick(GROUND_KINDS.filter((k) => k !== KIND.OVEN));
      spawnEntity(kind, x);
      if (rng.chance(0.55)) {
        // corn arc over the obstacle: three corns on the jump's path
        spawnEntity(KIND.CORN, x - 64, { y: GROUND_Y - 128 });
        spawnEntity(KIND.CORN, x + 8, { y: GROUND_Y - 168 });
        spawnEntity(KIND.CORN, x + 80, { y: GROUND_Y - 128 });
      }
      state.spawnInPx = rng.range(560, 880) + state.speed * 0.35;
    }
  }

  function throwKnife() {
    const high = rng.chance(0.55);
    const fx = TURKEY.x - state.gap + FARMER.width - 6;
    spawnEntity(high ? KIND.KNIFE_HIGH : KIND.KNIFE_LOW, Math.max(fx, -70));
  }

  function hitTurkey(events, byKnife) {
    const t = state.turkey;
    state.lives -= 1;
    state.gap = Math.max(FARMER.grabGap + 6, state.gap - (byKnife ? FARMER.knifeLoss : FARMER.stumbleLoss));
    t.invincibleUntil = state.time + RUN.invincibleSeconds;
    state.shake = 9;
    burst(TURKEY.x + TURKEY.width / 2, GROUND_Y - t.yOff - 40, '#f3e2c7', 14);
    burst(TURKEY.x + TURKEY.width / 2, GROUND_Y - t.yOff - 40, '#b45a2d', 8);
    events |= EVENT.HIT;
    if (state.lives <= 0) return finish(events, false, false);
    return events;
  }

  function finish(events, escaped, byHand) {
    state.over = true;
    state.escaped = escaped;
    state.caughtByHand = byHand;
    events |= EVENT.OVER;
    if (escaped) events |= EVENT.ESCAPED;
    return events;
  }

  // ctl: { jump: edge-triggered bool, duck: held bool }. Returns an EVENT bitmask.
  function step(dt, ctl) {
    let events = 0;
    const t = state.turkey;
    state.time += dt;

    // particles and shake always animate, even on the end screen
    for (const p of state.particles) {
      p.age += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.gravity * dt;
    }
    state.particles = state.particles.filter((p) => p.age < p.life);
    state.shake = Math.max(0, state.shake - dt * 26);
    if (state.over) return events;

    // --- the run itself
    const m = meters();
    state.speed = RUN.baseSpeed + (RUN.topSpeed - RUN.baseSpeed) * Math.min(1, m / RUN.rampMeters);
    state.distancePx += state.speed * dt;
    state.score += SCORE.perMeter * (state.speed * dt) / METER_PX;
    t.runPhase += dt * (6 + state.speed / 42);
    state.farmer.bobPhase += dt * (6 + state.speed / 40);

    // stage changes
    if (state.stageIndex < STAGES.length - 1 && m >= STAGES[state.stageIndex].until) {
      state.stageIndex += 1;
      state.stageBannerT = 2.6;
      events |= EVENT.STAGE;
    }
    state.stageBannerT = Math.max(0, state.stageBannerT - dt);

    // --- turkey movement
    const grounded = t.yOff === 0;
    t.ducking = !!ctl.duck && grounded;
    if (ctl.jump && !t.ducking) {
      if (grounded) {
        t.vy = TURKEY.jumpVelocity;
        t.jumps = 1;
        events |= EVENT.JUMP;
        burst(TURKEY.x + 30, GROUND_Y, '#d9b380', 5, 60, 90);
      } else if (t.jumps < TURKEY.maxJumps) {
        t.vy = TURKEY.flapVelocity;
        t.jumps += 1;
        events |= EVENT.FLAP;
        burst(TURKEY.x + 24, GROUND_Y - t.yOff - 26, '#f3e2c7', 6, 80, 60);
      }
    }
    if (!grounded || t.vy > 0) {
      t.vy -= TURKEY.gravity * dt;
      t.yOff += t.vy * dt;
      if (t.yOff <= 0) {
        t.yOff = 0;
        t.vy = 0;
        t.jumps = 0;
        burst(TURKEY.x + 34, GROUND_Y, '#d9b380', 4, 55, 70);
      }
    }
    // running dust
    if (grounded && rng.chance(0.3)) {
      state.particles.push({
        x: TURKEY.x + 14, y: GROUND_Y - 3, vx: rng.range(-70, -20), vy: rng.range(-46, -8),
        life: rng.range(0.3, 0.55), age: 0, size: rng.range(2, 4.5), colour: '#cfa96f', gravity: 130,
      });
    }

    // --- the farmer: recovers ground on a clean run is wrong way round — he closes only on
    // mistakes, and a clean run slowly opens the gap; his knives do the real work.
    state.gap = Math.min(FARMER.maxGap, state.gap + FARMER.recoverPerSecond * dt);
    const f = state.farmer;
    f.throwTimer -= dt;
    f.armRaise = f.throwTimer < 0.38 && f.throwTimer > 0 ? 1 : Math.max(0, f.armRaise - dt * 6);
    if (f.throwTimer <= 0) {
      throwKnife();
      f.throwTimer = stage().knifeEvery * rng.range(0.8, 1.25);
      events |= EVENT.KNIFE_THROW;
    }
    if (state.gap <= FARMER.grabGap) return finish(events, false, true);

    // --- dealing and scrolling the farm
    state.spawnInPx -= state.speed * dt;
    if (state.spawnInPx <= 0) dealNext();
    const box = turkeyBox();
    for (const e of state.entities) {
      e.x -= state.speed * dt;
      if (e.kind === KIND.KNIFE_HIGH || e.kind === KIND.KNIFE_LOW) e.x -= e.vx * dt;
      if (e.x + e.w < -80) e.dead = true;
    }

    // --- collisions
    const invincible = state.time < t.invincibleUntil;
    for (const e of state.entities) {
      if (e.dead) continue;
      const overlap = e.x < box.x + box.w - 6 && e.x + e.w > box.x + 6 && e.y < box.y + box.h && e.y + e.h > box.y;
      if (!overlap) continue;
      if (e.kind === KIND.CORN || e.kind === KIND.PUMPKIN || e.kind === KIND.GOLD_CORN) {
        e.dead = true;
        state.cornEaten += 1;
        state.score += e.kind === KIND.CORN ? SCORE.corn : e.kind === KIND.PUMPKIN ? SCORE.pumpkin : SCORE.goldCorn;
        if (e.kind === KIND.GOLD_CORN) state.gap = Math.min(FARMER.maxGap, state.gap + 55);
        burst(e.x + e.w / 2, e.y + e.h / 2, '#ffd94d', 7, 90, 120);
        events |= EVENT.PICKUP;
      } else if (!invincible) {
        e.dead = true;
        events = hitTurkey(events, e.kind === KIND.KNIFE_HIGH || e.kind === KIND.KNIFE_LOW);
        if (state.over) return events;
      }
    }
    state.entities = state.entities.filter((e) => !e.dead);

    // --- the Freedom Fence
    if (meters() >= ESCAPE_METERS) return finish(events, true, false);
    return events;
  }

  // Attract mode for the title screen: the world scrolls and the turkey runs, but nothing is
  // dealt and nobody throws anything.
  function stepAttract(dt) {
    const t = state.turkey;
    state.time += dt;
    state.distancePx += RUN.baseSpeed * 0.55 * dt;
    t.runPhase += dt * 9;
    state.farmer.bobPhase += dt * 9;
    for (const p of state.particles) { p.age += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.gravity * dt; }
    state.particles = state.particles.filter((p) => p.age < p.life);
  }

  // Jump the run to a distance (used to stage the kitchen scene for screenshots). The score
  // is set to the distance baseline, exactly what a real run to this point would show.
  function warpTo(m) {
    state.distancePx = m * METER_PX;
    state.score = m * SCORE.perMeter;
    while (state.stageIndex < STAGES.length - 1 && m >= STAGES[state.stageIndex].until) state.stageIndex += 1;
    state.stageBannerT = 0;
  }

  return {
    state,
    step,
    stepAttract,
    warpTo,
    spawnEntity,
    meters,
    turkeyBox,
    reset() {
      const fresh = createWorld(seed);
      Object.assign(state, fresh.state);
    },
  };
}
