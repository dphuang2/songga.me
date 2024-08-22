"use client";

import { GameProps } from "@/app/[game]/page";
import { LiveIndicator } from "./LiveIndicator";
import LivePlayerList from "./LivePlayerList";
import { StartGameButton } from "./StartGameButton";

export function DesktopClient({
  gameId,
  isCreator,
  currentPlayerId,
  initialPlayerList,
  isPlayerOnAnyTeam,
}: GameProps) {
  return (
    <>
      <StartGameButton gameId={gameId} />
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
    </>
  );
}
