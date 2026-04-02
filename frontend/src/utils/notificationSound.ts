let audioCtx: AudioContext | null = null;
let ctxReady = false;

function ensureCtx() {
  if (!audioCtx || audioCtx.state === 'closed') {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  ctxReady = true;
}

// Initialize AudioContext on first user interaction (browser policy)
if (typeof document !== 'undefined') {
  const init = () => {
    ensureCtx();
    ['click', 'keydown', 'touchstart'].forEach(e => document.removeEventListener(e, init));
  };
  ['click', 'keydown', 'touchstart'].forEach(e =>
    document.addEventListener(e, init, { once: true, passive: true })
  );
}

export function playNotificationSound(type: 'notification' | 'message' = 'notification') {
  try {
    ensureCtx();
    if (!audioCtx || audioCtx.state !== 'running') return;
    const ctx = audioCtx;

    if (type === 'message') {
      // Double tone for chat
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.frequency.value = 880;
      osc1.type = 'sine';
      gain1.gain.setValueAtTime(0.15, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.12);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.frequency.value = 1050;
      osc2.type = 'sine';
      gain2.gain.setValueAtTime(0.15, ctx.currentTime + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc2.start(ctx.currentTime + 0.15);
      osc2.stop(ctx.currentTime + 0.3);
    } else {
      // Ding for notifications
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(830, ctx.currentTime);
      osc.frequency.setValueAtTime(990, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    }
  } catch {
    // Silently fail
  }
}
