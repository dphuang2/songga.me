"use client";
import { createClient } from "@/utils/supabase/client";

export function SignInWithSpotifyButton() {
  return (
    <button
      onClick={signInWithSpotify}
      className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
    >
      Sign in with Spotify
    </button>
  );
}

export const SPOTIFY_SCOPES =
  "streaming \
      user-read-playback-state \
      user-read-currently-playing \
      user-top-read \
      user-read-email";

async function signInWithSpotify() {
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "spotify",
    options: {
      scopes: SPOTIFY_SCOPES,
      redirectTo: "http://localhost:3000/auth/callback",
    },
  });
  if (error) console.error(error);
}
