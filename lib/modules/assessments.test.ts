import { getAssessments, assessmentRank, GENERIC_ASSESSMENTS } from "./assessments";

describe("getAssessments", () => {
  test("returns the curated list for a known module", () => {
    expect(getAssessments("CS1101S")).toEqual([
      "Reading Assessment 1",
      "Midterms",
      "Practical Assessment",
      "Reading Assessment 2",
      "Finals",
    ]);
  });

  test("is case-insensitive on the module code", () => {
    expect(getAssessments("cs2030s")).toContain("Practical Examination 1");
  });

  test("falls back to the generic list for an unknown module", () => {
    expect(getAssessments("ZZ9999")).toEqual([...GENERIC_ASSESSMENTS]);
  });
});

describe("assessmentRank", () => {
  test("orders by position in the curated list", () => {
    expect(assessmentRank("CS1101S", "Midterms")).toBeLessThan(assessmentRank("CS1101S", "Finals"));
  });

  test("sorts unknown labels last", () => {
    expect(assessmentRank("CS1101S", "Mystery test")).toBe(5);
  });
});
