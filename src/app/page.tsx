export default function Home() {
  return (
    <main className="container mx-auto py-16 flex justify-center items-center">
      <div>
        <div className="text-3xl pb-6 font-bold underline">Song Game</div>
        <ul className="list-disc pl-5">
          <li>1 player picks a song (picker)</li>
          <li>rest of party guesses artist or song (guesser)</li>
          <li>
            the objective of the game is to guess the artist and song as quickly
            as possible
          </li>
          <li>1 point to picker if song is guessed in the first 50 seconds</li>
          <li>3 points to first correct guess of the artist/song</li>
          <li>2 points to second correct guess of the artist/song</li>
          <li>1 point to third correct guess of the artist/song</li>
          <li>You only get two guesses on either the artist or song</li>
          <li>Picker rotates in round robin fashion</li>
          <li>
            Game can end at any time and teams win based on who has the most
            points
          </li>
        </ul>
      </div>
    </main>
  );
}
