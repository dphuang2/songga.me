export function ShareThisCode({ code }: { code: string }) {
  return (
    <div className="mb-6 bg-blue-300 border-4 border-black p-4 rounded-xl transform rotate-2">
      <h2 className="text-2xl font-bold mb-2">Room Code:</h2>
      <div className="flex items-center justify-center bg-white border-4 border-black rounded-xl p-3">
        <span className="text-4xl font-black tracking-wider">{code}</span>
      </div>
      <p className="text-sm text-center mt-2">
        Share this code with your friends to join the game!
      </p>
    </div>
  );
}
