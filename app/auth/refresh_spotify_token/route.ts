import { AccessToken } from "@spotify/web-api-ts-sdk";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const refresh_token = searchParams.get("refresh_token");

  const authOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${btoa(
        `${process.env.SPOTIFY_ID}:${process.env.SPOTIFY_SECRET}`
      ).toString()}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refresh_token!,
      client_id: process.env.SPOTIFY_ID!,
    }),
  };

  const response = await fetch(
    "https://accounts.spotify.com/api/token",
    authOptions
  );
  const data = await response.json();

  console.log(data);

  if (response.ok) {
    return NextResponse.json({
      access_token: data.access_token,
      refresh_token: data.refresh_token || refresh_token,
      token_type: data.token_type,
      expires_in: data.expires_in,
    } as AccessToken);
  } else {
    return NextResponse.json(
      { error: "Failed to refresh token" },
      { status: 500 }
    );
  }
}
