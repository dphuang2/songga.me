"use client";

import { createClient } from "@/utils/supabase/client";
import humanId from "human-id";
import { AccessToken, SpotifyApi } from "@spotify/web-api-ts-sdk";

export function CreateAGameButton() {
  const supabase = createClient();
  const createGame = async () => {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (user === null) {
      console.error(userError);
      throw new Error("User not found. Please sign in to create a game.");
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    console.log(session);

    const spotifyAccessToken: AccessToken = {
      access_token: session!.provider_token!,
      refresh_token: session!.provider_refresh_token!,
      token_type: session!.token_type,
      expires_in: session!.expires_in,
    };
    const spotify = SpotifyApi.withAccessToken(
      process.env.NEXT_PUBLIC_SPOTIFY_ID!,
      spotifyAccessToken
    );

    const spotifyProfile = await spotify.currentUser.topItems("artists");
    console.log(spotifyProfile);

    // 1. Create a game row
    const { data, error } = await supabase
      .from("game")
      .insert([
        {
          creator: user.id,
          slug: humanId({ separator: ".", capitalize: false }),
        },
      ])
      .select();
    if (error) {
      console.error(error);
    }

    // 2. Add self to game
  };
  return (
    <button
      onClick={() => createGame()}
      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
    >
      Spotify Connected - Create a Game
    </button>
  );
}
