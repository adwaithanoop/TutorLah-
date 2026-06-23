import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/user";
import { getBalance } from "@/lib/wallet/service";
import { creditTopupBySession } from "@/lib/payments/topups";
import { moduleCodeSchema } from "@/lib/validation/search";
import BookingCheckout, { type CheckoutDraft } from "@/app/components/booking/BookingCheckout";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default async function NewBookingPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const tutorId = first(params.tutor);
  const moduleParsed = moduleCodeSchema.safeParse(first(params.module) ?? "");

  // After a top-up redirect the booking in progress comes back in the URL so the
  // user lands straight on the review step instead of refilling the form.
  const resume = first(params.resume) === "1";
  const draft: CheckoutDraft | undefined = resume
    ? {
        step: "review",
        date: first(params.date) ?? "",
        startTime: first(params.startTime) ?? "",
        endTime: first(params.endTime) ?? "",
      }
    : undefined;
  const topupRaw = first(params.topup);
  const topupResult = topupRaw === "success" || topupRaw === "cancelled" ? topupRaw : null;

  // Returning from a top-up done mid-checkout: credit before reading the balance so the
  // student can pay immediately, without waiting on the webhook.
  const sessionId = first(params.session_id);
  if (sessionId) await creditTopupBySession(sessionId);

  const supabase = await createClient();
  const [user, { data: tutor }] = await Promise.all([
    getCurrentUser(supabase),
    tutorId
      ? supabase.from("profiles").select("full_name, rate_per_hour").eq("id", tutorId).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  const balance = user ? await getBalance(supabase, user.id) : 0;

  if (!tutorId || !tutor || !moduleParsed.success) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center text-gray-500">
          Pick a tutor and module from{" "}
          <Link href="/dashboard" className="font-semibold text-indigo-600">
            search
          </Link>{" "}
          to book a session.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-3xl font-bold text-gray-900">Book a session</h1>
      <BookingCheckout
        tutorId={tutorId}
        tutorName={tutor.full_name}
        moduleCode={moduleParsed.data}
        defaultRate={Number(tutor.rate_per_hour)}
        balance={balance}
        initial={draft}
        topupResult={topupResult}
      />
    </main>
  );
}
