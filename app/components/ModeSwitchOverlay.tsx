"use client";

import { Skeleton } from "@/app/components/Skeleton";

export default function ModeSwitchOverlay() {
  return (
    <div role="status" aria-live="polite" className="fixed inset-0 z-50 overflow-hidden bg-cream">
      <span className="sr-only">Switching mode</span>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <header className="mb-8 space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-80" />
        </header>
        <Skeleton className="mb-10 h-48 w-full rounded-2xl" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col rounded-xl bg-white p-6 shadow-soft">
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <Skeleton className="h-7 w-10" />
              </div>
              <Skeleton className="mb-4 h-6 w-40" />
              <Skeleton className="mt-auto h-9 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
