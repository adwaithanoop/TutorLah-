import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { ReliabilityScore, type Grade } from "@/lib/scoring/reliability";

export interface RankedTutor {
  id: string;
  name: string;
  initials: string;
  year: string;
  faculty: string;
  moduleCode: string;
  grade: Grade;
  reliabilityScore: number;
  ratePerHour: number;
  isVerified: boolean;
  isActive: boolean;
  avatarColor: string;
  reviewCount: number;
  sessionsCompleted: number;
}

interface VerifiedModuleRow {
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

const SELECT =
  "tutor_id, grade, completed_at, is_verified, full_name, year, faculty, avatar_color, rate_per_hour, is_active, avg_rating, rating_count, sessions_completed, sessions_booked";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}

export async function searchTutors(
  supabase: SupabaseClient<Database>,
  moduleCode: string,
  now: Date = new Date(),
): Promise<RankedTutor[]> {
  const { data, error } = await supabase
    .from("verified_tutor_modules")
    .select(SELECT)
    .eq("module_code", moduleCode)
    .returns<VerifiedModuleRow[]>();

  if (error) throw error;

  return (data ?? [])
    .map((row) => {
      const reliabilityScore = new ReliabilityScore(
        {
          averageRating: row.avg_rating,
          ratingCount: row.rating_count,
          sessionsCompleted: row.sessions_completed,
          sessionsBooked: row.sessions_booked,
          isVerified: row.is_verified,
          grade: row.grade,
          moduleCompletedAt: new Date(row.completed_at),
        },
        now,
      ).value;

      return {
        id: row.tutor_id,
        name: row.full_name,
        initials: initials(row.full_name),
        year: row.year ?? "",
        faculty: row.faculty ?? "",
        moduleCode,
        grade: row.grade,
        reliabilityScore,
        ratePerHour: Number(row.rate_per_hour),
        isVerified: row.is_verified,
        isActive: row.is_active,
        avatarColor: row.avatar_color,
        reviewCount: row.rating_count,
        sessionsCompleted: row.sessions_completed,
      };
    })
    .sort((a, b) => b.reliabilityScore - a.reliabilityScore);
}
