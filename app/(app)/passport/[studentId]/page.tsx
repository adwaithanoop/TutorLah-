import { createClient } from "@/lib/supabase/server";
import PassportView, { type PassportReport } from "@/app/components/report/PassportView";

export default async function PassportPage({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params;
  const supabase = await createClient();

  // student data
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", studentId)
    .maybeSingle();

  // past session reports, newest first
  const { data: reports } = await supabase
    .from("session_reports")
    .select("id, module_code, misconceptions, summary, created_at, subjects(title)")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-1 text-3xl font-bold text-gray-900">Academic Passport</h1>
      <p className="mb-6 text-gray-500">
        Past sessions for {profile?.full_name ?? "this student"} so review before your session.
      </p>
      <PassportView studentName={profile?.full_name ?? "Student"} reports={(reports as PassportReport[]) ?? []} />
    </main>
  );
}
