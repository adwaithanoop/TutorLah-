import { dollarsToCents, suggestTopUp } from "./money";

describe("dollarsToCents", () => {
  test("converts whole dollars", () => {
    expect(dollarsToCents(20)).toBe(2000);
  });

  test("rounds floating point cents cleanly", () => {
    expect(dollarsToCents(19.99)).toBe(1999);
    expect(dollarsToCents(0.1 + 0.2)).toBe(30);
  });
});

describe("suggestTopUp", () => {
  test("returns zero when the balance already covers the need", () => {
    expect(suggestTopUp(20, 20)).toBe(0);
    expect(suggestTopUp(20, 50)).toBe(0);
  });

  test("returns the exact shortfall when funds are short", () => {
    expect(suggestTopUp(50, 20)).toBe(30);
  });

  test("rounds a fractional shortfall up to the next cent", () => {
    expect(suggestTopUp(19.999, 0)).toBe(20);
    expect(suggestTopUp(10.005, 0)).toBe(10.01);
  });
});
