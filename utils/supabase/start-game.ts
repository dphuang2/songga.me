"use server";

import { getTeamsAndPlayersForGame } from "./get-teams-and-players-for-game";
import { createClient } from "./server";
import { GameState } from "../game-state";

export async function startGame({
  gameId,
}: {
  gameId: number;
}): Promise<GameState> {
  const supabase = createClient();

  // randomly choose team to be picker
  const teams = await getTeamsAndPlayersForGame({ gameId });

  const pickerIndex = Math.floor(Math.random() * teams.length);
  const pickerTeam = teams[pickerIndex];
  const state = {
    picker: pickerTeam.teamId,
  };

  const { error } = await supabase
    .from("game")
    .update({ state })
    .eq("id", gameId);
  if (error) throw error;

  return state;
}
