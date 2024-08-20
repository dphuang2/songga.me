"use server";

import { createClient } from "./server";

export async function kickPlayerFromGame({
  teamId,
  playerId,
}: {
  teamId: number;
  playerId: number;
}) {
  const supabase = createClient();
  const { error } = await supabase
    .from("player_team_membership")
    .delete()
    .eq("player_id", playerId)
    .eq("team_id", teamId)
    .select();
  if (error) throw error;
}
