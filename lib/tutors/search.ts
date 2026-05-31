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

interface TutorModuleRow {
  grade: Grade;
  completed_at: string;
  is_verified: boolean;
  profiles: {
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
  } | null;
}

const SELECT =
  "grade, completed_at, is_verified, profiles(id, full_name, year, faculty, avatar_color, rate_per_hour, is_active, avg_rating, rating_count, sessions_completed, sessions_booked)";

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
    .from("tutor_modules")
    .select(SELECT)
    .eq("module_code", moduleCode)
    .eq("is_verified", true)
    .returns<TutorModuleRow[]>();

  if (error) throw error;

  return (data ?? [])
    .filter((row) => row.profiles !== null)
    .map((row) => {
      const profile = row.profiles!;
      const reliabilityScore = new ReliabilityScore(
        {
          averageRating: profile.avg_rating,
          ratingCount: profile.rating_count,
          sessionsCompleted: profile.sessions_completed,
          sessionsBooked: profile.sessions_booked,
          isVerified: row.is_verified,
          grade: row.grade,
          moduleCompletedAt: new Date(row.completed_at),
        },
        now,
      ).value;

      return {
        id: profile.id,
        name: profile.full_name,
        initials: initials(profile.full_name),
        year: profile.year ?? "",
        faculty: profile.faculty ?? "",
        moduleCode,
        grade: row.grade,
        reliabilityScore,
        ratePerHour: Number(profile.rate_per_hour),
        isVerified: row.is_verified,
        isActive: profile.is_active,
        avatarColor: profile.avatar_color,
        reviewCount: profile.rating_count,
        sessionsCompleted: profile.sessions_completed,
      };
    })
    .sort((a, b) => b.reliabilityScore - a.reliabilityScore);
}
