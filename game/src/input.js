// Keyboard and mouse input. Edge-triggered actions (jump, start, restart, pause) are latched
// until the game loop consumes them; duck is a held state. Keys: Space / ArrowUp / W jump
// (press again mid-air to flap), ArrowDown / S ducks, P pauses, R restarts a finished run.
// A mouse click jumps, starts and restarts; holding the mouse down ducks.

export function createInput(canvas) {
  const input = {
    jumpPressed: false,
    restartPressed: false,
    pausePressed: false,
    duckHeld: false,
    clicked: false,
  };
  const duckKeys = new Set();

  function pressJump() { input.jumpPressed = true; }
  function pressDuck(code) { duckKeys.add(code); input.duckHeld = true; }
  function releaseDuck(code) { duckKeys.delete(code); input.duckHeld = duckKeys.size > 0 || mouseDuck; }

  let mouseDuck = false;

  window.addEventListener('keydown', (event) => {
    if (event.repeat) {
      if (event.code === 'ArrowDown' || event.code === 'KeyS') event.preventDefault();
      return;
    }
    switch (event.code) {
      case 'Space':
      case 'ArrowUp':
      case 'KeyW':
        pressJump();
        event.preventDefault();
        break;
      case 'ArrowDown':
      case 'KeyS':
        pressDuck(event.code);
        event.preventDefault();
        break;
      case 'KeyR':
        input.restartPressed = true;
        break;
      case 'KeyP':
      case 'Escape':
        input.pausePressed = true;
        break;
      default:
        break;
    }
  });
  window.addEventListener('keyup', (event) => {
    if (event.code === 'ArrowDown' || event.code === 'KeyS') releaseDuck(event.code);
  });
  canvas.addEventListener('pointerdown', (event) => {
    input.clicked = true;
    pressJump();
    if (event.clientY > window.innerHeight * 0.62) { mouseDuck = true; input.duckHeld = true; }
  });
  window.addEventListener('pointerup', () => {
    if (mouseDuck) { mouseDuck = false; input.duckHeld = duckKeys.size > 0; }
  });
  window.addEventListener('blur', () => {
    duckKeys.clear();
    mouseDuck = false;
    input.duckHeld = false;
  });

  // The loop calls this once per frame after reading the edges it cares about.
  input.consumeEdges = function consumeEdges() {
    input.jumpPressed = false;
    input.restartPressed = false;
    input.pausePressed = false;
    input.clicked = false;
  };
  return input;
}
