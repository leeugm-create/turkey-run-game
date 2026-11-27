// Pardon Run — entry point. Wires the input, the world and the renderer together, runs the
// fixed-step loop, and moves between the title, the run and the end screen.
// ?seed=N fixes the deal of the farm. ?shot=start|play|kitchen|end (with &seed=N) stages that
// scene instead of running the loop, paints it and sets window.__shotReady for a screenshot.

import { EVENT, STEP } from './config.js';
import { createAudio } from './audio.js';
import { createInput } from './input.js';
import { createWorld } from './world.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, drawPaused, drawScene } from './render.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);

const audio = createAudio();
const input = createInput(canvas);

let best = 0;
try {
  best = Number(window.localStorage.getItem('pardon-run-best') ?? 0) || 0;
} catch { /* private mode: the best score just lives for the session */ }

if (shot) {
  const world = createWorld(Number.isFinite(seedParam) ? seedParam : 1);
  const staged = stageShot(shot, world);
  drawScene(ctx, world, staged.screen, best);
  requestAnimationFrame(() => {
    drawScene(ctx, world, staged.screen, best);
    window.__shotReady = true;
  });
} else {
  let world = createWorld((Date.now() % 90000) + 7);
  let screen = SCREEN_TITLE;
  let paused = false;
  // A small handle for headless play-tests: read the live world and screen.
  window.__pardon = { world: () => world, screen: () => screen };

  function startRun() {
    world = createWorld((Date.now() % 90000) + 7);
    screen = SCREEN_PLAY;
    paused = false;
    input.jumpPressed = false; // the press that started the run must not also jump
    audio.gobble();
  }

  function playSounds(events) {
    if (events & EVENT.JUMP) audio.jump();
    if (events & EVENT.FLAP) audio.flap();
    if (events & EVENT.KNIFE_THROW) audio.knifeThrow();
    if (events & EVENT.PICKUP) audio.pickup();
    if (events & EVENT.HIT) audio.hit();
    if (events & EVENT.STAGE) audio.stage();
    if (events & EVENT.OVER) {
      if (events & EVENT.ESCAPED) audio.escaped();
      else audio.caught();
    }
  }

  let last = performance.now();
  let accumulator = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.25) dt = 0.25;
    accumulator += dt;

    if (input.pausePressed && screen === SCREEN_PLAY) paused = !paused;

    if (screen === SCREEN_TITLE) {
      while (accumulator >= STEP) {
        world.stepAttract(STEP);
        accumulator -= STEP;
      }
      if (input.clicked || input.jumpPressed) {
        audio.unlock();
        startRun();
      }
    } else if (screen === SCREEN_PLAY && !paused) {
      let steps = 0;
      while (accumulator >= STEP && steps < 6) {
        const events = world.step(STEP, { jump: input.jumpPressed, duck: input.duckHeld });
        input.jumpPressed = false; // the edge belongs to the first step that saw it
        playSounds(events);
        accumulator -= STEP;
        steps += 1;
        if (world.state.over) {
          screen = SCREEN_OVER;
          best = Math.max(best, Math.floor(world.state.score));
          try { window.localStorage.setItem('pardon-run-best', String(best)); } catch { /* ignore */ }
          break;
        }
      }
      if (steps === 6) accumulator = 0;
    } else if (screen === SCREEN_OVER) {
      while (accumulator >= STEP) {
        world.step(STEP, { jump: false, duck: false }); // particles settle on the end screen
        accumulator -= STEP;
      }
      input.jumpPressed = false; // Space does nothing here; R or a click restarts
      if (input.restartPressed || input.clicked) startRun();
    } else {
      accumulator = 0;
    }

    drawScene(ctx, world, screen, best);
    if (paused && screen === SCREEN_PLAY) drawPaused(ctx);
    // Clear the per-frame edges — but never jumpPressed: it is an edge the fixed-step loop
    // consumes, and a frame in which no step ran must not eat a jump the player pressed.
    input.pausePressed = false;
    input.restartPressed = false;
    input.clicked = false;
  }
  requestAnimationFrame(frame);
}
