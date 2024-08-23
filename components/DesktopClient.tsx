"use client";

import { GameProps } from "@/app/[game]/page";
import { LiveIndicator } from "./LiveIndicator";
import LivePlayerList from "./LivePlayerList";
import { useEffect, useState, createContext, useContext } from "react";
import { createClient } from "@/utils/supabase/client";
import { GameState, gameStateSchema } from "@/utils/game-state";
import { RealtimeChannel } from "@supabase/supabase-js";
import { getTeamsAndPlayersForGame } from "@/utils/supabase/get-teams-and-players-for-game";
import { MusicIcon } from "./MusicIcon";
import { makeAutoObservable } from "mobx";
import { observer } from "mobx-react-lite";
import { FunFact } from "./FunFact";

class GameStore {
  gameState: GameState | null = null;
  gameRoom: RealtimeChannel | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  setGameState(state: GameState) {
    this.gameState = state;
  }

  setGameRoom(room: RealtimeChannel) {
    this.gameRoom = room;
  }

  initializeGameRoom(gameSlug: string) {
    const supabase = createClient();
    this.gameRoom = supabase.channel(gameSlug, {
      config: { broadcast: { self: true } },
    });
    this.gameRoom.on("broadcast", { event: "game" }, ({ payload }) => {
      console.log(payload);
      this.setGameState(gameStateSchema.parse(payload));
    });
    this.gameRoom.subscribe();
  }

  cleanup() {
    this.gameRoom?.unsubscribe();
    this.gameRoom = null;
  }
}

const GameStoreContext = createContext<GameStore | null>(null);

const GameStoreProvider = ({ children }: { children: React.ReactNode }) => {
  const [gameStore] = useState(() => new GameStore());
  return (
    <GameStoreContext.Provider value={gameStore}>
      {children}
    </GameStoreContext.Provider>
  );
};

const useGameStore = () => {
  const store = useContext(GameStoreContext);
  if (!store) {
    throw new Error("useGameStore must be used within a GameStoreProvider");
  }
  return store;
};

export const DesktopClient = observer((props: GameProps) => {
  return (
    <GameStoreProvider>
      <DesktopClientInner {...props} />
    </GameStoreProvider>
  );
});

const DesktopClientInner = observer((props: GameProps) => {
  const gameStore = useGameStore();

  useEffect(() => {
    gameStore.initializeGameRoom(props.gameSlug);
    return () => {
      gameStore.cleanup();
    };
  }, [props.gameSlug, gameStore]);

  return gameStore.gameState !== null ? (
    <Game {...props} />
  ) : (
    <Lobby {...props} />
  );
});

function Game(props: GameProps) {
  return <Scoreboard />;
}

const Scoreboard = observer(() => {
  const teams = [
    {
      name: "A",
      score: 42,
      isTyping: true,
      players: ["Alice"],
      guessOrder: null,
    },
    { name: "B", score: 46, guessOrder: 1, players: ["Bob", "Bill"] },
    {
      name: "Solo C-Note",
      score: 38,
      isPicker: true,
      players: ["Charlie"],
      guessOrder: null,
    },
    {
      name: "Dazzling D&D",
      score: 51,
      guessOrder: 2,
      players: ["David", "Diana"],
    },
    {
      name: "E",
      score: 40,
      isTyping: true,
      players: ["Eve"],
      guessOrder: null,
    },
    { name: "F", score: 48, players: ["Frank", "Fiona"], guessOrder: null },
    { name: "G", score: 35, guessOrder: 3, players: ["George"] },
    { name: "H", score: 53, players: ["Hannah", "Harry"], outOfGuesses: true },
  ];

  // Sort teams by score in descending order
  const sortedTeams = [...teams].sort((a, b) => b.score - a.score);

  return (
    <div className="flex items-center justify-center min-h-screen bg-yellow-400 p-4 sm:p-8 font-sans overflow-auto">
      <div className="relative bg-white border-8 border-black rounded-3xl p-6 w-full max-w-4xl transform rotate-1 shadow-2xl border-b-[16px] border-r-[16px]">
        <div className="absolute -top-8 -left-8 bg-red-500 w-16 h-16 rounded-full border-t-4 border-l-4 border-r-8 border-b-8 border-black flex items-center justify-center">
          <MusicIcon />
        </div>
        <div className="mb-6 border-b-8 border-black pb-4">
          <div className="flex items-center gap-4 mb-4">
            <h2 className="text-4xl sm:text-5xl font-black uppercase bg-purple-300 px-4 py-2 rounded-xl border-4 border-black transform -rotate-2">
              Round
            </h2>
            <div className="bg-green-400 border-4 border-black w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center text-3xl sm:text-4xl font-black rounded-xl transform rotate-3">
              1
            </div>
          </div>
          <div className="bg-blue-400 border-4 border-black px-4 sm:px-6 py-2 sm:py-3 text-xl sm:text-2xl font-black uppercase rounded-xl inline-block transform -rotate-1">
            Guessing
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {sortedTeams.map((team, index) => (
            <TeamScore
              key={index}
              name={team.name}
              score={team.score}
              isTyping={team.isTyping}
              isPicker={team.isPicker}
              guessOrder={team.guessOrder}
              players={team.players}
              rank={index + 1}
              isLeader={index === 0}
              outOfGuesses={team.outOfGuesses}
            />
          ))}
        </div>
        <FunFact />
      </div>
    </div>
  );
});

const TeamScore = observer(
  ({
    name,
    score,
    isTyping,
    isPicker,
    guessOrder,
    players,
    rank,
    isLeader,
    outOfGuesses,
  }: {
    name: string;
    score: number;
    isTyping?: boolean;
    isPicker?: boolean;
    guessOrder?: number | null;
    players: string[];
    rank: number;
    isLeader: boolean;
    outOfGuesses?: boolean;
  }) => {
    const bgColors = [
      "bg-pink-300",
      "bg-green-300",
      "bg-blue-300",
      "bg-yellow-300",
    ];
    const bgColor = bgColors[Math.floor(Math.random() * bgColors.length)];
    const rotation = Math.random() > 0.5 ? "rotate-2" : "-rotate-2";

    const rankSymbol = (rank: number) => {
      switch (rank) {
        case 1:
          return { emoji: "🥇", bg: "bg-yellow-500" };
        case 2:
          return { emoji: "🥈", bg: "bg-gray-300" };
        case 3:
          return { emoji: "🥉", bg: "bg-orange-400" };
        default:
          return null;
      }
    };

    const rankInfo = rankSymbol(rank);

    const getGuessOrderLabel = (order: number) => {
      switch (order) {
        case 1:
          return "1st";
        case 2:
          return "2nd";
        case 3:
          return "3rd";
        default:
          return `${order}th`;
      }
    };

    return (
      <div
        className={`${bgColor} border-4 border-black p-3 sm:p-4 rounded-xl ${rotation} relative transition-all duration-300
        ${isTyping ? "scale-105 shadow-lg" : ""}
        ${
          guessOrder
            ? "scale-105 shadow-lg ring-4 ring-emerald-500 ring-offset-2"
            : ""
        }
        ${isLeader ? "shadow-[0_0_20px_5px_rgba(255,215,0,0.7)]" : ""}
        ${
          isPicker
            ? "ring-4 ring-purple-500 ring-offset-4 ring-offset-yellow-400"
            : ""
        }
        ${outOfGuesses ? "opacity-40" : ""}`}
      >
        {isPicker && (
          <div className="absolute -top-6 -right-6 bg-purple-500 text-white px-2 py-1 rounded-full border-4 border-black font-bold text-xs sm:text-sm shadow-lg">
            Current Picker
          </div>
        )}
        <h3 className="text-xl sm:text-2xl font-black mb-2 uppercase relative">
          <div className="flex items-center justify-between">
            <span className="break-words pr-8">{name}</span>
          </div>
        </h3>
        <div className="flex items-center justify-between bg-white border-4 border-black p-2 rounded-lg">
          <div className="text-lg sm:text-xl font-black">Score</div>
          <div className="text-2xl sm:text-3xl font-black">{score}</div>
        </div>
        <div className="mt-2">
          {players.map((player, index) => (
            <div key={index} className="text-base sm:text-lg font-bold">
              {player}
            </div>
          ))}
        </div>
        {isTyping && (
          <div className="absolute -top-2 -right-2 bg-orange-400 rounded-full p-1 border-t-2 border-l-2 border-b-4 border-r-4 border-black animate-shake">
            <span className="text-xs sm:text-sm font-bold">Typing</span>
          </div>
        )}
        {guessOrder && (
          <div
            className={`absolute -top-6 sm:-top-8 -right-2 sm:-right-4 rounded-full px-2 sm:px-3 py-1 border-2 border-black shadow-lg transform hover:scale-105 transition-all duration-300 ${
              guessOrder === 1
                ? "bg-gradient-to-r from-yellow-400 to-amber-500 scale-110 border-b-4 border-r-4 shadow-[0_0_10px_4px_rgba(255,215,0,0.5)]"
                : "bg-gradient-to-r from-yellow-300 to-green-400 border-b-4 border-r-4"
            }`}
          >
            <span
              className={`text-base sm:text-lg font-bold text-black ${
                guessOrder === 1 ? "text-lg sm:text-xl" : ""
              }`}
            >
              {getGuessOrderLabel(guessOrder)}
            </span>
            <span
              className={`ml-1 ${
                guessOrder === 1 ? "text-lg sm:text-xl" : "text-xs sm:text-sm"
              }`}
            >
              {guessOrder === 1 ? "🥇" : "🏆"}
            </span>
          </div>
        )}
        {outOfGuesses && (
          <div className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 border-t-2 border-l-2 border-b-4 border-r-4 border-black">
            <span className="text-xs sm:text-sm font-bold text-white">
              Out of Guesses
            </span>
          </div>
        )}
        {isLeader && (
          <div className="absolute -top-4 -left-4 animate-bounce">
            <span className="text-3xl sm:text-4xl">👑</span>
          </div>
        )}
        {rankInfo && (
          <div
            className={`${rankInfo.bg} rounded-full w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center border-2 border-black flex-shrink-0 absolute bottom-2 right-2`}
          >
            <span className="text-xl sm:text-2xl">{rankInfo.emoji}</span>
          </div>
        )}
      </div>
    );
  }
);

const Lobby = observer(
  ({
    link,
    gameId,
    isCreator,
    currentPlayerId,
    initialPlayerList,
    isPlayerOnAnyTeam,
  }: GameProps) => {
    const gameStore = useGameStore();

    return (
      <div className="flex flex-col justify-start min-h-screen bg-yellow-400 p-4 pb-16 font-sans fixed inset-0 overflow-y-auto">
        <div className="bg-white border-8 border-black rounded-3xl p-4 sm:p-6 w-full max-w-2xl mx-auto transform rotate-1 shadow-2xl border-b-[16px] border-r-[16px] mt-8 sm:mt-12 md:mt-16 lg:mt-20">
          <h1 className="text-3xl sm:text-4xl font-black uppercase bg-purple-300 px-3 py-1 sm:px-4 sm:py-2 rounded-xl border-4 border-black transform -rotate-2 mb-4 sm:mb-6">
            You are the Host!
          </h1>

          <div className="mb-6 bg-green-300 border-4 border-black p-4 rounded-xl transform rotate-1">
            <h2 className="text-2xl font-bold mb-2">How to start the game:</h2>
            <ol className="list-decimal list-inside">
              <li className="mb-2">
                Make sure your Spotify is playing on a device everyone can hear
              </li>
              <li>
                When everyone is ready, click the "Start Game" button below
              </li>
            </ol>
          </div>

          <div className="mb-6 bg-orange-300 border-4 border-black p-4 rounded-xl transform -rotate-1">
            <h3 className="text-xl font-bold mb-2">
              Cool people waiting to play <LiveIndicator />
            </h3>
            <LivePlayerList
              isPlayerOnAnyTeam={isPlayerOnAnyTeam}
              isGameCreator={isCreator}
              gameId={gameId}
              initialPlayerList={initialPlayerList}
              currentPlayerId={currentPlayerId}
            />
          </div>

          {isCreator && (
            <button
              onClick={() => {
                getTeamsAndPlayersForGame({ gameId }).then((teams) => {
                  const state: GameState = {
                    picker: 2,
                    started: true,
                    score: {},
                    teams,
                  };
                  gameStore.gameRoom?.send({
                    type: "broadcast",
                    event: "game",
                    payload: state,
                  });
                });
              }}
              className="w-full bg-blue-500 hover:bg-blue-700 text-white text-xl font-bold py-3 px-6 rounded-xl border-4 border-black transition-colors mb-6"
            >
              Start Game
            </button>
          )}

          <p className="text-sm text-center mt-4">
            Lobby: <span className="font-bold">{link}</span>
          </p>
        </div>
      </div>
    );
  }
);
