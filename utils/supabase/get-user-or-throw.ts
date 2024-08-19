import { User } from "@supabase/auth-js";
import { SupabaseServerClient } from "./server";

export async function getUserOrThrow({
  supabase,
}: {
  supabase: SupabaseServerClient;
}): Promise<User> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error) throw error;
  if (user === null) throw Error("Could not get user");
  return user;
}
