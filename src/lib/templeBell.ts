// A short, synthesized temple-bell chime (two soft strikes) built from sine
// oscillators — no external audio asset to license or host. Shared by the
// full-screen splash intro and anywhere else a bell needs to ring.
export function ringBell(): AudioContext | null {
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioCtx) return null;
  const ctx = new AudioCtx();

  const strike = (t: number, freq: number) => {
    const partials: [number, number][] = [
      [1, 0.32],
      [2.0, 0.14],
      [2.76, 0.08],
    ];
    partials.forEach(([mult, peak], i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq * mult, t);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(peak, t + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0006, t + 1.5 - i * 0.15);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 1.6);
    });
  };

  strike(ctx.currentTime, 660);
  strike(ctx.currentTime + 0.5, 660);
  return ctx;
}
