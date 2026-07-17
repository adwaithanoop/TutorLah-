export type Grade = "A+" | "A" | "A-" | "B+" | "B" | "B-" | "C+" | "C";

export interface ReliabilityInput {
  averageRating: number;
  ratingCount: number;
  sessionsCompleted: number;
  sessionsBooked: number;
  isVerified: boolean;
  grade: Grade;
  moduleCompletedAt: Date;
}

export const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;

export type ScoreComponentKey = "satisfaction" | "completion" | "verification" | "grade" | "recency";

export interface ScoreBreakdownEntry {
  key: ScoreComponentKey;
  earned: number;
  max: number;
}

export class ReliabilityScore {
  private static readonly WEIGHTS = {
    satisfaction: 0.3,
    completion: 0.25,
    verification: 0.2,
    grade: 0.15,
    recency: 0.1,
  } as const;

  private static readonly GRADE_POINTS: Record<Grade, number> = {
    "A+": 1.0,
    A: 0.9,
    "A-": 0.8,
    "B+": 0.7,
    B: 0.6,
    "B-": 0.5,
    "C+": 0.4,
    C: 0.3,
  };

  private static readonly RECENCY_HORIZON_YEARS = 4;

  constructor(
    private readonly input: ReliabilityInput,
    private readonly now: Date,
  ) {}

  get value(): number {
    const w = ReliabilityScore.WEIGHTS;
    const weighted =
      w.satisfaction * this.satisfaction +
      w.completion * this.completion +
      w.verification * this.verification +
      w.grade * this.grade +
      w.recency * this.recency;
    return Math.round(weighted * 1000) / 10;
  }

  // per factor points, same rounding as value, so the UI can show how the
  // composite is built up
  get breakdown(): ScoreBreakdownEntry[] {
    const w = ReliabilityScore.WEIGHTS;
    const parts: Record<ScoreComponentKey, number> = {
      satisfaction: this.satisfaction,
      completion: this.completion,
      verification: this.verification,
      grade: this.grade,
      recency: this.recency,
    };
    return (Object.keys(w) as ScoreComponentKey[]).map((key) => ({
      key,
      earned: Math.round(w[key] * parts[key] * 1000) / 10,
      max: w[key] * 100,
    }));
  }

  private get satisfaction(): number {
    const { averageRating, ratingCount } = this.input;
    return ratingCount === 0 ? 0.5 : (averageRating - 1) / 4;
  }

  private get completion(): number {
    const { sessionsCompleted, sessionsBooked } = this.input;
    if (sessionsBooked === 0) return 0.5;
    return ReliabilityScore.clamp01(sessionsCompleted / sessionsBooked);
  }

  private get verification(): number {
    return this.input.isVerified ? 1 : 0;
  }

  private get grade(): number {
    return ReliabilityScore.GRADE_POINTS[this.input.grade];
  }

  private get recency(): number {
    const yearsSince =
      (this.now.getTime() - this.input.moduleCompletedAt.getTime()) / MS_PER_YEAR;
    return ReliabilityScore.clamp01(1 - yearsSince / ReliabilityScore.RECENCY_HORIZON_YEARS);
  }

  private static clamp01(n: number): number {
    return Math.min(1, Math.max(0, n));
  }
}
