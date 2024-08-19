import { User } from "@supabase/auth-js";
import { SupabaseServerClient } from "./server";
import { Tables } from "./database.types";
import { getUserOrThrow } from "./get-user-or-throw";
import { createPlayerForUser } from "./create-player-for-user";

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
  if (data.length === 0) {
    const player = await createPlayerForUser({ user, supabase });
    return { player, user };
  }
  return { player: data[0], user };
}
