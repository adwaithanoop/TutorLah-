import Link from "next/link";
import {
  Search,
  Zap,
  Users,
  CalendarCheck,
  MessagesSquare,
  CalendarDays,
  IdCard,
  UserRound,
} from "lucide-react";
import { signOut } from "@/app/auth/actions";

const NAV = [
  { href: "/tutors", label: "Find tutors", icon: Search },
  { href: "/sos", label: "SOS", icon: Zap },
  { href: "/groups", label: "Groups", icon: Users },
  { href: "/bookings", label: "Bookings", icon: CalendarCheck },
  { href: "/messages", label: "Messages", icon: MessagesSquare },
  { href: "/schedule", label: "Schedule", icon: CalendarDays },
  { href: "/passport", label: "Passport", icon: IdCard },
  { href: "/profile", label: "Profile", icon: UserRound },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-cream">
      <header className="sticky top-0 z-40 border-b border-indigo-100/70 bg-cream/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/tutors" className="text-lg font-bold tracking-tight text-indigo-950">
            TutorLah
          </Link>
          <nav className="flex items-center gap-0.5 sm:gap-1">
            {NAV.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-1.5 rounded-full px-2.5 py-2 text-sm font-medium text-indigo-900/70 transition-colors hover:bg-indigo-50 hover:text-indigo-700 sm:px-3"
              >
                <Icon className="h-4 w-4" strokeWidth={2} />
                <span className="hidden lg:inline">{label}</span>
              </Link>
            ))}
          </nav>
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-full px-4 py-2 text-sm font-medium text-indigo-900/70 transition-colors hover:bg-indigo-50 hover:text-indigo-700"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>
      {children}
    </div>
  );
}
