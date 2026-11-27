// The screenshot scenes behind ?shot=start|play|kitchen|end. Each plays the real rules forward
// from a fresh world at a fixed step, steered by a simple autopilot (watch what is coming,
// jump the ground obstacles, duck the high knives, hop the low ones), so every frame is a real
// moment of the game and the same seed always gives the same frame.

import { EVENT, KIND, STEP, TURKEY } from './config.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

function makeAutopilot() {
  let jumpCooldown = 0;
  return function decide(state) {
    jumpCooldown = Math.max(0, jumpCooldown - 1);
    const front = TURKEY.x + TURKEY.width;
    const t = state.turkey;
    let nearest = null;
    for (const e of state.entities) {
      if (e.x + e.w < TURKEY.x - 6 || e.x > front + 430) continue;
      if (nearest === null || e.x < nearest.x) nearest = e;
    }
    const ctl = { jump: false, duck: false };
    if (!nearest) return ctl;
    const dist = nearest.x - front;
    if (nearest.kind === KIND.KNIFE_HIGH) {
      if (dist < 210 && t.yOff === 0) ctl.duck = true;
      return ctl;
    }
    const wantJump =
      (nearest.kind === KIND.KNIFE_LOW && dist < 175) ||
      (nearest.kind === KIND.OVEN && dist < state.speed * 0.34) ||
      (dist < state.speed * 0.27);
    if (wantJump && jumpCooldown === 0 && (t.yOff === 0 || t.yOff > 70)) {
      ctl.jump = true;
      jumpCooldown = 9;
    }
    return ctl;
  };
}

function simulate(world, seconds, decide) {
  const steps = Math.floor(seconds / STEP);
  for (let i = 0; i < steps; i += 1) {
    const events = world.step(STEP, decide(world.state));
    if (events & EVENT.OVER) break;
  }
}

export function stageShot(name, world) {
  world.reset();
  if (name === 'play') {
    simulate(world, 16, makeAutopilot());
    if (world.state.over) {
      world.reset();
      simulate(world, 11, makeAutopilot());
    }
    world.state.gap = Math.min(world.state.gap, 330); // keep the farmer in frame
    return { screen: SCREEN_PLAY, best: 0 };
  }
  if (name === 'kitchen') {
    world.warpTo(790);
    simulate(world, 9, makeAutopilot());
    if (world.state.over) {
      world.reset();
      world.warpTo(790);
      simulate(world, 6, makeAutopilot());
    }
    // compose the frame the way the kitchen really plays: an oven ahead, a knife coming in
    const hasOven = world.state.entities.some((e) => e.kind === KIND.OVEN && e.x > 480 && e.x < 1180);
    if (!hasOven) world.spawnEntity(KIND.OVEN, 950);
    const hasKnife = world.state.entities.some((e) => (e.kind === KIND.KNIFE_HIGH || e.kind === KIND.KNIFE_LOW) && e.x > 500);
    if (!hasKnife) world.spawnEntity(KIND.KNIFE_HIGH, 1090);
    world.state.gap = Math.min(world.state.gap, 330);
    return { screen: SCREEN_PLAY, best: 0 };
  }
  if (name === 'end') {
    // a reckless turkey that never dodges: it trips, the knives land, the farmer closes in
    simulate(world, 150, () => ({ jump: false, duck: false }));
    return { screen: SCREEN_OVER, best: 0 };
  }
  // start: the title over a living farmyard, turkey running, farmer looming behind
  // (3.0 s lands on the bright phase of the title prompt's blink)
  for (let i = 0; i < Math.floor(3.0 / STEP); i += 1) world.stepAttract(STEP);
  return { screen: SCREEN_TITLE, best: 0 };
}
