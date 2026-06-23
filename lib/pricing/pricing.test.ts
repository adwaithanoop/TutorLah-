import { FixedPricing, GroupPricing } from "./pricing";

describe("FixedPricing", () => {
  test("multiplies the hourly rate by the number of hours", () => {
    expect(new FixedPricing(40, 1.5).quote()).toBe(60);
  });

  test("rounds the quote to two decimals", () => {
    expect(new FixedPricing(33.333, 1).quote()).toBe(33.33);
  });

  test("rejects a non-positive rate", () => {
    expect(() => new FixedPricing(0, 1)).toThrow();
    expect(() => new FixedPricing(-10, 1)).toThrow();
  });

  test("rejects non-positive hours", () => {
    expect(() => new FixedPricing(40, 0)).toThrow();
    expect(() => new FixedPricing(40, -1)).toThrow();
  });
});

describe("GroupPricing", () => {
  test("splits the total cost across participants", () => {
    expect(new GroupPricing(120, 4, 10).quote()).toBe(30);
  });

  test("per-student price falls as participants grow", () => {
    expect(new GroupPricing(120, 2, 5).quote()).toBe(60);
    expect(new GroupPricing(120, 4, 5).quote()).toBe(30);
    expect(new GroupPricing(120, 6, 5).quote()).toBe(20);
  });

  test("never drops below the per-student floor", () => {
    expect(new GroupPricing(120, 100, 15).quote()).toBe(15);
  });

  test("rounds the split to two decimals", () => {
    expect(new GroupPricing(100, 3, 5).quote()).toBe(33.33);
  });

  test("rejects a non-positive total cost", () => {
    expect(() => new GroupPricing(0, 4, 10)).toThrow();
    expect(() => new GroupPricing(-1, 4, 10)).toThrow();
  });

  test("rejects fewer than one participant", () => {
    expect(() => new GroupPricing(120, 0, 10)).toThrow();
  });

  test("rejects a negative floor", () => {
    expect(() => new GroupPricing(120, 4, -1)).toThrow();
  });
});
