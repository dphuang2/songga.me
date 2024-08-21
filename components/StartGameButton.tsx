"use client";
import { startGame } from "@/utils/supabase/start-game";

export function StartGameButton({ gameId }: { gameId: number }) {
  return (
    <button
      onClick={() => startGame({ gameId })}
      className="bg-blue-500 w-full hover:bg-blue-700 text-lg text-white font-bold py-2 px-4 rounded mb-3"
    >
      Start Game
    </button>
  );
}
