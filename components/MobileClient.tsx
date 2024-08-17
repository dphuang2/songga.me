"use client";

import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/auth-js";
import humanId from "human-id";
import { useEffect, useState } from "react";
import LivePlayerList from "./LivePlayerList";
import { LiveIndicator } from "./LiveIndicator";

export function MobileClient({ link }: { link: string }) {
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    signInAnonymously().then((user) => setUser(user));
  }, []);
  return (
    <>
      <p className="text-sm text-gray-400">
        Currently in the lobby for <span className="text-blue-300">{link}</span>
      </p>
      <h2 className="text-lg font-semibold">What is your name?</h2>
      <input
        className="mt-2 mb-4 p-2 border border-gray-300 rounded-md w-full"
        placeholder={user?.user_metadata["name"]}
      />
      <hr className="my-4 border-t border-gray-200 w-full" />
      <h3>
        Look who else is playing with you! <LiveIndicator />
      </h3>
      <LivePlayerList initialPlayerList={[{ players: [{ name: "test" }] }]} />
    </>
  );
}

async function signInAnonymously(): Promise<User> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    console.error("Error:", error);
  }
  const currentUser = data.user;
  if (currentUser === null) {
    const { data: anonymousUser, error } =
      await supabase.auth.signInAnonymously({
        options: {
          data: {
            name: humanId(),
          },
        },
      });
    if (error) console.error(error);
    if (anonymousUser.user === null) {
      throw new Error("User data is null");
    }
    return anonymousUser.user;
  }
  return currentUser;
}
