import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/user";
import { getAffordability } from "@/lib/booking/availability";
import RequestsDashboard, {
  type RequestView,
  type OfferView,
} from "@/app/components/booking/RequestsDashboard";

export default async function RequestsPage() {
  const supabase = await createClient();
  const user = await getCurrentUser(supabase);

  const nowIso = new Date().toISOString();
  const [{ data: reqRows }, { data: offerRows }, affordability] = await Promise.all([
    supabase
      .from("booking_requests")
      .select("id, module_code, tutor_id, scheduled_start, scheduled_end, amount, status, expires_at")
      .eq("student_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(60),
    supabase
      .from("counter_offers")
      .select("id, module_code, tutor_id, amount, expires_at")
      .eq("student_id", user!.id)
      .eq("status", "pending")
      .gt("expires_at", nowIso),
    getAffordability(supabase, user!.id),
  ]);

  const tutorIds = [
    ...new Set([...(reqRows ?? []).map((r) => r.tutor_id), ...(offerRows ?? []).map((o) => o.tutor_id)]),
  ];
  const offerIds = (offerRows ?? []).map((o) => o.id);

  const [{ data: profiles }, { data: slotRows }] = await Promise.all([
    tutorIds.length
      ? supabase.from("profiles").select("id, full_name").in("id", tutorIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string }[] }),
    offerIds.length
      ? supabase
          .from("counter_offer_slots")
          .select("offer_id, scheduled_start, scheduled_end")
          .in("offer_id", offerIds)
      : Promise.resolve({ data: [] as { offer_id: string; scheduled_start: string; scheduled_end: string }[] }),
  ]);

  const nameOf = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

  const requests: RequestView[] = (reqRows ?? []).map((r) => ({
    id: r.id,
    moduleCode: r.module_code,
    tutorName: nameOf.get(r.tutor_id) ?? "Tutor",
    start: r.scheduled_start,
    end: r.scheduled_end,
    amount: Number(r.amount),
    status: r.status,
    expiresAt: r.expires_at,
  }));

  const offers: OfferView[] = (offerRows ?? []).map((o) => ({
    id: o.id,
    moduleCode: o.module_code,
    tutorName: nameOf.get(o.tutor_id) ?? "Tutor",
    amount: Number(o.amount),
    expiresAt: o.expires_at,
    slots: (slotRows ?? [])
      .filter((s) => s.offer_id === o.id)
      .map((s) => ({ start: s.scheduled_start, end: s.scheduled_end })),
  }));

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Your requests</h1>
        <Link href="/bookings" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
          Confirmed bookings
        </Link>
      </div>
      <RequestsDashboard
        userId={user!.id}
        requests={requests}
        offers={offers}
        affordability={affordability}
      />
    </main>
  );
}
