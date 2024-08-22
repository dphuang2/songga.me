"use server";

import { createClient } from "./server";

export async function isPlayerOnAnyTeam({
  gameId,
  playerId,
}: {
  gameId: number;
  playerId: number;
}): Promise<boolean> {
  const supabase = createClient();
  const teamsWithGameQuery = supabase
    .from("team")
    // Using "!inner" allows us to filter on the referenced table's colun value
    .select(`id, game(id), player!inner(id)`, { count: "exact", head: true })
    .eq("game_id", gameId)
    .filter("player.id", "eq", playerId);

  const { error: teamsQueryError, count } = await teamsWithGameQuery;
  if (teamsQueryError) throw teamsQueryError;
  const isPlayerOnTeam = count !== null && count > 0;
  return isPlayerOnTeam;
}
