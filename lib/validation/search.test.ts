import { moduleCodeSchema } from "./search";

describe("moduleCodeSchema", () => {
  test("accepts valid module codes and upper-cases them", () => {
    expect(moduleCodeSchema.parse("cs2040s")).toBe("CS2040S");
    expect(moduleCodeSchema.parse(" ma1521 ")).toBe("MA1521");
    expect(moduleCodeSchema.parse("GEA1000")).toBe("GEA1000");
  });

  test("rejects malformed codes", () => {
    for (const code of ["", "CS", "1234", "CS204", "TOOLONG1234", "CS2040SS"]) {
      expect(moduleCodeSchema.safeParse(code).success).toBe(false);
    }
  });
});
