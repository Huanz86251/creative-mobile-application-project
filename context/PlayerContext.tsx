import React, { createContext, useContext, useState, ReactNode } from "react";
import { Audio } from "expo-av";
import { Track } from "../features/tracks/tracksSlice";

type PlayerContextType = {
  currentTrack: Track | null;
  currentTrackId: string | null;
  isPlaying: boolean;
  playTrack: (track: Track) => Promise<void>;
  togglePlayPause: () => Promise<void>;
};

export const PlayerContext = createContext<PlayerContextType>({
  currentTrack: null,
  currentTrackId: null,
  isPlaying: false,
  playTrack: async () => {},
  togglePlayPause: async () => {},
});

export const usePlayer = () => useContext(PlayerContext);

export const PlayerProvider = ({ children }: { children: ReactNode }) => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [soundObj, setSoundObj] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // ✅ 播放或切换歌曲
  const playTrack = async (track: Track) => {
    try {
      if (!track?.previewUrl) {
        console.warn("⚠️ 无效的 previewUrl:", track.trackName);
        return;
      }

      // 如果点击的是当前歌曲 → 切换播放/暂停
      if (currentTrack?.trackId === track.trackId && soundObj) {
        await togglePlayPause();
        return;
      }

      // 停止之前的歌曲
      if (soundObj) {
        await soundObj.stopAsync();
        await soundObj.unloadAsync();
      }

      // 创建新音频
      const { sound } = await Audio.Sound.createAsync({ uri: track.previewUrl });
      setSoundObj(sound);
      setCurrentTrack(track);
      setIsPlaying(true);
      await sound.playAsync();

      // 播放结束自动重置状态
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false);
        }
      });
    } catch (error) {
      console.error("🎧 播放错误:", error);
    }
  };

  // ✅ 暂停 / 恢复
  const togglePlayPause = async () => {
    if (!soundObj) return;
    const status = await soundObj.getStatusAsync();

    if (status.isLoaded && status.isPlaying) {
      await soundObj.pauseAsync();
      setIsPlaying(false);
    } else if (status.isLoaded) {
      await soundObj.playAsync();
      setIsPlaying(true);
    }
  };

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        currentTrackId: currentTrack?.trackId?.toString() ?? null,
        isPlaying,
        playTrack,
        togglePlayPause,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};
