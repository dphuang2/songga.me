"use server";

import { getUserOrThrow } from "./get-user-or-throw";
import { createClient } from "./server";

export async function isGameCreator({
  gameId,
}: {
  gameId: number;
}): Promise<boolean> {
  const supabase = createClient();
  const user = await getUserOrThrow({ supabase });
  const { error, count } = await supabase
    .from("game")
    .select("*", { count: "exact", head: true })
    .eq("creator", user.id)
    .eq("id", gameId);
  console.log("isGameCreator", error);
  if (error) throw error;
  if (count === null) throw Error("Did not get count of games");
  return count > 0;
}
