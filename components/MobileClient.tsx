import LivePlayerList from "./LivePlayerList";
import { LiveIndicator } from "./LiveIndicator";
import { setupUserForGame } from "@/utils/supabase/setup-user-for-game";
import { getTeamsAndPlayersForGame } from "@/utils/supabase/get-teams-and-players-for-game";
import { PlayerNameInput } from "./PlayerNameInput";

export async function MobileClient({
  link,
  gameId,
  isGameCreator,
  currentPlayerId,
}: {
  link: string;
  gameId: number;
  isGameCreator: boolean;
  currentPlayerId: number;
}) {
  const { player, supabase } = await setupUserForGame({ gameId });
  const players = await getTeamsAndPlayersForGame({ gameId });
  return (
    <>
      <p className="text-sm text-gray-400">
        Currently in the lobby for <span className="text-blue-300">{link}</span>
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
      <div className="p-8 shadow-md border rounded-md mb-16">
        <h2>Step 2: Form teams of 2 by joining another player, if you want</h2>
        <h4>
          Players waiting to have fun! <LiveIndicator />
        </h4>
        <p></p>
        <LivePlayerList
          currentPlayerId={currentPlayerId}
          isGameCreator={isGameCreator}
          gameId={gameId}
          initialPlayerList={players}
        />
      </div>
    </>
  );
}
