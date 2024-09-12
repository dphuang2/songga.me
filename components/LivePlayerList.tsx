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
  isPlayerOnAnyTeam,
}: {
  initialPlayerList: Players;
  gameId: number;
  isGameCreator: boolean;
  currentPlayerId?: number;
  isPlayerOnAnyTeam: boolean;
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
    <ul className="space-y-4">
      {playerList.map((team, i) => (
        <li
          key={i}
          className="bg-white border-4 border-black rounded-xl p-4 transform rotate-1 shadow-lg"
        >
          <div className="flex flex-wrap items-center gap-2">
            {team.players.map((player, i) => (
              <span key={i} className="inline-flex items-center">
                {player.playerId === currentPlayerId ? (
                  <div className="relative inline-flex items-center bg-yellow-300 px-3 py-1 rounded-md border-2 border-black border-b-4 border-r-4 transform -rotate-1">
                    <span className="absolute -left-2 -top-2 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full border-2 border-black border-b-4 border-r-4 transform -rotate-3">
                      You
                    </span>
                    <strong className="font-black text-lg ml-6">
                      {player.name}
                    </strong>
                  </div>
                ) : (
                  <div className="inline-flex items-center bg-gray-200 px-3 py-1 rounded-md border-2 border-black border-b-4 border-r-4 transform rotate-1">
                    <span className="font-bold text-lg">{player.name}</span>
                  </div>
                )}
                {isGameCreator && player.playerId !== currentPlayerId && (
                  <button
                    onClick={() =>
                      kickPlayerFromGame({
                        teamId: team.teamId,
                        playerId: player.playerId,
                      })
                    }
                    className="ml-2 bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded-md border-2 border-black transform rotate-1 transition-transform hover:scale-105"
                  >
                    Kick
                  </button>
                )}
                {i < team.players.length - 1 && team.players.length > 1 && (
                  <span className="mx-2 text-2xl font-black">&</span>
                )}
              </span>
            ))}
          </div>
          <div className="mt-3">
            {team.players.some(
              (player) => player.playerId === currentPlayerId
            ) ? (
              team.players.length === 1 ? null : (
                <button
                  onClick={() => leaveTeam({ gameId })}
                  className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-xl border-4 border-black transform -rotate-1 transition-transform hover:scale-105"
                >
                  Leave Team
                </button>
              )
            ) : team.players.length === 1 && isPlayerOnAnyTeam ? (
              <button
                onClick={() =>
                  joinTeam({ newTeamId: team.teamId, gameId: gameId })
                }
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl border-4 border-black transform rotate-1 transition-transform hover:scale-105"
              >
                Join Team
              </button>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
};

export default LivePlayerList;
