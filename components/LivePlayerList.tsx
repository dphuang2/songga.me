"use client";

import { createClient } from "@/utils/supabase/client";
import { getTeamsAndPlayersForGame } from "@/utils/supabase/get-teams-and-players-for-game";
import React, { useState } from "react";

export type Players = { players: { name: string }[] }[];

const LivePlayerList = ({
  initialPlayerList,
  gameId,
}: {
  initialPlayerList: Players;
  gameId: number;
}) => {
  const supabase = createClient();
  const [playerList, setPlayerList] = useState(initialPlayerList);
  supabase
    .channel("schema-db-changes")
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
  return (
    <ol>
      {playerList.map((team, i) =>
        team.players.map((player) => <li key={i}>{player.name}</li>)
      )}
    </ol>
  );
};

export default LivePlayerList;
