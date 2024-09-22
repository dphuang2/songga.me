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

        <div className="mb-6 bg-green-300 border-4 border-black p-4 rounded-xl transform rotate-1">
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
        </div>
      </div>
    </div>
  );
}
