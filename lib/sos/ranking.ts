export interface Bid {
  id: string;
  rate: number;
  reliabilityScore: number;
}

export interface RankedBid extends Bid {
  value: number;
}

export const RANKING_WEIGHTS = {
  reliability: 0.6,
  price: 0.4,
} as const;

export function rankBids(bids: Bid[]): RankedBid[] {
  if (bids.length === 0) return [];

  for (const bid of bids) {
    if (bid.rate <= 0) {
      throw new RangeError(`rate must be positive, got ${bid.rate}`);
    }
    if (bid.reliabilityScore < 0 || bid.reliabilityScore > 100) {
      throw new RangeError(
        `reliabilityScore must be within 0..100, got ${bid.reliabilityScore}`,
      );
    }
  }

  const rates = bids.map((b) => b.rate);
  const minRate = Math.min(...rates);
  const maxRate = Math.max(...rates);
  const span = maxRate - minRate;

  const ranked: RankedBid[] = bids.map((bid) => {
    const relNorm = bid.reliabilityScore / 100;
    const priceNorm = span === 0 ? 1 : (maxRate - bid.rate) / span;
    const value = clamp01(
      RANKING_WEIGHTS.reliability * relNorm + RANKING_WEIGHTS.price * priceNorm,
    );
    return { ...bid, value };
  });

  return ranked.sort((a, b) => {
    if (b.value !== a.value) return b.value - a.value;
    if (a.rate !== b.rate) return a.rate - b.rate;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
}

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}
