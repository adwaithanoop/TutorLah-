import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/user";
import PassportView, { type PassportReport } from "@/app/components/report/PassportView";

export default async function MyPassportPage() {
  const supabase = await createClient();
  const user = await getCurrentUser(supabase);

  const { data: reports } = await supabase
    .from("session_reports")
    .select("id, module_code, misconceptions, summary, created_at, subjects(title)")
    .eq("student_id", user!.id)
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-1 text-3xl font-bold text-gray-900">Your Academic Passport</h1>
      <p className="mb-6 text-gray-500">Every session you complete adds to your progress record.</p>
      <PassportView studentName="Your" reports={(reports as PassportReport[]) ?? []} />
    </main>
  );
}
