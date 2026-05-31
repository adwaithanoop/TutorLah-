import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ReviewForm from "@/app/components/review/ReviewForm";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default async function NewReviewPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const bookingId = first(params.booking);

  const supabase = await createClient();
  const { data: booking } = bookingId
    ? await supabase
        .from("bookings")
        .select("id, module_code, tutor:profiles!bookings_tutor_id_fkey(full_name)")
        .eq("id", bookingId)
        .maybeSingle()
    : { data: null };

  if (!bookingId || !booking) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center text-gray-500">
          Open a completed session from{" "}
          <Link href="/bookings" className="font-semibold text-indigo-600">
            your bookings
          </Link>{" "}
          to review it.
        </p>
      </main>
    );
  }

  const tutor = Array.isArray(booking.tutor) ? booking.tutor[0] : booking.tutor;

  return (
    <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-1 text-3xl font-bold text-gray-900">Rate your session</h1>
      <p className="mb-6 text-gray-500">
        <span className="font-mono font-semibold text-indigo-600">{booking.module_code}</span>
        {tutor?.full_name && ` with ${tutor.full_name}`}
      </p>
      <ReviewForm bookingId={booking.id} />
    </main>
  );
}
