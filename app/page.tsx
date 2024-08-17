import { CreateAGameButton } from "@/components/CreateAGameButton";
import { SignInWithSpotifyButton } from "@/components/SignInWithSpotifyButton";
import { createClient } from "@/utils/supabase/server";

export default async function Index() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="container mx-auto py-16 flex justify-center items-center px-4 md:px-0">
      <article className="prose lg:prose-xl">
        <h1>Song Game</h1>
        <h2>How does it work?</h2>
        <p>Its quite simple, actually.</p>
        <ul>
          <li>
            1 player picks a song (<span style={{ color: "blue" }}>picker</span>
            )
          </li>
          <li>
            The remaining players guess artist or song (
            <span style={{ color: "green" }}>guessers</span>)
          </li>
          <li>
            the goal is for <span style={{ color: "green" }}>guessers</span> to
            identify the artist and song in the shortest time
          </li>
          <li>
            The role of the <span style={{ color: "blue" }}>picker</span>{" "}
            rotates among players in a round-robin manner.
          </li>
        </ul>
        <h2>Create a game!</h2>
        {user ? <CreateAGameButton /> : <SignInWithSpotifyButton />}
      </article>
    </main>
  );
}
