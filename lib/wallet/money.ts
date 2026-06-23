const CENTS_PER_DOLLAR = 100;

export function dollarsToCents(amount: number): number {
  return Math.round(amount * CENTS_PER_DOLLAR);
}

// When a booking costs more than the wallet holds, this is the smallest top-up that
// closes the gap, rounded up to a whole cent so the student is never left a fraction
// short after paying.
export function suggestTopUp(need: number, balance: number): number {
  const shortfall = need - balance;
  if (shortfall <= 0) return 0;
  return Math.ceil(shortfall * CENTS_PER_DOLLAR) / CENTS_PER_DOLLAR;
}
