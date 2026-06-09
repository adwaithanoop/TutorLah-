import Link from "next/link";

const footerLinks = {
  Platform: [
    { label: "Find a Tutor", href: "/dashboard" },
    { label: "Become a Tutor", href: "/auth/signup?role=tutor" },
    { label: "SOS Bidding", href: "#features" },
    { label: "Group Sessions", href: "#features" },
    { label: "Academic Passport", href: "#features" },
  ],
  Company: [
    { label: "About Us", href: "/about" },
    { label: "Orbital 2026", href: "/orbital" },
    { label: "Blog", href: "/blog" },
    { label: "Contact", href: "/contact" },
  ],
  Support: [
    { label: "Help Center", href: "/help" },
    { label: "Dispute Resolution", href: "/help/disputes" },
    { label: "Verification Process", href: "/help/verification" },
    { label: "Safety Guidelines", href: "/help/safety" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "/legal/privacy" },
    { label: "Terms of Service", href: "/legal/terms" },
    { label: "Cookie Policy", href: "/legal/cookies" },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-indigo-950 text-indigo-100/80">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-5">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="text-xl font-extrabold tracking-tight text-white">
              TutorLah
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-indigo-100/70">
              Module-verified peer tutoring for NUS students.
            </p>
          </div>

          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-sky-200">
                {section}
              </h3>
              <ul className="mt-5 space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-indigo-100/70 transition-colors hover:text-white"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-sm text-indigo-200/70 sm:flex-row">
          <p>&copy; 2026 TutorLah</p>
          <p>Built for NUS students, by NUS students.</p>
        </div>
      </div>
    </footer>
  );
}
