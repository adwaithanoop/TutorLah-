"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SosRealtime({ userId }: { userId: string }) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("sos-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "sos_requests" }, () => router.refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "sos_bids" }, () => router.refresh())
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings", filter: `student_id=eq.${userId}` },
        () => router.refresh(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reviews", filter: `student_id=eq.${userId}` },
        () => router.refresh(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router, userId]);

  return null;
}
