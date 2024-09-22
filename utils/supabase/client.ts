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

/**
 * SpotifyAuthStorage Class
 *
 * This class manages the storage and retrieval of Spotify access tokens using the browser's local storage.
 * It provides methods to save, retrieve, remove, and refresh Spotify access tokens.
 *
 * How it works:
 * 1. The class uses a static key (SPOTIFY_ACCESS_TOKEN_KEY) to store and retrieve the access token in local storage.
 * 2. All methods check for the availability of the 'window' object to ensure they're running in a browser environment.
 * 3. The access token is stored as a JSON string and parsed when retrieved.
 * 4. The refreshAccessToken method makes an API call to refresh the token and then saves the new token.
 *
 * Note: This class relies on browser local storage, so it will only work in client-side code.
 * Server-side usage will result in null returns or no-ops for storage operations.
 */
export class SpotifyAuthStorage {
  static SPOTIFY_ACCESS_TOKEN_KEY = "spotify_access_token";

  static saveAccessToken(accessToken: AccessToken) {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        SpotifyAuthStorage.SPOTIFY_ACCESS_TOKEN_KEY,
        JSON.stringify(accessToken)
      );
    }
  }

  static getSavedAccessToken(): AccessToken | null {
    if (typeof window === "undefined") return null;
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
