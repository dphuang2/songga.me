"use client";

import React from "react";

export type Players = { players: { name: string }[] }[];

const LivePlayerList = ({
  initialPlayerList,
}: {
  initialPlayerList: Players;
}) => {
  return (
    <ol>
      {initialPlayerList.map((team, i) =>
        team.players.map((player) => <li key={i}>{player.name}</li>)
      )}
    </ol>
  );
};

export default LivePlayerList;
