// A paid seva booking holds its seats this long while the devotee pays
// online. Unpaid after that, it's cancelled and the seats are released.
export const PAYMENT_HOLD_MS = 20 * 60_000;
export const PAYMENT_HOLD_MINUTES = PAYMENT_HOLD_MS / 60_000;
