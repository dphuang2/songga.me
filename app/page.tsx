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
            The <span style={{ color: "blue" }}>picker</span> earns 1 point if
            the song is correctly identified within the first 50 seconds.
          </li>
          <li>
            The 1st <span style={{ color: "green" }}>guesser</span> to correctly
            identify the artist or song earns 3 points.
          </li>
          <li>
            The 2nd <span style={{ color: "green" }}>guesser</span> to correctly
            identify the artist or song earns 2 points.
          </li>
          <li>
            The 3rd <span style={{ color: "green" }}>guesser</span> to correctly
            identify the artist or song earns 1 point.
          </li>
          <li>
            Each <span style={{ color: "green" }}>guesser</span> is limited to 2
            attempts to guess either the artist or the song.
          </li>
          <li>
            The role of the <span style={{ color: "blue" }}>picker</span>{" "}
            rotates among players in a round-robin manner.
          </li>
          <li>
            The game can be concluded at any point, with the team(s) having the
            highest score declared the winner(s).
          </li>
        </ul>
        {user ? (
          <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            Spotify Connected - Create a Game
          </button>
        ) : (
          <SignInWithSpotifyButton />
        )}
      </div>
    </main>
  );
}
