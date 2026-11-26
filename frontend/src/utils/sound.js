let sharedCtx = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  if (!sharedCtx) {
    sharedCtx = new AudioCtx();
  }
  if (sharedCtx.state === 'suspended') {
    sharedCtx.resume().catch(() => {});
  }
  return sharedCtx;
}

function clampVolume(vol) {
  const num = Number(vol);
  if (Number.isNaN(num)) return 0.75;
  return Math.max(0, Math.min(1, num));
}

function playSonarTheme(ctx, now, vol) {
  const pings = [
    { offset: 0, freq: 1318.5, harm: 1975.5, dur: 0.34, peak: 0.14 * vol },
    { offset: 0.24, freq: 1567.98, harm: 2349.3, dur: 0.42, peak: 0.11 * vol },
  ];
  pings.forEach(p => {
    const osc = ctx.createOscillator();
    const oscHarm = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(p.freq, now + p.offset);
    osc.frequency.exponentialRampToValueAtTime(p.freq * 0.96, now + p.offset + p.dur);

    oscHarm.type = 'sine';
    oscHarm.frequency.setValueAtTime(p.harm, now + p.offset);

    gain.gain.setValueAtTime(0.0001, now + p.offset);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, p.peak), now + p.offset + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + p.offset + p.dur);

    osc.connect(gain);
    oscHarm.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + p.offset);
    oscHarm.start(now + p.offset);
    osc.stop(now + p.offset + p.dur + 0.02);
    oscHarm.stop(now + p.offset + p.dur + 0.02);
  });
}

function playTraumaTheme(ctx, now, vol) {
  const pulses = [0, 0.22, 0.44];
  pulses.forEach((offset, idx) => {
    const oscPrimary = ctx.createOscillator();
    const oscHarmonic = ctx.createOscillator();
    const gain = ctx.createGain();

    const baseFreq = idx === 2 ? 987.77 : 880;
    oscPrimary.type = 'sine';
    oscPrimary.frequency.setValueAtTime(baseFreq, now + offset);

    oscHarmonic.type = 'triangle';
    oscHarmonic.frequency.setValueAtTime(baseFreq * 1.5, now + offset);

    const peak = Math.max(0.0002, 0.15 * vol);
    gain.gain.setValueAtTime(0.0001, now + offset);
    gain.gain.exponentialRampToValueAtTime(peak, now + offset + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.17);

    oscPrimary.connect(gain);
    oscHarmonic.connect(gain);
    gain.connect(ctx.destination);

    oscPrimary.start(now + offset);
    oscHarmonic.start(now + offset);
    oscPrimary.stop(now + offset + 0.19);
    oscHarmonic.stop(now + offset + 0.19);
  });
}

function playTacticalTheme(ctx, now, vol) {
  const notes = [587.33, 880, 1174.66];
  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const oscSub = ctx.createOscillator();
    const gain = ctx.createGain();
    const t = now + idx * 0.095;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, t);

    oscSub.type = 'sine';
    oscSub.frequency.setValueAtTime(freq * 0.5, t);

    const peak = Math.max(0.0002, 0.13 * vol);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(peak, t + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);

    osc.connect(gain);
    oscSub.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    oscSub.start(t);
    osc.stop(t + 0.27);
    oscSub.stop(t + 0.27);
  });
}

/**
 * Plays an audio alert using the selected theme and master volume.
 */
export function playAlertSound({ enabled = true, theme = 'sonar', volume = 0.75 } = {}) {
  if (!enabled) return;
  const vol = clampVolume(volume);
  if (vol <= 0.001) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    if (theme === 'trauma') {
      playTraumaTheme(ctx, now, vol);
    } else if (theme === 'tactical') {
      playTacticalTheme(ctx, now, vol);
    } else {
      playSonarTheme(ctx, now, vol);
    }
  } catch {
    // Ignore audio errors in restricted headless environments
  }
}

/**
 * Plays an urgent clinical telemetry alert chime using Web Audio API.
 */
export function playEmergencyAlertChime(enabled = true, volume = 0.75, theme = 'trauma') {
  playAlertSound({ enabled, theme, volume });
}

/**
 * Subtle positive double-tone chime when emergency is resolved or transfer succeeds.
 */
export function playResolveChime(enabled = true, volume = 0.75) {
  if (!enabled) return;
  const vol = clampVolume(volume);
  if (vol <= 0.001) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [523.25, 659.25];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = now + idx * 0.11;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, 0.11 * vol), t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.18);
    });
  } catch {
    // Ignore audio errors
  }
}

/**
 * Plays a realistic hospital dispatch telephone ringtone loop.
 * Returns a stop() function to halt ringing cleanly.
 */
export function startCallRingtone(enabled = true, volume = 0.75) {
  if (!enabled) return () => {};
  const vol = clampVolume(volume);
  if (vol <= 0.001) return () => {};

  let stopped = false;
  let timerId = null;

  const playBurst = () => {
    if (stopped) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      // Classic clean digital dual-ring cadence (two short trills)
      [0, 0.28].forEach(offset => {
        const oscA = ctx.createOscillator();
        const oscB = ctx.createOscillator();
        const gain = ctx.createGain();

        oscA.type = 'sine';
        oscA.frequency.setValueAtTime(440, now + offset);
        oscB.type = 'sine';
        oscB.frequency.setValueAtTime(480, now + offset);

        const peak = Math.max(0.0002, 0.12 * vol);
        gain.gain.setValueAtTime(0.0001, now + offset);
        gain.gain.exponentialRampToValueAtTime(peak, now + offset + 0.02);
        gain.gain.setValueAtTime(peak, now + offset + 0.17);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.21);

        oscA.connect(gain);
        oscB.connect(gain);
        gain.connect(ctx.destination);

        oscA.start(now + offset);
        oscB.start(now + offset);
        oscA.stop(now + offset + 0.23);
        oscB.stop(now + offset + 0.23);
      });
    } catch {
      // Ignore restricted audio environments
    }
  };

  playBurst();
  timerId = setInterval(playBurst, 2100);

  return () => {
    stopped = true;
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
  };
}

/**
 * Plays a crisp voice-connected chime when a donor call is answered.
 */
export function playCallConnectedChime(enabled = true, volume = 0.75) {
  if (!enabled) return;
  const vol = clampVolume(volume);
  if (vol <= 0.001) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [523.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = now + idx * 0.08;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, 0.11 * vol), t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.2);
    });
  } catch {
    // Ignore audio errors
  }
}
