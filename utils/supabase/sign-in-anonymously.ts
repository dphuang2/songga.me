import { User } from "@supabase/auth-js";
import { SupabaseServerClient } from "./server";
import { createPlayerForUser } from "./create-player-for-user";

export async function signInAnonymously({
  supabase,
}: {
  supabase: SupabaseServerClient;
}): Promise<{ user: User; supabase: SupabaseServerClient }> {
  const user = await signInIfNotSignedIn({ supabase });
  return { user, supabase };
}

async function signInIfNotSignedIn({
  supabase,
}: {
  supabase: SupabaseServerClient;
}): Promise<User> {
  const { data } = await supabase.auth.getUser();
  const currentUser = data.user;
  if (currentUser === null) {
    const { data: anonymousUser, error } =
      await supabase.auth.signInAnonymously();
    if (error) console.error(error);
    if (anonymousUser.user === null) {
      throw new Error("User data is null");
    }
    await createPlayerForUser({ user: anonymousUser.user, supabase });
    return anonymousUser.user;
  }
  return currentUser;
}
