// Splitting a seva's fixed daily ticket total across its time slots.
// Slot counts always add up to the total: changing one slot re-balances
// the slots the admin hasn't set by hand.

export type SplitSlot = { capacity: number; locked: boolean };

/** `total` shared as evenly as possible over `n` parts (earlier parts get the remainder). */
export function evenSplit(total: number, n: number): number[] {
  if (n <= 0) return [];
  const base = Math.floor(total / n);
  return Array.from({ length: n }, (_, i) => base + (i < total % n ? 1 : 0));
}

/** Evenly split `total` across every slot and clear manual locks. */
export function splitEvenly<T extends SplitSlot>(slots: T[], total: number): T[] {
  const parts = evenSplit(total, slots.length);
  return slots.map((s, i) => ({ ...s, capacity: parts[i], locked: false }));
}

/**
 * Re-balance after the total changes or a slot is added/removed: slots the
 * admin set by hand keep their count when they still fit, the rest share
 * what's left. Falls back to an even split when the locked counts don't fit.
 */
export function rebalance<T extends SplitSlot>(slots: T[], total: number): T[] {
  const locked = slots.filter((s) => s.locked);
  const free = slots.length - locked.length;
  const lockedSum = locked.reduce((sum, s) => sum + s.capacity, 0);
  const remaining = total - lockedSum;
  if (free === 0 ? remaining !== 0 : remaining < free) return splitEvenly(slots, total);
  const parts = evenSplit(remaining, free);
  let k = 0;
  return slots.map((s) => (s.locked ? s : { ...s, capacity: parts[k++] }));
}

/**
 * The admin typed `value` into slot `index`: pin it (within what's possible
 * while every other slot keeps at least 1) and share the rest among the
 * other unpinned slots. If no other slot is free to absorb the change, the
 * others are unpinned so the edit can still balance.
 */
export function setSlotCount<T extends SplitSlot>(slots: T[], index: number, value: number, total: number): T[] {
  if (slots.length === 1) return [{ ...slots[0], capacity: total, locked: false }];

  let others = slots.map((s, i) => (i === index ? null : s));
  const lockedOthers = () => others.filter((s): s is T => !!s && s.locked);
  const freeOthers = () => others.filter((s): s is T => !!s && !s.locked);

  const max = () => total - lockedOthers().reduce((sum, s) => sum + s.capacity, 0) - freeOthers().length;
  if (freeOthers().length === 0 || max() < 1) {
    others = others.map((s) => (s ? { ...s, locked: false } : s));
  }

  const capacity = Math.min(Math.max(1, Math.floor(value) || 1), max());
  const next = others.map((s) => s ?? { ...slots[index], capacity, locked: true }) as T[];
  return rebalance(next, total);
}
