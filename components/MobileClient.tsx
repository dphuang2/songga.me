import { createClient, SupabaseServerClient } from "@/utils/supabase/server";
import LivePlayerList, { Players } from "./LivePlayerList";
import { LiveIndicator } from "./LiveIndicator";
import { Tables } from "@/utils/supabase/database.types";
import { getUserAndPlayer } from "@/utils/supabase/get-user-and-player";
import { isPlayerOnAnyTeam } from "@/utils/supabase/is-player-on-any-team";

export async function MobileClient({
  link,
  gameId,
}: {
  link: string;
  gameId: number;
}) {
  const { player, supabase } = await setupUser({ gameId });
  return (
    <>
      <p className="text-sm text-gray-400">
        Currently in the lobby for <span className="text-blue-300">{link}</span>
      </p>
      <h2 className="text-lg font-semibold">What is your name?</h2>
      <input
        className="mt-2 mb-4 p-2 border border-gray-300 rounded-md w-full"
        placeholder={player.name}
      />
      <hr className="my-4 border-t border-gray-200 w-full" />
      <h3>
        Players waiting to have fun! <LiveIndicator />
      </h3>
      <LivePlayerList
        initialPlayerList={await getTeamsAndPlayersForGame({
          gameId,
          supabase,
        })}
      />
    </>
  );
}

async function getTeamsAndPlayersForGame({
  gameId,
  supabase,
}: {
  gameId: number;
  supabase: SupabaseServerClient;
}): Promise<Players> {
  // const { data, error } = await supabase
  //   .from("game")
  //   .select("*, team(id, user_team_membership(*))")
  //   .eq("id", gameId);
  // if (error) console.error(error);
  // console.log("getPlayers", JSON.stringify(data, null, 2));
  return [];
}

async function setupUser({
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
