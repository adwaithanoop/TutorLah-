import { searchTutors } from "./search";
import { ReliabilityScore, type Grade } from "@/lib/scoring/reliability";

const NOW = new Date("2026-01-01T00:00:00Z");

interface Profile {
  id: string;
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

interface Row {
  grade: Grade;
  completed_at: string;
  is_verified: boolean;
  profiles: Profile | null;
}

const profile = (over: Partial<Profile> = {}): Profile => ({
  id: "id-1",
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
  const builder = {
    select: () => builder,
    eq: (column: string, value: unknown) => {
      eqCalls.push([column, value]);
      return builder;
    },
    returns: () => Promise.resolve({ data: rows, error }),
  };
  const client = { from: () => builder, eqCalls };
  return client as unknown as Parameters<typeof searchTutors>[0] & { eqCalls: typeof eqCalls };
}

describe("searchTutors", () => {
  test("filters by module code and verified status only", async () => {
    const client = mockClient([{ grade: "A", completed_at: "2025-01-01", is_verified: true, profiles: profile() }]);
    await searchTutors(client, "CS2040S", NOW);
    expect(client.eqCalls).toContainEqual(["module_code", "CS2040S"]);
    expect(client.eqCalls).toContainEqual(["is_verified", true]);
  });

  test("ranks by reliability score, highest first", async () => {
    const strong: Row = {
      grade: "A+",
      completed_at: "2025-12-01",
      is_verified: true,
      profiles: profile({ id: "aiden", full_name: "Aiden Tan", avg_rating: 4.9, rating_count: 42, sessions_completed: 47, sessions_booked: 49 }),
    };
    const weak: Row = {
      grade: "A",
      completed_at: "2023-12-01",
      is_verified: true,
      profiles: profile({ id: "marcus", full_name: "Marcus Lim", avg_rating: 4.6, rating_count: 20, sessions_completed: 23, sessions_booked: 27 }),
    };
    const result = await searchTutors(mockClient([weak, strong]), "CS2040S", NOW);
    expect(result.map((t) => t.id)).toEqual(["aiden", "marcus"]);
    expect(result[0].reliabilityScore).toBeGreaterThan(result[1].reliabilityScore);
  });

  test("maps the DB row into ReliabilityInput correctly", async () => {
    const row: Row = {
      grade: "A+",
      completed_at: "2025-12-01",
      is_verified: true,
      profiles: profile({ id: "aiden", full_name: "Aiden Tan", avg_rating: 4.9, rating_count: 42, sessions_completed: 47, sessions_booked: 49 }),
    };
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

    const [tutor] = await searchTutors(mockClient([row]), "CS2040S", NOW);
    expect(tutor.reliabilityScore).toBe(expected);
    expect(tutor.initials).toBe("AT");
    expect(tutor.ratePerHour).toBe(30);
    expect(tutor.grade).toBe("A+");
  });

  test("drops rows whose profile join is null", async () => {
    const result = await searchTutors(
      mockClient([{ grade: "A", completed_at: "2025-01-01", is_verified: true, profiles: null }]),
      "CS2040S",
      NOW,
    );
    expect(result).toEqual([]);
  });

  test("throws when the query errors", async () => {
    await expect(searchTutors(mockClient([], { message: "db down" }), "CS2040S", NOW)).rejects.toEqual({
      message: "db down",
    });
  });
});
