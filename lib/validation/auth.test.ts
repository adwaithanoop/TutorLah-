import { isNusEmail, nusEmailSchema } from "./auth";

describe("nusEmailSchema", () => {
  test("accepts an NUS email and normalises case + whitespace", () => {
    const result = nusEmailSchema.safeParse("  E1234567@U.NUS.EDU ");
    expect(result.success).toBe(true);
    expect(result.success && result.data).toBe("e1234567@u.nus.edu");
  });

  test("rejects non-NUS domains", () => {
    for (const email of ["a@gmail.com", "a@nus.edu", "a@u.nus.edu.evil.com", "a@students.nus.edu"]) {
      expect(nusEmailSchema.safeParse(email).success).toBe(false);
    }
  });
});

describe("isNusEmail", () => {
  test("is true only for @u.nus.edu addresses", () => {
    expect(isNusEmail("e1234567@u.nus.edu")).toBe(true);
    expect(isNusEmail("E1234567@U.NUS.EDU")).toBe(true);
  });

  test("is false for nullish or foreign domains", () => {
    expect(isNusEmail(null)).toBe(false);
    expect(isNusEmail(undefined)).toBe(false);
    expect(isNusEmail("hacker@gmail.com")).toBe(false);
  });
});
