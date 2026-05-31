import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ReportForm from "@/app/components/report/ReportForm";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default async function NewReportPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const bookingId = first(params.booking);

  const supabase = await createClient();
  const { data: booking } = bookingId
    ? await supabase
        .from("bookings")
        .select("id, module_code, student:profiles!bookings_student_id_fkey(full_name)")
        .eq("id", bookingId)
        .maybeSingle()
    : { data: null };

  if (!bookingId || !booking) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center text-gray-500">
          Open a session from{" "}
          <Link href="/bookings" className="font-semibold text-indigo-600">
            your bookings
          </Link>{" "}
          to submit its report.
        </p>
      </main>
    );
  }

  const student = Array.isArray(booking.student) ? booking.student[0] : booking.student;

  return (
    <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-1 text-3xl font-bold text-gray-900">Session report</h1>
      <p className="mb-6 text-gray-500">
        <span className="font-mono font-semibold text-indigo-600">{booking.module_code}</span>
        {student?.full_name && ` · ${student.full_name}`} and a report is required before releasing payment.
      </p>
      <ReportForm bookingId={booking.id} />
    </main>
  );
}
