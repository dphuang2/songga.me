"use client";

import { User } from "@supabase/auth-js";
import { CreateAGameButton } from "./CreateAGameButton";
import { SignInWithSpotifyButton } from "./SignInWithSpotifyButton";
import { SpotifyAuthStorage } from "@/utils/supabase/client";

export function StartAGame({ user }: { user: User | null }) {
  const savedSpotifyAccessToken = SpotifyAuthStorage.getSavedAccessToken();
  return (
    <>
      {user && savedSpotifyAccessToken !== null ? (
        <CreateAGameButton />
      ) : (
        <div>
          <p className="text-lg mb-4">Sign in with Spotify to create a game!</p>
          <SignInWithSpotifyButton />
        </div>
      )}
    </>
  );
}
