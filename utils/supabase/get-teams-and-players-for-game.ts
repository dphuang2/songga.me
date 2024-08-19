"use server";

import { Players } from "@/components/LivePlayerList";
import { createClient } from "./server";

export async function getTeamsAndPlayersForGame({
  gameId,
}: {
  gameId: number;
}): Promise<Players> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("game")
    .select("*, team(*, player(*))")
    .eq("id", gameId);
  if (error) console.error(error);
  if (data === null) throw Error("Could not query for all teams in game");
  return data[0].team.map((team) => ({
    players: team.player.map((player) => ({
      name: player.custom_name ? player.custom_name : player.name,
    })),
  }));
}
