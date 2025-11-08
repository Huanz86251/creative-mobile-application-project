import { View, Button, StyleSheet } from "react-native";
import { useEffect, useState } from "react";
import { Audio } from "expo-av";

export const PlayerControls = ({
  allTracks,
  startIndex,
  onTrackChange,
}: {
  allTracks: any[];
  startIndex: number;
  onTrackChange?: (newIndex: number) => void;
}) => {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(startIndex);

  const currentTrack = allTracks[currentIndex];

  const playTrack = async (url: string) => {
    try {
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: url },
        { shouldPlay: true }
      );
      setSound(newSound);
      setPlaying(true);
    } catch (error) {
      console.error("🎵 播放出错:", error);
    }
  };

  useEffect(() => {
    if (currentTrack?.previewUrl) {
      playTrack(currentTrack.previewUrl);
      onTrackChange?.(currentIndex); // 👈 通知父组件更新 UI
    }
    return () => {
      sound?.unloadAsync();
    };
  }, [currentIndex]);

  const handlePlayPause = async () => {
    if (!sound) return;
    if (isPlaying) {
      await sound.pauseAsync();
      setPlaying(false);
    } else {
      await sound.playAsync();
      setPlaying(true);
    }
  };

  const handleNext = () => {
    if (allTracks.length === 0) return;
    const next = (currentIndex + 1) % allTracks.length;
    setCurrentIndex(next);
  };

  const handlePrev = () => {
    if (allTracks.length === 0) return;
    const prev =
      currentIndex === 0 ? allTracks.length - 1 : currentIndex - 1;
    setCurrentIndex(prev);
  };

  return (
    <View style={styles.controls}>
      <Button title="⏮ Prev" onPress={handlePrev} />
      <Button
        title={isPlaying ? "⏸ Pause" : "▶️ Play"}
        onPress={handlePlayPause}
      />
      <Button title="⏭ Next" onPress={handleNext} />
    </View>
  );
};

const styles = StyleSheet.create({
  controls: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginTop: 20,
    width: "80%",
  },
});
