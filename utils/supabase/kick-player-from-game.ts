"use server";

import { createClient } from "./server";

export async function kickPlayerFromGame({
  teamId,
  playerId,
}: {
  teamId: number;
  playerId: number;
}) {
  console.log(`Attempting to kick player ${playerId} from team ${teamId}`);
  const supabase = createClient();
  const { data, error } = await supabase
    .from("player_team_membership")
    .delete()
    .eq("player_id", playerId)
    .eq("team_id", teamId)
    .select();
  if (error) {
    console.error(
      `Error kicking player ${playerId} from team ${teamId}:`,
      error
    );
    throw error;
  }
  console.log(
    `Successfully kicked player ${playerId} from team ${teamId}. Data:`,
    data
  );
}
