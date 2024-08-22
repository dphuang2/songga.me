"use client";

import { GameProps } from "@/app/[game]/page";
import { LiveIndicator } from "./LiveIndicator";
import LivePlayerList from "./LivePlayerList";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { GameState, gameStateSchema } from "@/utils/game-state";
import { RealtimeChannel } from "@supabase/supabase-js";

export function DesktopClient({
  gameId,
  isCreator,
  currentPlayerId,
  initialPlayerList,
  isPlayerOnAnyTeam,
  gameSlug,
}: GameProps) {
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
    <main className="container mx-auto py-16 flex justify-center items-center px-4 md:px-0">
      <article className="prose">
        <h1 className="text-gray-400">You are the host</h1>
        <h2>How to start the game</h2>
        <ol>
          <li>
            Make sure your Spotify is playing on a device everyone can hear
          </li>
          <li>When everyone is ready, click "Start Game" button below. </li>
        </ol>
        <button
          onClick={() => {
            const state: GameState = {
              picker: 2,
              started: true,
            };
            gameRoom.current?.send({
              type: "broadcast",
              event: "game",
              payload: state,
            });
          }}
          className="bg-blue-500 w-full hover:bg-blue-700 text-lg text-white font-bold py-2 px-4 rounded mb-3"
        >
          Start Game
        </button>
        <h3>
          Cool people waiting to play <LiveIndicator />
        </h3>
        <LivePlayerList
          isPlayerOnAnyTeam={isPlayerOnAnyTeam}
          isGameCreator={isCreator}
          gameId={gameId}
          initialPlayerList={initialPlayerList}
          currentPlayerId={currentPlayerId}
        />
      </article>
    </main>
  );
}
