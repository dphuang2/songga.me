import { JoinGameForm } from "@/components/JoinGameForm";
import { StartAGame } from "@/components/StartAGame";
import { createClient } from "@/utils/supabase/server";

export default async function Index() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return (
    <div className="flex flex-col justify-start min-h-screen bg-yellow-400 p-4 pb-16 font-sans fixed inset-0 overflow-y-auto">
      <div className="bg-white border-8 border-black rounded-3xl p-4 sm:p-6 w-full max-w-2xl mx-auto transform rotate-1 shadow-2xl border-b-[16px] border-r-[16px] mt-8 sm:mt-12 md:mt-16 lg:mt-20">
        <h1 className="text-3xl sm:text-4xl font-black uppercase bg-purple-300 px-3 py-1 sm:px-4 sm:py-2 rounded-xl border-4 border-black transform -rotate-2 mb-4 sm:mb-6">
          Song Game
        </h1>

        <div className="mb-6 bg-orange-300 border-4 border-black p-4 rounded-xl transform -rotate-1">
          <h2 className="text-2xl font-bold mb-4">Want to start a game?</h2>
          <StartAGame user={user} />
        </div>

        <div className="mb-6 bg-blue-300 border-4 border-black p-4 rounded-xl transform rotate-1">
          <h2 className="text-2xl font-bold mb-4">Or join an existing game:</h2>
          <JoinGameForm />
        </div>

        <div className="mb-6 bg-green-200 border-4 border-black p-4 rounded-xl transform rotate-1">
          <h2 className="text-2xl font-bold mb-2">How does it work?</h2>
          <p className="text-lg mb-4">It's quite simple, actually:</p>
          <ul className="list-disc list-inside space-y-2">
            <li>
              1 player picks a song (
              <span className="font-bold text-blue-600">picker</span>)
            </li>
            <li>
              The remaining players guess artist or song (
              <span className="font-bold text-green-600">guessers</span>)
            </li>
            <li>
              The goal is for{" "}
              <span className="font-bold text-green-600">guessers</span> to
              identify the artist and song in the shortest time
            </li>
            <li>
              The role of the{" "}
              <span className="font-bold text-blue-600">picker</span> rotates
              among players in a round-robin manner
            </li>
          </ul>
          <h3 className="text-xl font-bold mt-4 mb-2">Scoring:</h3>
          <ul className="list-disc list-inside space-y-2">
            <li>
              First correct{" "}
              <span className="font-bold text-green-600">
                guesser (song or artist)
              </span>
              : 5 (+2 for double dipping) points
            </li>
            <li>
              Second correct{" "}
              <span className="font-bold text-green-600">guesser</span>: 3 (+2
              for double dipping) points
            </li>
            <li>
              Third correct{" "}
              <span className="font-bold text-green-600">guesser</span>: 2 (+2
              for double dipping) points
            </li>
            <li>
              The <span className="font-bold text-blue-600">picker</span> gets 2
              points if someone guesses correctly
            </li>
            <li>
              "Double dipping": If you're in the top 3 and guess both the song
              and artist, you get 2 extra points (e.g., 5 + 2 = 7 points for
              first place)
            </li>
          </ul>
          <p className="mt-2">
            Teams can guess both the artist and song, with 1 guess for each per
            round.
          </p>
        </div>
      </div>
    </div>
  );
}
