import LivePlayerList from "./LivePlayerList";
import { LiveIndicator } from "./LiveIndicator";
import { setupUserForGame } from "@/utils/supabase/setup-user-for-game";
import { getTeamsAndPlayersForGame } from "@/utils/supabase/get-teams-and-players-for-game";

export async function MobileClient({
  link,
  gameId,
}: {
  link: string;
  gameId: number;
}) {
  const { player, supabase } = await setupUserForGame({ gameId });
  const players = await getTeamsAndPlayersForGame({ gameId, supabase });
  return (
    <>
      <p className="text-sm text-gray-400">
        Currently in the lobby for <span className="text-blue-300">{link}</span>
      </p>
      <h2 className="text-lg font-semibold">What is your name?</h2>
      <input
        className="mt-2 mb-4 p-2 border border-gray-300 rounded-md w-full"
        placeholder={player.name}
      />
      <hr className="my-4 border-t border-gray-200 w-full" />
      <h3>
        Players waiting to have fun! <LiveIndicator />
      </h3>
      <LivePlayerList initialPlayerList={players} />
    </>
  );
}
