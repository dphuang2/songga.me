import { NextResponse } from "next/server";

function generateRandomString(length: number) {
  var text = "";
  var possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

export async function GET(req: Request) {
  var scope =
    "streaming \
      user-read-playback-state \
      user-read-currently-playing \
      user-read-email";

  var state = generateRandomString(16);

  let spotify_client_id = process.env.SPOTIFY_CLIENT_ID;

  if (spotify_client_id === undefined)
    throw Error("Missing SPOTIFY_CLIENT_ID environment variable");

  var auth_query_parameters = new URLSearchParams({
    response_type: "code",
    client_id: spotify_client_id,
    scope: scope,
    redirect_uri: "http://localhost:3000/api/auth/callback",
    state: state,
  });

  return NextResponse.redirect(
    "https://accounts.spotify.com/authorize/?" +
      auth_query_parameters.toString()
  );
}
