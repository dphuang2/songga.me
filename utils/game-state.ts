import { RealtimeChannel } from "@supabase/supabase-js";
import { makeAutoObservable, runInAction } from "mobx";
import { z } from "zod";
import { createClient, SpotifyAuthStorage } from "./supabase/client";
import { getTeamsAndPlayersForGame } from "./supabase/get-teams-and-players-for-game";
import {
  Devices,
  ItemTypes,
  Market,
  MaxInt,
  SpotifyApi,
  Track,
} from "@spotify/web-api-ts-sdk";
import { AllQueryResults } from "@/components/MobileClient";

const GUESS_EVENT = "guess";
const IS_TYPING_EVENT = "is-typing";
const GAME_EVENT = "game";
const START_ROUND_EVENT = "start-round";
const SYNC_EVENT = "sync";

export const songSchema = z.object({
  name: z.string(),
  artist: z.string(),
  albumCoverImage: z.string(),
});

export const startRoundPayloadSchema = z.object({
  song: songSchema,
});

export const guessStatusSchema = z.object({
  guessesLeft: z.object({
    artist: z.number(),
    song: z.number(),
  }),
  correctArtist: z.boolean(),
  correctSong: z.boolean(),
});

export const guessSchemaSongOrArtist = z
  .object({
    type: z.enum(["song", "artist"]),
    value: z.string(),
    teamId: z.number(),
    lastGuess: z.boolean(),
  })
  .merge(guessStatusSchema);

export type GuessSongOrArtist = z.infer<typeof guessSchemaSongOrArtist>;

export const guessSchemaSkip = z.object({
  type: z.literal("skip"),
  teamId: z.number(),
});

export const guessSchemaCheater = z.object({
  type: z.literal("cheater"),
  teamId: z.number(),
});

export const guessSchema = z.union([
  guessSchemaSongOrArtist,
  guessSchemaSkip,
  guessSchemaCheater,
]);

export type Guess = z.infer<typeof guessSchema>;

export const isTypingSchema = z.object({
  teamId: z.number(),
  isTyping: z.boolean(),
});

const spotifyAccessTokenSchema = z.object({
  access_token: z.string(),
  token_type: z.string(),
  expires_in: z.number(),
  refresh_token: z.string(),
});

export type SpotifyAccessToken = z.infer<typeof spotifyAccessTokenSchema>;

export const gameStateSchema = z.object({
  selectedSong: songSchema.nullable(),
  lastSong: songSchema.nullable(),
  round: z.number(),
  spotifyAccessToken: spotifyAccessTokenSchema,
  pickerIndex: z.number(),
  roundStartTime: z.number().nullable(),
  teams: z.array(
    z
      .object({
        teamId: z.number(),
        score: z.number(),
        bgColor: z.enum([
          "bg-red-300",
          "bg-orange-300",
          "bg-yellow-300",
          "bg-green-300",
          "bg-teal-300",
          "bg-blue-300",
          "bg-indigo-300",
          "bg-purple-300",
          "bg-pink-300",
          "bg-emerald-300",
          "bg-lime-300",
          "bg-fuchsia-300",
        ]),
        guessOrder: z
          .union([z.literal(1), z.literal(2), z.literal(3)])
          .nullable(),
        isTyping: z.boolean(),
        wasPicker: z.boolean(),
        outOfGuesses: z.boolean(),
        cheater: z.boolean(),
        skipped: z.boolean(),
        players: z.array(
          z.object({
            name: z.string(),
            playerId: z.number(),
          })
        ),
        artistGuess: z.string().nullable(),
        songGuess: z.string().nullable(),
        guessTime: z.number().nullable(),
      })
      .merge(guessStatusSchema)
  ),
});

export const gameStatePayloadSchema = z.object({
  state: gameStateSchema,
  sender: z.enum(["host", "player"]),
});

export type GameState = z.infer<typeof gameStateSchema>;

export class GameStore {
  /**
   * the gameState property is the ground truth for state in this client. It is
   * synced across various devices in the game and lost if all people exit from
   * the game. Otherwise, at least 1 device will be able to sync the state of
   * the game with other devices. Whenever a player joins, they are given the
   * current state of the game from the host. For now, if the host is not
   * present, the game will break.
   */
  gameState: GameState | null = null;
  gameRoom: RealtimeChannel | null = null;
  gameCode: string;
  currentPlayerId: number | undefined;
  countdown: number | null = null;
  private audioContext: AudioContext | null = null;

  constructor({
    gameCode,
    currentPlayerId,
  }: {
    gameCode: string;
    currentPlayerId?: number;
  }) {
    this.currentPlayerId = currentPlayerId;
    makeAutoObservable(this);
    this.gameCode = gameCode;
    this.initializeGameRoom();
    this.initAudioContext();
  }

  getCurrentTeam(): GameState["teams"][number] | undefined {
    if (!this.gameState) return undefined;
    const teamId = this.getTeamIdForCurrentPlayer();
    return this.gameState.teams.find((team) => team.teamId === teamId);
  }

  correctArtist(): boolean {
    const team = this.getCurrentTeam();
    return team ? team.correctArtist : false;
  }

  setOwnTeamCorrectArtist(value: boolean): void {
    const team = this.getCurrentTeam();
    if (team) {
      team.correctArtist = value;
    }
  }

  correctSong(): boolean {
    const team = this.getCurrentTeam();
    return team ? team.correctSong : false;
  }

  setOwnTeamCorrectSong(value: boolean): void {
    const team = this.getCurrentTeam();
    if (team) {
      team.correctSong = value;
    }
  }

  guessesLeft(): { artist: number; song: number } {
    const team = this.getCurrentTeam();
    return team ? team.guessesLeft : { artist: 0, song: 0 };
  }

  setOwnTeamGuessesLeft(guesses: { artist: number; song: number }): void {
    const team = this.getCurrentTeam();
    if (team) {
      team.guessesLeft = guesses;
    }
  }

  skipped(): boolean {
    const team = this.getCurrentTeam();
    return team ? team.skipped : false;
  }

  setOwnTeamSkipped(value: boolean): void {
    const team = this.getCurrentTeam();
    if (team) {
      team.skipped = value;
    }
  }

  artistGuess(): string | null {
    const team = this.getCurrentTeam();
    return team ? team.artistGuess : null;
  }

  setOwnTeamArtistGuess(guess: string): void {
    const team = this.getCurrentTeam();
    if (team) {
      team.artistGuess = guess;
    }
  }

  songGuess(): string | null {
    const team = this.getCurrentTeam();
    return team ? team.songGuess : null;
  }

  setOwnTeamSongGuess(guess: string): void {
    const team = this.getCurrentTeam();
    if (team) {
      team.songGuess = guess;
    }
  }

  isHost(): boolean {
    return this.currentPlayerId === undefined;
  }

  allNonPickerTeams(): GameState["teams"] {
    if (!this.gameState) return [];
    return this.gameState.teams.filter(
      (_, index) => index !== this.gameState?.pickerIndex
    );
  }

  /**
   * Determines if the current round of guessing is over.
   * This is used to check if it's time to move to the next phase of the game (e.g., revealing answers, updating scores).
   * Unlike isCurrentRoundActive, which checks if a round is in progress,
   * this method specifically checks if the guessing phase of the current round has concluded.
   * The round is over when either:
   * 1. At least 3 teams (or all teams if less than 3) have made correct guesses, or
   * 2. All non-picker teams have either made a correct guess, are out of guesses, or have skipped.
   */
  isRoundOver(): boolean {
    if (!this.gameState) {
      console.log("isRoundOver: Game state is not initialized");
      return false;
    }

    const nonPickerTeams = this.allNonPickerTeams();
    console.log("isRoundOver: Non-picker teams:", nonPickerTeams);

    const teamsWithCorrectGuesses = nonPickerTeams.filter(
      (team) => team.guessOrder !== null
    );
    console.log(
      "isRoundOver: Teams with correct guesses:",
      teamsWithCorrectGuesses
    );

    const teamsOutOfGuessesOrSkipped = nonPickerTeams.filter(
      (team) => team.outOfGuesses || team.skipped || team.cheater
    );
    console.log(
      "isRoundOver: Teams out of guesses or skipped:",
      teamsOutOfGuessesOrSkipped
    );

    const minRequiredGuesses = Math.min(nonPickerTeams.length, 3);
    console.log("isRoundOver: Minimum required guesses:", minRequiredGuesses);

    const isRoundOver =
      teamsWithCorrectGuesses.length >= minRequiredGuesses ||
      teamsWithCorrectGuesses.length + teamsOutOfGuessesOrSkipped.length ===
        nonPickerTeams.length;

    console.log("isRoundOver: Round is over?", isRoundOver);
    return isRoundOver;
  }

  sendGuess(input: Omit<Guess, "teamId">) {
    if (this.gameRoom === null) {
      throw new Error("Can't send guess without connection to game channel");
    }
    const teamId = this.getTeamIdForCurrentPlayer();
    const guess = guessSchema.parse({
      ...input,
      teamId,
    });
    this.gameRoom.send({
      type: "broadcast",
      event: GUESS_EVENT,
      payload: guess,
    });
  }

  sendIsTyping(isTyping: boolean) {
    if (this.gameRoom === null) {
      throw new Error("Can't send guess without connection to game channel");
    }
    this.gameRoom.send({
      type: "broadcast",
      event: IS_TYPING_EVENT,
      payload: isTypingSchema.parse({
        teamId: this.getTeamIdForCurrentPlayer(),
        isTyping,
      }),
    });
  }

  isNotOnTeam(): boolean {
    try {
      this.getTeamIdForCurrentPlayer();
      return false; // If getTeamIdForCurrentPlayer() succeeds, the player is on a team
    } catch (error) {
      // If getTeamIdForCurrentPlayer() throws an error, the player is not on a team
      return true;
    }
  }

  getTeamIdForCurrentPlayer(): number {
    if (!this.gameState || this.currentPlayerId === undefined) {
      throw new Error(
        `Game state or current player ID (${this.currentPlayerId}) is not set`
      );
    }

    for (const team of this.gameState.teams) {
      if (
        team.players.some((player) => player.playerId === this.currentPlayerId)
      ) {
        return team.teamId;
      }
    }

    throw new Error(
      `Current player (${this.currentPlayerId}) not found in any team`
    );
  }

  allScoresAreSame(): boolean {
    if (!this.gameState || this.gameState.teams.length === 0) return true;

    const firstScore = this.gameState.teams[0].score;
    return this.gameState.teams.every((team) => team.score === firstScore);
  }

  setGameState(state: GameState) {
    this.gameState = state;
    if (this.isHost()) {
      localStorage.setItem(`gameState_${this.gameCode}`, JSON.stringify(state));
    }
  }

  setGameRoom(room: RealtimeChannel) {
    this.gameRoom = room;
  }

  isOnPickingTeam(): boolean {
    if (!this.gameState || !this.currentPlayerId) return false;

    const pickingTeam = this.pickingTeam();
    if (!pickingTeam) return false;

    return pickingTeam.players.some(
      (player) => player.playerId === this.currentPlayerId
    );
  }

  pickingTeam(): GameState["teams"][number] | undefined {
    if (!this.gameState) return undefined;
    return this.gameState.teams[this.gameState.pickerIndex];
  }

  startCountdown() {
    console.log("Starting countdown");
    if (this.isHost() && this.isRoundOver() && this.countdown === null) {
      console.log("Host is starting the countdown");
      this.countdown = 10;
      const countdownInterval = setInterval(async () => {
        if (this.countdown !== null) {
          this.decrementCount();
          if (this.countdown <= 0) {
            console.log("Countdown finished");
            clearInterval(countdownInterval);
            await this.startNewRound();
          }
        } else {
          console.log("Countdown was unexpectedly null");
        }
      }, 1000);
    } else {
      console.log("Conditions not met to start countdown");
    }
  }

  async startNewRound() {
    await this.resetRound();
    this.broadcastGameState(this.gameState!);
  }

  async resetRound() {
    console.log("Resetting round");
    if (this.isHost() && this.gameState) {
      console.log("Current game state:", JSON.stringify(this.gameState));
      const updatedTeams = this.gameState.teams.map((team, index) => ({
        ...team,
        isTyping: false,
        guessesLeft: { artist: 1, song: 1 },
        wasPicker: index === this.gameState?.pickerIndex,
      }));

      // Refresh spotify access token
      const refreshedToken = await SpotifyAuthStorage.refreshAccessToken(
        this.gameState.spotifyAccessToken.refresh_token
      );

      // Select a new picker
      const currentPickerIndex = this.gameState.pickerIndex;
      const newPickerIndex = (currentPickerIndex + 1) % updatedTeams.length;
      this.gameState.pickerIndex = newPickerIndex;
      console.log(
        `New picker selected: Team ${updatedTeams[newPickerIndex].teamId}`
      );

      this.setGameState({
        ...this.gameState,
        selectedSong: null,
        teams: updatedTeams,
        round: this.gameState.round + 1,
        spotifyAccessToken: refreshedToken,
        roundStartTime: null,
      });
      this.countdown = null;
      console.log("Updated game state:", JSON.stringify(this.gameState));
    } else {
      console.log("Cannot reset round: not host or game state is null");
    }
  }

  decrementCount() {
    if (this.countdown !== null) {
      this.countdown--;
      console.log(`Countdown: ${this.countdown}`);

      if (this.audioContext && this.audioContext.state === "running") {
        try {
          const oscillator = this.audioContext.createOscillator();
          const gainNode = this.audioContext.createGain();

          oscillator.connect(gainNode);
          gainNode.connect(this.audioContext.destination);

          // Use a major scale for a more jingle-like sound
          const majorScale = [
            261.63, 293.66, 329.63, 349.23, 392.0, 440.0, 493.88, 523.25,
          ]; // C4 to C5
          const noteIndex = this.countdown % 8;
          const frequency = majorScale[noteIndex];

          oscillator.type = "sine";
          oscillator.frequency.setValueAtTime(
            frequency,
            this.audioContext.currentTime
          );

          // Create a more musical envelope
          const now = this.audioContext.currentTime;
          gainNode.gain.setValueAtTime(0, now);
          gainNode.gain.linearRampToValueAtTime(0.2, now + 0.05);
          gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

          oscillator.start(now);
          oscillator.stop(now + 0.5);

          // Add a harmony note
          const harmonyOscillator = this.audioContext.createOscillator();
          const harmonyGain = this.audioContext.createGain();
          harmonyOscillator.connect(harmonyGain);
          harmonyGain.connect(this.audioContext.destination);

          const harmonyFrequency = frequency * 1.25; // Perfect fifth
          harmonyOscillator.type = "sine";
          harmonyOscillator.frequency.setValueAtTime(harmonyFrequency, now);

          harmonyGain.gain.setValueAtTime(0, now);
          harmonyGain.gain.linearRampToValueAtTime(0.1, now + 0.05);
          harmonyGain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

          harmonyOscillator.start(now);
          harmonyOscillator.stop(now + 0.5);

          console.log(
            `Playing jingle sound: Main Frequency ${frequency}Hz, Harmony Frequency ${harmonyFrequency}Hz`
          );
        } catch (error) {
          console.error("Error playing jingle sound:", error);
        }
      } else {
        console.log("AudioContext is not running. Sound cannot be played.");
        this.initAudioContext(); // Try to reinitialize the AudioContext
      }
    } else {
      console.log("Countdown was unexpectedly null");
    }
  }

  initAudioContext() {
    if (typeof window !== "undefined") {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
      }
      if (this.audioContext.state === "suspended") {
        this.audioContext
          .resume()
          .then(() => {
            console.log("AudioContext resumed successfully");
          })
          .catch((error) => {
            console.error("Failed to resume AudioContext:", error);
          });
      }
    } else {
      console.log("AudioContext not initialized: not in browser environment");
    }
  }

  async startGame({ gameId }: { gameId: number }) {
    if (this.gameRoom === null)
      throw Error("Can't start game without connection to game channel");
    let spotifyAccessToken = SpotifyAuthStorage.getSavedAccessToken();
    if (spotifyAccessToken === null)
      throw new Error(
        "Spotify access token not found. Please authenticate with Spotify."
      );
    delete spotifyAccessToken["expires"];

    // Refresh the Spotify access token before starting the game
    try {
      const refreshedToken = await SpotifyAuthStorage.refreshAccessToken(
        spotifyAccessToken.refresh_token
      );
      console.log("Successfully refreshed Spotify access token");
      spotifyAccessToken = refreshedToken;
    } catch (error) {
      console.error("Failed to refresh Spotify access token:", error);
      throw new Error(
        "Failed to refresh Spotify access token. Please try authenticating again."
      );
    }

    getTeamsAndPlayersForGame({ gameId }).then((teams) => {
      const bgColors = [
        "bg-red-300",
        "bg-orange-300",
        "bg-yellow-300",
        "bg-green-300",
        "bg-teal-300",
        "bg-blue-300",
        "bg-indigo-300",
        "bg-purple-300",
        "bg-pink-300",
        "bg-emerald-300",
        "bg-lime-300",
        "bg-fuchsia-300",
      ] as const;
      const initialTeams = teams.map((team) => {
        const bgColor = bgColors[Math.floor(Math.random() * bgColors.length)];
        return {
          teamId: team.teamId,
          score: 0,
          picker: false,
          wasPicker: false,
          guessOrder: null,
          cheater: false,
          isTyping: false,
          outOfGuesses: false,
          bgColor,
          players: team.players.map((player) => {
            return {
              name: player.name,
              playerId: player.playerId,
            };
          }),
          guessesLeft: {
            artist: 1,
            song: 1,
          },
          correctArtist: false,
          correctSong: false,
          artistGuess: null,
          songGuess: null,
          skipped: false,
          guessTime: null,
        };
      });

      if (spotifyAccessToken === null) return;
      const state: GameState = {
        selectedSong: null,
        lastSong: null,
        pickerIndex: Math.floor(Math.random() * initialTeams.length),
        round: 1,
        teams: initialTeams,
        roundStartTime: null,
        spotifyAccessToken: spotifyAccessToken,
      };

      // Set the game state
      this.setGameState(state);
      this.broadcastGameState(state);
    });
  }

  broadcastGameState(gameState: GameState) {
    console.log("Broadcasting game state:", gameState);

    if (gameState === null) {
      console.error("Attempted to broadcast null game state");
      throw new Error("Game state is null");
    }

    const payload: z.infer<typeof gameStatePayloadSchema> = {
      state: gameState,
      sender: this.isHost() ? "host" : "player",
    };

    console.log("Prepared payload:", payload);

    try {
      this.gameRoom?.send({
        type: "broadcast",
        event: GAME_EVENT,
        payload: payload,
      });
      console.log("Game state broadcasted successfully");
    } catch (error) {
      console.error("Error broadcasting game state:", error);
    }
  }

  connectedToGameRoom(): boolean {
    return this.gameRoom !== null;
  }

  didCheat(allQueryResults: AllQueryResults, guess: string): boolean {
    debugger;
    const isCorrect = this.isGuessCorrect("song", guess);
    if (!isCorrect) return false;

    const selectedSongName =
      this.gameState?.selectedSong?.name?.toLowerCase() || "";
    const selectedArtistName =
      this.gameState?.selectedSong?.artist?.toLowerCase() || "";

    // Check if the song name includes at least one normal (Latin) character
    if (!/[a-zA-Z]/.test(selectedSongName)) {
      return false;
    }

    for (const [query, results] of Object.entries(allQueryResults)) {
      const queryLower = query.toLowerCase();

      // Skip queries shorter than 8 characters
      if (queryLower.length < 5) continue;

      // Skip if the query matches the artist name
      if (this.lcsSimilarity(queryLower, selectedArtistName) >= 0.8) continue;

      // Check if the query is significantly different from the selected song name
      if (this.lcsSimilarity(queryLower, selectedSongName) < 0.3) {
        // Check if any track in the results matches the correct guess
        if (
          results.tracks.some((track) =>
            this.isGuessCorrect("song", track.name)
          )
        ) {
          // This is only true when Spotify returns a lyric match in the search results
          // Spotify's search can sometimes return tracks based on lyric matches,
          // which could indicate that the user searched for lyrics to find the song
          return true; // Caught a potential cheater
        }
      }

      // Additional check: If the query contains words that are not in the song name
      const queryWords = queryLower.split(/\s+/);
      const songWords = selectedSongName.split(/\s+/);
      const differentWords = queryWords.filter(
        (word) => !songWords.includes(word) && word.length > 3
      );
      if (
        differentWords.length > 1 &&
        results.tracks.some((track) => this.isGuessCorrect("song", track.name))
      ) {
        return true; // Caught a potential cheater
      }
    }

    return false;
  }

  private lcsSimilarity(s1: string, s2: string): number {
    const lcsLength = this.longestCommonSubstring(s1, s2);
    const minLength = Math.min(s1.length, s2.length);
    return lcsLength / minLength;
  }

  private longestCommonSubstring(s1: string, s2: string): number {
    const m = s1.length;
    const n = s2.length;
    const dp: number[][] = Array(m + 1)
      .fill(null)
      .map(() => Array(n + 1).fill(0));

    let maxLength = 0;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (s1[i - 1] === s2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
          maxLength = Math.max(maxLength, dp[i][j]);
        }
      }
    }

    return maxLength;
  }

  isGuessCorrect(type: "artist" | "song", guess: string): boolean {
    if (type === "artist") {
      if (this.gameState?.selectedSong?.artist) {
        const artists = this.gameState.selectedSong.artist.split(", ");
        return artists.some(
          (artist) => artist.toLowerCase() === guess.toLowerCase()
        );
      }
    } else {
      if (this.gameState?.selectedSong?.name) {
        const selectedSongName = this.gameState.selectedSong.name.toLowerCase();
        const guessLower = guess.toLowerCase();

        // Remove common suffixes and prefixes
        const cleanString = (str: string) => {
          return str
            .replace(
              /(\s*-\s*(radio\s*version|album\s*version|remastered|live|acoustic|remix).*$)/i,
              ""
            )
            .replace(/^\s*(the|a|an)\s+/i, "")
            .replace(/\s*\(feat\..*\)\s*$/i, "") // Remove featuring artists
            .trim();
        };

        const cleanSelectedSong = cleanString(selectedSongName);
        const cleanGuess = cleanString(guessLower);

        // Check for exact match after cleaning
        if (cleanSelectedSong === cleanGuess) {
          return true;
        }

        // Check if the guess is a substring of the selected song
        if (
          cleanSelectedSong.includes(cleanGuess) ||
          cleanGuess.includes(cleanSelectedSong)
        ) {
          // Ensure the guess is not significantly shorter than the selected song
          if (
            cleanGuess.length > cleanSelectedSong.length * 0.7 ||
            cleanSelectedSong.length > cleanGuess.length * 0.7
          ) {
            return true;
          }
        }

        // Calculate Levenshtein distance
        const levenshteinDistance = (a: string, b: string) => {
          const matrix = [];
          for (let i = 0; i <= b.length; i++) {
            matrix[i] = [i];
          }
          for (let j = 0; j <= a.length; j++) {
            matrix[0][j] = j;
          }
          for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
              if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
              } else {
                matrix[i][j] = Math.min(
                  matrix[i - 1][j - 1] + 1,
                  matrix[i][j - 1] + 1,
                  matrix[i - 1][j] + 1
                );
              }
            }
          }
          return matrix[b.length][a.length];
        };

        // Calculate similarity as a percentage
        const maxLength = Math.max(cleanSelectedSong.length, cleanGuess.length);
        const distance = levenshteinDistance(cleanSelectedSong, cleanGuess);
        const similarity = (maxLength - distance) / maxLength;

        // Consider it correct if similarity is above 90% and lengths are similar
        return (
          similarity > 0.9 &&
          Math.abs(cleanSelectedSong.length - cleanGuess.length) <= 3
        );
      }
    }
    return false;
  }

  isGameStarted(): boolean {
    return this.gameState !== null;
  }

  async startRound({ track }: { track: Track }) {
    if (this.gameState === null) throw new Error("Game state is null");
    const selectedSong = {
      name: track.name,
      artist: track.artists.map((artist) => artist.name).join(", "),
      albumCoverImage: track.album.images[0]?.url || "",
    };
    let retries = 0;
    const maxRetries = 5;
    while (!(await this.setPlayback(track)) && retries < maxRetries) {
      retries++;
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait for 1 second before retrying
    }
    if (retries === maxRetries) {
      console.error("Failed to set playback after maximum retries");
    }
    const payload: z.infer<typeof startRoundPayloadSchema> = {
      song: selectedSong,
    };
    this.gameRoom?.send({
      type: "broadcast",
      event: START_ROUND_EVENT,
      payload: payload,
    });
  }

  isCurrentRoundActive(): boolean {
    return this.gameState?.selectedSong !== null;
  }

  isWaitingForNextRound(): this is {
    gameState: { lastSong: NonNullable<GameState["lastSong"]> };
  } {
    return !this.isCurrentRoundActive() && this.gameState?.lastSong !== null;
  }

  currentScoreboardMessage(): string {
    if (!this.isCurrentRoundActive()) {
      const pickerTeam = this.gameState?.teams.find((team) =>
        this.isTeamPicker(team.teamId)
      );
      const pickerNames = pickerTeam?.players
        .map((player) => player.name)
        .join(", ");
      return `${pickerNames} ${
        pickerNames && pickerNames.includes(",") ? "are" : "is"
      } choosing a song...`;
    }
    if (this.isRoundOver() && this.countdown !== null) {
      return `Round over! Next round starting in ${this.countdown} seconds...`;
    }
    return "Players, start guessing!";
  }

  async spotifySearch(
    q: string,
    type: readonly ItemTypes[],
    market?: Market,
    limit?: MaxInt<50>,
    offset?: number,
    include_external?: string
  ) {
    try {
      if (this.gameState?.spotifyAccessToken === undefined) {
        return null;
      }

      const spotify = SpotifyApi.withAccessToken(
        process.env.NEXT_PUBLIC_SPOTIFY_ID!,
        this.gameState.spotifyAccessToken
      );

      const searchResults = await spotify.search(
        q,
        type,
        market,
        limit,
        offset,
        include_external
      );

      return searchResults;
    } catch (error) {
      console.error("Error in testSpotify function:", error);
      throw error;
    }
  }

  async getAvailableDevices(): Promise<Devices | null> {
    console.log("Fetching available devices");
    try {
      if (!this.gameState?.spotifyAccessToken) {
        console.error("Spotify access token is undefined");
        return null;
      }

      const spotify = SpotifyApi.withAccessToken(
        process.env.NEXT_PUBLIC_SPOTIFY_ID!,
        this.gameState.spotifyAccessToken
      );

      const devices = await spotify.player.getAvailableDevices();

      console.log("Available devices:", devices.devices);
      devices.devices.forEach((device, index) => {
        console.log(`Device ${index + 1}:`);
        console.log(`  ID: ${device.id}`);
        console.log(`  Name: ${device.name}`);
        console.log(`  Type: ${device.type}`);
        console.log(`  Is Active: ${device.is_active}`);
        console.log(`  Is Private Session: ${device.is_private_session}`);
        console.log(`  Is Restricted: ${device.is_restricted}`);
        console.log(`  Volume Percent: ${device.volume_percent}`);
      });

      return devices;
    } catch (error) {
      console.error("Error fetching available devices:", error);
      return null;
    }
  }

  async setPlayback(track: Track): Promise<boolean> {
    console.log(`Attempting to set playback for track: ${track.name}`);
    try {
      if (!this.gameState?.spotifyAccessToken) {
        console.error("Spotify access token is undefined");
        return false;
      }
      console.log("Spotify access token is available");

      console.log("Initializing Spotify API with access token");
      const spotify = SpotifyApi.withAccessToken(
        process.env.NEXT_PUBLIC_SPOTIFY_ID!,
        this.gameState.spotifyAccessToken
      );

      console.log("Fetching available devices");
      const devices = await this.getAvailableDevices();

      if (!devices || devices.devices.length === 0) {
        console.error("No available devices found");
        return false;
      }

      console.log("Fetching current playback state");
      try {
        const playbackState = await spotify.player.getPlaybackState();
        if (playbackState) {
          console.log("Current Playback State:");
          console.log(`  Is Playing: ${playbackState.is_playing}`);
          console.log(
            `  Device: ${playbackState.device.name} (${playbackState.device.type})`
          );
          if (playbackState.item) {
            console.log(`  Track: ${playbackState.item.name}`);
            console.log(
              `  Progress: ${playbackState.progress_ms}ms / ${playbackState.item.duration_ms}ms`
            );
          } else {
            console.log("  No track currently playing");
          }
        } else {
          console.log("No active playback state found");
        }
      } catch (error) {
        console.error("Error fetching playback state:", error);
      }

      console.log("Available devices:", devices.devices);
      devices.devices.forEach((device, index) => {
        console.log(`Device ${index + 1}:`);
        console.log(`  ID: ${device.id}`);
        console.log(`  Name: ${device.name}`);
        console.log(`  Type: ${device.type}`);
        console.log(`  Is Active: ${device.is_active}`);
        console.log(`  Is Private Session: ${device.is_private_session}`);
        console.log(`  Is Restricted: ${device.is_restricted}`);
        console.log(`  Volume Percent: ${device.volume_percent}`);
      });

      const songGameWebPlayer = devices.devices.find(
        (device) => device.name === "Song Game Web Player"
      );
      const activeDevice = devices.devices.find((device) => device.is_active);
      const tvDevice = devices.devices.find((device) => device.type === "TV");
      const computerDevice = devices.devices.find(
        (device) => device.type === "Computer"
      );
      const targetDevice =
        songGameWebPlayer?.id ||
        activeDevice?.id ||
        tvDevice?.id ||
        computerDevice?.id ||
        devices.devices[0].id;

      if (!targetDevice) {
        console.error("No device ID available");
        return false;
      }

      console.log(
        `Starting playback for track URI: ${track.uri} on device: ${targetDevice}`
      );
      // Start playback on the active device or the first available device
      await spotify.player.startResumePlayback(targetDevice, undefined, [
        track.uri,
      ]);

      console.log(`Playback successfully started for track: ${track.name}`);
      return true;
    } catch (error) {
      console.error("Error setting playback:", error);
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
      return false;
    }
  }

  isTeamPicker(teamId: number): boolean {
    if (!this.gameState) return false;
    const pickingTeam = this.gameState.teams[this.gameState.pickerIndex];
    return pickingTeam.teamId === teamId;
  }

  static calculateAddedScore(
    team: GameState["teams"][number],
    wasPicker: boolean,
    correctGuessWasMade: boolean
  ): number {
    if (wasPicker && correctGuessWasMade) {
      return 2;
    }

    let addedScore = 0;

    // Points for correct guesses based on guessOrder
    if (team.guessOrder !== null) {
      switch (team.guessOrder) {
        case 1:
          addedScore += 5;
          break;
        case 2:
          addedScore += 3;
          break;
        case 3:
          addedScore += 2;
          break;
      }

      // Additional points for second correct guess
      if (team.correctArtist && team.correctSong) {
        addedScore += 2;
      }
    }

    return addedScore;
  }

  correctGuessWasMade(): boolean {
    if (!this.gameState) return false;
    return this.gameState.teams.some((team) => team.guessOrder !== null);
  }

  sendSyncEvent() {
    if (this.gameRoom) {
      this.gameRoom.send({
        type: "broadcast",
        event: SYNC_EVENT,
      });
    } else {
      console.error("Game room is not initialized");
    }
  }

  /**
   * Connect the client to the game room channel
   */
  initializeGameRoom() {
    const supabase = createClient();
    this.gameRoom = supabase.channel(this.gameCode, {
      config: { broadcast: { self: true } },
    });

    // Avoid SSR subscribing to realtime events and participating as an unexpected client
    if (typeof window === "undefined") {
      return;
    }

    /**
     * Whenever somebody sends an update to the state, store it locally
     */
    this.gameRoom.on("broadcast", { event: GAME_EVENT }, ({ payload }) => {
      console.log("broadcast (game): ", payload);
      const parsedPayload = gameStatePayloadSchema.parse(payload);
      if (this.isHost() || parsedPayload.sender === "host") {
        this.setGameState(parsedPayload.state);
      }
    });

    this.gameRoom.on(
      "broadcast",
      { event: START_ROUND_EVENT },
      ({ payload }) => {
        console.log("broadcast (start-round):", payload);
        if (this.isHost() && this.gameState) {
          const parsedPayload = startRoundPayloadSchema.parse(payload);
          const selectedSong = parsedPayload.song;

          this.gameState.selectedSong = selectedSong;
          this.gameState.lastSong = selectedSong;

          // Reset songGuess and artistGuess for all teams
          this.gameState.teams = this.gameState.teams.map((team) => ({
            ...team,
            songGuess: null,
            guessOrder: null,
            artistGuess: null,
            correctArtist: false,
            correctSong: false,
            isTyping: false,
            cheater: false,
            skipped: false,
            wasPicker: false,
            outOfGuesses: false,
            guessTime: null,
          }));

          const roundStartTime = new Date().getTime();
          console.log(`Round start time: ${roundStartTime}`);
          this.gameState.roundStartTime = roundStartTime;

          console.log(
            "Updated game state with new song and reset guesses:",
            this.gameState
          );

          // Broadcast the updated game state to all clients
          this.broadcastGameState(this.gameState);
        }
      }
    );

    this.gameRoom.on("broadcast", { event: IS_TYPING_EVENT }, ({ payload }) => {
      console.log("broadcast (is-typing):", payload);
      const parsedPayload = isTypingSchema.parse(payload);
      if (this.isHost() && this.gameState) {
        const updatedTeams = this.gameState.teams.map((team) =>
          team.teamId === parsedPayload.teamId && team.guessOrder === null
            ? { ...team, isTyping: parsedPayload.isTyping }
            : team
        );
        this.setGameStateTeams(updatedTeams);
      }
    });

    this.gameRoom.on("broadcast", { event: GUESS_EVENT }, ({ payload }) => {
      console.log("broadcast (guess):", payload);
      const guess = guessSchema.parse(payload);

      if (this.isHost()) {
        if (guess.type === "cheater") {
          // Update the team's guess, correctness, and guesses left
          const updatedTeams = this.gameState!.teams.map((team) => {
            if (team.teamId === guess.teamId) {
              return {
                ...team,
                cheater: true,
                guessesLeft: { artist: 0, song: 0 },
                isTyping: false, // Reset typing status after a guess
              };
            }
            return team;
          });
          // Update the game state with the new teams
          this.setGameStateTeams(updatedTeams);
        } else if (guess.type === "skip") {
          // Update the team's guess, correctness, and guesses left
          const updatedTeams = this.gameState!.teams.map((team) => {
            if (team.teamId === guess.teamId) {
              return {
                ...team,
                skipped: team.guessOrder === null ? true : team.skipped,
                guessesLeft: { artist: 0, song: 0 },
                isTyping: false, // Reset typing status after a guess
              };
            }
            return team;
          });
          // Update the game state with the new teams
          this.setGameStateTeams(updatedTeams);
        } else if (guess.type === "artist" || guess.type === "song") {
          // Check if the guess is correct
          const isCorrect = this.isGuessCorrect(guess.type, guess.value);

          // Update the team's guess, correctness, and guesses left
          const updatedTeams = this.gameState!.teams.map((team) => {
            if (team.teamId === guess.teamId) {
              return {
                ...team,
                [guess.type === "song" ? "songGuess" : "artistGuess"]:
                  guess.value,
                correctArtist:
                  guess.type === "artist" ? isCorrect : team.correctArtist,
                correctSong:
                  guess.type === "song" ? isCorrect : team.correctSong,
                guessesLeft: guess.guessesLeft,
                isTyping: false, // Reset typing status after a guess
              };
            }
            return team;
          });

          // Update the game state with the new teams
          this.setGameStateTeams(updatedTeams);

          // If the guess is correct, we'll handle additional logic (like scoring) in the next block
          if (isCorrect) {
            // Find the next available guessOrder
            const nextGuessOrder = [1, 2, 3].find(
              (order) =>
                !this.gameState!.teams.some((team) => team.guessOrder === order)
            ) as 1 | 2 | 3 | undefined;

            console.log(`Processing correct guess for team ${guess.teamId}`);
            let updatedTeams = this.gameState!.teams.map((team) => {
              if (team.teamId === guess.teamId) {
                console.log(`Updated team ${team.teamId}:`, team);
                if (team.guessOrder !== null) {
                  console.log(
                    `Second correct guess for team ${team.teamId}, awarding 2 points`
                  );
                  return {
                    ...team,
                    score: team.score + 2,
                  };
                } else if (nextGuessOrder) {
                  console.log(`First correct guess for team ${team.teamId}`);
                  let pointsAwarded;
                  switch (nextGuessOrder) {
                    case 1:
                      pointsAwarded = 5;
                      break;
                    case 2:
                      pointsAwarded = 3;
                      break;
                    case 3:
                      pointsAwarded = 2;
                      break;
                    default:
                      pointsAwarded = 0;
                  }
                  console.log(
                    `Awarding ${pointsAwarded} points to team ${team.teamId} for guess order ${nextGuessOrder}`
                  );
                  return {
                    ...team,
                    guessOrder: nextGuessOrder,
                    score: team.score + pointsAwarded,
                    guessTime: new Date().getTime(),
                  };
                }
              } else {
                console.log(`No changes for team ${team.teamId}`);
              }
              return team;
            });

            // If this is the first guess overall, award the picker 2 points
            if (nextGuessOrder === 1) {
              console.log("First guess made. Awarding 2 points to the picker.");
              updatedTeams = updatedTeams.map((team) => {
                if (this.isTeamPicker(team.teamId)) {
                  return {
                    ...team,
                    score: team.score + 2,
                  };
                }
                return team;
              });
            }

            // Use updateTeams method to update and broadcast the changes
            this.setGameStateTeams(updatedTeams);
          } else {
            console.log(`Incorrect guess from team ${guess.teamId}`);

            // If it's the last guess, mark the team as out of guesses if they're not in the top 3
            if (this.gameState) {
              if (guess.lastGuess) {
                console.log(`Team ${guess.teamId} has made their last guess`);
                const updatedTeams = this.gameState.teams.map((team) => {
                  if (team.teamId === guess.teamId) {
                    // Only set outOfGuesses if the team's guessOrder is null
                    if (team.guessOrder === null) {
                      console.log(`Team ${guess.teamId} is out of guesses`);
                      return {
                        ...team,
                        outOfGuesses: true,
                      };
                    }
                  }
                  return team;
                });
                this.setGameStateTeams(updatedTeams);
              }
            } else {
              console.error(
                "Game state is null when trying to process last guess"
              );
            }
          }
        }
        // After processing the guess, check if the round is over
        if (this.isRoundOver()) {
          this.startCountdown();
        }
      } else if (this.getTeamIdForCurrentPlayer() === guess.teamId) {
        if (guess.type === "artist" || guess.type === "song") {
          // Update the team's guess status using setters
          this.setOwnTeamCorrectArtist(guess.correctArtist);
          this.setOwnTeamCorrectSong(guess.correctSong);
          this.setOwnTeamGuessesLeft(guess.guessesLeft);
          if (guess.type === "artist") {
            this.setOwnTeamArtistGuess(guess.value);
          } else if (guess.type === "song") {
            this.setOwnTeamSongGuess(guess.value);
          }

          console.log(`Updated guess status for team ${guess.teamId}`);
          console.log(`Correct artist: ${this.correctArtist()}`);
          console.log(`Correct song: ${this.correctSong()}`);
          console.log(`Guesses left:`, this.guessesLeft());
        }
      }
    });

    this.gameRoom.on("broadcast", { event: SYNC_EVENT }, () => {
      console.log("Received sync event");
      console.log("Current game state:", this.gameState);
      if (this.gameState && this.isHost()) {
        this.broadcastGameState(this.gameState);
      }
    });

    // Handle tab visibility changes
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
          console.log("Tab became visible, sending sync event");
          this.sendSyncEvent();
        }
      });
    }

    this.gameRoom.subscribe((status) => {
      console.log(status);
      if (status === "SUBSCRIBED") {
        this.sendSyncEvent();
      }
    });
  }

  setGameStateTeams(updatedTeams: GameState["teams"]) {
    if (!this.gameState) {
      throw new Error("Game state is not initialized");
    }

    this.gameState.teams = updatedTeams;
  }

  cleanup() {
    this.gameRoom?.unsubscribe();
    this.gameRoom = null;
  }
}
