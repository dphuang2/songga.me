"use client";

import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/auth-js";
import humanId from "human-id";
import { useEffect, useState } from "react";
import LivePlayerList from "./LivePlayerList";
import { LiveIndicator } from "./LiveIndicator";

export function MobileClient({
  link,
  gameId,
}: {
  link: string;
  gameId: number;
}) {
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    setupUser({ gameId }).then((user) => setUser(user));
  }, []);
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
  const user = await signInAnonymously();
  const supabase = createClient();

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
  console.log("teamsWithGame", teamsWithGame);

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
  console.log("Creating team");

  // 2. Create team
  const { data: team, error } = await supabase
    .from("team")
    .insert([{ game_id: gameId }])
    .select();
  if (team === null) throw Error("could not create team");
  if (error) throw error;

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

async function signInAnonymously(): Promise<User> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    console.error("Error:", error);
  }
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
    return anonymousUser.user;
  }
  return currentUser;
}
