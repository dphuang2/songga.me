"use server";

import { createClient } from "./server";

export async function updateNameOfPlayer({
  playerId,
  name,
}: {
  playerId: number;
  name: string;
}) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("player")
    .update({ custom_name: name })
    .eq("id", playerId)
    .select("*");
  if (error) console.error(error);
}
