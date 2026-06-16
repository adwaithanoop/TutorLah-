import Link from "next/link";
import { notFound } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { getAdminUser } from "@/lib/auth/admin";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdminUser();
  if (!admin) notFound();

  return (
    <div className="min-h-screen bg-cream">
      <header className="sticky top-0 z-40 border-b border-indigo-100/70 bg-cream/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/admin/verifications"
            className="flex items-center gap-2 text-lg font-bold tracking-tight text-indigo-950"
          >
            <ShieldCheck className="h-5 w-5 text-indigo-600" strokeWidth={2} />
            TutorLah Admin
          </Link>
          <Link
            href="/dashboard"
            className="text-sm font-medium text-indigo-900/70 transition-colors hover:text-indigo-700"
          >
            Back to app
          </Link>
        </div>
      </header>
      {children}
    </div>
  );
}
