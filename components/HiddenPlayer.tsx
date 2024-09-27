import { useEffect, useState } from "react";
import { useGameStore } from "./DesktopClient";
import { observer } from "mobx-react-lite";

// Add this type declaration at the top of the file, outside of the component
declare global {
  interface Window {
    player: any;
    Spotify: {
      Player: any;
    };
    onSpotifyWebPlaybackSDKReady: () => void;
  }
}

const HiddenPlayer: React.FC = observer(() => {
  const gameStore = useGameStore();
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && !window.player) {
      const script = document.createElement("script");
      script.src = "https://sdk.scdn.co/spotify-player.js";
      script.async = true;

      document.body.appendChild(script);

      const initializePlayer = () => {
        if (window.player) return; // Avoid creating multiple players

        window.player = new window.Spotify.Player({
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
        window.player.addListener(
          "initialization_error",
          ({ message }: { message: string }) => {
            console.error(message);
          }
        );
        window.player.addListener(
          "authentication_error",
          ({ message }: { message: string }) => {
            console.error(message);
          }
        );
        window.player.addListener(
          "account_error",
          ({ message }: { message: string }) => {
            console.error(message);
          }
        );
        window.player.addListener(
          "playback_error",
          ({ message }: { message: string }) => {
            console.error(message);
          }
        );

        // Playback status updates
        window.player.addListener("player_state_changed", (state: any) => {
          console.log(state);
          if (state) {
            setIsPlaying(!state.paused);
          } else {
            console.error("Received null state in player_state_changed event");
            setIsPlaying(false);
          }
        });

        // Ready
        window.player.addListener(
          "ready",
          ({ device_id }: { device_id: string }) => {
            console.log("Ready with Device ID", device_id);
          }
        );

        // Not Ready
        window.player.addListener(
          "not_ready",
          ({ device_id }: { device_id: string }) => {
            console.log("Device ID has gone offline", device_id);
          }
        );

        // Connect to the player!
        window.player.connect();
      };

      if (window.Spotify) {
        initializePlayer();
      } else {
        window.onSpotifyWebPlaybackSDKReady = initializePlayer;
      }
    }

    return () => {
      if (window.player) {
        window.player.disconnect();
      }
    };
  }, [gameStore]);

  const togglePlayback = () => {
    if (window.player) {
      if (isPlaying) {
        window.player.pause();
      } else {
        window.player.resume();
      }
    }
  };

  return (
    <div
      className="fixed bottom-4 right-4 bg-black text-white px-3 py-1 rounded-full text-sm cursor-pointer"
      onClick={togglePlayback}
    >
      {isPlaying ? "Playing" : "Not Playing"}
    </div>
  );
});

export default HiddenPlayer;
