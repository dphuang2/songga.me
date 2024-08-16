"use client";

import React from "react";

export function GameInstructions({ link }: { link: string }) {
  return (
    <>
      <li>
        All players open the game on their phone:{" "}
        <span className="cursor-pointer text-blue-500 hover:text-blue-700">
          {link}
        </span>
      </li>
      <li>Enter your name</li>
      <li>Join others to form teams of 2</li>
      <li>When everyone is ready, click "Start Game" </li>
    </>
  );
}
