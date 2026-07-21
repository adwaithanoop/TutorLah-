"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function GroupsRealtime() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("groups-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "group_sessions" }, () => router.refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "group_enrolments" }, () => router.refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "group_lobbies" }, () => router.refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "lobby_members" }, () => router.refresh())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  return null;
}
