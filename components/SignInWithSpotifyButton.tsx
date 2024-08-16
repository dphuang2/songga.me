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

async function signInWithSpotify() {
  const supabase = createClient();
  var scopes =
    "streaming \
      user-read-playback-state \
      user-read-currently-playing \
      user-read-email";
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "spotify",
    options: {
      scopes,
      redirectTo: "http://localhost:3000/auth/callback",
    },
  });
  if (error) console.error(error);
}
