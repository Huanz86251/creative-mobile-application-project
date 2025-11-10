import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Alert, Platform } from "react-native";
import { Audio, AVPlaybackStatusSuccess } from "expo-av";
import { Track } from "../features/tracks/tracksSlice";

// 扩展：允许传入 localUri/其它命名的流地址（不改 slice 也能兼容）
type PlayableTrack = Track & {
  localUri?: string;
  preview_url?: string; // 有些接口用下划线
  streamUrl?: string;
  stream_url?: string;
  url?: string;
  artwork_url?: string; // 兼容不同源的封面字段
};

type PlayerContextType = {
  currentTrack: PlayableTrack | null;
  currentTrackId: string | null;
  isPlaying: boolean;
  playTrack: (track: PlayableTrack) => Promise<void>;
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
  const [currentTrack, setCurrentTrack] = useState<PlayableTrack | null>(null);
  const [soundObj, setSoundObj] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // 一次性配置播放模式（静音键播放、后台策略等）
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

    // Provider 卸载时释放资源（通常不发生，但以防万一）
    return () => {
      (async () => {
        try { await soundObj?.stopAsync(); } catch {}
        try { await soundObj?.unloadAsync(); } catch {}
      })();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 统一选择音频 URL：本地优先，其次 preview/stream/url
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

  // ✅ 播放或切换歌曲
  const playTrack = async (rawTrack: PlayableTrack) => {
    try {
      const sourceUri = pickSourceUri(rawTrack);

      if (!sourceUri) {
        console.warn("⚠️ 无效的音频源：缺少 localUri / previewUrl / streamUrl / url");
        return;
      }
      // Web 端一般无法播放 file://
      if (Platform.OS === "web" && sourceUri.startsWith("file://")) {
        Alert.alert("Cannot play", "Web 平台通常无法播放本地文件（file://）。请在 iOS/Android 设备上播放。");
        return;
      }

      // 如果点击的是当前歌曲 → 切换播放/暂停
      if (currentTrack?.trackId === rawTrack.trackId && soundObj) {
        await togglePlayPause();
        return;
      }

      // 停止并卸载旧实例
      if (soundObj) {
        try { await soundObj.stopAsync(); } catch {}
        try { await soundObj.unloadAsync(); } catch {}
      }

      // 创建并播放新实例
      const { sound } = await Audio.Sound.createAsync(
        { uri: sourceUri },
        { shouldPlay: true },
        (s) => {
          if ("isLoaded" in s && s.isLoaded) {
            const status = s as AVPlaybackStatusSuccess;
            setIsPlaying(status.isPlaying);
            if (status.didJustFinish) {
              setIsPlaying(false);
              // 可选：这里也可以把 currentTrack 设为空
            }
          }
        }
      );

      setSoundObj(sound);
      setCurrentTrack(rawTrack);
      setIsPlaying(true);
    } catch (error) {
      console.error("🎧 播放错误:", error);
      setIsPlaying(false);
    }
  };

  // ✅ 暂停 / 恢复
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
