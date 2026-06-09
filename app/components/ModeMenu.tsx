"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeftRight, ChevronDown, GraduationCap, LogOut, UserRound } from "lucide-react";
import { switchMode } from "@/app/(app)/actions";
import { signOut } from "@/app/auth/actions";
import type { Mode } from "@/app/(app)/mode";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

export default function ModeMenu({
  name,
  mode,
  avatarColor,
}: {
  name: string;
  mode: Mode;
  avatarColor: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const other: Mode = mode === "student" ? "tutor" : "student";

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-indigo-50"
      >
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white ${avatarColor}`}
        >
          {initials(name)}
        </span>
        <span className="hidden text-left leading-tight sm:block">
          <span className="block text-sm font-semibold text-indigo-950">{name}</span>
          <span className="block text-xs capitalize text-indigo-900/50">{mode} mode</span>
        </span>
        <ChevronDown className="h-4 w-4 text-indigo-900/50" strokeWidth={2} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-60 overflow-hidden rounded-xl border border-indigo-100 bg-white shadow-soft-lg">
          <div className="flex items-center gap-3 border-b border-indigo-100/70 px-4 py-3">
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white ${avatarColor}`}
            >
              {initials(name)}
            </span>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-indigo-950">{name}</p>
              <p className="text-xs capitalize text-indigo-900/50">{mode} mode</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => switchMode(other)}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-indigo-900 transition-colors hover:bg-indigo-50"
          >
            {other === "tutor" ? (
              <GraduationCap className="h-4 w-4 text-indigo-600" strokeWidth={2} />
            ) : (
              <ArrowLeftRight className="h-4 w-4 text-indigo-600" strokeWidth={2} />
            )}
            Switch to {other} mode
          </button>

          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-indigo-900 transition-colors hover:bg-indigo-50"
          >
            <UserRound className="h-4 w-4 text-indigo-900/50" strokeWidth={2} />
            Profile
          </Link>

          <form action={signOut} className="border-t border-indigo-100/70">
            <button
              type="submit"
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-indigo-900 transition-colors hover:bg-indigo-50"
            >
              <LogOut className="h-4 w-4 text-indigo-900/50" strokeWidth={2} />
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}