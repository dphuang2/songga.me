"use client";

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

const track = {
  name: "",
  album: {
    images: [{ url: "" }],
  },
  artists: [{ name: "" }],
};

const WebPlayback: React.FC<{ token: string }> = (props) => {
  const [is_paused, setPaused] = useState(false); // Track paused state
  const [current_track, setTrack] = useState(track); // Track current track state
  const [is_active, setActive] = useState(false);
  const [player, setPlayer] = useState<any>(undefined);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;

    document.body.appendChild(script);

    (window as any).onSpotifyWebPlaybackSDKReady = () => {
      const newPlayer = new (window as any).Spotify.Player({
        name: "Web Playback SDK",
        getOAuthToken: (cb: any) => {
          cb(props.token);
        },
        volume: 0.5,
      });

      newPlayer.addListener("ready", ({ device_id }: any) => {
        console.log("Ready with Device ID", device_id);
      });

      newPlayer.addListener("not_ready", ({ device_id }: any) => {
        console.log("Device ID has gone offline", device_id);
      });

      newPlayer.addListener("initialization_error", ({ message }: any) => {
        console.error(message);
      });

      newPlayer.addListener("authentication_error", ({ message }: any) => {
        console.error(message);
      });

      newPlayer.addListener("account_error", ({ message }: any) => {
        console.error(message);
      });

      newPlayer.addListener("player_state_changed", (state: any) => {
        if (!state) {
          return;
        }

        setTrack(state.track_window.current_track); // Update current track
        setPaused(state.paused); // Update paused state

        newPlayer.getCurrentState().then((state: any) => {
          !state ? setActive(false) : setActive(true);
        });
      });

      newPlayer.connect();
      setPlayer(newPlayer);
    };
  }, [props.token]);

  if (!is_active) {
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
            {current_track && (
              <img src={current_track.album.images[0].url} alt="" />
            )}
            <div>
              {current_track && (
                <>
                  <div>{current_track.name}</div>
                  <div>{current_track.artists[0].name}</div>
                </>
              )}

              <button
                onClick={() => {
                  player.previousTrack();
                }}
              >
                &lt;&lt;
              </button>

              <button
                onClick={() => {
                  player.togglePlay();
                }}
              >
                {is_paused ? "PLAY" : "PAUSE"}
              </button>

              <button
                onClick={() => {
                  player.nextTrack();
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
};

export default Game;
