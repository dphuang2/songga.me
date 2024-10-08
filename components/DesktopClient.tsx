"use client";

import { GameProps } from "@/app/[game]/page";
import { LiveIndicator } from "./LiveIndicator";
import LivePlayerList from "./LivePlayerList";
import { useEffect, useState, createContext, useContext } from "react";
import { MusicIcon } from "./MusicIcon";
import { observer } from "mobx-react-lite";
import { FunFact } from "./FunFact";
import { GameState, gameStateSchema, GameStore } from "@/utils/game-state";
import { ShareThisCode } from "./ShareThisCode";
import HiddenPlayer from "./HiddenPlayer";
import Image from "next/image";
import clsx from "clsx";

const GameStoreContext = createContext<GameStore | null>(null);

const GameStoreProvider = ({
  children,
  gameCode,
}: {
  children: React.ReactNode;
  gameCode: string;
}) => {
  const [gameStore] = useState(() => new GameStore({ gameCode }));

  useEffect(() => {
    console.log("Attempting to load game state from local storage");
    if (typeof window !== "undefined") {
      console.log("Window is defined, proceeding with local storage access");
      const savedState = localStorage.getItem(`gameState_${gameCode}`);
      console.log("Saved state from local storage:", savedState);
      if (savedState) {
        try {
          console.log("Parsing saved state");
          const parsedState = JSON.parse(savedState);
          console.log("Parsed state:", parsedState);
          console.log("Validating parsed state with gameStateSchema");
          const validatedState = gameStateSchema.parse(parsedState);
          console.log("State validation successful");
          gameStore.setGameState(validatedState);
          console.log("Game state loaded from local storage:");
          console.log(validatedState);
        } catch (error) {
          console.error("Error parsing or validating saved game state:", error);
        }
      } else {
        console.log("No saved state found in local storage");
      }
    } else {
      console.log("Window is undefined, skipping local storage access");
    }
  }, [gameCode, gameStore]);

  return (
    <GameStoreContext.Provider value={gameStore}>
      {children}
    </GameStoreContext.Provider>
  );
};

export const useGameStore = () => {
  const store = useContext(GameStoreContext);
  if (!store) {
    throw new Error("useGameStore must be used within a GameStoreProvider");
  }
  return store;
};

export const DesktopClient = observer(
  (props: Omit<GameProps, "currentPlayerId">) => {
    return (
      <GameStoreProvider gameCode={props.gameSlug}>
        <DesktopClientInner {...props} />
      </GameStoreProvider>
    );
  }
);

const DesktopClientInner = observer(
  (props: Omit<GameProps, "currentPlayerId">) => {
    const gameStore = useGameStore();

    useEffect(() => {
      gameStore.initializeGameRoom();
      return () => {
        gameStore.cleanup();
      };
    }, [props.gameSlug, gameStore]);

    return gameStore.gameState !== null ? (
      <Scoreboard {...props} />
    ) : (
      <Lobby {...props} />
    );
  }
);

const Scoreboard = observer(({}: Omit<GameProps, "currentPlayerId">) => {
  const gameStore = useGameStore();
  if (gameStore.gameState === null) return null;
  const teams = gameStore.gameState.teams;

  // Sort teams by score in descending order
  const sortedTeams = [...teams].sort((a, b) => b.score - a.score);

  return (
    <div className="flex items-center justify-center min-h-screen bg-yellow-400 p-4 sm:p-8 font-sans overflow-auto">
      <HiddenPlayer />
      <button
        onClick={async () => await gameStore.startNewRound()}
        className="fixed top-2 right-2 text-black text-xs px-2 py-1 rounded opacity-30 hover:opacity-100 transition-opacity z-50"
        title="Force start next round (Debug)"
      >
        Next Round
      </button>
      <div className="bg-white border-8 border-black rounded-3xl p-6 w-full max-w-6xl transform rotate-1 shadow-2xl border-b-[16px] border-r-[16px]">
        <div className="flex justify-between items-start mb-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <h2 className="text-4xl sm:text-5xl font-black uppercase bg-purple-300 px-4 py-2 rounded-xl border-4 border-black transform -rotate-2">
                Round
              </h2>
              <div className="bg-green-400 border-4 border-black w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center text-3xl sm:text-4xl font-black rounded-xl transform rotate-3">
                {gameStore.gameState.round}
              </div>
            </div>
            <div className="bg-blue-400 border-4 border-black px-4 sm:px-6 py-2 sm:py-3 text-xl sm:text-2xl font-black uppercase rounded-xl inline-block transform -rotate-1 relative">
              {gameStore.currentScoreboardMessage()}
              {gameStore.connectedToGameRoom() &&
                gameStore.isCurrentRoundActive() && (
                  <div className="absolute -top-8 -right-5 bg-yellow-300 border-4 border-black rounded-full p-1 transform rotate-3 shadow-[4px_4px_0_0_rgba(0,0,0,1)] animate-shake">
                    <span className="text-3xl">🗣️</span>
                  </div>
                )}
            </div>
            {gameStore.isWaitingForNextRound() && (
              <div className="bg-blue-300 border-4 border-black p-3 rounded-lg transform rotate-1 shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-shadow duration-300 max-w-[300px]">
                <div className="flex items-center space-x-3">
                  {gameStore.gameState.lastSong.albumCoverImage && (
                    <div className="w-16 h-16 relative flex-shrink-0">
                      <Image
                        src={gameStore.gameState.lastSong.albumCoverImage}
                        alt="Album Cover"
                        className="object-cover w-full h-full rounded-md border-4 border-black"
                        width={64}
                        height={64}
                        sizes="64px"
                      />
                    </div>
                  )}
                  <div className="text-left overflow-hidden">
                    <p className="text-base font-bold break-words">
                      {gameStore.gameState.lastSong.name}
                    </p>
                    <p className="text-sm font-medium text-gray-700 break-words">
                      {gameStore.gameState.lastSong.artist}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          {gameStore.isWaitingForNextRound() && (
            <div className="max-w-[300px]">
              <IncorrectGuessesList />
            </div>
          )}
        </div>
        <div className="mt-4 mb-8 relative">
          <div className="h-4 bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-600 border-4 border-black rounded-lg shadow-[2px_2px_0_0_rgba(0,0,0,1)] transform flex items-center justify-center"></div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {sortedTeams.map((team, index) => (
            <TeamScore
              key={index}
              team={team}
              rank={index + 1}
              isLeader={index === 0 && !gameStore.allScoresAreSame()}
              allScoresAreSame={gameStore.allScoresAreSame()}
              picker={gameStore.isTeamPicker(team.teamId)}
              isWaitingForNextRound={gameStore.isWaitingForNextRound()}
              correctGuessWasMade={gameStore.correctGuessWasMade()}
              roundStartTime={gameStore.gameState!.roundStartTime}
            />
          ))}
        </div>
      </div>
    </div>
  );
});

const IncorrectGuessesList = observer(() => {
  const gameStore = useGameStore();
  const teams = gameStore.gameState?.teams || [];

  const incorrectGuesses = teams.flatMap((team) =>
    [
      !team.correctArtist && team.artistGuess
        ? {
            teamName: team.players.map((p) => p.name).join(", "),
            guess: team.artistGuess,
            type: "artist",
          }
        : null,
      !team.correctSong && team.songGuess
        ? {
            teamName: team.players.map((p) => p.name).join(", "),
            guess: team.songGuess,
            type: "song",
          }
        : null,
    ].filter((guess): guess is NonNullable<typeof guess> => guess !== null)
  );

  if (incorrectGuesses.length === 0) {
    return null;
  }

  return (
    <div className="bg-red-400 border-4 border-black rounded-lg p-2 transform -rotate-1 shadow-[4px_4px_0_0_rgba(0,0,0,1)] text-base relative">
      <div className="absolute -top-6 -right-5 w-10 h-10 bg-red-200 rounded-lg border-2 border-black flex items-center justify-center shadow-[2px_2px_0_0_rgba(0,0,0,1)] z-20 transform rotate-12">
        <span className="text-xl rotate-6" role="img" aria-label="Incorrect">
          ⛔
        </span>
      </div>
      <ul className="space-y-1 relative z-10">
        {incorrectGuesses.map((guess, index) => (
          <li
            key={index}
            className="bg-red-300 border-2 border-black p-1 rounded text-sm transform -rotate-1 shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
          >
            <span className="text-red-800">{guess.teamName}:</span>{" "}
            <span className="font-semibold text-red-950">{guess.guess}</span>{" "}
            <span className="text-gray-500 text-xs italic">
              ({guess.type === "artist" ? "👤" : "🎵"})
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
});

const TeamScore = observer(
  ({
    rank,
    isLeader,
    allScoresAreSame,
    picker,
    team,
    isWaitingForNextRound,
    correctGuessWasMade,
    roundStartTime,
  }: {
    team: GameState["teams"][number];
    rank: number;
    isLeader: boolean;
    picker: boolean;
    allScoresAreSame: boolean;
    isWaitingForNextRound: boolean;
    correctGuessWasMade: boolean;
    roundStartTime: number | null;
  }) => {
    const rotation = Math.random() > 0.5 ? "rotate-2" : "-rotate-2";

    const rankSymbol = (rank: number) => {
      if (allScoresAreSame) return null;
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
      <div className={clsx("relative mb-6")}>
        <div
          className={`${
            team.bgColor
          } border-4 border-black p-3 sm:p-4 rounded-xl ${rotation} relative transition-all duration-300
          ${team.isTyping ? "scale-105 shadow-lg" : ""}
          ${
            team.guessOrder
              ? "scale-105 shadow-lg ring-4 ring-emerald-500 ring-offset-2"
              : ""
          }
          ${isLeader ? "shadow-[0_0_20px_5px_rgba(255,215,0,0.7)]" : ""}
          ${
            picker
              ? "ring-4 ring-purple-500 ring-offset-4 ring-offset-yellow-400"
              : ""
          }
          ${
            !isWaitingForNextRound && (team.outOfGuesses || team.skipped)
              ? "opacity-40"
              : ""
          }`}
        >
          {picker && (
            <div className="absolute z-10 -top-6 -right-6 bg-purple-500 text-white px-2 py-1 rounded-full border-4 border-black font-bold text-xs sm:text-sm shadow-lg">
              Current Picker
            </div>
          )}
          <div className="flex items-center justify-between bg-white border-4 border-black p-2 rounded-lg">
            <div className="text-lg sm:text-xl font-black">Score</div>
            <div className="text-2xl sm:text-3xl font-black flex items-center">
              {team.score}
              {isWaitingForNextRound && (team.guessOrder || team.wasPicker) && (
                <span className="ml-2 text-sm font-bold text-green-600">
                  +
                  {GameStore.calculateAddedScore(
                    team,
                    team.wasPicker,
                    correctGuessWasMade
                  )}
                </span>
              )}
            </div>
          </div>
          <div className="mt-2">
            {team.players.map((player, index) => (
              <div key={index} className="text-base sm:text-lg font-bold">
                {player.name}
              </div>
            ))}
          </div>
          {team.isTyping && (
            <div className="absolute -top-2 -right-2 bg-orange-400 rounded-full p-1 border-t-2 border-l-2 border-b-4 border-r-4 border-black animate-shake">
              <span className="text-xs sm:text-sm font-bold">Typing</span>
            </div>
          )}
          {team.guessOrder && !isWaitingForNextRound && (
            <div
              className={`absolute z-0 -top-6 sm:-top-8 -right-2 sm:-right-4 rounded-full px-2 sm:px-3 py-1 border-2 border-black shadow-lg transform hover:scale-105 transition-all duration-300 ${
                team.guessOrder === 1
                  ? "bg-gradient-to-r from-yellow-400 to-amber-500 scale-110 border-b-4 border-r-4 shadow-[0_0_10px_4px_rgba(255,215,0,0.5)]"
                  : "bg-gradient-to-r from-yellow-300 to-green-400 border-b-4 border-r-4"
              }`}
            >
              <span
                className={`text-base sm:text-lg font-bold text-black ${
                  team.guessOrder === 1 ? "text-lg sm:text-xl" : ""
                }`}
              >
                {getGuessOrderLabel(team.guessOrder)} Correct
                {team.guessTime && roundStartTime !== null && (
                  <span className="ml-1 text-xs font-normal opacity-75">
                    ({((team.guessTime - roundStartTime) / 1000).toFixed(1)}s)
                  </span>
                )}
              </span>
            </div>
          )}
          {team.cheater && (
            <div
              className={clsx(
                "absolute rounded-full p-1 border-t-2 border-l-2 border-b-4 border-r-4 border-black",
                "bg-orange-500",
                "bottom-0 right-0 transform translate-x-1/2 translate-y-1/2 -rotate-12"
              )}
            >
              <span className="text-xs sm:text-sm font-bold text-white text-nowrap">
                CHEATER!! 🕵️
              </span>
            </div>
          )}
          {!isWaitingForNextRound && team.outOfGuesses && (
            <div className="absolute -top-2 -right-2 bg-red-500 rotate-6 rounded-full p-1 border-t-2 border-l-2 border-b-4 border-r-4 border-black">
              <span className="text-xs sm:text-sm font-bold text-white">
                Out of Guesses
              </span>
            </div>
          )}
          {!isWaitingForNextRound && team.skipped && (
            <div className="absolute -top-2 -right-2 bg-red-500 rotate-6 rounded-full p-1 border-t-2 border-l-2 border-b-4 border-r-4 border-black">
              <span className="text-xs sm:text-sm font-bold text-white">
                Skipped
              </span>
            </div>
          )}
          {isLeader && (
            <div className="absolute -top-4 -left-4 animate-bounce">
              <span className="text-3xl sm:text-4xl transform -rotate-12 inline-block">
                👑
              </span>
            </div>
          )}
          {rankInfo && (
            <div
              className={`${rankInfo.bg} rounded-full w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center border-2 border-black flex-shrink-0 absolute bottom-2 right-2`}
            >
              <span className="text-xl sm:text-2xl">{rankInfo.emoji}</span>
            </div>
          )}
          {isWaitingForNextRound &&
            (team.correctArtist ||
              team.correctSong ||
              team.guessOrder ||
              team.skipped ||
              team.outOfGuesses) && (
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 flex items-center space-x-1">
                {team.guessOrder && (
                  <div className="bg-yellow-300 rounded-full w-8 h-8 flex items-center justify-center border-t-2 border-l-2 border-b-4 border-r-4 border-black rotate-3">
                    <span className="text-lg font-bold relative z-10">
                      {team.guessOrder}
                    </span>
                    <div className="absolute inset-0 bg-yellow-400 rounded-full opacity-50 transform scale-90"></div>
                  </div>
                )}
                {(team.correctArtist || team.correctSong) && (
                  <div className="bg-lime-300 rounded-full w-8 h-8 flex items-center justify-center border-t-2 border-l-2 border-b-4 border-r-4 border-black rotate-3">
                    <span className="text-lg relative z-10">
                      {team.correctArtist && team.correctSong
                        ? "🎯"
                        : team.correctArtist
                        ? "👤"
                        : team.correctSong
                        ? "🎵"
                        : ""}
                    </span>
                  </div>
                )}
                {team.skipped && (
                  <div className="bg-red-600 rounded-full w-8 h-8 flex items-center justify-center border-t-2 border-l-2 border-b-4 border-r-4 border-black rotate-3">
                    <span className="text-lg relative z-10">⏭️</span>
                  </div>
                )}
                {team.outOfGuesses && (
                  <div className="bg-gray-500 rounded-full w-8 h-8 flex items-center justify-center border-t-2 border-l-2 border-b-4 border-r-4 border-black rotate-3">
                    <span className="text-lg relative z-10">🚫</span>
                  </div>
                )}
              </div>
            )}
        </div>
      </div>
    );
  }
);

const Lobby = observer(
  ({
    link,
    gameId,
    isCreator,
    initialPlayerList,
    isPlayerOnAnyTeam,
    gameSlug,
  }: Omit<GameProps, "currentPlayerId">) => {
    const gameStore = useGameStore();

    return (
      <div className="flex flex-col justify-start min-h-screen bg-yellow-400 p-4 pb-16 font-sans fixed inset-0 overflow-y-auto">
        <div className="bg-white border-8 border-black rounded-3xl p-4 sm:p-6 w-full max-w-2xl mx-auto transform rotate-1 shadow-2xl border-b-[16px] border-r-[16px] mt-8 sm:mt-12 md:mt-16 lg:mt-20">
          <h1 className="text-3xl sm:text-4xl font-black uppercase bg-purple-300 px-3 py-1 sm:px-4 sm:py-2 rounded-xl border-4 border-black transform -rotate-2 mb-4 sm:mb-6">
            You are the Host!
          </h1>

          <ShareThisCode code={gameSlug} />

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
            />
          </div>

          {isCreator && (
            <button
              onClick={() => {
                gameStore.startGame({ gameId });
              }}
              className="w-full bg-blue-500 hover:bg-blue-700 text-white text-xl font-bold py-3 px-6 rounded-xl border-4 border-black transition-colors mb-6"
            >
              Start Game
            </button>
          )}
        </div>
      </div>
    );
  }
);
