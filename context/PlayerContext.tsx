import React, { createContext, useContext, useRef, useState, useEffect, ReactNode } from "react";
import { Audio, AVPlaybackStatusSuccess } from "expo-av";
import { Track } from "../features/tracks/tracksSlice";

type PlayOptions = { queue?: Track[]; index?: number; force?: boolean };
type PlaybackMode = "sequential" | "shuffle" | "repeat-one";

type PlayerContextType = {
  currentTrack: Track | null;
  currentTrackId: string | null;
  isPlaying: boolean;
  positionMillis: number;
  durationMillis: number;
  playTrack: (track: Track, options?: PlayOptions) => Promise<void>;
  playNext: () => Promise<void>;
  playPrevious: () => Promise<void>;
  canSkipNext: boolean;
  canSkipPrevious: boolean;
  togglePlayPause: () => Promise<void>;
  playbackMode: PlaybackMode;
  cyclePlaybackMode: () => void;
};

export const PlayerContext = createContext<PlayerContextType>({
  currentTrack: null,
  currentTrackId: null,
  isPlaying: false,
  positionMillis: 0,
  durationMillis: 0,
  playTrack: async () => {},
  playNext: async () => {},
  playPrevious: async () => {},
  canSkipNext: false,
  canSkipPrevious: false,
  togglePlayPause: async () => {},
  playbackMode: "sequential",
  cyclePlaybackMode: () => {},
});

export const usePlayer = () => useContext(PlayerContext);

export const PlayerProvider = ({ children }: { children: ReactNode }) => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [positionMillis, setPositionMillis] = useState(0);
  const [durationMillis, setDurationMillis] = useState(0);
  const [queue, setQueue] = useState<Track[]>([]);
  const [queueIndex, setQueueIndex] = useState<number>(-1);
  const [playbackMode, setPlaybackMode] = useState<PlaybackMode>("sequential");
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      (async () => {
        try {
          if (soundRef.current) {
            await soundRef.current.stopAsync().catch(() => {});
            await soundRef.current.unloadAsync().catch(() => {});
            soundRef.current = null;
          }
        } catch {}
      })();
    };
  }, []);

  const cyclePlaybackMode = () =>
    setPlaybackMode((m) => (m === "sequential" ? "shuffle" : m === "shuffle" ? "repeat-one" : "sequential"));

  const resolvePreviewUrl = async (track: Track): Promise<string | null> => {
    if (track.previewUrl) return track.previewUrl;
    if (track.previewUrlResolver) {
      try {
        const url = await track.previewUrlResolver();
        if (url) {
          track.previewUrl = url;
          return url;
        }
      } catch {}
    }
    return null;
  };

  const safeSetProgress = (pos?: number, dur?: number) => {
    if (!mountedRef.current) return;
    if (typeof pos === "number") setPositionMillis(pos);
    if (typeof dur === "number") setDurationMillis(dur);
  };

  const handleDidJustFinish = async () => {
    if (!mountedRef.current) return;

    if (playbackMode === "repeat-one") {
      const s = soundRef.current;
      if (!s) return;
      try {
        await s.setPositionAsync(0);
        await s.playAsync();
        setIsPlaying(true);
        safeSetProgress(0, durationMillis);
      } catch {
        setIsPlaying(false);
      }
      return;
    }

    await playNext(); // will pass force: true
  };

  const onPlaybackStatusUpdate = (track: Track) => (status: any) => {
    if (!mountedRef.current || !status?.isLoaded) return;
    const s = status as AVPlaybackStatusSuccess;
    safeSetProgress(s.positionMillis ?? 0, s.durationMillis ?? track.trackTimeMillis ?? durationMillis ?? 0);
    if (s.didJustFinish) {
      setIsPlaying(false);
      setTimeout(() => handleDidJustFinish(), 0);
    }
  };

  const startPlaybackFor = async (track: Track) => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync().catch(() => {});
        await soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
      }
    } catch {}

    const uri = track.previewUrl!;
    const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true });
    soundRef.current = sound;

    if (!mountedRef.current) return;

    setCurrentTrack(track);
    setPositionMillis(0);
    setDurationMillis(track.trackTimeMillis ?? 0);
    setIsPlaying(true);

    sound.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate(track));
  };

  const playTrack = async (track: Track, options?: PlayOptions) => {
    try {
      const previewUrl = await resolvePreviewUrl(track);
      if (!previewUrl) {
        console.warn("No previewUrl for", track.trackName);
        return;
      }

      // IMPORTANT: only toggle if not forced
      if (!options?.force && currentTrack?.trackId === track.trackId && soundRef.current) {
        await togglePlayPause();
        return;
      }

      let nextQueue = options?.queue ?? queue;
      if (!nextQueue?.length) nextQueue = [track];

      let nextIndex =
        typeof options?.index === "number"
          ? options.index
          : nextQueue.findIndex((t) => t.trackId === track.trackId);
      if (nextIndex < 0) nextIndex = 0;

      setQueue(nextQueue);
      setQueueIndex(nextIndex);

      await startPlaybackFor(track);
    } catch (err) {
      console.error("playTrack error:", err);
      setIsPlaying(false);
    }
  };

  const pickNextIndex = (): number => {
    if (!queue.length) return -1;
    if (playbackMode === "shuffle") {
      if (queue.length === 1) return queueIndex;
      let r = queueIndex;
      while (r === queueIndex) r = Math.floor(Math.random() * queue.length);
      return r;
    }
    return queueIndex + 1 < queue.length ? queueIndex + 1 : 0;
  };

  const pickPrevIndex = (): number => {
    if (!queue.length) return -1;
    if (playbackMode === "shuffle") {
      if (queue.length === 1) return queueIndex;
      let r = queueIndex;
      while (r === queueIndex) r = Math.floor(Math.random() * queue.length);
      return r;
    }
    return queueIndex > 0 ? queueIndex - 1 : queue.length - 1;
  };

  const playNext = async () => {
    if (!queue.length) return;
    const nextIndex = pickNextIndex();
    if (nextIndex < 0) return;
    const nextTrack = queue[nextIndex];
    setQueueIndex(nextIndex);
    await playTrack(nextTrack, { queue, index: nextIndex, force: true });
  };

  const playPrevious = async () => {
    if (!queue.length) return;
    const prevIndex = pickPrevIndex();
    if (prevIndex < 0) return;
    const prevTrack = queue[prevIndex];
    setQueueIndex(prevIndex);
    await playTrack(prevTrack, { queue, index: prevIndex, force: true });
  };

  const togglePlayPause = async () => {
    const s = soundRef.current;
    if (!s) return;
    try {
      const status = await s.getStatusAsync();
      if (status.isLoaded && status.isPlaying) {
        await s.pauseAsync();
        setIsPlaying(false);
        safeSetProgress(status.positionMillis ?? positionMillis, status.durationMillis ?? durationMillis);
      } else if (status.isLoaded) {
        await s.playAsync();
        setIsPlaying(true);
        safeSetProgress(status.positionMillis ?? positionMillis, status.durationMillis ?? durationMillis);
      }
    } catch (err) {
      console.error("togglePlayPause error:", err);
    }
  };

  const canSkip = queue.length > 1;

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        currentTrackId: currentTrack?.trackId?.toString() ?? null,
        isPlaying,
        positionMillis,
        durationMillis,
        playTrack,
        playNext,
        playPrevious,
        canSkipNext: canSkip,
        canSkipPrevious: canSkip,
        togglePlayPause,
        playbackMode,
        cyclePlaybackMode,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};
