import { LiveIndicator } from "@/components/LiveIndicator";
import LivePlayerList from "@/components/LivePlayerList";
import QRCodeGenerator from "@/components/QRCode";
import { isMobileDevice } from "@/utils/is-mobile-device";
import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { MobileClient } from "@/components/MobileClient";
import { getTeamsAndPlayersForGame } from "@/utils/supabase/get-teams-and-players-for-game";
import { isGameCreator } from "@/utils/supabase/is-game-creator";
import { getUserAndPlayer } from "@/utils/supabase/get-user-and-player";

export default async function Game({ params }: { params: { game: string } }) {
  const supabase = createClient();

  const existingGame = await supabase
    .from("game")
    .select("*")
    .eq("slug", params.game);

  if (existingGame.data === null || existingGame.data.length === 0) {
    return notFound();
  }

  const link = `songga.me/${params.game}`;
  const isMobile = isMobileDevice();
  const gameId = existingGame.data[0].id;
  const isCreator = await isGameCreator({ gameId });
  const currentPlayerId = (await getUserAndPlayer({ supabase })).player.id;
  return (
    <div>
      {true ? (
        <Mobile
          currentPlayerId={currentPlayerId}
          isCreator={isCreator}
          gameId={gameId}
          link={link}
        />
      ) : (
        <Desktop
          currentPlayerId={currentPlayerId}
          isCreator={isCreator}
          gameId={gameId}
          link={link}
        />
      )}
    </div>
  );
}

async function Mobile({
  link,
  gameId,
  isCreator,
  currentPlayerId,
}: {
  link: string;
  gameId: number;
  isCreator: boolean;
  currentPlayerId: number;
}) {
  return (
    <main className="container mx-auto py-16 flex flex-col justify-center items-center px-4">
      <article className="prose">
        <MobileClient
          currentPlayerId={currentPlayerId}
          isGameCreator={isCreator}
          gameId={gameId}
          link={link}
        />
        <h3>Want to invite others?</h3>
        <p>Share this QR code for anyone else who wants to play</p>
        <QRCodeGenerator url={link} />
      </article>
    </main>
  );
}

async function Desktop({
  link,
  gameId,
  isCreator,
  currentPlayerId,
}: {
  link: string;
  gameId: number;
  isCreator: boolean;
  currentPlayerId: number;
}) {
  const players = await getTeamsAndPlayersForGame({ gameId });
  return (
    <main className="container mx-auto py-16 flex justify-center items-center px-4 md:px-0">
      <article className="prose">
        <h1 className="text-gray-400">Waiting to start the game...</h1>
        <h2>How to start the game</h2>
        <ol>
          <li>
            All players open the game on their phone:{" "}
            <span className="cursor-pointer text-blue-500 hover:text-blue-700">
              {link}
            </span>
            . You can use the following QR code if its easier.
          </li>
          <QRCodeGenerator url={link} />
          <li>Enter your name</li>
          <li>Join others to form teams of 2</li>
          <li>
            Make sure your Spotify is playing on a device everyone can hear
          </li>
          <li>When everyone is ready, click "Start Game" button below. </li>
        </ol>
        <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mb-3">
          Start Game
        </button>
        <h2>
          Cool people waiting to play <LiveIndicator />
        </h2>
        <LivePlayerList
          isGameCreator={isCreator}
          gameId={gameId}
          initialPlayerList={players}
          currentPlayerId={currentPlayerId}
        />
      </article>
    </main>
  );
}
