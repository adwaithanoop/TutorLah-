import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type Client = SupabaseClient<Database>;
export type WalletTransaction = Database["public"]["Tables"]["wallet_transactions"]["Row"];

export async function getBalance(client: Client, userId: string): Promise<number> {
  const { data } = await client.from("wallets").select("balance").eq("id", userId).maybeSingle();
  return data ? Number(data.balance) : 0;
}

export async function getRecentTransactions(
  client: Client,
  userId: string,
  limit = 20,
): Promise<WalletTransaction[]> {
  const { data } = await client
    .from("wallet_transactions")
    .select("*")
    .eq("wallet_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}
