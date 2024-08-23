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
      bgColor: z.enum([
        "bg-red-300",
        "bg-orange-300",
        "bg-yellow-300",
        "bg-green-300",
        "bg-teal-300",
        "bg-blue-300",
        "bg-indigo-300",
        "bg-purple-300",
        "bg-pink-300",
        "bg-rose-300",
        "bg-cyan-300",
        "bg-emerald-300",
        "bg-lime-300",
        "bg-amber-300",
        "bg-fuchsia-300",
        "bg-violet-300",
        "bg-sky-300",
      ]),
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
  gameCode: string;
  currentPlayerId: number | undefined;

  constructor({
    gameCode,
    currentPlayerId,
  }: {
    gameCode: string;
    currentPlayerId?: number;
  }) {
    this.currentPlayerId = currentPlayerId;
    makeAutoObservable(this);
    this.gameCode = gameCode;
    this.initializeGameRoom();
  }

  allScoresAreSame(): boolean {
    if (!this.gameState || this.gameState.teams.length === 0) return true;

    const firstScore = this.gameState.teams[0].score;
    return this.gameState.teams.every((team) => team.score === firstScore);
  }

  setGameState(state: GameState) {
    this.gameState = state;
  }

  setGameRoom(room: RealtimeChannel) {
    this.gameRoom = room;
  }

  isOnPickingTeam(): boolean {
    if (!this.gameState || !this.currentPlayerId) return false;

    const pickingTeam = this.gameState.teams.find((team) => team.picker);
    if (!pickingTeam) return false;

    return pickingTeam.players.some(
      (player) => player.playerId === this.currentPlayerId
    );
  }

  startGame({ gameId }: { gameId: number }) {
    if (this.gameRoom === null)
      throw Error("Can't start game without connection to game channel");
    getTeamsAndPlayersForGame({ gameId }).then((teams) => {
      const bgColors = [
        "bg-red-300",
        "bg-orange-300",
        "bg-yellow-300",
        "bg-green-300",
        "bg-teal-300",
        "bg-blue-300",
        "bg-indigo-300",
        "bg-purple-300",
        "bg-pink-300",
        "bg-rose-300",
        "bg-cyan-300",
        "bg-emerald-300",
        "bg-lime-300",
        "bg-amber-300",
        "bg-fuchsia-300",
        "bg-violet-300",
        "bg-sky-300",
      ] as const;
      const state: GameState = {
        teams: teams.map((team) => {
          return {
            teamId: team.teamId,
            score: 0,
            picker: false,
            guessOrder: null,
            isTyping: false,
            outOfGuesses: false,
            bgColor: bgColors[Math.floor(Math.random() * bgColors.length)],
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

  initializeGameRoom() {
    const supabase = createClient();
    this.gameRoom = supabase.channel(this.gameCode, {
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
