import { searchTutors } from "./search";
import { ReliabilityScore, type Grade } from "@/lib/scoring/reliability";

const NOW = new Date("2026-01-01T00:00:00Z");

interface Row {
  tutor_id: string;
  grade: Grade;
  completed_at: string;
  is_verified: boolean;
  full_name: string;
  year: string | null;
  faculty: string | null;
  avatar_color: string;
  rate_per_hour: number;
  is_active: boolean;
  avg_rating: number;
  rating_count: number;
  sessions_completed: number;
  sessions_booked: number;
}

const row = (over: Partial<Row> = {}): Row => ({
  tutor_id: "id-1",
  grade: "A",
  completed_at: "2025-01-01",
  is_verified: true,
  full_name: "Test User",
  year: "Year 2",
  faculty: "Computing",
  avatar_color: "bg-indigo-500",
  rate_per_hour: 30,
  is_active: true,
  avg_rating: 4.5,
  rating_count: 10,
  sessions_completed: 10,
  sessions_booked: 10,
  ...over,
});

function mockClient(rows: Row[], error: { message: string } | null = null) {
  const eqCalls: Array<[string, unknown]> = [];
  const fromCalls: string[] = [];
  const builder = {
    select: () => builder,
    eq: (column: string, value: unknown) => {
      eqCalls.push([column, value]);
      return builder;
    },
    returns: () => Promise.resolve({ data: rows, error }),
  };
  const client = { from: (table: string) => (fromCalls.push(table), builder), eqCalls, fromCalls };
  return client as unknown as Parameters<typeof searchTutors>[0] & {
    eqCalls: typeof eqCalls;
    fromCalls: typeof fromCalls;
  };
}

describe("searchTutors", () => {
  test("reads the verified read model and filters by module code", async () => {
    const client = mockClient([row()]);
    await searchTutors(client, "CS2040S", NOW);
    expect(client.fromCalls).toContain("verified_tutor_modules");
    expect(client.eqCalls).toContainEqual(["module_code", "CS2040S"]);
  });

  test("ranks by reliability score, highest first", async () => {
    const strong = row({
      tutor_id: "aiden",
      grade: "A+",
      completed_at: "2025-12-01",
      full_name: "Aiden Tan",
      avg_rating: 4.9,
      rating_count: 42,
      sessions_completed: 47,
      sessions_booked: 49,
    });
    const weak = row({
      tutor_id: "marcus",
      grade: "A",
      completed_at: "2023-12-01",
      full_name: "Marcus Lim",
      avg_rating: 4.6,
      rating_count: 20,
      sessions_completed: 23,
      sessions_booked: 27,
    });
    const result = await searchTutors(mockClient([weak, strong]), "CS2040S", NOW);
    expect(result.map((t) => t.id)).toEqual(["aiden", "marcus"]);
    expect(result[0].reliabilityScore).toBeGreaterThan(result[1].reliabilityScore);
  });

  test("maps the DB row into ReliabilityInput correctly", async () => {
    const expected = new ReliabilityScore(
      {
        averageRating: 4.9,
        ratingCount: 42,
        sessionsCompleted: 47,
        sessionsBooked: 49,
        isVerified: true,
        grade: "A+",
        moduleCompletedAt: new Date("2025-12-01"),
      },
      NOW,
    ).value;

    const [tutor] = await searchTutors(
      mockClient([
        row({
          tutor_id: "aiden",
          grade: "A+",
          completed_at: "2025-12-01",
          full_name: "Aiden Tan",
          avg_rating: 4.9,
          rating_count: 42,
          sessions_completed: 47,
          sessions_booked: 49,
        }),
      ]),
      "CS2040S",
      NOW,
    );
    expect(tutor.reliabilityScore).toBe(expected);
    expect(tutor.initials).toBe("AT");
    expect(tutor.ratePerHour).toBe(30);
    expect(tutor.grade).toBe("A+");
  });

  test("throws when the query errors", async () => {
    await expect(searchTutors(mockClient([], { message: "db down" }), "CS2040S", NOW)).rejects.toEqual({
      message: "db down",
    });
  });
});
