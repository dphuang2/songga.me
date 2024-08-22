import { Players } from "@/components/LivePlayerList";
import { isMobileDevice } from "@/utils/is-mobile-device";
import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { MobileClient } from "@/components/MobileClient";
import { getTeamsAndPlayersForGame } from "@/utils/supabase/get-teams-and-players-for-game";
import { isGameCreator } from "@/utils/supabase/is-game-creator";
import { getUserAndPlayer } from "@/utils/supabase/get-user-and-player";
import { setupUserForGame } from "@/utils/supabase/setup-user-for-game";
import { DesktopClient } from "@/components/DesktopClient";
import { isPlayerOnAnyTeam } from "@/utils/supabase/is-player-on-any-team";

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
  const players = await getTeamsAndPlayersForGame({ gameId });
  const isOnTeam = await isPlayerOnAnyTeam({
    gameId,
    playerId: currentPlayerId,
  });
  return (
    <div>
      {true && !isCreator ? (
        <Mobile
          initialPlayerList={players}
          currentPlayerId={currentPlayerId}
          isCreator={isCreator}
          gameId={gameId}
          link={link}
          gameSlug={params.game}
          isPlayerOnAnyTeam={isOnTeam}
        />
      ) : (
        <DesktopClient
          gameSlug={params.game}
          initialPlayerList={players}
          currentPlayerId={currentPlayerId}
          isCreator={isCreator}
          gameId={gameId}
          link={link}
          isPlayerOnAnyTeam={isOnTeam}
        />
      )}
    </div>
  );
}

export type GameProps = {
  link: string;
  gameId: number;
  gameSlug: string;
  isCreator: boolean;
  currentPlayerId: number;
  initialPlayerList: Players;
  isPlayerOnAnyTeam: boolean;
};

async function Mobile({
  link,
  gameId,
  isCreator,
  currentPlayerId,
  initialPlayerList,
  gameSlug,
  isPlayerOnAnyTeam,
}: GameProps) {
  const { player } = await setupUserForGame({ gameId });
  return (
    <MobileClient
      isPlayerOnAnyTeam={isPlayerOnAnyTeam}
      gameSlug={gameSlug}
      currentPlayerId={currentPlayerId}
      player={player}
      isCreator={isCreator}
      gameId={gameId}
      link={link}
      initialPlayerList={initialPlayerList}
    />
  );
}
