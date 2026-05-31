import { ReliabilityScore, MS_PER_YEAR, type Grade, type ReliabilityInput } from "./reliability";

const NOW = new Date("2026-01-01T00:00:00Z");
const yearsAgo = (y: number) => new Date(NOW.getTime() - y * MS_PER_YEAR);
const score = (input: ReliabilityInput) => new ReliabilityScore(input, NOW).value;

const ISO_BASE: ReliabilityInput = {
  averageRating: 1,
  ratingCount: 1,
  sessionsCompleted: 0,
  sessionsBooked: 1,
  isVerified: false,
  grade: "A+",
  moduleCompletedAt: yearsAgo(4),
};

describe("ReliabilityScore", () => {
  test("perfect tutor scores 100.0", () => {
    expect(
      score({
        averageRating: 5,
        ratingCount: 50,
        sessionsCompleted: 50,
        sessionsBooked: 50,
        isVerified: true,
        grade: "A+",
        moduleCompletedAt: NOW,
      }),
    ).toBe(100.0);
  });

  test("verification adds its full 20-point weight when the queried module is verified", () => {
    expect(score({ ...ISO_BASE, isVerified: false })).toBe(15.0);
    expect(score({ ...ISO_BASE, isVerified: true })).toBe(35.0);
  });

  test("grade for the queried module maps to its point value", () => {
    const cases: Array<[Grade, number]> = [
      ["A+", 15.0],
      ["A-", 12.0],
      ["C", 4.5],
    ];
    for (const [grade, expected] of cases) {
      expect(score({ ...ISO_BASE, grade })).toBe(expected);
    }
  });

  test("module recency decays linearly over four years", () => {
    expect(score({ ...ISO_BASE, moduleCompletedAt: NOW })).toBe(25.0);
    expect(score({ ...ISO_BASE, moduleCompletedAt: yearsAgo(2) })).toBe(20.0);
    expect(score({ ...ISO_BASE, moduleCompletedAt: yearsAgo(4) })).toBe(15.0);
    expect(score({ ...ISO_BASE, moduleCompletedAt: yearsAgo(10) })).toBe(15.0);
  });

  test("a module completed in the future is treated as fully recent", () => {
    expect(score({ ...ISO_BASE, moduleCompletedAt: yearsAgo(-1) })).toBe(25.0);
  });

  test("completion rate is clamped to 1 when completed exceeds booked", () => {
    expect(score({ ...ISO_BASE, sessionsCompleted: 5, sessionsBooked: 3 })).toBe(40.0);
  });

  test("a tutor new to sessions falls back to neutral satisfaction and completion", () => {
    expect(
      score({
        averageRating: 0,
        ratingCount: 0,
        sessionsCompleted: 0,
        sessionsBooked: 0,
        isVerified: true,
        grade: "A+",
        moduleCompletedAt: NOW,
      }),
    ).toBe(72.5);
  });

  test("the result is rounded to one decimal place", () => {
    expect(score({ ...ISO_BASE, sessionsCompleted: 1, sessionsBooked: 3 })).toBe(23.3);
  });
});
