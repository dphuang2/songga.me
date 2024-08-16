import { createClient } from "@supabase/supabase-js";
import { Database } from "./database.types";

export function createBrowserClient() {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_KEY must be defined in the environment variables."
    );
  }
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  return supabase;
}
