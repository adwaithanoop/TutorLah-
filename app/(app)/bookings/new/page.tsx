import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { moduleCodeSchema } from "@/lib/validation/search";
import BookingForm from "@/app/components/booking/BookingForm";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default async function NewBookingPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const tutorId = first(params.tutor);
  const moduleParsed = moduleCodeSchema.safeParse(first(params.module) ?? "");

  const supabase = await createClient();
  const { data: tutor } = tutorId
    ? await supabase.from("profiles").select("full_name, rate_per_hour").eq("id", tutorId).maybeSingle()
    : { data: null };

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
      <BookingForm
        tutorId={tutorId}
        tutorName={tutor.full_name}
        moduleCode={moduleParsed.data}
        defaultRate={Number(tutor.rate_per_hour)}
      />
    </main>
  );
}
