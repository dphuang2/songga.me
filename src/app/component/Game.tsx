import React, { useState, useEffect } from "react";
import { SignInWithSpotifyButton } from "./SignInWithSpotifyButton";
import { createServerClient } from "@/utils/supabase/server";

const Game: React.FC = async () => {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  console.log(user);
  return <>{user !== null ? user : <SignInWithSpotifyButton />}</>;
};

export default Game;
