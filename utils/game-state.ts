import { z } from "zod";

export const gameStateSchema = z.object({
  picker: z.number().describe("Team ID"),
});

export type GameState = z.infer<typeof gameStateSchema>;
