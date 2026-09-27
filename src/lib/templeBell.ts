// A short, synthesized temple-bell chime (two soft strikes) built from sine
// oscillators — no external audio asset to license or host. Shared by the
// full-screen splash intro and anywhere else a bell needs to ring.
//
// Creation and scheduling are split because `new AudioContext()` starts
// `suspended` until a user gesture resumes it: scheduling strikes relative
// to a suspended context's (frozen) `currentTime` means they land in the
// past the moment it resumes, so nothing plays. Callers must only call
// `strikeBell` once `handle.ctx.state === "running"`.
export interface BellHandle {
  ctx: AudioContext;
  // Every oscillator routes through this instead of ctx.destination so a
  // caller that needs to stop mid-chime (see closeBellHandle) can ramp it
  // to silence first — closing an AudioContext directly cuts the waveform
  // wherever it happens to be, which is an audible click/pop.
  master: GainNode;
}

export function createBellContext(): BellHandle | null {
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioCtx) return null;
  const ctx = new AudioCtx();
  const master = ctx.createGain();
  master.connect(ctx.destination);
  return { ctx, master };
}

export function strikeBell({ ctx, master }: BellHandle): void {
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
      osc.connect(gain).connect(master);
      osc.start(t);
      osc.stop(t + 1.6);
    });
  };

  strike(ctx.currentTime, 660);
  strike(ctx.currentTime + 0.5, 660);
}

/** Fades to silence over ~30ms (avoiding a click) before closing the context. */
function closeBellHandle(handle: BellHandle): void {
  const { ctx, master } = handle;
  if (ctx.state === "closed") return;
  try {
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(0, now + 0.03);
  } catch {
    // ctx already unusable (e.g. mid-teardown) — closing below still applies.
  }
  setTimeout(() => {
    if (ctx.state !== "closed") ctx.close().catch(() => {});
  }, 40);
}

/**
 * Rings the bell once as soon as the browser allows it: immediately if the
 * context can start running on its own, otherwise on the page's first
 * pointerdown/keydown. Returns a cleanup function — call it on unmount.
 * It always fades out and closes this call's AudioContext, including
 * mid-chime: without that, a caller that unmounts and remounts quickly
 * (e.g. a client-side route change that re-triggers the ring, such as a
 * locale switch) would leave the previous chime still sounding, overlapping
 * the new ring and throwing it out of sync with the (single, fresh)
 * bell-swing animation.
 */
export function scheduleBellRing(onRing?: () => void): () => void {
  const handle = createBellContext();
  let struck = false;
  // Removing the pointerdown/keydown listeners in the returned cleanup only
  // stops a *future* gesture from triggering a ring. If a gesture already
  // fired (e.g. the very click that's cancelling this call), its
  // `resume().then(tryRing)` chain is already in flight as a microtask —
  // removing the listener can't stop that. This flag can: tryRing checks it
  // synchronously, so the cleanup can pre-empt a strike that's already
  // queued to happen a moment later.
  let cancelled = false;

  const tryRing = () => {
    if (cancelled || !handle || struck || handle.ctx.state !== "running") return;
    struck = true;
    strikeBell(handle);
    onRing?.();
  };

  tryRing();

  const onInteract = () => {
    if (cancelled || !handle || struck) return;
    if (handle.ctx.state === "suspended") {
      handle.ctx.resume().then(tryRing);
    } else {
      tryRing();
    }
  };
  window.addEventListener("pointerdown", onInteract, { once: true });
  window.addEventListener("keydown", onInteract, { once: true });

  return () => {
    cancelled = true;
    window.removeEventListener("pointerdown", onInteract);
    window.removeEventListener("keydown", onInteract);
    if (handle) closeBellHandle(handle);
  };
}

/**
 * Rings the bell right now, for a direct interaction (e.g. clicking a bell
 * image) that is itself already the user gesture browsers require —
 * unlike `scheduleBellRing`, it never waits for a *later* gesture. Closes
 * its own context a couple seconds after striking so repeated clicks don't
 * pile up unclosed AudioContexts (browsers cap how many a page can have).
 */
export function ringBellNow(onRing?: () => void): void {
  const handle = createBellContext();
  if (!handle) return;

  const fire = () => {
    strikeBell(handle);
    onRing?.();
    setTimeout(() => closeBellHandle(handle), 2200);
  };

  if (handle.ctx.state === "running") {
    fire();
  } else {
    handle.ctx.resume().then(fire).catch(() => {});
  }
}
