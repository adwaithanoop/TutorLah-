import { Bid, RANKING_WEIGHTS, rankBids } from "./ranking";

describe("rankBids", () => {
  it("returns an empty array for no bids", () => {
    expect(rankBids([])).toEqual([]);
  });

  it("ranks a single bid", () => {
    const result = rankBids([{ id: "a", amount: 40, reliabilityScore: 80 }]);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("a");
    expect(result[0].value).toBeCloseTo(0.6 * 0.8 + 0.4 * 1, 10);
  });

  it("ranks highest reliability and lowest total first", () => {
    const result = rankBids([
      { id: "a", amount: 60, reliabilityScore: 40 },
      { id: "b", amount: 30, reliabilityScore: 95 },
    ]);
    expect(result.map((b) => b.id)).toEqual(["b", "a"]);
  });

  it("matches the worked numeric example", () => {
    const result = rankBids([
      { id: "a", amount: 50, reliabilityScore: 90 },
      { id: "b", amount: 30, reliabilityScore: 70 },
    ]);
    expect(result.map((b) => b.id)).toEqual(["b", "a"]);
    const a = result.find((b) => b.id === "a");
    const b = result.find((x) => x.id === "b");
    expect(a?.value).toBeCloseTo(0.54, 10);
    expect(b?.value).toBeCloseTo(0.82, 10);
  });

  it("treats all-equal totals as priceNorm 1 for every bid", () => {
    const result = rankBids([
      { id: "a", amount: 50, reliabilityScore: 90 },
      { id: "b", amount: 50, reliabilityScore: 70 },
    ]);
    expect(result.map((b) => b.id)).toEqual(["a", "b"]);
    expect(result[0].value).toBeCloseTo(0.6 * 0.9 + 0.4, 10);
    expect(result[1].value).toBeCloseTo(0.6 * 0.7 + 0.4, 10);
  });

  it("tie-breaks by lower total then id ascending", () => {
    const result = rankBids([
      { id: "z", amount: 40, reliabilityScore: 50 },
      { id: "y", amount: 40, reliabilityScore: 50 },
      { id: "x", amount: 30, reliabilityScore: 30 },
    ]);
    expect(result.map((b) => b.id)).toEqual(["x", "y", "z"]);
  });

  it("rejects a non-positive total", () => {
    expect(() => rankBids([{ id: "a", amount: 0, reliabilityScore: 50 }])).toThrow(
      RangeError,
    );
    expect(() => rankBids([{ id: "a", amount: -1, reliabilityScore: 50 }])).toThrow(
      RangeError,
    );
  });

  it("rejects a reliability score outside 0..100", () => {
    expect(() =>
      rankBids([{ id: "a", amount: 10, reliabilityScore: -1 }]),
    ).toThrow(RangeError);
    expect(() =>
      rankBids([{ id: "a", amount: 10, reliabilityScore: 101 }]),
    ).toThrow(RangeError);
  });

  it("keeps every value within [0, 1]", () => {
    const result = rankBids([
      { id: "a", amount: 100, reliabilityScore: 100 },
      { id: "b", amount: 1, reliabilityScore: 0 },
      { id: "c", amount: 50, reliabilityScore: 50 },
    ]);
    for (const bid of result) {
      expect(bid.value).toBeGreaterThanOrEqual(0);
      expect(bid.value).toBeLessThanOrEqual(1);
    }
  });

  it("does not mutate the input array or its objects", () => {
    const input: Bid[] = [
      { id: "a", amount: 50, reliabilityScore: 90 },
      { id: "b", amount: 30, reliabilityScore: 70 },
    ];
    const snapshot = input.map((b) => ({ ...b }));
    const result = rankBids(input);
    expect(input).toEqual(snapshot);
    expect(result).not.toBe(input);
    expect(result[0]).not.toBe(input[0]);
  });

  it("exposes tunable weights", () => {
    expect(RANKING_WEIGHTS.reliability + RANKING_WEIGHTS.price).toBeCloseTo(1, 10);
  });
});
