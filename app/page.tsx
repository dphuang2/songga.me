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
      <div>
        <div className="text-3xl pb-6 font-bold underline">Song Game</div>
        <ul className="list-disc pl-5 pb-3">
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
        {user ? <CreateAGameButton /> : <SignInWithSpotifyButton />}
      </div>
    </main>
  );
}
