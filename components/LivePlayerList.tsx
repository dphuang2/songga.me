"use client";

import { createClient } from "@/utils/supabase/client";
import { getTeamsAndPlayersForGame } from "@/utils/supabase/get-teams-and-players-for-game";
import { joinTeam } from "@/utils/supabase/join-team";
import { kickPlayerFromGame } from "@/utils/supabase/kick-player-from-game";
import { leaveTeam } from "@/utils/supabase/leave-team";
import React, { useEffect, useState } from "react";

export type Players = {
  players: { name: string; playerId: number }[];
  teamId: number;
}[];

const LivePlayerList = ({
  initialPlayerList,
  gameId,
  isGameCreator,
  currentPlayerId,
}: {
  initialPlayerList: Players;
  gameId: number;
  isGameCreator: boolean;
  currentPlayerId: number;
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
      {playerList.map((team, i) => (
        <li key={i}>
          {team.players.map((player, i) => (
            <span key={i}>
              {player.playerId === currentPlayerId ? (
                <strong>{player.name}</strong>
              ) : (
                <span>{player.name}</span>
              )}
              {isGameCreator && player.playerId !== currentPlayerId && (
                <button
                  onClick={() =>
                    kickPlayerFromGame({
                      teamId: team.teamId,
                      playerId: player.playerId,
                    })
                  }
                  className="ml-1 text-sm text-red-500 hover:text-red-700"
                >
                  Kick Player
                </button>
              )}
              {i < team.players.length - 1 && team.players.length > 1
                ? " & "
                : ""}
            </span>
          ))}
          {team.players.some(
            (player) => player.playerId === currentPlayerId
          ) ? (
            team.players.length === 1 ? null : (
              <>
                {" / "}
                <button
                  onClick={() => leaveTeam({ gameId })}
                  className="text-sm text-red-500 hover:text-red-700"
                >
                  Leave Team
                </button>
              </>
            )
          ) : team.players.length === 1 ? (
            <>
              {" / "}
              <button
                onClick={() =>
                  joinTeam({ newTeamId: team.teamId, gameId: gameId })
                }
                className="text-sm text-blue-500 hover:text-blue-700"
              >
                Join Team
              </button>
            </>
          ) : null}
        </li>
      ))}
    </ol>
  );
};

export default LivePlayerList;
