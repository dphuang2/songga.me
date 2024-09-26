"use client";

import LivePlayerList from "./LivePlayerList";
import { LiveIndicator } from "./LiveIndicator";
import { PlayerNameInput } from "./PlayerNameInput";
import { GameProps } from "@/app/[game]/page";
import { Tables } from "@/utils/supabase/database.types";
import { useCallback, useEffect, useRef, useState } from "react";
import { GameStore } from "@/utils/game-state";
import { MusicIcon } from "./MusicIcon";

import { observer } from "mobx-react-lite";
import { createContext, useContext } from "react";
import { ShareThisCode } from "./ShareThisCode";
import { FunFact } from "./FunFact";
import debounce from "debounce";
import { Track } from "@spotify/web-api-ts-sdk";
import Image from "next/image";

const GameStoreContext = createContext<GameStore | null>(null);

const GameStoreProvider: React.FC<{
  children: React.ReactNode;
  gameCode: string;
  currentPlayerId: number;
}> = ({ children, gameCode, currentPlayerId }) => {
  const store = new GameStore({ gameCode, currentPlayerId });
  return (
    <GameStoreContext.Provider value={store}>
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

const MobileClientInner = observer(
  ({
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
  }) => {
    const store = useGameStore();

    if (store.isGameStarted() && store.isNotOnTeam()) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-yellow-400 p-4 font-sans">
          <div className="bg-white border-8 border-black rounded-3xl p-6 w-full max-w-md transform rotate-1 shadow-2xl border-b-[16px] border-r-[16px]">
            <h2 className="text-3xl font-black uppercase bg-red-400 px-4 py-2 rounded-xl border-4 border-black transform -rotate-2 mb-4">
              Oops!
            </h2>
            <p className="text-xl font-bold mb-4 bg-blue-300 border-4 border-black p-3 rounded-xl transform rotate-1">
              The game has already started!
            </p>
            <p className="text-lg mb-4 bg-green-300 border-4 border-black p-3 rounded-xl transform -rotate-1">
              You can't join an ongoing game. Please join a new game.
            </p>
          </div>
        </div>
      );
    }

    return store.gameState !== null ? (
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
);

export function MobileClient(props: GameProps & { player: Tables<"player"> }) {
  return (
    <GameStoreProvider
      currentPlayerId={props.currentPlayerId}
      gameCode={props.gameSlug}
    >
      <MobileClientInner {...props} />
    </GameStoreProvider>
  );
}

const Game = observer(() => {
  const store = useGameStore();
  return store.isOnPickingTeam() ? <Picker /> : <Guesser />;
});

const Picker = observer(() => {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Track[]>([]);
  const [selectedSong, setSelectedSong] = useState<Track | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const gameStore = useGameStore();

  const updateResults = async (query: string) => {
    setIsSearching(true);
    try {
      const searchResults = await gameStore.spotifySearch(
        query,
        ["track"],
        undefined,
        20
      );
      if (searchResults && searchResults.tracks && searchResults.tracks.items) {
        setResults(searchResults.tracks.items);
      } else {
        setResults([]);
      }
    } catch (error) {
      console.error("Error searching for tracks:", error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const debouncedUpdateResults = useCallback(
    debounce((query: string) => {
      if (query) {
        updateResults(query);
      } else {
        setResults([]);
      }
    }, 300),
    []
  );

  const handleSearch = (query: string) => {
    setSearch(query);
    debouncedUpdateResults(query);
  };

  const handleSelectSong = (song: Track) => {
    setSelectedSong(song);
    setResults([]);
    setSearch("");
  };

  if (gameStore.isCurrentRoundActive()) {
    return (
      <div className="flex flex-col justify-start min-h-screen bg-yellow-400 p-4 pb-16 font-sans fixed inset-0 overflow-y-auto">
        <div className="bg-white border-8 border-black rounded-3xl p-4 sm:p-6 w-full max-w-md mx-auto transform rotate-1 shadow-2xl border-b-[16px] border-r-[16px] mt-8 sm:mt-12 md:mt-16 lg:mt-20">
          <h2 className="text-2xl sm:text-3xl font-black uppercase bg-purple-300 px-3 py-1 sm:px-4 sm:py-2 rounded-xl border-4 border-black transform -rotate-2 mb-4 sm:mb-6">
            Round in Progress
          </h2>
          <div className="mb-6 bg-green-300 border-4 border-black p-4 rounded-xl transform rotate-1">
            <p className="text-xl font-bold">You've picked a song!</p>
            <p className="text-2xl font-black mt-2">
              Wait for guessers to guess.
            </p>
          </div>
          <div className="mb-6 bg-blue-300 border-4 border-black p-4 rounded-xl transform -rotate-1">
            <p className="text-xl font-bold mb-4">Selected Song:</p>
            <div className="flex flex-col items-start">
              {gameStore.gameState?.selectedSong?.albumCoverImage && (
                <div className="w-32 h-32 mb-4 relative">
                  <Image
                    src={gameStore.gameState.selectedSong.albumCoverImage}
                    alt="Album Cover"
                    layout="fill"
                    objectFit="cover"
                    className="rounded-lg border-4 border-black"
                  />
                </div>
              )}
              <div className="text-left">
                <p className="text-2xl font-black mb-2">
                  {gameStore.gameState?.selectedSong?.name}
                </p>
                <p className="text-xl text-gray-700 font-bold">
                  {gameStore.gameState?.selectedSong?.artist}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-start min-h-screen bg-yellow-400 p-4 pb-16 font-sans fixed inset-0 overflow-y-auto">
      <div className="bg-white border-8 border-black rounded-3xl p-4 sm:p-6 w-full max-w-md mx-auto transform rotate-1 shadow-2xl border-b-[16px] border-r-[16px] mt-8 sm:mt-12 md:mt-16 lg:mt-20">
        <h2 className="text-2xl sm:text-3xl font-black uppercase bg-purple-300 px-3 py-1 sm:px-4 sm:py-2 rounded-xl border-4 border-black transform -rotate-2 mb-4 sm:mb-6">
          You are the Picker!
        </h2>
        <div className="mb-4 sm:mb-6">
          <label
            className="text-xl font-black uppercase mb-2 bg-orange-300 px-4 py-2 rounded-xl border-4 border-black transform -rotate-1 inline-block"
            htmlFor="songSearch"
          >
            Choose a song:
          </label>
          <div className="relative mt-2">
            <input
              type="text"
              id="songSearch"
              className="w-full px-4 py-2 text-lg border-4 border-black rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-400"
              placeholder="Search by artist or song name..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
              </div>
            )}
            {results.length > 0 && (
              <div className="absolute z-10 mt-2 w-full bg-white border-4 border-black rounded-xl overflow-hidden shadow-lg">
                <div className="max-h-80 overflow-y-auto relative">
                  {results.map((track) => (
                    <button
                      key={track.id}
                      className="w-full text-left px-4 py-3 text-lg font-bold hover:bg-yellow-200 focus:bg-yellow-200 focus:outline-none transition-colors flex items-start"
                      onClick={() => handleSelectSong(track)}
                    >
                      {track.album.images && track.album.images.length > 0 && (
                        <div className="flex-shrink-0 w-12 h-12 mr-3 relative">
                          <Image
                            src={
                              track.album.images[track.album.images.length - 1]
                                .url
                            }
                            alt={`${track.name} album cover`}
                            layout="fill"
                            objectFit="cover"
                            className="rounded-md"
                          />
                        </div>
                      )}
                      <div className="flex-grow min-w-0">
                        <div className="break-words">{track.name}</div>
                        <div className="text-sm text-gray-600 break-words">
                          {track.artists
                            .map((artist) => artist.name)
                            .join(", ")}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                {results.length >= 5 && (
                  <div className="h-8 bg-gradient-to-t from-white to-transparent pointer-events-none absolute bottom-0 left-0 right-0"></div>
                )}
              </div>
            )}
          </div>
        </div>
        {selectedSong && (
          <div className="mb-6 bg-blue-300 border-4 border-black p-4 rounded-xl transform -rotate-1">
            <p className="text-xl font-bold mb-4">Selected Song:</p>
            <div className="flex flex-col items-start">
              {selectedSong.album.images &&
                selectedSong.album.images.length > 0 && (
                  <div className="w-32 h-32 mb-4 relative">
                    <Image
                      src={selectedSong.album.images[0].url}
                      alt="Album Cover"
                      layout="fill"
                      objectFit="cover"
                      className="rounded-lg border-4 border-black"
                    />
                  </div>
                )}
              <div className="text-left">
                <p className="text-2xl font-black mb-2">{selectedSong.name}</p>
                <p className="text-xl text-gray-700 font-bold">
                  {selectedSong.artists.map((artist) => artist.name).join(", ")}
                </p>
              </div>
            </div>
          </div>
        )}
        <button
          className={`w-full bg-blue-500 hover:bg-blue-700 text-white text-xl font-bold py-3 px-6 rounded-xl border-4 border-black transition-colors ${
            !selectedSong ? "opacity-50 cursor-not-allowed" : ""
          }`}
          onClick={() => {
            if (selectedSong) {
              gameStore.startRound({ track: selectedSong });
            }
          }}
          disabled={!selectedSong || !gameStore.connectedToGameRoom()}
        >
          Start Round
        </button>
      </div>
    </div>
  );
});

const Guesser = observer(() => {
  const [artistSearch, setArtistSearch] = useState("");
  const [songSearch, setSongSearch] = useState("");
  const [artistResults, setArtistResults] = useState<Track[]>([]);
  const [songResults, setSongResults] = useState<Track[]>([]);
  const [isSearchingArtist, setIsSearchingArtist] = useState(false);
  const [isSearchingSong, setIsSearchingSong] = useState(false);
  const gameState = useGameStore();

  useEffect(() => {
    // Reset all state when a new round starts
    const resetState = () => {
      gameState.setGuessesLeft({ artist: 1, song: 1 });
      gameState.setCorrectArtist(false);
      gameState.setCorrectSong(false);
      setArtistSearch("");
      setSongSearch("");
      setArtistResults([]);
      setSongResults([]);
    };

    resetState();
  }, [gameState.gameState?.round]);

  const handleSearch = useCallback(
    debounce(async (type: "artist" | "song", query: string) => {
      if (query.length === 0) {
        if (type === "artist") {
          setArtistResults([]);
          setIsSearchingArtist(false);
        } else {
          setSongResults([]);
          setIsSearchingSong(false);
        }
        return;
      }

      if (type === "artist") {
        setIsSearchingArtist(true);
      } else {
        setIsSearchingSong(true);
      }

      try {
        const results = await gameState.spotifySearch(
          query,
          ["track"],
          undefined,
          5
        );

        if (results && results.tracks) {
          if (type === "artist") {
            setArtistResults(results.tracks.items);
          } else {
            setSongResults(results.tracks.items);
          }
        }
      } catch (error) {
        console.error("Error searching Spotify:", error);
      } finally {
        if (type === "artist") {
          setIsSearchingArtist(false);
        } else {
          setIsSearchingSong(false);
        }
      }
    }, 300),
    [gameState]
  );

  const handleGuess = (type: "artist" | "song", track: Track) => {
    const artistName = track.artists.map((artist) => artist.name).join(", ");
    console.log(
      `Guessed ${type}: ${type === "artist" ? artistName : track.name}`
    );
    const newGuessesLeft = {
      ...gameState.guessesLeft(),
      [type]: Math.max(0, gameState.guessesLeft()[type] - 1),
    };
    gameState.setGuessesLeft(newGuessesLeft);
    gameState.sendIsTyping(false);

    const isCorrect = gameState.isGuessCorrect(
      type,
      type === "artist" ? artistName : track.name
    );

    if (isCorrect) {
      if (type === "artist") {
        gameState.setCorrectArtist(true);
      } else {
        gameState.setCorrectSong(true);
      }
    }

    const lastGuess = newGuessesLeft.artist === 0 && newGuessesLeft.song === 0;

    // Send the guess to the host to allow the host to calculate points and update the scoreboard
    gameState.sendGuess({
      type,
      value: type === "artist" ? artistName : track.name,
      lastGuess,
      guessesLeft: gameState.guessesLeft(),
      correctArtist: gameState.correctArtist(),
      correctSong: gameState.correctSong(),
    });

    // Update game state accordingly
    if (type === "artist") {
      setArtistSearch(artistName);
      setArtistResults([]);
    } else {
      setSongSearch(track.name);
      setSongResults([]);
    }
  };

  if (!gameState.isCurrentRoundActive()) {
    return (
      <div className="flex flex-col justify-start min-h-screen bg-yellow-400 p-4 pb-16 font-sans fixed inset-0 overflow-y-auto">
        <div className="bg-white border-8 border-black rounded-3xl p-4 sm:p-6 w-full max-w-md mx-auto transform rotate-1 shadow-2xl border-b-[16px] border-r-[16px] mt-8 sm:mt-12 md:mt-16 lg:mt-20">
          <h2 className="text-2xl sm:text-3xl font-black uppercase bg-purple-300 px-3 py-1 sm:px-4 sm:py-2 rounded-xl border-4 border-black transform -rotate-2 mb-4 sm:mb-6">
            Waiting for Song
          </h2>
          <p className="text-xl font-bold text-center">
            The picker hasn't chosen a song yet. Please wait...
          </p>
          <FunFact />
        </div>
      </div>
    );
  }

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
            <div
              className={`w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center border-4 border-black rounded-xl ${
                gameState.correctArtist()
                  ? "bg-green-400 animate-bounce"
                  : gameState.guessesLeft().artist > 0
                  ? "bg-blue-300"
                  : "bg-gray-300"
              }`}
            >
              <MusicIcon
                className={`text-3xl sm:text-4xl ${
                  gameState.correctArtist()
                    ? "text-white "
                    : gameState.guessesLeft().artist > 0
                    ? "text-black"
                    : "text-gray-500"
                }`}
              />
            </div>
            <div
              className={`w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center border-4 border-black rounded-xl ${
                gameState.correctSong()
                  ? "bg-green-400 animate-bounce"
                  : gameState.guessesLeft().song > 0
                  ? "bg-blue-300"
                  : "bg-gray-300"
              }`}
            >
              <MusicIcon
                className={`text-3xl sm:text-4xl ${
                  gameState.correctSong()
                    ? "text-white"
                    : gameState.guessesLeft().song > 0
                    ? "text-black"
                    : "text-gray-500"
                }`}
              />
            </div>
          </div>
        </div>

        {gameState.guessesLeft().artist === 0 &&
          gameState.guessesLeft().song === 0 &&
          !gameState.correctArtist() &&
          !gameState.correctSong() && (
            <div className="mb-6 bg-red-300 border-4 border-black p-4 rounded-xl transform -rotate-1 animate-shake">
              <p className="text-xl font-bold text-center">No guesses left!</p>
            </div>
          )}

        <SearchComponent
          type="artist"
          search={gameState.artistGuess() ?? artistSearch}
          setSearch={setArtistSearch}
          results={artistResults}
          gameState={gameState}
          handleSearch={(type, query) =>
            handleSearch(type, query) as Promise<void>
          }
          handleGuess={handleGuess}
          isSearching={isSearchingArtist}
        />

        <SearchComponent
          type="song"
          search={gameState.songGuess() ?? songSearch}
          setSearch={setSongSearch}
          results={songResults}
          gameState={gameState}
          handleSearch={(type, query) =>
            handleSearch(type, query) as Promise<void>
          }
          handleGuess={handleGuess}
          isSearching={isSearchingSong}
        />
      </div>
    </div>
  );
});

const SearchComponent = ({
  type,
  search,
  setSearch,
  results,
  gameState,
  handleSearch,
  handleGuess,
  isSearching,
}: {
  type: "artist" | "song";
  search: string;
  setSearch: React.Dispatch<React.SetStateAction<string>>;
  results: Track[];
  gameState: ReturnType<typeof useGameStore>;
  handleSearch: (type: "artist" | "song", query: string) => Promise<void>;
  handleGuess: (type: "artist" | "song", track: Track) => void;
  isSearching: boolean;
}) => {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchResultsRef = useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = useState(false);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (
      searchInputRef.current &&
      !searchInputRef.current.contains(e.target as Node) &&
      searchResultsRef.current &&
      !searchResultsRef.current.contains(e.target as Node)
    ) {
      setIsActive(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [handleClickOutside]);

  return (
    <div className="mb-6 search-container">
      <label
        className={`text-xl font-black uppercase mb-2 bg-orange-300 px-4 py-2 rounded-xl border-4 border-black transform ${
          type === "artist" ? "-rotate-1" : "rotate-2"
        } inline-block`}
      >
        Guess the {type}:
      </label>
      <div className="relative">
        <input
          ref={searchInputRef}
          type="text"
          className={`w-full px-4 py-2 text-lg border-4 rounded-xl focus:outline-none focus:ring-4 ${
            (type === "artist" && gameState.correctArtist()) ||
            (type === "song" && gameState.correctSong())
              ? "bg-green-200 border-green-500 text-green-700 font-bold"
              : gameState.guessesLeft()[type] === 0
              ? "bg-gray-200 cursor-not-allowed border-black"
              : "border-black focus:ring-blue-400"
          }`}
          placeholder={`${
            (type === "artist" && gameState.correctArtist()) ||
            (type === "song" && gameState.correctSong())
              ? `Correct ${type}!`
              : `Search for ${type}...`
          }`}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            gameState.sendIsTyping(true);
            handleSearch(type, e.target.value);
          }}
          onFocus={() => setIsActive(true)}
          disabled={
            gameState.guessesLeft()[type] === 0 ||
            (type === "artist"
              ? gameState.correctArtist()
              : gameState.correctSong())
          }
        />
        {((type === "artist" && gameState.correctArtist()) ||
          (type === "song" && gameState.correctSong())) && (
          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 text-2xl">
            ✓
          </span>
        )}
        {isSearching && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
          </div>
        )}
        {results.length > 0 &&
          gameState.guessesLeft()[type] > 0 &&
          isActive && (
            <div
              ref={searchResultsRef}
              className="absolute z-10 mt-2 w-full bg-white border-4 border-black rounded-xl overflow-hidden shadow-lg"
            >
              <div className="max-h-48 overflow-y-auto">
                {results.map((track, index) => (
                  <button
                    key={index}
                    className="w-full text-left px-4 py-3 text-lg font-bold hover:bg-yellow-200 focus:bg-yellow-200 focus:outline-none transition-colors flex items-center"
                    onClick={() => {
                      handleGuess(type, track);
                      setIsActive(false);
                    }}
                  >
                    {track.album.images && track.album.images.length > 0 && (
                      <div className="w-12 h-12 mr-3 relative flex-shrink-0">
                        <Image
                          src={track.album.images[0].url}
                          alt="Album Cover"
                          layout="fill"
                          objectFit="cover"
                          className="rounded-lg border-2 border-black"
                        />
                      </div>
                    )}
                    <div>
                      <p className="font-bold">{track.name}</p>
                      <p className="text-sm text-gray-600">
                        {track.artists.map((artist) => artist.name).join(", ")}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
      </div>
    </div>
  );
};

const Lobby = observer(
  ({
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
  }) => {
    return (
      <div className="flex flex-col justify-start min-h-screen bg-yellow-400 p-4 pb-36 font-sans fixed inset-0 overflow-y-auto">
        <div className="bg-white border-8 border-black rounded-3xl p-4 sm:p-6 w-full max-w-md mx-auto transform rotate-1 shadow-2xl border-b-[16px] border-r-[16px] mt-8 sm:mt-12 md:mt-16 lg:mt-20">
          <h1 className="text-2xl sm:text-3xl font-black uppercase bg-purple-300 px-3 py-1 sm:px-4 sm:py-2 rounded-xl border-4 border-black transform -rotate-2 mb-4 sm:mb-6">
            Welcome to the Lobby!
          </h1>

          <div className="mb-6 bg-green-300 border-4 border-black p-4 rounded-xl transform rotate-1">
            <h2 className="text-xl font-bold mb-2">
              Step 1: What's your name?
            </h2>
            <PlayerNameInput
              name={player.name}
              customName={player.custom_name}
              playerId={player.id}
            />
          </div>

          <div className="mb-6 bg-orange-300 border-4 border-black p-4 rounded-xl transform -rotate-1">
            <h2 className="text-xl font-bold mb-2">
              Step 2: Form teams of 2 (or not)
            </h2>
            <h3 className="text-lg font-bold mb-2">
              Cool people waiting to play <LiveIndicator />
            </h3>
            <LivePlayerList
              isPlayerOnAnyTeam={isPlayerOnAnyTeam}
              currentPlayerId={currentPlayerId}
              isGameCreator={isCreator}
              gameId={gameId}
              initialPlayerList={initialPlayerList}
            />
          </div>

          <ShareThisCode code={gameSlug} />

          {isCreator && (
            <button className="w-full bg-blue-500 hover:bg-blue-700 text-white text-xl font-bold py-3 px-6 rounded-xl border-4 border-black transition-colors">
              Start Game
            </button>
          )}
        </div>
      </div>
    );
  }
);
