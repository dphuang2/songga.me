import { z } from "zod";

export const gameStateSchema = z.object({
  picker: z.number(),
  started: z.boolean(),
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
