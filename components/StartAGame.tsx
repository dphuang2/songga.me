"use client";

import { User } from "@supabase/auth-js";
import { CreateAGameButton } from "./CreateAGameButton";
import { SignInWithSpotifyButton } from "./SignInWithSpotifyButton";
import { SpotifyAuthStorage } from "@/utils/supabase/client";
import { AccessToken } from "@spotify/web-api-ts-sdk";
import { useState, useEffect } from "react";

export function StartAGame({ user }: { user: User | null }) {
  const [savedSpotifyAccessToken, setSavedSpotifyAccessToken] =
    useState<AccessToken | null>(null);

  useEffect(() => {
    const token = SpotifyAuthStorage.getSavedAccessToken();
    setSavedSpotifyAccessToken(token);
  }, []);

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
