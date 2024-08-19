import { User } from "@supabase/auth-js";
import humanId from "human-id";
import { SupabaseServerClient } from "./server";

export async function createPlayerForUser({
  user,
  supabase,
}: {
  user: User;
  supabase: SupabaseServerClient;
}) {
  const { data: player, error } = await supabase
    .from("player")
    .insert([
      {
        user_id: user.id,
        name: humanId(),
      },
    ])
    .select();
  if (error) throw error;
  if (player === null) throw Error("Could not create player");
  return player[0];
}
