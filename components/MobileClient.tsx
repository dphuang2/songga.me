"use client";

import LivePlayerList from "./LivePlayerList";
import { LiveIndicator } from "./LiveIndicator";
import { PlayerNameInput } from "./PlayerNameInput";
import { GameProps } from "@/app/[game]/page";
import { Tables } from "@/utils/supabase/database.types";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { GameState, gameStateSchema } from "@/utils/game-state";
import { RealtimeChannel } from "@supabase/supabase-js";

export function MobileClient({
  link,
  gameId,
  isCreator,
  currentPlayerId,
  initialPlayerList,
  player,
  gameSlug,
  isPlayerOnAnyTeam,
}: GameProps & {
  player: Tables<"player">;
}) {
  const [gameState, setGameState] = useState<GameState>();
  const gameRoom = useRef<RealtimeChannel | null>(null);
  useEffect(() => {
    if (gameRoom.current !== null) return;
    const supabase = createClient();
    gameRoom.current = supabase.channel(gameSlug, {
      config: { broadcast: { self: true } },
    });
    gameRoom.current.on("broadcast", { event: "game" }, ({ payload }) => {
      setGameState(gameStateSchema.parse(payload));
    });
    gameRoom.current.subscribe();
    return () => {
      gameRoom.current?.unsubscribe();
      gameRoom.current = null;
    };
  }, []);
  return (
    <main className="container mx-auto py-16 flex flex-col justify-center items-center px-4">
      <article className="prose">
        <p className="text-sm text-gray-400">
          Currently in the lobby for{" "}
          <span className="text-blue-300">{link}</span>
        </p>
        <div className="p-8 shadow-md border rounded-md mb-12">
          <h2>Step 1: What is your name?</h2>
          <PlayerNameInput
            name={player.name}
            customName={player.custom_name}
            playerId={player.id}
          />
        </div>
        {/* {isGameCreator && (
        <button className="bg-blue-500 w-full hover:bg-blue-700 text-lg text-white font-bold py-2 px-4 rounded mb-3">
          Start Game
        </button>
      )} */}

        <div className="p-8 shadow-md border rounded-md mb-12">
          <h2>
            Step 2: Form teams of 2 by joining another player, if you want
          </h2>
          <h4>
            Players waiting to have fun! <LiveIndicator />
          </h4>
          <LivePlayerList
            isPlayerOnAnyTeam={isPlayerOnAnyTeam}
            currentPlayerId={currentPlayerId}
            isGameCreator={isCreator}
            gameId={gameId}
            initialPlayerList={initialPlayerList}
          />
        </div>
      </article>
    </main>
  );
}
