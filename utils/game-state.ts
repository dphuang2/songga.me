import { z } from "zod";

export const gameStateSchema = z.object({
  picker: z.number(),
  started: z.boolean(),
});

export type GameState = z.infer<typeof gameStateSchema>;
