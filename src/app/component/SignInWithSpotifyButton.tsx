"use client";

import React from "react";

export const SignInWithSpotifyButton = () => {
  return (
    <a href="/api/auth/login">
      <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
        Connect Spotify To Start Game
      </button>
    </a>
  );
};
