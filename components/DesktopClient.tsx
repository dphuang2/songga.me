"use client";

import { GameProps } from "@/app/[game]/page";
import { LiveIndicator } from "./LiveIndicator";
import LivePlayerList from "./LivePlayerList";
import { MutableRefObject, useEffect, useRef, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { GameState, gameStateSchema } from "@/utils/game-state";
import { RealtimeChannel } from "@supabase/supabase-js";
import { getTeamsAndPlayersForGame } from "@/utils/supabase/get-teams-and-players-for-game";
import { MusicIcon } from "./MusicIcon";

export function DesktopClient(props: GameProps) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const gameRoom = useRef<RealtimeChannel | null>(null);
  useEffect(() => {
    const supabase = createClient();
    gameRoom.current = supabase.channel(props.gameSlug, {
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
    <Game {...props} gameState={gameState} />
  ) : (
    <Lobby {...props} gameRoom={gameRoom} />
  );
}

function Game(props: GameProps & { gameState: GameState }) {
  return <Scoreboard />;
}

function Scoreboard() {
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
    <div className="flex items-center justify-center min-h-screen bg-yellow-400 p-4 sm:p-8 font-sans">
      <div className="relative bg-white border-8 border-black rounded-3xl p-6 w-full max-w-4xl transform rotate-1 shadow-2xl border-b-[16px] border-r-[16px]">
        <div className="absolute -top-8 -left-8 bg-red-500 w-16 h-16 rounded-full border-t-4 border-l-4 border-r-8 border-b-8 border-black flex items-center justify-center">
          <MusicIcon />
        </div>
        <div className="mb-6 border-b-8 border-black pb-4">
          <div className="flex items-center gap-4 mb-4">
            <h2 className="text-5xl font-black uppercase bg-purple-300 px-4 py-2 rounded-xl border-4 border-black transform -rotate-2">
              Round
            </h2>
            <div className="bg-green-400 border-4 border-black w-16 h-16 flex items-center justify-center text-4xl font-black rounded-xl transform rotate-3">
              1
            </div>
          </div>
          <div className="bg-blue-400 border-4 border-black px-6 py-3 text-2xl font-black uppercase rounded-xl inline-block transform -rotate-1">
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
}

function TeamScore({
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
}) {
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
      className={`${bgColor} border-4 border-black p-4 rounded-xl ${rotation} relative transition-all duration-300
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
        <div className="absolute -top-6 -right-6 bg-purple-500 text-white px-3 py-1 rounded-full border-4 border-black font-bold text-sm shadow-lg">
          Current Picker
        </div>
      )}
      <h3 className="text-2xl font-black mb-2 uppercase flex items-center flex-wrap">
        <span className="break-words mr-2">{name}</span>
        {rankInfo && (
          <span
            className={`mt-1 ${rankInfo.bg} rounded-full w-8 h-8 flex items-center justify-center border-2 border-black flex-shrink-0`}
          >
            <span className="text-2xl">{rankInfo.emoji}</span>
          </span>
        )}
      </h3>
      <div className="flex items-center justify-between bg-white border-4 border-black p-2 rounded-lg">
        <div className="text-xl font-black">Score</div>
        <div className="text-3xl font-black">{score}</div>
      </div>
      <div className="mt-2">
        {players.map((player, index) => (
          <div key={index} className="text-lg font-bold">
            {player}
          </div>
        ))}
      </div>
      {isTyping && (
        <div className="absolute -top-2 -right-2 bg-orange-400 rounded-full p-1 border-t-2 border-l-2 border-b-4 border-r-4 border-black animate-shake">
          <span className="text-sm font-bold">Typing</span>
        </div>
      )}
      {guessOrder && (
        <div
          className={`absolute -top-8 -right-4 rounded-full px-3 py-1 border-2 border-black shadow-lg transform hover:scale-105 transition-all duration-300 ${
            guessOrder === 1
              ? "bg-gradient-to-r from-yellow-400 to-amber-500 scale-110 border-b-4 border-r-4 shadow-[0_0_10px_4px_rgba(255,215,0,0.5)]"
              : "bg-gradient-to-r from-yellow-300 to-green-400 border-b-4 border-r-4"
          }`}
        >
          <span
            className={`text-lg font-bold text-black ${
              guessOrder === 1 ? "text-xl" : ""
            }`}
          >
            {getGuessOrderLabel(guessOrder)}
          </span>
          <span className={`ml-1 ${guessOrder === 1 ? "text-xl" : "text-sm"}`}>
            {guessOrder === 1 ? "🥇" : "🏆"}
          </span>
        </div>
      )}
      {outOfGuesses && (
        <div className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 border-t-2 border-l-2 border-b-4 border-r-4 border-black">
          <span className="text-sm font-bold text-white">Out of Guesses</span>
        </div>
      )}
      {isLeader && (
        <div className="absolute -top-4 -left-4 animate-bounce">
          <span className="text-4xl">👑</span>
        </div>
      )}
    </div>
  );
}

function FunFact() {
  const [fact, setFact] = useState(getRandomFact());

  useEffect(() => {
    const interval = setInterval(() => {
      setFact(getRandomFact());
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mt-6 bg-purple-200 border-4 border-black p-4 rounded-xl transform -rotate-1">
      <h3 className="text-xl font-bold mb-2">Fun Fact!</h3>
      <p className="text-lg">{fact}</p>
    </div>
  );
}

function getRandomFact() {
  const facts = [
    "The world's longest concert lasted 639 hours and 5 minutes.",
    "The first song ever sung in space was 'Jingle Bells'.",
    "The most expensive musical instrument sold for $15.9 million (a Stradivarius violin).",
    "Listening to music can temporarily reduce chronic pain by up to 21%.",
    "Playing a musical instrument can increase your IQ by up to 7 points.",
    "The shortest song ever recorded is 'You Suffer' by Napalm Death, lasting 1.316 seconds.",
    "Cows produce more milk when listening to slow music.",
    "The 'Happy Birthday' song was copyrighted for 80 years until 2016.",
    "Mozart could write an entire concerto at the age of five.",
    "Your heartbeat changes and mimics the music you listen to.",
    "The most expensive music video ever made was 'Scream' by Michael and Janet Jackson, costing $7 million.",
    "The longest officially released song is 'The Rise and Fall of Bossanova (A 13:23:32 song)' by PC III.",
    "Singing releases endorphins, oxytocin, and dopamine in the brain, making you happier.",
    "The loudest band in the world is KISS, reaching 136 decibels in a 2009 concert.",
    "Music can help plants grow faster and healthier.",
    "The Beatles have sold over 600 million records worldwide.",
    "The harmonica is the world's best-selling music instrument.",
    "The longest guitar solo ever recorded lasted for 24 hours and 18 minutes.",
    "Listening to music while working out can increase your endurance by up to 15%.",
    "The human voice is the only musical instrument that can imitate all other instruments.",
    "The most expensive concert ticket ever sold was for $3.3 million.",
    "Playing the didgeridoo can help treat sleep apnea.",
    "The first known musical instrument was the flute, dating back 43,000 years.",
    "Metallica is the first and only band to have played on all seven continents.",
    "The 'Mozart Effect' suggests that listening to Mozart can temporarily boost IQ scores.",
    "The best-selling album of all time is Michael Jackson's 'Thriller'.",
    "Music can help reduce the effects of Alzheimer's disease.",
    "The longest officially released song title has 1,022 characters.",
    "Singing in a choir can improve your mood as much as yoga.",
    "The most expensive guitar ever sold was Jimi Hendrix's Fender Stratocaster for $2 million.",
    "The term 'music' comes from the Greek word 'mousike', meaning 'art of the Muses'.",
    "Playing music can help premature babies gain weight faster.",
    "The world's largest playable guitar is 43 feet long and 16 feet wide.",
    "Listening to music can help improve your memory and cognitive performance.",
    "The bagpipes were originally used as a weapon of war to scare enemies.",
    "The first pop song to use a synthesizer was 'Born to Be Wild' by Steppenwolf.",
    "Music can help reduce anxiety in hospital patients by up to 65%.",
    "The world's smallest violin is just 1/64th the size of a full-scale violin.",
    "The 'Mosquito Alarm' uses a high-frequency tone that only young people can hear.",
    "Playing an instrument can help improve your mathematical ability.",
    "The longest drum solo lasted for 738 hours and 55 minutes.",
    "Music therapy can help stroke patients regain their speech.",
    "The most expensive piano ever sold was for $3.22 million.",
    "The human ear can distinguish between hundreds of thousands of different sounds.",
    "Listening to music can increase the amount of antibodies in your body.",
    "The first music was created in Africa about 55,000 years ago.",
    "Playing music can help children develop better social skills.",
    "The world's largest orchestra had 7,548 musicians playing together.",
    "Listening to music can help reduce chronic pain by up to 21%.",
    "The phonograph, invented by Thomas Edison in 1877, was the first device to record sound.",
    "Music can help plants grow faster and produce more crops.",
    "The longest continuous radio airplay of one artist lasted for 183 hours, featuring only Grateful Dead songs.",
    "Listening to music can help improve your sleep quality.",
    "The didgeridoo is one of the oldest wind instruments, dating back over 40,000 years.",
    "Music can help reduce the perception of effort during workouts by up to 12%.",
    "The world's largest drum measures 18 feet in diameter and weighs over 7 tons.",
    "Listening to music can increase endurance during exercise by up to 15%.",
    "The most expensive CD ever made was 'Once Upon a Time in Shaolin' by Wu-Tang Clan, sold for $2 million.",
    "Playing a musical instrument can delay the onset of dementia by up to 3.7 years.",
    "The loudest animal on Earth is the sperm whale, producing sounds up to 230 decibels.",
    "Music has been shown to reduce stress levels by up to 65%.",
    "The world's largest music collection belongs to a Brazilian businessman with over 8 million items.",
    "Listening to music can help improve your immune system function.",
    "The first music video broadcast on MTV was 'Video Killed the Radio Star' by The Buggles.",
    "Playing music can help children develop better language skills.",
    "The longest-running music show on TV is 'Top of the Pops', which aired for 42 years.",
    "The first CD pressed in the United States was Bruce Springsteen's 'Born in the U.S.A.'",
    "The human brain processes music in both hemispheres simultaneously.",
    "The world's oldest known musical instrument is a 43,000-year-old flute made from a bear femur.",
    "The 'Amen Break' is the most sampled drum beat in music history.",
    "The longest-held note in a song is 115.7 seconds, achieved by Rage Against the Machine's Tom Morello.",
    "The first-ever platinum album was Eagles' 'Their Greatest Hits (1971-1975)'.",
    "The 'Wilhelm Scream' is a famous sound effect used in over 400 films and TV series.",
    "The most expensive musical instrument is the 'Lady Blunt' Stradivarius violin, sold for $15.9 million.",
    "The longest officially released song is 'The Rise and Fall of Bossanova (A 13:23:32 song)' by PC III.",
    "The first-ever music video was made in 1894 for 'The Little Lost Child'.",
    "The 'Loudness War' refers to the trend of increasing audio levels in recorded music.",
    "The world's largest playable turntable is 25 feet in diameter.",
    "The longest applause recorded lasted for 1 hour and 20 minutes at a Luciano Pavarotti concert.",
    "The first-ever digital download single to sell 1 million copies was 'I Gotta Feeling' by The Black Eyed Peas.",
    "The most expensive album cover ever produced was for Sgt. Pepper's Lonely Hearts Club Band by The Beatles.",
    "The world's largest musical instrument is the Stalacpipe Organ in Virginia's Luray Caverns.",
    "The first song played on Mars was will.i.am's 'Reach for the Stars' in 2012.",
    "The longest title for a music album contains 156 words.",
    "The first-ever gold record was awarded to 'Chattanooga Choo Choo' by Glenn Miller in 1942.",
    "The world's smallest playable violin is just 1 inch long.",
    "The longest echo in a man-made structure lasts for 75 seconds.",
    "The first-ever music streaming service was launched in 1993 called 'Internet Underground Music Archive'.",
    "The world's largest bass drum is 20 feet in diameter and weighs 7,760 pounds.",
    "The longest continuous live radio broadcast of a single artist was 183 hours, featuring only Grateful Dead songs.",
    "The first-ever music video to reach one billion views on YouTube was 'Gangnam Style' by Psy.",
    "The world's largest collection of music memorabilia contains over 1 million items.",
    "The longest-running number one single on the US Billboard Hot 100 is 'Old Town Road' by Lil Nas X.",
    "The first-ever digital single to sell 1 million copies in the UK was 'Do They Know It's Christmas?' by Band Aid 20.",
    "The world's largest functioning musical instrument is the Great Stalacpipe Organ in Virginia's Luray Caverns.",
    "The longest marathon playing drums lasted 738 hours and 55 minutes.",
    "The first-ever song to be played in space was 'Jingle Bells' on a harmonica in 1965.",
    "The world's largest playable guitar is 43 feet long and 16 feet wide.",
    "The longest continuous DJ set lasted for 240 hours.",
    "The first-ever song to be registered for copyright was 'The Castle of Dromore' in 1877.",
    "The world's largest collection of Beatles memorabilia contains over 8,500 items.",
    "The longest concert by a solo artist lasted 60 hours and 7 minutes.",
    "The first-ever platinum-certified ringtone was 'Candy Shop' by 50 Cent featuring Olivia.",
    "The world's largest musical festival, Donauinselfest in Vienna, attracts over 3 million visitors annually.",
    "The longest-running music radio show is 'Grand Ole Opry', which has been on air since 1925.",
    "The first-ever song to be performed live on MTV Unplugged was 'Rocket Man' by Elton John.",
    "The world's largest pipe organ is in the Boardwalk Hall Auditorium Organ in Atlantic City, with over 33,000 pipes.",
    "The longest continuous live performance by a full orchestra lasted 26 hours and 180 seconds.",
  ];

  return facts[Math.floor(Math.random() * facts.length)];
}

function Lobby({
  gameId,
  gameRoom,
  isPlayerOnAnyTeam,
  isCreator,
  initialPlayerList,
  currentPlayerId,
}: GameProps & { gameRoom: MutableRefObject<RealtimeChannel | null> }) {
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
            getTeamsAndPlayersForGame({ gameId }).then((teams) => {
              const state: GameState = {
                picker: 2,
                started: true,
                score: {},
                teams,
              };
              gameRoom.current?.send({
                type: "broadcast",
                event: "game",
                payload: state,
              });
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
