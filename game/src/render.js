// All drawing for Pardon Run: hand-drawn canvas art, no images. The farmyard and barnyard are
// parallax autumn scenes; the kitchen is a tiled room with hanging pans and a chequered floor.
// The turkey, the farmer and every obstacle are drawn from paths each frame, and this file also
// owns the HUD, the title screen and the end screen.

import { ESCAPE_METERS, FARMER, GROUND_Y, KIND, RUN, STAGES, TURKEY, VIEW } from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_OVER = 'over';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// ---------------------------------------------------------------- backgrounds

function drawSky(ctx, stageIndex, t) {
  const stops = [
    ['#8ec9e8', '#fdeec9'],
    ['#f2a65e', '#ffe9bd'],
    ['#584a63', '#c96f4a'],
  ][stageIndex];
  const g = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  g.addColorStop(0, stops[0]);
  g.addColorStop(1, stops[1]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW.width, GROUND_Y);
  if (stageIndex < 2) {
    // sun and drifting clouds
    ctx.fillStyle = stageIndex === 0 ? '#fff3a6' : '#ffd27a';
    ctx.beginPath();
    ctx.arc(1090, 118, 52, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    for (let i = 0; i < 5; i += 1) {
      const cx = ((i * 340 + 120 - t * 9) % (VIEW.width + 260)) - 130;
      const cy = 70 + (i % 3) * 52;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 62, 20, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + 38, cy + 5, 44, 16, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawFarmBackdrop(ctx, stageIndex, scroll) {
  // distant hills, then a barn (stage 1) or windmill (stage 2) on a slow parallax layer
  ctx.fillStyle = stageIndex === 0 ? '#a8bf6d' : '#b98a52';
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y);
  for (let x = 0; x <= VIEW.width; x += 160) {
    const off = (x - (scroll * 0.12) % 160);
    ctx.lineTo(off, GROUND_Y - 92 - Math.sin((x + scroll * 0.12) * 0.004) * 26);
  }
  ctx.lineTo(VIEW.width, GROUND_Y);
  ctx.closePath();
  ctx.fill();

  const layerX = VIEW.width - ((scroll * 0.25) % (VIEW.width + 480)) + 240;
  if (stageIndex === 0) {
    // red barn with a silo
    ctx.fillStyle = '#a63a2e';
    ctx.fillRect(layerX, GROUND_Y - 208, 190, 128);
    ctx.fillStyle = '#7e2a21';
    ctx.beginPath();
    ctx.moveTo(layerX - 14, GROUND_Y - 208);
    ctx.lineTo(layerX + 95, GROUND_Y - 268);
    ctx.lineTo(layerX + 204, GROUND_Y - 208);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#f3e2c7';
    ctx.fillRect(layerX + 70, GROUND_Y - 160, 50, 80);
    ctx.strokeStyle = '#7e2a21';
    ctx.lineWidth = 5;
    ctx.strokeRect(layerX + 70, GROUND_Y - 160, 50, 80);
    ctx.fillStyle = '#c9ccd4';
    ctx.fillRect(layerX + 224, GROUND_Y - 252, 44, 172);
    ctx.fillStyle = '#9aa0ac';
    ctx.beginPath();
    ctx.arc(layerX + 246, GROUND_Y - 252, 22, Math.PI, 0);
    ctx.fill();
  } else {
    // windmill, turning slowly
    ctx.strokeStyle = '#6e4a2f';
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(layerX + 40, GROUND_Y);
    ctx.lineTo(layerX + 62, GROUND_Y - 230);
    ctx.moveTo(layerX + 104, GROUND_Y);
    ctx.lineTo(layerX + 62, GROUND_Y - 230);
    ctx.stroke();
    const cx = layerX + 62;
    const cy = GROUND_Y - 238;
    ctx.strokeStyle = '#8a613c';
    ctx.lineWidth = 7;
    for (let i = 0; i < 4; i += 1) {
      const a = scroll * 0.002 + (i * Math.PI) / 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * 62, cy + Math.sin(a) * 62);
      ctx.stroke();
    }
    ctx.fillStyle = '#6e4a2f';
    ctx.beginPath();
    ctx.arc(cx, cy, 9, 0, Math.PI * 2);
    ctx.fill();
  }
  // fence posts on a faster layer
  ctx.fillStyle = '#8a613c';
  const gap = 118;
  for (let x = -((scroll * 0.6) % gap); x < VIEW.width; x += gap) {
    ctx.fillRect(x, GROUND_Y - 58, 10, 58);
  }
  ctx.fillRect(0, GROUND_Y - 46, VIEW.width, 6);
  ctx.fillRect(0, GROUND_Y - 22, VIEW.width, 6);
}

function drawKitchenBackdrop(ctx, scroll) {
  // tiled wall, a window on the night, hanging pans and utensils
  ctx.fillStyle = '#e9dcbf';
  ctx.fillRect(0, 0, VIEW.width, GROUND_Y);
  ctx.strokeStyle = 'rgba(160,130,90,0.35)';
  ctx.lineWidth = 2;
  const tile = 64;
  const off = -((scroll * 0.5) % tile);
  for (let x = off; x < VIEW.width; x += tile) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, GROUND_Y);
    ctx.stroke();
  }
  for (let y = 0; y < GROUND_Y; y += tile / 2) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(VIEW.width, y);
    ctx.stroke();
  }
  // window
  ctx.fillStyle = '#2c3550';
  ctx.fillRect(120, 84, 190, 170);
  ctx.fillStyle = '#f7e8b0';
  ctx.beginPath();
  ctx.arc(252, 128, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#7a5c38';
  ctx.lineWidth = 8;
  ctx.strokeRect(120, 84, 190, 170);
  ctx.beginPath();
  ctx.moveTo(215, 84);
  ctx.lineTo(215, 254);
  ctx.stroke();
  // hanging pans
  ctx.fillStyle = '#4c4f57';
  for (let i = 0; i < 6; i += 1) {
    const px = 480 + i * 128 - ((scroll * 0.5) % 128);
    ctx.fillRect(px + 22, 0, 5, 54);
    ctx.beginPath();
    ctx.arc(px + 24, 84, 27, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#62656e';
    ctx.beginPath();
    ctx.arc(px + 24, 84, 17, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#4c4f57';
  }
  // a shelf with jars
  ctx.fillStyle = '#8a613c';
  ctx.fillRect(880, 210, 330, 12);
  const jarCols = ['#c94f38', '#e0a83c', '#7fae4c', '#c94f38', '#e0a83c'];
  for (let i = 0; i < 5; i += 1) {
    ctx.fillStyle = jarCols[i];
    roundRect(ctx, 898 + i * 64, 168, 40, 42, 6);
    ctx.fill();
  }
}

function drawGround(ctx, stageIndex, scroll) {
  const h = VIEW.height - GROUND_Y;
  if (stageIndex === 2) {
    // chequered kitchen floor
    const tile = 56;
    const off = -((scroll) % (tile * 2));
    for (let row = 0; row < Math.ceil(h / tile); row += 1) {
      for (let col = -1; col < VIEW.width / tile + 1; col += 1) {
        ctx.fillStyle = (row + col) % 2 === 0 ? '#d8cfc0' : '#5d564e';
        ctx.fillRect(off + col * tile, GROUND_Y + row * tile, tile, tile);
      }
    }
    ctx.fillStyle = '#8a613c';
    ctx.fillRect(0, GROUND_Y - 6, VIEW.width, 8);
    return;
  }
  ctx.fillStyle = stageIndex === 0 ? '#79a84b' : '#a37c3f';
  ctx.fillRect(0, GROUND_Y, VIEW.width, h);
  ctx.fillStyle = stageIndex === 0 ? '#c9a35f' : '#bd9250';
  ctx.fillRect(0, GROUND_Y + 26, VIEW.width, 62);
  // dashed track line scrolling with the world
  ctx.fillStyle = 'rgba(255,246,220,0.5)';
  const dash = 46;
  for (let x = -((scroll) % (dash * 2)); x < VIEW.width; x += dash * 2) ctx.fillRect(x, GROUND_Y + 52, dash, 5);
  // grass tufts / stubble
  ctx.strokeStyle = stageIndex === 0 ? '#5d8a38' : '#8a6a30';
  ctx.lineWidth = 3;
  for (let i = 0; i < 26; i += 1) {
    const x = ((i * 173 + 40 - scroll * 1.0) % (VIEW.width + 30) + VIEW.width + 30) % (VIEW.width + 30) - 15;
    const y = GROUND_Y + 8 + (i % 4) * 4;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 4, y - 10);
    ctx.moveTo(x + 5, y);
    ctx.lineTo(x + 8, y - 11);
    ctx.stroke();
  }
}

// ---------------------------------------------------------------- creatures

function drawTurkey(ctx, state) {
  const t = state.turkey;
  const ducking = t.ducking && t.yOff === 0;
  const baseY = GROUND_Y - t.yOff;
  const blink = state.time < t.invincibleUntil && Math.floor(state.time * 14) % 2 === 0;
  ctx.save();
  if (blink) ctx.globalAlpha = 0.35;
  // shadow
  ctx.fillStyle = 'rgba(60,35,10,0.28)';
  const shScale = Math.max(0.4, 1 - t.yOff / 420);
  ctx.beginPath();
  ctx.ellipse(TURKEY.x + 48, GROUND_Y + 12, 52 * shScale, 9 * shScale, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.translate(TURKEY.x, baseY);
  if (ducking) { ctx.translate(4, 26); ctx.scale(1.06, 0.72); ctx.translate(0, -10); }
  const bob = t.yOff === 0 && !ducking ? Math.sin(t.runPhase * 2) * 2.4 : 0;
  ctx.translate(0, bob - 62);

  // tail fan
  const featherCols = ['#8a4b21', '#b45a2d', '#d9822b', '#b45a2d', '#8a4b21'];
  for (let i = 0; i < 5; i += 1) {
    const a = -0.9 + i * 0.34 + Math.sin(t.runPhase + i) * 0.03;
    ctx.save();
    ctx.translate(16, 6);
    ctx.rotate(a);
    ctx.fillStyle = featherCols[i];
    ctx.beginPath();
    ctx.ellipse(-26, 0, 30, 10.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f3e2c7';
    ctx.beginPath();
    ctx.ellipse(-46, 0, 7, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  // legs
  ctx.strokeStyle = '#e08a2d';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  if (t.yOff > 4) {
    ctx.beginPath(); ctx.moveTo(44, 22); ctx.lineTo(38, 40); ctx.lineTo(48, 44); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(62, 22); ctx.lineTo(66, 38); ctx.lineTo(76, 40); ctx.stroke();
  } else if (!ducking) {
    const s = Math.sin(t.runPhase * 2);
    ctx.beginPath(); ctx.moveTo(44, 22); ctx.lineTo(44 + s * 13, 46); ctx.lineTo(52 + s * 13, 46); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(62, 22); ctx.lineTo(62 - s * 13, 46); ctx.lineTo(70 - s * 13, 46); ctx.stroke();
  }
  // body
  const bodyGrad = ctx.createLinearGradient(0, -34, 0, 30);
  bodyGrad.addColorStop(0, '#c97a3a');
  bodyGrad.addColorStop(1, '#9c5522');
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.ellipse(48, 0, 46, 31, -0.08, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f3e2c7';
  ctx.beginPath();
  ctx.ellipse(58, 10, 30, 18, -0.1, 0, Math.PI * 2);
  ctx.fill();
  // wing (flaps hard when airborne)
  const flap = t.yOff > 4 ? Math.sin(state.time * 26) * 0.5 : Math.sin(t.runPhase * 2) * 0.1;
  ctx.save();
  ctx.translate(44, -4);
  ctx.rotate(0.25 + flap);
  ctx.fillStyle = '#8a4b21';
  ctx.beginPath();
  ctx.ellipse(0, 6, 27, 15, 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // neck and head
  ctx.fillStyle = '#b45a2d';
  ctx.beginPath();
  ctx.ellipse(88, -16, 13, 20, 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#d9822b';
  ctx.beginPath();
  ctx.arc(99, -30, 15.5, 0, Math.PI * 2);
  ctx.fill();
  // head tuft
  ctx.strokeStyle = '#8a4b21';
  ctx.lineWidth = 3.4;
  ctx.beginPath(); ctx.moveTo(95, -43); ctx.lineTo(91, -53); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(101, -44); ctx.lineTo(101, -55); ctx.stroke();
  // beak and wattle
  ctx.fillStyle = '#f2a71b';
  ctx.beginPath();
  ctx.moveTo(112, -33);
  ctx.lineTo(130, -28);
  ctx.lineTo(112, -23);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#d63a2f';
  ctx.beginPath();
  ctx.ellipse(110, -18, 5.5, 10, 0.25, 0, Math.PI * 2);
  ctx.fill();
  // eye: a determined dot, or X X when caught
  ctx.fillStyle = '#241407';
  if (state.over && !state.escaped) {
    ctx.strokeStyle = '#241407';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(99, -36); ctx.lineTo(107, -28); ctx.moveTo(107, -36); ctx.lineTo(99, -28);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(103, -32, 3.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawFarmer(ctx, state) {
  const gap = state.gap;
  const fx = TURKEY.x - gap;
  if (fx + FARMER.width < -30) return; // too far behind to see — the HUD meter speaks for him
  const f = state.farmer;
  const bob = Math.abs(Math.sin(f.bobPhase * 2)) * 5;
  ctx.save();
  ctx.translate(fx, GROUND_Y - bob);
  // shadow
  ctx.fillStyle = 'rgba(60,35,10,0.25)';
  ctx.beginPath();
  ctx.ellipse(42, 12 + bob, 40, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  const stride = Math.sin(f.bobPhase * 2) * 15;
  // legs in overalls
  ctx.strokeStyle = '#33549e';
  ctx.lineWidth = 13;
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(36, -52); ctx.lineTo(36 + stride, -6); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(52, -52); ctx.lineTo(52 - stride, -6); ctx.stroke();
  // boots
  ctx.fillStyle = '#4a2f18';
  ctx.fillRect(28 + stride, -10, 20, 9);
  ctx.fillRect(44 - stride, -10, 20, 9);
  // torso: red shirt, white apron in the kitchen
  ctx.fillStyle = '#b23a30';
  roundRect(ctx, 14, -116, 56, 68, 9);
  ctx.fill();
  ctx.fillStyle = '#33549e';
  ctx.fillRect(14, -78, 56, 30);
  if (state.stageIndex === 2) {
    ctx.fillStyle = '#f6efe0';
    roundRect(ctx, 24, -108, 38, 52, 5);
    ctx.fill();
  }
  // back arm pumping
  ctx.strokeStyle = '#b23a30';
  ctx.lineWidth = 11;
  ctx.beginPath(); ctx.moveTo(20, -104); ctx.lineTo(8, -76 + stride * 0.7); ctx.stroke();
  // head and straw hat
  ctx.fillStyle = '#e8b07e';
  ctx.beginPath();
  ctx.arc(44, -132, 17, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e6c04f';
  ctx.beginPath();
  ctx.ellipse(44, -146, 30, 7.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(28, -160, 32, 13);
  // angry eye and shout mouth when close
  ctx.fillStyle = '#241407';
  ctx.beginPath();
  ctx.arc(52, -134, 2.8, 0, Math.PI * 2);
  ctx.fill();
  if (gap < 200) {
    ctx.strokeStyle = '#7e2a21';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(56, -124, 4.6, 0.3, Math.PI - 0.6);
    ctx.stroke();
    // sweat drops
    ctx.fillStyle = '#7ec3e8';
    ctx.beginPath();
    ctx.ellipse(24, -150 + (state.time * 60) % 14, 3.4, 5.4, 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
  // knife arm: raised back in the telegraph, reaching forward on the catch, else pumping
  ctx.strokeStyle = '#b23a30';
  ctx.lineWidth = 11;
  let handX;
  let handY;
  if (state.over && state.caughtByHand) {
    handX = 96; handY = -88;
  } else if (f.armRaise > 0) {
    handX = 66; handY = -128;
  } else {
    handX = 70; handY = -78 - stride * 0.7;
  }
  ctx.beginPath();
  ctx.moveTo(62, -104);
  ctx.lineTo(handX, handY);
  ctx.stroke();
  // the carving knife in his hand
  ctx.save();
  ctx.translate(handX, handY);
  ctx.rotate(state.over && state.caughtByHand ? 0.5 : -0.4);
  ctx.fillStyle = '#6e4a2f';
  ctx.fillRect(-4, -4, 15, 8);
  ctx.fillStyle = '#d9dee6';
  ctx.beginPath();
  ctx.moveTo(11, -4);
  ctx.lineTo(38, -1);
  ctx.lineTo(11, 5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.restore();
}

// ---------------------------------------------------------------- entities

function drawOven(ctx, e, t) {
  ctx.fillStyle = '#3f434c';
  roundRect(ctx, e.x, e.y, e.w, e.h, 8);
  ctx.fill();
  ctx.fillStyle = '#2c2f36';
  ctx.fillRect(e.x + 14, e.y - 20, 16, 22); // chimney
  ctx.fillStyle = 'rgba(200,200,200,0.5)';
  ctx.beginPath();
  ctx.ellipse(e.x + 22, e.y - 30 - Math.sin(t * 3 + e.x) * 3, 7, 10 + Math.sin(t * 2.2 + e.x) * 2.5, 0, 0, Math.PI * 2);
  ctx.fill();
  // door with a fire window
  ctx.fillStyle = '#24262c';
  roundRect(ctx, e.x + 13, e.y + 26, e.w - 26, e.h - 42, 6);
  ctx.fill();
  const flicker = 0.75 + Math.sin(t * 13 + e.x * 0.7) * 0.25;
  const g = ctx.createRadialGradient(e.x + e.w / 2, e.y + 66, 4, e.x + e.w / 2, e.y + 66, 34);
  g.addColorStop(0, `rgba(255,214,90,${flicker})`);
  g.addColorStop(1, 'rgba(214,80,30,0.9)');
  ctx.fillStyle = g;
  roundRect(ctx, e.x + 21, e.y + 36, e.w - 42, e.h - 62, 5);
  ctx.fill();
  // dial and handle
  ctx.fillStyle = '#d9dee6';
  ctx.beginPath();
  ctx.arc(e.x + e.w - 20, e.y + 14, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(e.x + 10, e.y + 20, e.w - 20, 4);
}

function drawKnife(ctx, e, t) {
  ctx.save();
  ctx.translate(e.x + e.w / 2, e.y + e.h / 2);
  ctx.rotate(Math.sin(t * 30 + e.spin) * 0.22);
  // motion streaks
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 2.4;
  for (let i = -1; i <= 1; i += 1) {
    ctx.beginPath();
    ctx.moveTo(30, i * 6);
    ctx.lineTo(52, i * 6);
    ctx.stroke();
  }
  ctx.fillStyle = '#6e4a2f';
  ctx.fillRect(8, -4.5, 17, 9); // handle behind
  ctx.fillStyle = '#e8edf4';
  ctx.beginPath();
  ctx.moveTo(8, -6);
  ctx.lineTo(-30, -1.5);
  ctx.lineTo(8, 6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath();
  ctx.moveTo(2, -3.4);
  ctx.lineTo(-22, -1.2);
  ctx.lineTo(2, 1);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawEntity(ctx, e, t) {
  switch (e.kind) {
    case KIND.HAY:
      ctx.fillStyle = '#dfa83c';
      roundRect(ctx, e.x, e.y, e.w, e.h, 14);
      ctx.fill();
      ctx.strokeStyle = '#b9822a';
      ctx.lineWidth = 3.4;
      for (let i = 1; i <= 3; i += 1) {
        ctx.beginPath();
        ctx.moveTo(e.x + (e.w / 4) * i, e.y + 4);
        ctx.lineTo(e.x + (e.w / 4) * i, e.y + e.h - 4);
        ctx.stroke();
      }
      break;
    case KIND.CRATE:
      ctx.fillStyle = '#a4713a';
      ctx.fillRect(e.x, e.y, e.w, e.h);
      ctx.strokeStyle = '#7a5226';
      ctx.lineWidth = 4;
      ctx.strokeRect(e.x + 2, e.y + 2, e.w - 4, e.h - 4);
      ctx.beginPath();
      ctx.moveTo(e.x + 3, e.y + 3);
      ctx.lineTo(e.x + e.w - 3, e.y + e.h - 3);
      ctx.moveTo(e.x + e.w - 3, e.y + 3);
      ctx.lineTo(e.x + 3, e.y + e.h - 3);
      ctx.stroke();
      break;
    case KIND.FENCE:
      ctx.fillStyle = '#f1ead9';
      for (let i = 0; i < 4; i += 1) {
        const px = e.x + 4 + i * 18;
        ctx.beginPath();
        ctx.moveTo(px, e.y + e.h);
        ctx.lineTo(px, e.y + 10);
        ctx.lineTo(px + 6, e.y);
        ctx.lineTo(px + 12, e.y + 10);
        ctx.lineTo(px + 12, e.y + e.h);
        ctx.closePath();
        ctx.fill();
      }
      ctx.fillRect(e.x, e.y + 20, e.w, 7);
      ctx.fillRect(e.x, e.y + 42, e.w, 7);
      break;
    case KIND.BARREL:
      ctx.fillStyle = '#8a5a2c';
      roundRect(ctx, e.x, e.y, e.w, e.h, 10);
      ctx.fill();
      ctx.fillStyle = '#5d564e';
      ctx.fillRect(e.x - 2, e.y + 12, e.w + 4, 6);
      ctx.fillRect(e.x - 2, e.y + e.h - 18, e.w + 4, 6);
      break;
    case KIND.OVEN:
      drawOven(ctx, e, t);
      break;
    case KIND.KNIFE_HIGH:
    case KIND.KNIFE_LOW:
      drawKnife(ctx, e, t);
      break;
    case KIND.CORN:
    case KIND.GOLD_CORN: {
      const bobY = Math.sin(t * 5 + e.x * 0.05) * 3;
      ctx.save();
      ctx.translate(e.x + e.w / 2, e.y + e.h / 2 + bobY);
      if (e.kind === KIND.GOLD_CORN) {
        ctx.fillStyle = 'rgba(255,217,77,0.35)';
        ctx.beginPath();
        ctx.arc(0, 0, 25 + Math.sin(t * 7) * 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.rotate(0.5);
      ctx.fillStyle = e.kind === KIND.GOLD_CORN ? '#ffd94d' : '#f2c230';
      ctx.beginPath();
      ctx.ellipse(0, 0, 10, 17, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(160,100,10,0.55)';
      for (let r = -10; r <= 10; r += 6) {
        ctx.beginPath();
        ctx.ellipse(0, r, 8.6, 1.6, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#5d8a38';
      ctx.beginPath();
      ctx.ellipse(-9, 10, 5, 11, 0.6, 0, Math.PI * 2);
      ctx.ellipse(9, 10, 5, 11, -0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      break;
    }
    case KIND.PUMPKIN: {
      ctx.fillStyle = '#dd721f';
      ctx.beginPath();
      ctx.ellipse(e.x + e.w / 2, e.y + e.h / 2 + 2, 19, 15, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#b85a14';
      ctx.lineWidth = 2.4;
      for (const dx of [-9, 0, 9]) {
        ctx.beginPath();
        ctx.ellipse(e.x + e.w / 2 + dx, e.y + e.h / 2 + 2, 6.5, 14, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = '#5d8a38';
      ctx.fillRect(e.x + e.w / 2 - 3, e.y - 3, 6, 9);
      break;
    }
    default:
      break;
  }
}

function drawParticles(ctx, state) {
  for (const p of state.particles) {
    const a = 1 - p.age / p.life;
    ctx.globalAlpha = a;
    ctx.fillStyle = p.colour;
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, p.size, p.size * 0.62, p.age * 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// ---------------------------------------------------------------- HUD and screens

function drawHeart(ctx, x, y, filled) {
  ctx.fillStyle = filled ? '#d63a2f' : 'rgba(30,18,8,0.45)';
  ctx.beginPath();
  ctx.moveTo(x, y + 7);
  ctx.bezierCurveTo(x - 13, y - 6, x - 4, y - 17, x, y - 8);
  ctx.bezierCurveTo(x + 4, y - 17, x + 13, y - 6, x, y + 7);
  ctx.fill();
}

export function drawHUD(ctx, state, best) {
  const pad = 22;
  ctx.textBaseline = 'alphabetic';
  // score and distance, top left
  ctx.fillStyle = 'rgba(28,16,6,0.55)';
  roundRect(ctx, pad - 8, 12, 252, 74, 10);
  ctx.fill();
  ctx.fillStyle = '#ffe9bd';
  ctx.font = '700 27px Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`SCORE ${String(Math.floor(state.score)).padStart(6, '0')}`, pad, 44);
  ctx.font = '600 19px Arial, sans-serif';
  ctx.fillStyle = '#ffd98a';
  ctx.fillText(`DIST ${Math.floor(state.distancePx / 40)} m  ·  CORN ${state.cornEaten}`, pad, 72);
  // stage name, top centre
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(28,16,6,0.55)';
  roundRect(ctx, VIEW.width / 2 - 128, 12, 256, 40, 10);
  ctx.fill();
  ctx.fillStyle = '#ffe9bd';
  ctx.font = '700 19px Arial, sans-serif';
  ctx.fillText(STAGES[state.stageIndex].name, VIEW.width / 2, 39);
  // escape progress under it
  const prog = Math.min(1, state.distancePx / 40 / ESCAPE_METERS);
  ctx.fillStyle = 'rgba(28,16,6,0.55)';
  roundRect(ctx, VIEW.width / 2 - 128, 58, 256, 12, 6);
  ctx.fill();
  ctx.fillStyle = '#7fae4c';
  roundRect(ctx, VIEW.width / 2 - 126, 60, 252 * prog, 8, 4);
  ctx.fill();
  // hearts and the farmer meter, top right
  for (let i = 0; i < RUN.startLives; i += 1) drawHeart(ctx, VIEW.width - pad - 16 - i * 36, 36, i < state.lives);
  ctx.fillStyle = 'rgba(28,16,6,0.55)';
  roundRect(ctx, VIEW.width - pad - 196, 52, 204, 34, 9);
  ctx.fill();
  ctx.fillStyle = '#ffe9bd';
  ctx.font = '700 14px Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('FARMER', VIEW.width - pad - 188, 74);
  const close = 1 - (state.gap - FARMER.grabGap) / (FARMER.maxGap - FARMER.grabGap);
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  roundRect(ctx, VIEW.width - pad - 118, 62, 108, 11, 5);
  ctx.fill();
  ctx.fillStyle = close > 0.72 ? '#d63a2f' : close > 0.45 ? '#e08a2d' : '#7fae4c';
  roundRect(ctx, VIEW.width - pad - 118, 62, Math.max(6, 108 * close), 11, 5);
  ctx.fill();
  // stage banner
  if (state.stageBannerT > 0) {
    const a = Math.min(1, state.stageBannerT / 0.5);
    ctx.globalAlpha = a;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff6e0';
    ctx.font = '800 44px Arial, sans-serif';
    ctx.strokeStyle = 'rgba(60,30,5,0.8)';
    ctx.lineWidth = 7;
    const label = `NOW ENTERING: ${STAGES[state.stageIndex].name}`;
    ctx.strokeText(label, VIEW.width / 2, 210);
    ctx.fillText(label, VIEW.width / 2, 210);
    ctx.globalAlpha = 1;
  }
  if (best > 0 && state.time < 0.05) { /* best is shown on the title and end screens */ }
}

export function drawScene(ctx, world, screen, best = 0) {
  const state = world.state;
  ctx.save();
  if (state.shake > 0) ctx.translate((Math.sin(state.time * 90) * state.shake) / 2, (Math.cos(state.time * 77) * state.shake) / 3);
  if (state.stageIndex === 2) {
    ctx.fillStyle = '#584a63';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    drawKitchenBackdrop(ctx, state.distancePx);
  } else {
    drawSky(ctx, state.stageIndex, state.time);
    drawFarmBackdrop(ctx, state.stageIndex, state.distancePx);
  }
  drawGround(ctx, state.stageIndex, state.distancePx);
  // the Freedom Fence, when the end of the run scrolls into view
  const fenceX = ESCAPE_METERS * 40 - state.distancePx + TURKEY.x + 340;
  if (fenceX < VIEW.width + 80) {
    ctx.fillStyle = '#f1ead9';
    for (let i = 0; i < 5; i += 1) {
      const px = fenceX + i * 26;
      ctx.beginPath();
      ctx.moveTo(px, GROUND_Y + 4);
      ctx.lineTo(px, GROUND_Y - 108);
      ctx.lineTo(px + 8, GROUND_Y - 122);
      ctx.lineTo(px + 16, GROUND_Y - 108);
      ctx.lineTo(px + 16, GROUND_Y + 4);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = '#7fae4c';
    roundRect(ctx, fenceX - 12, GROUND_Y - 152, 148, 34, 7);
    ctx.fill();
    ctx.fillStyle = '#fff6e0';
    ctx.font = '800 19px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('FREEDOM →', fenceX + 62, GROUND_Y - 129);
  }
  for (const e of state.entities) drawEntity(ctx, e, state.time);
  drawFarmer(ctx, state);
  drawTurkey(ctx, state);
  drawParticles(ctx, state);
  ctx.restore();

  if (screen !== SCREEN_TITLE) drawHUD(ctx, state, best);
  if (screen === SCREEN_TITLE) drawTitle(ctx, state, best);
  if (screen === SCREEN_OVER) drawEnd(ctx, state, best);
}

function drawTitle(ctx, state, best) {
  const g = ctx.createLinearGradient(0, 0, 0, 430);
  g.addColorStop(0, 'rgba(46,22,4,0.62)');
  g.addColorStop(1, 'rgba(46,22,4,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW.width, 430);
  ctx.textAlign = 'center';
  ctx.font = '900 104px Arial, sans-serif';
  ctx.lineWidth = 14;
  ctx.strokeStyle = '#5d2c08';
  ctx.strokeText('PARDON RUN', VIEW.width / 2, 148);
  const tg = ctx.createLinearGradient(0, 60, 0, 150);
  tg.addColorStop(0, '#ffd94d');
  tg.addColorStop(1, '#e08a2d');
  ctx.fillStyle = tg;
  ctx.fillText('PARDON RUN', VIEW.width / 2, 148);
  ctx.font = '700 30px Arial, sans-serif';
  ctx.fillStyle = '#fff6e0';
  ctx.fillText('T H E   G R E A T   T U R K E Y   E S C A P E', VIEW.width / 2, 198);
  ctx.font = '600 21px Arial, sans-serif';
  ctx.fillStyle = '#ffe9bd';
  ctx.fillText('Outrun the farmer. Dodge the oven. Duck the carving knives. Reach the Freedom Fence at 1,150 m.', VIEW.width / 2, 240);
  // controls panel
  ctx.fillStyle = 'rgba(28,16,6,0.66)';
  roundRect(ctx, VIEW.width / 2 - 330, 268, 660, 86, 12);
  ctx.fill();
  ctx.fillStyle = '#fff6e0';
  ctx.font = '600 20px Arial, sans-serif';
  ctx.fillText('SPACE / ↑ / CLICK — jump · press again mid-air to flap', VIEW.width / 2, 300);
  ctx.fillText('↓ — duck under knives · P — pause', VIEW.width / 2, 332);
  if (Math.floor(state.time * 1.6) % 2 === 0) {
    ctx.font = '800 27px Arial, sans-serif';
    ctx.fillStyle = '#ffd94d';
    ctx.fillText('CLICK OR PRESS SPACE TO RUN!', VIEW.width / 2, 402);
  }
  if (best > 0) {
    ctx.font = '700 20px Arial, sans-serif';
    ctx.fillStyle = '#ffe9bd';
    ctx.fillText(`BEST SCORE ${Math.floor(best)}`, VIEW.width / 2, 438);
  }
}

function drawEnd(ctx, state, best) {
  ctx.fillStyle = 'rgba(30,15,3,0.52)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  const w = 620;
  const h = 356;
  const x = (VIEW.width - w) / 2;
  const y = 168;
  ctx.fillStyle = '#fdf3da';
  roundRect(ctx, x, y, w, h, 18);
  ctx.fill();
  ctx.strokeStyle = '#8a5a2c';
  ctx.lineWidth = 5;
  roundRect(ctx, x, y, w, h, 18);
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.font = '900 62px Arial, sans-serif';
  ctx.fillStyle = state.escaped ? '#4d7c2a' : '#b23a30';
  ctx.fillText(state.escaped ? 'PARDONED!' : 'CAUGHT!', VIEW.width / 2, y + 84);
  ctx.font = '600 21px Arial, sans-serif';
  ctx.fillStyle = '#5d4020';
  const story = state.escaped
    ? 'Over the Freedom Fence — no turkey dinner tonight.'
    : state.caughtByHand
      ? 'The farmer finally got his hands on you.'
      : 'Three stumbles, and the run is done.';
  ctx.fillText(story, VIEW.width / 2, y + 126);
  ctx.font = '700 24px Arial, sans-serif';
  ctx.fillStyle = '#33200c';
  const metres = Math.floor(state.distancePx / 40);
  ctx.fillText(`SCORE ${Math.floor(state.score)}      DISTANCE ${metres} m`, VIEW.width / 2, y + 182);
  ctx.fillText(`CORN & SNACKS ${state.cornEaten}      BEST ${Math.floor(Math.max(best, state.score))}`, VIEW.width / 2, y + 222);
  // a row of little feathers as a divider
  ctx.fillStyle = '#d9822b';
  for (let i = 0; i < 7; i += 1) {
    ctx.beginPath();
    ctx.ellipse(VIEW.width / 2 - 96 + i * 32, y + 262, 9, 4.6, 0.6, 0, Math.PI * 2);
    ctx.fill();
  }
  if (Math.floor(state.time * 1.6) % 2 === 0) {
    ctx.font = '800 25px Arial, sans-serif';
    ctx.fillStyle = '#b23a30';
    ctx.fillText('PRESS R OR CLICK TO RUN AGAIN', VIEW.width / 2, y + 316);
  }
}

export function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(30,15,3,0.45)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.textAlign = 'center';
  ctx.font = '900 64px Arial, sans-serif';
  ctx.fillStyle = '#fff6e0';
  ctx.fillText('PAUSED', VIEW.width / 2, VIEW.height / 2);
  ctx.font = '600 22px Arial, sans-serif';
  ctx.fillText('Press P to keep running', VIEW.width / 2, VIEW.height / 2 + 42);
}
