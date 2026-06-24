import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/user";
import { getBalance } from "@/lib/wallet/service";
import { searchTutors } from "@/lib/tutors/search";
import { getFreeWindows } from "@/lib/booking/availability";
import { moduleCodeSchema } from "@/lib/validation/search";
import BlastBuilder from "@/app/components/booking/BlastBuilder";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

const RANGE_DAYS = 14;

export default async function NewBookingPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const moduleParsed = moduleCodeSchema.safeParse(first(params.module) ?? "");

  const supabase = await createClient();
  const user = await getCurrentUser(supabase);

  if (!moduleParsed.success || !user) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center text-gray-500">
          Pick a module from{" "}
          <Link href="/dashboard" className="font-semibold text-indigo-600">
            search
          </Link>{" "}
          to find tutors and book.
        </p>
      </main>
    );
  }

  const moduleCode = moduleParsed.data;
  const now = new Date();
  const to = new Date(now.getTime() + RANGE_DAYS * 86_400_000);

  const ranked = await searchTutors(supabase, moduleCode, now);
  const bookable = ranked.filter((t) => t.id !== user.id && t.isActive && t.ratePerHour > 0);

  const admin = createAdminClient();
  const [balance, tutorsWithWindows] = await Promise.all([
    getBalance(supabase, user.id),
    Promise.all(
      bookable.map(async (t) => ({
        id: t.id,
        name: t.name,
        ratePerHour: t.ratePerHour,
        windows: await getFreeWindows(admin, t.id, now, to, now),
      })),
    ),
  ]);

  // Only tutors who actually have free time are worth showing in the picker.
  const tutors = tutorsWithWindows.filter((t) => t.windows.length > 0);

  return (
    <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Book {moduleCode}</h1>
        <p className="text-gray-500">
          Pick your timeslots. Once the tutor has accepted your request for one of the timeslots, all other bookings for this module (even with other tutors) will cancel automatically, allowing you to mass apply.
        </p>
      </div>
      <BlastBuilder moduleCode={moduleCode} tutors={tutors} balance={balance} />
    </main>
  );
}
