"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function JoinGameForm() {
  const [gameCode, setGameCode] = useState("");
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setGameCode(value);
  };

  const handleJoinGame = () => {
    if (gameCode.length === 4) {
      router.push(`/${gameCode}`);
    }
  };

  const isButtonDisabled = gameCode.length !== 4;

  return (
    <>
      <div className="mb-4">
        <input
          type="text"
          maxLength={4}
          placeholder="Enter 4-letter code"
          className="w-full px-4 py-3 text-2xl font-bold uppercase border-4 border-black rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-400"
          value={gameCode}
          onChange={handleInputChange}
        />
      </div>
      <button
        className={`w-full text-xl font-bold py-3 px-6 rounded-xl border-4 border-black transition-colors ${
          isButtonDisabled
            ? "bg-gray-300 cursor-not-allowed"
            : "bg-blue-500 hover:bg-blue-700 text-white"
        }`}
        disabled={isButtonDisabled}
        onClick={handleJoinGame}
      >
        Join Game
      </button>
    </>
  );
}
