"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

// anchor links to page sections
const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Find Tutors", href: "#tutors" },
  { label: "For Tutors", href: "#for-tutors" },
];

// logo
function Wordmark() {
  return (
    <Link href="/" className="text-xl font-extrabold tracking-tight text-indigo-950">
      TutorLah
    </Link>
  );
}

export default function Navbar() {
  // mobile menu open + scrolled flags
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // solidify nav once scrolled down
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed inset-x-0 top-0 z-50 border-b transition-all duration-300 ${
        scrolled
          ? "border-indigo-100 bg-cream/90 shadow-soft backdrop-blur-md"
          : "border-transparent bg-cream/70 backdrop-blur-sm"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Wordmark />

          <div className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-semibold text-indigo-900/70 transition-colors hover:text-indigo-700"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <Link
              href="/auth/login"
              className="rounded-full px-4 py-2 text-sm font-semibold text-indigo-900/80 transition-colors hover:bg-indigo-50 hover:text-indigo-700"
            >
              Log In
            </Link>
            <Link
              href="/auth/signup"
              className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-soft transition-all hover:bg-indigo-700 hover:shadow-soft-lg"
            >
              Sign Up
            </Link>
          </div>

          <button
            className="rounded-full p-2 text-indigo-900/80 transition-colors hover:bg-indigo-50 md:hidden"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="h-5 w-5" strokeWidth={2} /> : <Menu className="h-5 w-5" strokeWidth={2} />}
          </button>
        </div>

        {/* mobile dropdown */}
        {menuOpen && (
          <div className="rounded-b-2xl border-t border-indigo-100 bg-cream shadow-soft-lg md:hidden">
            <div className="flex flex-col gap-3 px-4 py-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="py-1 text-sm font-semibold text-indigo-900/80 transition-colors hover:text-indigo-700"
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="flex gap-2 border-t border-indigo-100 pt-3">
                <Link
                  href="/auth/login"
                  className="flex-1 rounded-full border border-indigo-200 px-4 py-2 text-center text-sm font-semibold text-indigo-900/80 transition-colors hover:bg-indigo-50"
                  onClick={() => setMenuOpen(false)}
                >
                  Log In
                </Link>
                <Link
                  href="/auth/signup"
                  className="flex-1 rounded-full bg-indigo-600 px-4 py-2 text-center text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
                  onClick={() => setMenuOpen(false)}
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
