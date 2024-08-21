"use server";

import { getUserOrThrow } from "./get-user-or-throw";
import { createClient } from "./server";

export async function leaveTeam({ gameId }: { gameId: number }) {
  const supabase = createClient();
  // 1. get player
  const user = await getUserOrThrow({ supabase });
  const { data: player, error: playerQueryError } = await supabase
    .from("player")
    .select("*")
    .eq("user_id", user.id);
  if (playerQueryError) throw playerQueryError;
  if (player === null) throw Error("Could not get player");
  const playerId = player[0].id;

  // 2. get previous team id
  const { data: previousMembership, error: previousMembershipQueryError } =
    await supabase
      .from("player_team_membership")
      .select(`*, team!inner(*)`)
      .eq("team.game_id", gameId)
      .eq("player_id", playerId);
  if (previousMembershipQueryError) throw previousMembershipQueryError;
  if (previousMembership === null) throw Error("Could not get previous team");
  const previousTeamId = previousMembership[0].team_id;

  const { data: newTeam, error: newTeamError } = await supabase
    .from("team")
    .insert([{ game_id: gameId }])
    .select();
  if (newTeamError) throw newTeamError;
  if (newTeam === null) throw Error("Could not create new team");
  const newTeamId = newTeam[0].id;

  // 4. update row with new team id
  const { error } = await supabase
    .from("player_team_membership")
    .update({ team_id: newTeamId })
    .eq("team_id", previousTeamId)
    .eq("player_id", playerId);
  if (error) throw error;
}
