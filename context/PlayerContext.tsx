import React, { createContext, useContext, useState, ReactNode } from "react";
import { Audio } from "expo-av";
import { Track } from "../features/tracks/tracksSlice";

type PlayOptions = {
  queue?: Track[];
  index?: number;
};

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
});

export const usePlayer = () => useContext(PlayerContext);

export const PlayerProvider = ({ children }: { children: ReactNode }) => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [soundObj, setSoundObj] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [positionMillis, setPositionMillis] = useState(0);
  const [durationMillis, setDurationMillis] = useState(0);
  const [queue, setQueue] = useState<Track[]>([]);
  const [queueIndex, setQueueIndex] = useState<number>(-1);

  const updateFromStatus = (track: Track, status: any) => {
    setPositionMillis(status.positionMillis ?? 0);
    setDurationMillis(
      status.durationMillis ?? track.trackTimeMillis ?? durationMillis ?? 0
    );
    if (status.didJustFinish) {
      setIsPlaying(false);
      setPositionMillis(0);
    }
  };

  const startPlaybackFor = async (track: Track) => {
    if (soundObj) {
      await soundObj.stopAsync();
      await soundObj.unloadAsync();
    }

    const { sound } = await Audio.Sound.createAsync({ uri: track.previewUrl });
    setSoundObj(sound);
    setCurrentTrack(track);
    setPositionMillis(0);
    setDurationMillis(track.trackTimeMillis ?? 0);
    setIsPlaying(true);
    await sound.playAsync();

    sound.setOnPlaybackStatusUpdate((status) => {
      if (!status.isLoaded) return;
      updateFromStatus(track, status);
    });
  };

  const playTrack = async (track: Track, options?: PlayOptions) => {
    try {
      if (!track?.previewUrl) {
        console.warn("⚠️ 无效的 previewUrl:", track.trackName);
        return;
      }

      if (currentTrack?.trackId === track.trackId && soundObj) {
        await togglePlayPause();
        return;
      }

      let nextQueue = options?.queue ?? queue;
      if (!nextQueue?.length) {
        nextQueue = [track];
      }

      let nextIndex =
        typeof options?.index === "number"
          ? options.index
          : nextQueue.findIndex((t) => t.trackId === track.trackId);
      if (nextIndex < 0) nextIndex = 0;

      setQueue(nextQueue);
      setQueueIndex(nextIndex);

      await startPlaybackFor(track);
    } catch (error) {
      console.error("🎧 播放错误:", error);
    }
  };

  const playNext = async () => {
    if (!queue.length) return;
    const nextIndex = queueIndex + 1 < queue.length ? queueIndex + 1 : 0;
    const nextTrack = queue[nextIndex];
    if (!nextTrack) return;
    await playTrack(nextTrack, { queue, index: nextIndex });
  };

  const playPrevious = async () => {
    if (!queue.length) return;
    const prevIndex = queueIndex > 0 ? queueIndex - 1 : queue.length - 1;
    const prevTrack = queue[prevIndex];
    if (!prevTrack) return;
    await playTrack(prevTrack, { queue, index: prevIndex });
  };

  const togglePlayPause = async () => {
    if (!soundObj) return;
    const status = await soundObj.getStatusAsync();

    if (status.isLoaded && status.isPlaying) {
      await soundObj.pauseAsync();
      setPositionMillis(status.positionMillis ?? 0);
      setIsPlaying(false);
    } else if (status.isLoaded) {
      await soundObj.playAsync();
      setPositionMillis(status.positionMillis ?? 0);
      setDurationMillis(status.durationMillis ?? durationMillis);
      setIsPlaying(true);
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
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};
