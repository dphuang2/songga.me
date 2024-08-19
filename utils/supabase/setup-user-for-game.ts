import { Tables } from "./database.types";
import { getUserAndPlayer } from "./get-user-and-player";
import { isPlayerOnAnyTeam } from "./is-player-on-any-team";
import { createClient, SupabaseServerClient } from "./server";

export async function setupUserForGame({
  gameId,
}: {
  gameId: number;
}): Promise<{ player: Tables<"player">; supabase: SupabaseServerClient }> {
  const supabase = createClient();
  // 1. Sign up/in
  const { player } = await getUserAndPlayer({ supabase });

  // 2. If user is already on team in this game, then return early
  const doNotCreateTeam = await isPlayerOnAnyTeam({
    supabase,
    gameId,
    playerId: player.id,
  });
  if (doNotCreateTeam) return { player, supabase };

  // 3. Create team
  const { data: team, error } = await supabase
    .from("team")
    .insert([{ game_id: gameId }])
    .select();
  if (error) throw error;
  if (team === null) throw Error("could not create team");

  // 4. Create player to team relationship
  const { error: userToTeamRelationshipError } = await supabase
    .from("player_team_membership")
    .insert([
      {
        team_id: team[0].id,
        player_id: player.id,
      },
    ]);
  if (userToTeamRelationshipError) throw userToTeamRelationshipError;

  return { player: player, supabase };
}
