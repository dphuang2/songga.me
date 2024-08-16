import { GameInstructions } from "@/components/GameInstructions";

export default function Game({ params }: { params: { game: string } }) {
  const link = `songga.me/${params.game}`;
  return (
    <main className="container mx-auto py-16 flex justify-center items-center px-4 md:px-0">
      <div>
        <h2 className="text-2xl font-semibold">How to start the game</h2>
        <ol className="list-decimal pl-5 pb-2">
          <GameInstructions link={link} />
        </ol>
        <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mb-3">
          Start Game
        </button>
        <div className="text-2xl font-semibold mt-6">Players</div>
        <ul className="list-disc pl-5">
          <li>Player 1</li>
          <li>Player 2</li>
          <li>Player 3</li>
          {/* Dynamically generated players list can be added here */}
        </ul>
      </div>
    </main>
  );
}
