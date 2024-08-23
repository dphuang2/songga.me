import { RealtimeChannel } from "@supabase/supabase-js";
import { makeAutoObservable } from "mobx";
import { z } from "zod";
import { createClient } from "./supabase/client";

export const gameStateSchema = z.object({
  picker: z.number(),
  started: z.boolean(),

  /**
   * Team ID -> Score
   */
  score: z.record(z.number(), z.number()),

  teams: z.array(
    z.object({
      teamId: z.number(),
      players: z.array(
        z.object({
          name: z.string(),
          playerId: z.number(),
        })
      ),
    })
  ),
});

export type GameState = z.infer<typeof gameStateSchema>;

export class GameStore {
  gameState: GameState | null = null;
  gameRoom: RealtimeChannel | null = null;

  constructor(gameSlug?: string) {
    makeAutoObservable(this);
    if (gameSlug !== undefined) this.initializeGameRoom(gameSlug);
  }

  setGameState(state: GameState) {
    this.gameState = state;
  }

  setGameRoom(room: RealtimeChannel) {
    this.gameRoom = room;
  }

  initializeGameRoom(gameSlug: string) {
    const supabase = createClient();
    this.gameRoom = supabase.channel(gameSlug, {
      config: { broadcast: { self: true } },
    });
    this.gameRoom.on("broadcast", { event: "game" }, ({ payload }) => {
      console.log(payload);
      this.setGameState(gameStateSchema.parse(payload));
    });
    this.gameRoom.subscribe();
  }

  cleanup() {
    this.gameRoom?.unsubscribe();
    this.gameRoom = null;
  }
}
