// Tiny WebAudio sound effects, synthesised in code — no audio files. A gobble on the start,
// a squawk on the jump, a whoosh for the thrown knife, a ding for corn, a thud for a trip and
// a descending sting for the catch. The context is created on the first user gesture, and
// every call is safe before that (it simply stays silent).

export function createAudio() {
  let ctx = null;
  let master = null;

  function ensure() {
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume();
      return true;
    }
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = 0.16;
      master.connect(ctx.destination);
      return true;
    } catch {
      return false;
    }
  }

  function tone(freqFrom, freqTo, seconds, type, volume, delay = 0) {
    if (!ensure()) return;
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freqFrom, t0);
    osc.frequency.exponentialRampToValueAtTime(Math.max(30, freqTo), t0 + seconds);
    gain.gain.setValueAtTime(volume, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + seconds);
    osc.connect(gain).connect(master);
    osc.start(t0);
    osc.stop(t0 + seconds + 0.02);
  }

  function noise(seconds, volume, delay = 0, freq = 900) {
    if (!ensure()) return;
    const t0 = ctx.currentTime + delay;
    const length = Math.max(1, Math.floor(ctx.sampleRate * seconds));
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = freq;
    const gain = ctx.createGain();
    gain.gain.value = volume;
    src.connect(filter).connect(gain).connect(master);
    src.start(t0);
  }

  return {
    unlock() { ensure(); },
    gobble() { tone(420, 180, 0.09, 'square', 0.5); tone(460, 170, 0.09, 'square', 0.5, 0.1); tone(500, 200, 0.12, 'square', 0.45, 0.2); },
    jump() { tone(300, 640, 0.14, 'triangle', 0.6); },
    flap() { noise(0.12, 0.5, 0, 1400); tone(340, 520, 0.1, 'triangle', 0.35); },
    knifeThrow() { noise(0.16, 0.4, 0, 2600); },
    hit() { tone(160, 60, 0.22, 'sawtooth', 0.6); noise(0.18, 0.5, 0, 500); },
    pickup() { tone(880, 1320, 0.09, 'sine', 0.55); tone(1320, 1760, 0.08, 'sine', 0.4, 0.07); },
    stage() { tone(523, 523, 0.1, 'triangle', 0.5); tone(659, 659, 0.1, 'triangle', 0.5, 0.1); tone(784, 784, 0.16, 'triangle', 0.55, 0.2); },
    caught() { tone(392, 392, 0.16, 'square', 0.45); tone(330, 330, 0.16, 'square', 0.45, 0.17); tone(262, 130, 0.4, 'square', 0.5, 0.34); },
    escaped() { tone(523, 523, 0.11, 'triangle', 0.55); tone(659, 659, 0.11, 'triangle', 0.55, 0.11); tone(784, 784, 0.11, 'triangle', 0.55, 0.22); tone(1046, 1046, 0.3, 'triangle', 0.6, 0.33); },
  };
}
