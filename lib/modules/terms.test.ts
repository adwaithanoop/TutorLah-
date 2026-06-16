import { recentTerms, formatTerm, termCompletedDate } from "./terms";

describe("termCompletedDate", () => {
  test("sem 1 completes in December of the start year", () => {
    expect(termCompletedDate(2025, 1)).toBe("2025-12-01");
  });

  test("sem 2 completes in May of the following year", () => {
    expect(termCompletedDate(2025, 2)).toBe("2026-05-01");
  });
});

describe("formatTerm", () => {
  test("maps December dates to Sem 1", () => {
    expect(formatTerm("2025-12-01")).toBe("25/26 Sem 1");
  });

  test("maps May dates to Sem 2 of the prior start year", () => {
    expect(formatTerm("2025-05-01")).toBe("24/25 Sem 2");
  });

  test("round-trips with termCompletedDate", () => {
    expect(formatTerm(termCompletedDate(2024, 2))).toBe("24/25 Sem 2");
    expect(formatTerm(termCompletedDate(2023, 1))).toBe("23/24 Sem 1");
  });

  test("falls back to the raw value for an unparseable date", () => {
    expect(formatTerm("not-a-date")).toBe("not-a-date");
  });
});

describe("recentTerms", () => {
  const now = new Date("2026-06-17T00:00:00Z");

  test("lists the most recent completed term first", () => {
    expect(recentTerms(now)[0]).toEqual({ label: "25/26 Sem 2", value: "2026-05-01" });
  });

  test("excludes terms that have not finished yet", () => {
    expect(recentTerms(now).some((t) => t.value > "2026-06-17")).toBe(false);
  });
});
