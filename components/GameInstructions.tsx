"use client";

import React from "react";

export function GameInstructions({ link }: { link: string }) {
  return (
    <>
      <li>
        Share the game:{" "}
        <span className="cursor-pointer text-blue-500 hover:text-blue-700">
          {link}
        </span>
      </li>
      <li>When everyone is ready, click "Start Game" </li>
    </>
  );
}
