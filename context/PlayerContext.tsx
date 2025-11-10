// context/PlayerContext.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Alert, Platform } from "react-native";
import { Audio, AVPlaybackStatusSuccess } from "expo-av";
import { Track } from "../features/tracks/tracksSlice";

// 允许多种来源字段
export type PlayableTrack = Track & {
  localUri?: string;
  preview_url?: string;
  streamUrl?: string;
  stream_url?: string;
  url?: string;
  artwork_url?: string;
};

type PlayerContextType = {
  currentTrack: PlayableTrack | null;
  currentTrackId: string | null;
  isPlaying: boolean;
  playTrack: (track: PlayableTrack) => Promise<void>;
  togglePlayPause: () => Promise<void>;
  // 新增：队列控制
  setQueue: (tracks: PlayableTrack[], startIndex?: number) => Promise<void>;
  playNext: () => Promise<void>;
  playPrev: () => Promise<void>;
};

export const PlayerContext = createContext<PlayerContextType>({
  currentTrack: null,
  currentTrackId: null,
  isPlaying: false,
  playTrack: async () => {},
  togglePlayPause: async () => {},
  setQueue: async () => {},
  playNext: async () => {},
  playPrev: async () => {},
});

export const usePlayer = () => useContext(PlayerContext);

export const PlayerProvider = ({ children }: { children: ReactNode }) => {
  const [currentTrack, setCurrentTrack] = useState<PlayableTrack | null>(null);
  const [soundObj, setSoundObj] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // 播放队列
  const [queue, setQueueState] = useState<PlayableTrack[]>([]);
  const [queueIndex, setQueueIndex] = useState<number>(-1);

  useEffect(() => {
    (async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: false,
          playsInSilentModeIOS: true,
          interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
          shouldDuckAndroid: true,
          interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
          playThroughEarpieceAndroid: false,
        });
      } catch {}
    })();

    return () => {
      (async () => {
        try { await soundObj?.stopAsync(); } catch {}
        try { await soundObj?.unloadAsync(); } catch {}
      })();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    };
  }, []);

  function pickSourceUri(track: PlayableTrack): string | null {
    return (
      track.localUri ??
      track.previewUrl ??
      (track as any).preview_url ??
      track.streamUrl ??
      (track as any).stream_url ??
      track.url ??
      null
    );
  }

  async function _stopAndUnload() {
    if (soundObj) {
      try { await soundObj.stopAsync(); } catch {}
      try { await soundObj.unloadAsync(); } catch {}
    }
  }

  async function _loadAndPlay(track: PlayableTrack) {
    const sourceUri = pickSourceUri(track);
    if (!sourceUri) {
      console.warn("⚠️ 无效的音频源：缺少 localUri / previewUrl / streamUrl / url");
      return;
    }
    if (Platform.OS === "web" && sourceUri.startsWith("file://")) {
      Alert.alert("Cannot play", "Web 平台通常无法播放本地文件（file://）。请在 iOS/Android 设备上播放。");
      return;
    }

    const { sound } = await Audio.Sound.createAsync(
      { uri: sourceUri },
      { shouldPlay: true },
      (s) => {
        if ("isLoaded" in s && s.isLoaded) {
          const status = s as AVPlaybackStatusSuccess;
          setIsPlaying(status.isPlaying);
          if (status.didJustFinish) {
            setIsPlaying(false);
            // 自动下一首
            playNext().catch(() => {});
          }
        }
      }
    );
    setSoundObj(sound);
    setCurrentTrack(track);
    setIsPlaying(true);
  }

  // 播放或切换到指定歌曲
  const playTrack = async (track: PlayableTrack) => {
    try {
      // 如果点的是当前曲目 -> 切换播放/暂停
      if (currentTrack?.trackId === track.trackId && soundObj) {
        await togglePlayPause();
        return;
      }

      // 如果该曲目在队列里，更新 index；否则将队列置为仅此一首
      const foundIdx = queue.findIndex((t) => String(t.trackId) === String(track.trackId));
      if (foundIdx !== -1) {
        setQueueIndex(foundIdx);
      } else {
        setQueueState([track]);
        setQueueIndex(0);
      }

      await _stopAndUnload();
      await _loadAndPlay(track);
    } catch (error) {
      console.error("🎧 播放错误:", error);
      setIsPlaying(false);
    }
  };

  const togglePlayPause = async () => {
    if (!soundObj) return;
    const status = await soundObj.getStatusAsync();
    if ("isLoaded" in status && status.isLoaded) {
      if (status.isPlaying) {
        await soundObj.pauseAsync();
        setIsPlaying(false);
      } else {
        await soundObj.playAsync();
        setIsPlaying(true);
      }
    }
  };

  // 设置播放队列（可在 TrackListItem 点击时注入）
  const setQueue = async (tracks: PlayableTrack[], startIndex = 0) => {
    setQueueState(tracks);
    setQueueIndex(startIndex);
    const start = tracks[startIndex];
    if (start) {
      await _stopAndUnload();
      await _loadAndPlay(start);
    }
  };

  const playNext = async () => {
    if (!queue.length) return;
    const nextIdx = queueIndex + 1;
    if (nextIdx >= queue.length) {
      // 到底了，这里选择停住；你也可以循环：const ni = 0;
      return;
    }
    setQueueIndex(nextIdx);
    await _stopAndUnload();
    await _loadAndPlay(queue[nextIdx]);
  };

  const playPrev = async () => {
    if (!queue.length) return;
    const prevIdx = queueIndex - 1;
    if (prevIdx < 0) {
      // 已在第一首，停住；也可循环：const pi = queue.length - 1;
      return;
    }
    setQueueIndex(prevIdx);
    await _stopAndUnload();
    await _loadAndPlay(queue[prevIdx]);
  };

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        currentTrackId: currentTrack?.trackId?.toString() ?? null,
        isPlaying,
        playTrack,
        togglePlayPause,
        setQueue,
        playNext,
        playPrev,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};
