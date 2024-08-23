import { RealtimeChannel } from "@supabase/supabase-js";
import { makeAutoObservable } from "mobx";
import { z } from "zod";
import { createClient } from "./supabase/client";
import { getTeamsAndPlayersForGame } from "./supabase/get-teams-and-players-for-game";

export const gameStateSchema = z.object({
  teams: z.array(
    z.object({
      teamId: z.number(),
      score: z.number(),
      picker: z.boolean(),
      guessOrder: z
        .union([z.literal(1), z.literal(2), z.literal(3)])
        .nullable(),
      isTyping: z.boolean(),
      outOfGuesses: z.boolean(),
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

  startGame({ gameId }: { gameId: number }) {
    if (this.gameRoom === null)
      throw Error("Can't start game without connection to game channel");
    getTeamsAndPlayersForGame({ gameId }).then((teams) => {
      const state: GameState = {
        teams: teams.map((team) => {
          return {
            teamId: team.teamId,
            score: 0,
            picker: false,
            guessOrder: null,
            isTyping: false,
            outOfGuesses: false,
            players: team.players.map((player) => {
              return {
                name: player.name,
                playerId: player.playerId,
              };
            }),
          };
        }),
      };

      // Randomly select a team to be the picker
      const randomIndex = Math.floor(Math.random() * state.teams.length);
      state.teams[randomIndex].picker = true;

      // Set the game state
      this.setGameState(state);
      this.gameRoom?.send({
        type: "broadcast",
        event: "game",
        payload: state,
      });
    });
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
