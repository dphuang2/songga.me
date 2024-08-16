"use client";

import { makeAutoObservable } from "mobx";
import { observer } from "mobx-react-lite";
import React, { useState, useEffect } from "react";

const Game: React.FC = () => {
  const [jwtToken, setJwtToken] = useState<string | null>(null); // Add state for jwtToken

  useEffect(() => {
    const url = new URL(window.location.href);
    const urlToken = url.searchParams.get("jwt_token");
    const storedToken = localStorage.getItem("jwt_token");
    if (urlToken) {
      localStorage.setItem("jwt_token", urlToken);
      setJwtToken(urlToken); // Set the jwtToken state
    } else if (storedToken) {
      setJwtToken(storedToken); // Set the jwtToken state from localStorage
    }
  }, []);

  return (
    <>
      {jwtToken ? ( // Render WebPlayback if jwtToken is present
        <WebPlayback
          token={JSON.parse(atob(jwtToken.split(".")[1])).access_token}
        />
      ) : (
        <a href="/api/auth/login">
          <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
            Connect Spotify To Start Game
          </button>
        </a>
      )}
    </>
  );
};

type Track = {
  name: string;
  album: {
    images: { url: string }[];
  };
  artists: { name: string }[];
};

const emptyTrack: Track = {
  name: "",
  album: {
    images: [{ url: "" }],
  },
  artists: [{ name: "" }],
};

class WebPlaybackState {
  player: Spotify.Player | null = null;
  track: Track = emptyTrack;
  isPaused = false;
  isActive = false;
  constructor() {
    makeAutoObservable(this);
  }

  setPlayer(player: Spotify.Player) {
    this.player = player;
    console.log(player);
  }

  setTrack(track: Track) {
    this.track = track;
  }

  setIsPaused(isPaused: boolean) {
    this.isPaused = isPaused;
  }

  setIsActive(isActive: boolean) {
    this.isActive = isActive;
  }
}

const playbackState = new WebPlaybackState();

const WebPlayback: React.FC<{ token: string }> = observer((props) => {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;

    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      const player = new window.Spotify.Player({
        name: `Random Player ${Math.random().toString(36).substr(2, 9)}`,
        getOAuthToken: (cb) => {
          cb(props.token);
        },
        volume: 0.5,
      });

      player.addListener("ready", ({ device_id }) => {
        console.log("Ready with Device ID", device_id);
      });

      player.addListener("not_ready", ({ device_id }) => {
        console.log("Device ID has gone offline", device_id);
      });

      player.addListener("initialization_error", ({ message }) => {
        console.error(message);
      });

      player.addListener("authentication_error", ({ message }) => {
        console.error(message);
      });

      player.addListener("account_error", ({ message }) => {
        console.error(message);
      });

      player.addListener("player_state_changed", (state) => {
        if (!state) {
          return;
        }

        playbackState.setTrack(state.track_window.current_track); // Update current track
        playbackState.setIsPaused(state.paused); // Update paused state

        player.getCurrentState().then((state) => {
          !state
            ? playbackState.setIsActive(false)
            : playbackState.setIsActive(true);
        });
      });

      player.connect();

      playbackState.setPlayer(player);
    };
  }, []);

  if (!playbackState.isActive) {
    return (
      <>
        <div className="container">
          <div className="main-wrapper">
            <b>
              {" "}
              Instance not active. Transfer your playback using your Spotify app{" "}
            </b>
          </div>
        </div>
      </>
    );
  } else {
    return (
      <>
        <div className="container">
          <div>
            {playbackState.track && (
              <img src={playbackState.track.album.images[0].url} alt="" />
            )}
            <div>
              {playbackState.track && (
                <>
                  <div>{playbackState.track.name}</div>
                  <div>{playbackState.track.artists[0].name}</div>
                </>
              )}

              <button
                onClick={() => {
                  playbackState.player?.previousTrack();
                }}
              >
                &lt;&lt;
              </button>

              <button
                onClick={() => {
                  playbackState.player?.togglePlay();
                }}
              >
                {playbackState.isPaused ? "PLAY" : "PAUSE"}
              </button>

              <button
                onClick={() => {
                  playbackState.player?.nextTrack();
                }}
              >
                &gt;&gt;
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }
});

export default Game;
