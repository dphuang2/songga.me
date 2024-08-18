import { createClient } from "@/utils/supabase/server";
import { User } from "@supabase/auth-js";
import humanId from "human-id";
import LivePlayerList from "./LivePlayerList";
import { LiveIndicator } from "./LiveIndicator";

export async function MobileClient({
  link,
  gameId,
}: {
  link: string;
  gameId: number;
}) {
  const user = await setupUser({ gameId });
  return (
    <>
      <p className="text-sm text-gray-400">
        Currently in the lobby for <span className="text-blue-300">{link}</span>
      </p>
      <h2 className="text-lg font-semibold">What is your name?</h2>
      <input
        className="mt-2 mb-4 p-2 border border-gray-300 rounded-md w-full"
        placeholder={user?.user_metadata["name"]}
      />
      <hr className="my-4 border-t border-gray-200 w-full" />
      <h3>
        Look who else is playing with you! <LiveIndicator />
      </h3>
      <LivePlayerList initialPlayerList={[{ players: [{ name: "test" }] }]} />
    </>
  );
}

async function setupUser({ gameId }: { gameId: number }): Promise<User> {
  // 1. Sign up/in
  const { user, supabase } = await signInAnonymously();

  // 1.a If user is already on team in this game, then return early
  const teamsWithGameQuery = supabase
    .from("team")
    .select(
      `
    id,
    game (
      id
    )
    `
    )
    .eq("game_id", gameId);
  const { data: teamsWithGame, error: teamsQueryError } =
    await teamsWithGameQuery;
  if (teamsQueryError) throw teamsQueryError;

  // Find all memberships of teams that match any of the teams in the previous query
  const { count, error: membershipQueryError } = await supabase
    .from("user_team_membership")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .in(
      "team_id",
      teamsWithGame.map((team) => team.id)
    );
  if (membershipQueryError) throw membershipQueryError;
  if (count !== null && count > 0) return user;

  // 2. Create team
  const { data: team, error } = await supabase
    .from("team")
    .insert([{ game_id: gameId }])
    .select();
  if (error) throw error;
  if (team === null) throw Error("could not create team");

  // 3. Create user to team relationship
  const { error: userToTeamRelationshipError } = await supabase
    .from("user_team_membership")
    .insert([
      {
        team_id: team[0].id,
        user_id: user.id,
      },
    ]);
  if (userToTeamRelationshipError) throw userToTeamRelationshipError;

  return user;
}

async function signInAnonymously(): Promise<{
  user: User;
  supabase: ReturnType<typeof createClient>;
}> {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  const currentUser = data.user;
  if (currentUser === null) {
    const { data: anonymousUser, error } =
      await supabase.auth.signInAnonymously({
        options: {
          data: {
            name: humanId(),
          },
        },
      });
    if (error) console.error(error);
    if (anonymousUser.user === null) {
      throw new Error("User data is null");
    }
    return { user: anonymousUser.user, supabase };
  }
  return { user: currentUser, supabase };
}
