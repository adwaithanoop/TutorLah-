"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SosRealtime() {
  const router = useRouter();

  // refresh when any SOS request or bid changes
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("sos-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "sos_requests" }, () => router.refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "sos_bids" }, () => router.refresh())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  return null;
}
