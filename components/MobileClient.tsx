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
import { FaMusic } from "react-icons/fa";

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
  const [gameState, setGameState] = useState<GameState | null>(null);
  const gameRoom = useRef<RealtimeChannel | null>(null);
  useEffect(() => {
    if (gameRoom.current !== null) return;
    const supabase = createClient();
    gameRoom.current = supabase.channel(gameSlug, {
      config: { broadcast: { self: true } },
    });
    gameRoom.current.on("broadcast", { event: "game" }, ({ payload }) => {
      console.log(payload);
      setGameState(gameStateSchema.parse(payload));
    });
    gameRoom.current.subscribe();
    return () => {
      gameRoom.current?.unsubscribe();
      gameRoom.current = null;
    };
  }, []);
  return gameState !== null ? (
    <Game />
  ) : (
    <Lobby
      gameSlug={gameSlug}
      link={link}
      gameId={gameId}
      isCreator={isCreator}
      currentPlayerId={currentPlayerId}
      initialPlayerList={initialPlayerList}
      player={player}
      isPlayerOnAnyTeam={isPlayerOnAnyTeam}
    />
  );
}

function Game() {
  const [guessesLeft, setGuessesLeft] = useState(2);
  const [artistSearch, setArtistSearch] = useState("");
  const [songSearch, setSongSearch] = useState("");
  const [artistResults, setArtistResults] = useState<string[]>([]);
  const [songResults, setSongResults] = useState<string[]>([]);

  const handleSearch = (type: "artist" | "song", query: string) => {
    // Simulated search results - replace with actual API call
    const mockResults = query
      ? [`${type} 1 - ${query}`, `${type} 2 - ${query}`, `${type} 3 - ${query}`]
      : [];
    if (type === "artist") {
      setArtistResults(mockResults);
    } else {
      setSongResults(mockResults);
    }
  };

  const handleGuess = (type: "artist" | "song", name: string) => {
    console.log(`Guessed ${type}: ${name}`);
    setGuessesLeft((prev) => Math.max(0, prev - 1));
    // Add logic to check if the guess is correct
    // Update game state accordingly
    if (type === "artist") {
      setArtistSearch(name);
      setArtistResults([]);
    } else {
      setSongSearch(name);
      setSongResults([]);
    }
  };

  const handleFocus = (type: "artist" | "song") => {
    if (type === "artist") {
      setSongResults([]);
    } else {
      setArtistResults([]);
    }
  };

  return (
    <div className="flex flex-col justify-start min-h-screen bg-yellow-400 p-4 pb-16 font-sans fixed inset-0 overflow-y-auto">
      <div className="bg-white border-8 border-black rounded-3xl p-4 sm:p-6 w-full max-w-md mx-auto transform rotate-1 shadow-2xl border-b-[16px] border-r-[16px] mt-8 sm:mt-12 md:mt-16 lg:mt-20">
        <h2 className="text-2xl sm:text-3xl font-black uppercase bg-purple-300 px-3 py-1 sm:px-4 sm:py-2 rounded-xl border-4 border-black transform -rotate-2 mb-4 sm:mb-6">
          Guess the Song!
        </h2>

        <div className="mb-4 sm:mb-6 bg-green-300 border-4 border-black p-3 sm:p-4 rounded-xl transform rotate-1">
          <div className="flex justify-center items-center space-x-2 sm:space-x-4">
            <span className="text-lg sm:text-xl font-bold mr-2 bg-purple-300 px-3 py-1 sm:px-4 sm:py-2 rounded-xl border-4 border-black transform -rotate-2">
              Guesses:
            </span>
            {[1, 2].map((guess) => (
              <div
                key={guess}
                className={`w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center border-4 border-black rounded-xl ${
                  guess <= guessesLeft ? "bg-blue-300" : "bg-gray-300"
                }`}
              >
                <FaMusic
                  className={`text-3xl sm:text-4xl ${
                    guess <= guessesLeft ? "text-black" : "text-gray-500"
                  }`}
                />
              </div>
            ))}
          </div>
        </div>

        {guessesLeft === 0 && (
          <div className="mb-6 bg-red-300 border-4 border-black p-4 rounded-xl transform -rotate-1">
            <p className="text-xl font-bold text-center">No guesses left!</p>
          </div>
        )}

        {[
          {
            type: "artist",
            search: artistSearch,
            setSearch: setArtistSearch,
            results: artistResults,
          },
          {
            type: "song",
            search: songSearch,
            setSearch: setSongSearch,
            results: songResults,
          },
        ].map(({ type, search, setSearch, results }) => (
          <div key={type} className="mb-6">
            <label
              className={`text-xl font-black uppercase mb-2 bg-orange-300 px-4 py-2 rounded-xl border-4 border-black transform ${
                type === "artist" ? "-rotate-1" : "rotate-2"
              } inline-block`}
            >
              Guess the {type}:
            </label>
            <div className="relative">
              <input
                type="text"
                className={`w-full px-4 py-2 text-lg border-4 border-black rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-400 ${
                  guessesLeft === 0 ? "bg-gray-200 cursor-not-allowed" : ""
                }`}
                placeholder={`Search for ${type}...`}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  handleSearch(type as "artist" | "song", e.target.value);
                }}
                onFocus={() => handleFocus(type as "artist" | "song")}
                disabled={guessesLeft === 0}
              />
              {results.length > 0 && guessesLeft > 0 && (
                <div className="absolute z-10 mt-2 w-full bg-white border-4 border-black rounded-xl overflow-hidden shadow-lg">
                  <div className="max-h-48 overflow-y-auto">
                    {results.map((result, index) => (
                      <button
                        key={index}
                        className="w-full text-left px-4 py-3 text-lg font-bold hover:bg-yellow-200 focus:bg-yellow-200 focus:outline-none transition-colors"
                        onClick={() =>
                          handleGuess(type as "artist" | "song", result)
                        }
                      >
                        {result}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Lobby({
  link,
  gameId,
  isCreator,
  currentPlayerId,
  initialPlayerList,
  player,
  isPlayerOnAnyTeam,
}: GameProps & {
  player: Tables<"player">;
}) {
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
