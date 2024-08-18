import { LiveIndicator } from "@/components/LiveIndicator";
import LivePlayerList from "@/components/LivePlayerList";
import QRCodeGenerator from "@/components/QRCode";
import { isMobileDevice } from "@/utils/is-mobile-device";
import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { MobileClient } from "@/components/MobileClient";

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
  return (
    <div>
      {true ? (
        <Mobile gameId={existingGame.data[0].id} link={link} />
      ) : (
        <Desktop link={link} />
      )}
    </div>
  );
}

async function Mobile({ link, gameId }: { link: string; gameId: number }) {
  return (
    <main className="container mx-auto py-16 flex flex-col justify-center items-center px-4">
      <article className="prose">
        <MobileClient gameId={gameId} link={link} />
        <h3>Want to invite others?</h3>
        <p>Share this QR code for anyone else who wants to play</p>
        <QRCodeGenerator url={link} />
      </article>
    </main>
  );
}

function Desktop({ link }: { link: string }) {
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
        <LivePlayerList initialPlayerList={[{ players: [{ name: "test" }] }]} />
      </article>
    </main>
  );
}
