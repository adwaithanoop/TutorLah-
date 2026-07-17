import Link from "next/link";
import {
  Search,
  LayoutDashboard,
  Zap,
  Users,
  CalendarCheck,
  MessagesSquare,
  CalendarDays,
  IdCard,
  ShieldCheck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/user";
import { getBalance } from "@/lib/wallet/service";
import { signedAvatarUrl } from "@/lib/avatars";
import ModeMenu from "@/app/components/ModeMenu";
import SiteBackground from "@/app/components/SiteBackground";
import { getMode } from "./mode";

// nav links shown in both student and tutor mode
const SHARED_NAV = [
  { href: "/sos", label: "SOS", icon: Zap },
  { href: "/groups", label: "Groups", icon: Users },
  { href: "/bookings", label: "Bookings", icon: CalendarCheck },
  { href: "/messages", label: "Messages", icon: MessagesSquare },
];

const SCHEDULE_NAV = { href: "/schedule", label: "Schedule", icon: CalendarDays };
const PASSPORT_NAV = { href: "/passport", label: "Passport", icon: IdCard };

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  // current mode (student or tutor) and the logged in user
  const [mode, user] = await Promise.all([getMode(), getCurrentUser(supabase)]);

  // profile, admin check and wallet balance
  const [{ data: profile }, { data: adminRow }, balance] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, avatar_color, avatar_path")
      .eq("id", user!.id)
      .maybeSingle(),
    supabase.from("admins").select("id").eq("id", user!.id).maybeSingle(),
    getBalance(supabase, user!.id),
  ]);
  const isAdmin = !!adminRow;

  // values the header needs to render
  const name = profile?.full_name?.trim() || user?.email?.split("@")[0] || "You";
  const avatarColor = profile?.avatar_color ?? "bg-indigo-500";
  const avatarSrc = await signedAvatarUrl(supabase, profile?.avatar_path);
  const home = mode === "tutor" ? "/dashboard/tutor" : "/dashboard";

  // nav swaps the home link and adds extras depending on mode
  const homeNav =
    mode === "tutor"
      ? { href: home, label: "Dashboard", icon: LayoutDashboard }
      : { href: home, label: "Find tutors", icon: Search };
  const navItems = [
    homeNav,
    ...SHARED_NAV,
    ...(mode === "tutor" ? [SCHEDULE_NAV] : []),
    PASSPORT_NAV,
  ];

  return (
    <div id="app-shell" className="relative isolate min-h-screen bg-cream">
      <SiteBackground
        name={mode === "tutor" ? "appTutor" : "appStudent"}
        overlayClassName="bg-cream/85"
      />
      <header className="sticky top-0 z-40 border-b border-indigo-100/70 bg-cream/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href={home} className="text-lg font-bold tracking-tight text-indigo-950">
            TutorLah
          </Link>
          <nav className="flex items-center gap-0.5 sm:gap-1">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-1.5 rounded-full px-2.5 py-2 text-sm font-medium text-indigo-900/70 transition-colors hover:bg-indigo-50 hover:text-indigo-700 sm:px-3"
              >
                <Icon className="h-4 w-4" strokeWidth={2} />
                <span className="hidden lg:inline">{label}</span>
              </Link>
            ))}
            {/* admin only link */}
            {isAdmin && (
              <Link
                href="/admin/verifications"
                className="flex items-center gap-1.5 rounded-full px-2.5 py-2 text-sm font-medium text-indigo-900/70 transition-colors hover:bg-indigo-50 hover:text-indigo-700 sm:px-3"
              >
                <ShieldCheck className="h-4 w-4" strokeWidth={2} />
                <span className="hidden lg:inline">Admin</span>
              </Link>
            )}
          </nav>
          <ModeMenu
            name={name}
            mode={mode}
            avatarColor={avatarColor}
            avatarSrc={avatarSrc}
            balance={balance}
          />
        </div>
      </header>
      {children}
    </div>
  );
}
