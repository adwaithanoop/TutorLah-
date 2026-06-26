import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { ReliabilityScore, type Grade } from "@/lib/scoring/reliability";
import { rankBids } from "./ranking";

type Client = SupabaseClient<Database>;

export interface DashboardBid {
  id: string;
  amount: number;
  status: string;
  tutorName: string;
  reliabilityScore: number;
  value: number;
}

export interface MyRequest {
  id: string;
  module_code: string;
  description: string;
  status: string;
  durationMinutes: number;
  expiresAt: string;
  bids: DashboardBid[];
}

export interface MyBid {
  amount: number;
  status: string;
}

export interface OpenRequest {
  id: string;
  module_code: string;
  description: string;
  durationMinutes: number;
  expiresAt: string;
  studentName: string;
  studentInfo: string | null;
  myBid: MyBid | null;
}

export interface SosDashboard {
  myRequests: MyRequest[];
  openForMe: OpenRequest[];
  myVerifiedModules: string[];
  receivingSos: boolean;
}

interface RawBid {
  id: string;
  amount: number;
  status: string;
  tutor_id: string;
  tutor: { full_name: string; avg_rating: number; rating_count: number; sessions_completed: number; sessions_booked: number } | null;
}

interface RawRequest {
  id: string;
  module_code: string;
  description: string;
  status: string;
  duration_minutes: number;
  expires_at: string;
  sos_bids: RawBid[];
}

interface RawOpenRequest {
  id: string;
  module_code: string;
  description: string;
  duration_minutes: number;
  expires_at: string;
  student_id: string;
  student: { full_name: string; faculty: string | null; year: string | null } | null;
}

export async function loadSosDashboard(
  supabase: Client,
  userId: string,
  now: Date = new Date(),
): Promise<SosDashboard> {
  const [{ data: vmods }, { data: prof }] = await Promise.all([
    supabase.from("tutor_modules").select("module_code").eq("tutor_id", userId).eq("is_verified", true),
    supabase.from("profiles").select("is_active, receiving_sos").eq("id", userId).maybeSingle(),
  ]);
  const myVerifiedModules = (vmods ?? []).map((m) => m.module_code);
  const receivingSos = (prof?.is_active ?? false) && (prof?.receiving_sos ?? false);

  const { data: rawMine } = await supabase
    .from("sos_requests")
    .select(
      "id, module_code, description, status, duration_minutes, expires_at, sos_bids(id, amount, status, tutor_id, tutor:profiles!sos_bids_tutor_id_fkey(full_name, avg_rating, rating_count, sessions_completed, sessions_booked))",
    )
    .eq("student_id", userId)
    .order("created_at", { ascending: false });
  const mine = (rawMine as RawRequest[] | null) ?? [];

  const bidderModules = await loadBidderModules(supabase, mine);

  const myRequests: MyRequest[] = mine.map((req) => {
    const scored = req.sos_bids.map((bid) => {
      const tm = bidderModules.get(`${bid.tutor_id}|${req.module_code}`);
      const reliabilityScore = tm
        ? new ReliabilityScore(
            {
              averageRating: bid.tutor?.avg_rating ?? 0,
              ratingCount: bid.tutor?.rating_count ?? 0,
              sessionsCompleted: bid.tutor?.sessions_completed ?? 0,
              sessionsBooked: bid.tutor?.sessions_booked ?? 0,
              isVerified: tm.is_verified,
              grade: tm.grade,
              moduleCompletedAt: new Date(tm.completed_at),
            },
            now,
          ).value
        : 0;
      return { bid, reliabilityScore };
    });

    const ranked = rankBids(scored.map((s) => ({ id: s.bid.id, amount: Number(s.bid.amount), reliabilityScore: s.reliabilityScore })));
    const byId = new Map(scored.map((s) => [s.bid.id, s]));

    return {
      id: req.id,
      module_code: req.module_code,
      description: req.description,
      status: req.status,
      durationMinutes: req.duration_minutes,
      expiresAt: req.expires_at,
      bids: ranked.map((r) => {
        const s = byId.get(r.id)!;
        return {
          id: r.id,
          amount: Number(s.bid.amount),
          status: s.bid.status,
          tutorName: s.bid.tutor?.full_name ?? "Tutor",
          reliabilityScore: s.reliabilityScore,
          value: r.value,
        };
      }),
    };
  });

  const openForMe: OpenRequest[] =
    !receivingSos || myVerifiedModules.length === 0
      ? []
      : await loadOpenForMe(supabase, userId, myVerifiedModules, now);

  return { myRequests, openForMe, myVerifiedModules, receivingSos };
}

async function loadBidderModules(supabase: Client, mine: RawRequest[]) {
  const tutorIds = [...new Set(mine.flatMap((r) => r.sos_bids.map((b) => b.tutor_id)))];
  const moduleCodes = [...new Set(mine.map((r) => r.module_code))];
  const map = new Map<string, { grade: Grade; completed_at: string; is_verified: boolean }>();
  if (tutorIds.length === 0) return map;

  const { data } = await supabase
    .from("verified_tutor_modules")
    .select("tutor_id, module_code, grade, completed_at, is_verified")
    .in("tutor_id", tutorIds)
    .in("module_code", moduleCodes)
    .returns<
      { tutor_id: string; module_code: string; grade: Grade; completed_at: string; is_verified: boolean }[]
    >();

  for (const row of data ?? []) {
    map.set(`${row.tutor_id}|${row.module_code}`, {
      grade: row.grade,
      completed_at: row.completed_at,
      is_verified: row.is_verified,
    });
  }
  return map;
}

async function loadOpenForMe(
  supabase: Client,
  userId: string,
  modules: string[],
  now: Date,
): Promise<OpenRequest[]> {
  const { data } = await supabase
    .from("sos_requests")
    .select(
      "id, module_code, description, duration_minutes, expires_at, student_id, student:profiles!sos_requests_student_id_fkey(full_name, faculty, year)",
    )
    .eq("status", "open")
    .gt("expires_at", now.toISOString())
    .in("module_code", modules)
    .order("created_at", { ascending: false });
  const open = ((data as RawOpenRequest[] | null) ?? []).filter((r) => r.student_id !== userId);
  if (open.length === 0) return [];

  const { data: bids } = await supabase
    .from("sos_bids")
    .select("request_id, amount, status")
    .eq("tutor_id", userId)
    .in(
      "request_id",
      open.map((r) => r.id),
    );
  const myBidByRequest = new Map(
    (bids ?? []).map((b) => [b.request_id, { amount: Number(b.amount), status: b.status as string }]),
  );

  return open.map((r) => {
    const studentInfo = [r.student?.year, r.student?.faculty].filter(Boolean).join(", ");
    return {
      id: r.id,
      module_code: r.module_code,
      description: r.description,
      durationMinutes: r.duration_minutes,
      expiresAt: r.expires_at,
      studentName: r.student?.full_name ?? "Student",
      studentInfo: studentInfo || null,
      myBid: myBidByRequest.get(r.id) ?? null,
    };
  });
}
