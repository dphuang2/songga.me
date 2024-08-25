import { createBrowserClient } from "@supabase/ssr";
import { Database } from "./database.types";
import { AccessToken } from "@spotify/web-api-ts-sdk";

export const createClient = () => {
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: true,
      },
    }
  );
  supabase.auth.onAuthStateChange((event, session) => {
    if (session && session.provider_token) {
      const spotifyAccessToken: AccessToken = {
        access_token: session.provider_token,
        refresh_token: session.provider_refresh_token!,
        token_type: session.token_type,
        expires_in: session.expires_in,
        expires: session.expires_at,
      };
      if (SpotifyAuthStorage.getSavedAccessToken() === null)
        SpotifyAuthStorage.saveAccessToken(spotifyAccessToken);
    }

    if (event === "SIGNED_OUT") {
      SpotifyAuthStorage.removeAccessToken();
    }
  });
  return supabase;
};

export class SpotifyAuthStorage {
  static SPOTIFY_ACCESS_TOKEN_KEY = "spotify_access_token";

  static saveAccessToken(accessToken: AccessToken) {
    window.localStorage.setItem(
      SpotifyAuthStorage.SPOTIFY_ACCESS_TOKEN_KEY,
      JSON.stringify(accessToken)
    );
  }

  static getSavedAccessToken(): AccessToken | null {
    if (window === undefined) return null;
    const accessTokenString = window.localStorage.getItem(
      SpotifyAuthStorage.SPOTIFY_ACCESS_TOKEN_KEY
    );
    if (accessTokenString === null) return null;
    return JSON.parse(accessTokenString);
  }

  static removeAccessToken() {
    window.localStorage.removeItem(SpotifyAuthStorage.SPOTIFY_ACCESS_TOKEN_KEY);
  }

  static async refreshAccessToken(refreshToken: string): Promise<AccessToken> {
    const body = await fetch(
      `/auth/refresh_spotify_token?refresh_token=${refreshToken}`
    );
    const response = await body.json();
    SpotifyAuthStorage.saveAccessToken(response);
    return response as AccessToken;
  }
}
