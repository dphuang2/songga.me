import { User } from "@supabase/auth-js";
import { SupabaseServerClient } from "./server";
import { Tables } from "./database.types";
import { getUserOrThrow } from "./get-user-or-throw";

export async function getUserAndPlayer({
  supabase,
}: {
  supabase: SupabaseServerClient;
}): Promise<{ user: User; player: Tables<"player"> }> {
  const user = await getUserOrThrow({ supabase });
  const { data, error } = await supabase
    .from("player")
    .select("*")
    .eq("user_id", user.id);
  if (error) throw error;
  return { player: data[0], user };
}
