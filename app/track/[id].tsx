import { View, Text, Image, StyleSheet } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useState, useEffect } from "react";
import { PlayerControls } from "../../components/PlayerControls";

export default function TrackDetails() {
  const { index, tracks } = useLocalSearchParams<{
    index: string;
    tracks: string;
  }>();

  const allTracks = tracks ? JSON.parse(tracks) : [];
  const startIndex = parseInt(index);
  const [currentIndex, setCurrentIndex] = useState(startIndex);

  // 当前播放歌曲
  const currentTrack = allTracks[currentIndex];

  // 当 PlayerControls 切歌时更新当前索引
  const handleTrackChange = (newIndex: number) => {
    setCurrentIndex(newIndex);
  };

  useEffect(() => {
    if (!currentTrack) return;
  }, [currentIndex]);

  return (
    <View style={styles.container}>
      {/* 返回按钮 */}
      <Text style={styles.back} onPress={() => router.back()}>
        ← Back
      </Text>

      {/* 动态封面 */}
      <Image
        source={{ uri: currentTrack?.artworkUrl100 }}
        style={styles.cover}
      />
      <Text style={styles.title}>{currentTrack?.trackName}</Text>
      <Text style={styles.artist}>{currentTrack?.artistName}</Text>

      {/* 播放控制器 */}
      <PlayerControls
        allTracks={allTracks}
        startIndex={currentIndex}
        onTrackChange={handleTrackChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  cover: {
    width: 260,
    height: 260,
    borderRadius: 12,
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 6,
  },
  artist: {
    fontSize: 18,
    color: "gray",
    textAlign: "center",
    marginBottom: 16,
  },
  back: {
    position: "absolute",
    top: 50,
    left: 20,
    fontSize: 18,
    color: "blue",
  },
});
