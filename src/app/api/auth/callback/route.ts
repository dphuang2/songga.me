import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import request from "request"; // Ensure you have the 'request' package installed

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  if (
    !process.env.SPOTIFY_CLIENT_ID ||
    !process.env.SPOTIFY_CLIENT_SECRET ||
    !process.env.SPOTIFY_REDIRECT_URI ||
    !process.env.JWT_SECRET
  ) {
    return NextResponse.json(
      { error: "Missing environment variables" },
      { status: 400 }
    );
  }

  const authOptions = {
    url: "https://accounts.spotify.com/api/token",
    form: {
      code: code,
      redirect_uri: process.env.SPOTIFY_REDIRECT_URI, // Use environment variable
      grant_type: "authorization_code",
    },
    headers: {
      Authorization:
        "Basic " +
        Buffer.from(
          process.env.SPOTIFY_CLIENT_ID +
            ":" +
            process.env.SPOTIFY_CLIENT_SECRET
        ).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    json: true,
  };

  const jwt_secret = process.env.JWT_SECRET;

  // Use a promise to handle the request
  return new Promise((resolve, reject) => {
    request.post(authOptions, function (error, response, body) {
      if (!error && response.statusCode === 200) {
        const access_token = body.access_token;
        // Generate a JWT token with the access token
        const jwtToken = jwt.sign({ access_token }, jwt_secret);
        // Redirect or respond as needed with the JWT token
        resolve(NextResponse.redirect(`/?jwt_token=${jwtToken}`));
      } else {
        reject(
          NextResponse.json(
            { error: "Failed to authenticate" },
            { status: 400 }
          )
        );
      }
    });
  });
}
