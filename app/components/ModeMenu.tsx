"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { ArrowLeftRight, ChevronDown, GraduationCap, LogOut, UserRound, Wallet } from "lucide-react";
import { switchMode } from "@/app/(app)/actions";
import { signOut } from "@/app/auth/actions";
import type { Mode } from "@/app/(app)/mode";
import Avatar from "@/app/components/Avatar";
import ModeSwitchOverlay from "@/app/components/ModeSwitchOverlay";

export default function ModeMenu({
  name,
  mode,
  avatarColor,
  avatarSrc,
  balance,
}: {
  name: string;
  mode: Mode;
  avatarColor: string;
  avatarSrc: string | null;
  balance: number;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);
  // the mode you can switch to
  const other: Mode = mode === "student" ? "tutor" : "student";

  // close on outside click
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  useEffect(() => {
    if (!isPending) return;
    const shell = document.getElementById("app-shell");
    if (!shell) return;
    shell.inert = true;
    return () => {
      shell.inert = false;
    };
  }, [isPending]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-indigo-50"
      >
        <Avatar
          src={avatarSrc}
          name={name}
          colorClass={avatarColor}
          className="h-8 w-8"
          textClass="text-xs"
        />
        <span className="hidden text-left leading-tight sm:block">
          <span className="block text-sm font-semibold text-indigo-950">{name}</span>
          <span className="block text-xs capitalize text-indigo-900/50">{mode} mode</span>
        </span>
        <ChevronDown className="h-4 w-4 text-indigo-900/50" strokeWidth={2} />
      </button>

      {/* dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-60 overflow-hidden rounded-xl border border-indigo-100 bg-white shadow-soft-lg">
          <div className="flex items-center gap-3 border-b border-indigo-100/70 px-4 py-3">
            <Avatar
              src={avatarSrc}
              name={name}
              colorClass={avatarColor}
              className="h-9 w-9"
              textClass="text-sm"
            />
            <div className="leading-tight">
              <p className="text-sm font-semibold text-indigo-950">{name}</p>
              <p className="text-xs capitalize text-indigo-900/50">{mode} mode</p>
              <p className="mt-1 text-sm font-bold text-indigo-700">${balance.toFixed(2)}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              startTransition(() => switchMode(other));
            }}
            disabled={isPending}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-indigo-900 transition-colors hover:bg-indigo-50 disabled:opacity-60"
          >
            {other === "tutor" ? (
              <GraduationCap className="h-4 w-4 text-indigo-600" strokeWidth={2} />
            ) : (
              <ArrowLeftRight className="h-4 w-4 text-indigo-600" strokeWidth={2} />
            )}
            Switch to {other} mode
          </button>

          <Link
            href="/wallet"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-indigo-900 transition-colors hover:bg-indigo-50"
          >
            <Wallet className="h-4 w-4 text-indigo-900/50" strokeWidth={2} />
            Wallet
          </Link>

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

      {/* the switch is a server action, so route level loading screens never fire;
          portalled past the blurred header, which would otherwise trap fixed children */}
      {isPending && createPortal(<ModeSwitchOverlay />, document.body)}
    </div>
  );
}
