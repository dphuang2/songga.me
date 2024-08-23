"use client";

import { createClient, SpotifyAuthStorage } from "@/utils/supabase/client";
import humanId from "human-id";
import { AccessToken, SpotifyApi } from "@spotify/web-api-ts-sdk";
import { SPOTIFY_SCOPES } from "./SignInWithSpotifyButton";
import { MusicIcon } from "./MusicIcon";

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

    const savedSpotifyAccessToken = SpotifyAuthStorage.getSavedAccessToken();

    if (savedSpotifyAccessToken === null)
      throw new Error(
        "No Spotify access token found. Please authenticate with Spotify."
      );

    // 1. Always refresh access token and save it
    const spotifyAccessToken = await SpotifyAuthStorage.refreshAccessToken(
      savedSpotifyAccessToken.refresh_token
    );

    // Without this, the Spotify API throws an error when authenticating for some reason
    delete spotifyAccessToken["expires"];
    const spotify = SpotifyApi.withAccessToken(
      process.env.NEXT_PUBLIC_SPOTIFY_ID!,
      spotifyAccessToken
    );

    const spotifyProfile = await spotify.currentUser.profile();
    const topArtists = await spotify.currentUser.topItems("artists");
    console.log(spotifyProfile, topArtists);

    // 2. Create a game row
    const { data: game, error: gameError } = await supabase
      .from("game")
      .insert([
        {
          creator: user.id,
          slug: generateFourLetterCode(),
        },
      ])
      .select();
    if (gameError) console.error(gameError);

    if (game === null || game.length === 0) throw new Error("No game created.");

    window.location.href = `/${game[0].slug}`;
  };
  return (
    <button
      onClick={() => createGame()}
      className="relative bg-blue-500 hover:bg-blue-700 text-white text-xl font-bold py-3 px-6 rounded-xl border-4 border-black transition-colors transform hover:rotate-1 hover:scale-105 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1"
    >
      <span className="flex items-center justify-center">
        <MusicIcon className="mr-2" />
        Create a Game
      </span>
    </button>
  );
}

function generateFourLetterCode() {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let result = "";
  for (let i = 0; i < 4; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}
