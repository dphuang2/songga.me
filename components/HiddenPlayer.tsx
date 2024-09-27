import { useEffect, useState } from "react";
import { useGameStore } from "./DesktopClient";
import { observer } from "mobx-react-lite";

const HiddenPlayer: React.FC = observer(() => {
  const gameStore = useGameStore();
  const [player, setPlayer] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const script = document.createElement("script");
      script.src = "https://sdk.scdn.co/spotify-player.js";
      script.async = true;

      document.body.appendChild(script);

      (window as any).onSpotifyWebPlaybackSDKReady = () => {
        const newPlayer = new (window as any).Spotify.Player({
          name: "Song Game Web Player",
          getOAuthToken: (cb: (token: string) => void) => {
            if (gameStore.gameState?.spotifyAccessToken) {
              cb(gameStore.gameState.spotifyAccessToken.access_token);
            } else {
              console.error("Spotify access token not available");
            }
          },
          volume: 0.5,
        });

        // Error handling
        newPlayer.addListener(
          "initialization_error",
          ({ message }: { message: string }) => {
            console.error(message);
          }
        );
        newPlayer.addListener(
          "authentication_error",
          ({ message }: { message: string }) => {
            console.error(message);
          }
        );
        newPlayer.addListener(
          "account_error",
          ({ message }: { message: string }) => {
            console.error(message);
          }
        );
        newPlayer.addListener(
          "playback_error",
          ({ message }: { message: string }) => {
            console.error(message);
          }
        );

        // Playback status updates
        newPlayer.addListener("player_state_changed", (state: any) => {
          console.log(state);
          if (state) {
            setIsPlaying(!state.paused);
          } else {
            console.error("Received null state in player_state_changed event");
            setIsPlaying(false);
          }
        });

        // Ready
        newPlayer.addListener(
          "ready",
          ({ device_id }: { device_id: string }) => {
            console.log("Ready with Device ID", device_id);
          }
        );

        // Not Ready
        newPlayer.addListener(
          "not_ready",
          ({ device_id }: { device_id: string }) => {
            console.log("Device ID has gone offline", device_id);
          }
        );

        // Connect to the player!
        newPlayer.connect();

        // Set the player in state
        setPlayer(newPlayer);
      };
    }
  }, [gameStore]);

  useEffect(() => {
    return () => {
      if (player) {
        player.disconnect();
      }
    };
  }, [player]);

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white px-3 py-1 rounded-full text-sm">
      {isPlaying ? "Playing" : "Not Playing"}
    </div>
  );
});

export default HiddenPlayer;
