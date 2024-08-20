"use client";

import { createClient } from "@/utils/supabase/client";
import { getTeamsAndPlayersForGame } from "@/utils/supabase/get-teams-and-players-for-game";
import { kickPlayerFromGame } from "@/utils/supabase/kick-player-from-game";
import React, { useEffect, useState } from "react";

export type Players = {
  players: { name: string; playerId: number }[];
  teamId: number;
}[];

const LivePlayerList = ({
  initialPlayerList,
  gameId,
}: {
  initialPlayerList: Players;
  gameId: number;
}) => {
  const supabase = createClient();
  const [playerList, setPlayerList] = useState(initialPlayerList);
  useEffect(() => {
    const channel = supabase.channel("schema-db-changes");
    channel
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
        },
        (payload) => {
          getTeamsAndPlayersForGame({ gameId }).then((players) =>
            setPlayerList(players)
          );
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <ol>
      {playerList.map((team, i) =>
        team.players.map((player) => (
          <li key={i}>
            {player.name}{" "}
            <button
              onClick={() =>
                kickPlayerFromGame({
                  teamId: team.teamId,
                  playerId: player.playerId,
                })
              }
              className="ml-2 text-sm text-red-500 hover:text-red-700"
            >
              Kick
            </button>
          </li>
        ))
      )}
    </ol>
  );
};

export default LivePlayerList;
