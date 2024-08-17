"use client";

import React from "react";

const LivePlayerList = ({
  initialPlayerList,
}: {
  initialPlayerList: { players: { name: string }[] }[];
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
