"use client";

import { useEffect, useState } from "react";
import { countdownLabel } from "@/lib/scheduling/display";

export default function SosCountdown({ expiresAt }: { expiresAt: string }) {
  const [now, setNow] = useState(() => Date.now());

  // tick every second
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const expired = Date.parse(expiresAt) - now <= 0;

  return (
    <span
      suppressHydrationWarning
      className={`text-xs font-semibold ${expired ? "text-red-500" : "text-amber-600"}`}
    >
      {expired ? "Expired" : `${countdownLabel(expiresAt, now)} left`}
    </span>
  );
}
