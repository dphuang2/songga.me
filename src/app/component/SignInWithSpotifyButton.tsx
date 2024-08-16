"use client";

import { createBrowserClient } from "@/utils/supabase/client";
import React from "react";

export const SignInWithSpotifyButton = () => {
  return (
    <button
      onClick={async () => {
        await signInWithSpotify();
      }}
      className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
    >
      Connect Spotify To Start Game
    </button>
  );
};

async function signInWithSpotify() {
  const supabase = createBrowserClient();
  const scopes =
    "streaming \
     user-read-currently-playing \
     user-read-email \
     user-read-playback-state \
     user-modify-playback-state";
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "spotify",
    options: {
      scopes,
    },
  });
  if (error !== null) {
    console.error(error);
    return error;
  }
  return data;
}
