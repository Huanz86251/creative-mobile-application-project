import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { usePlayer } from "../../context/PlayerContext";
import { router } from "expo-router";

export default function TrackDetails() {
  const { currentTrack, isPlaying, togglePlayPause } = usePlayer();

  if (!currentTrack) {
    return (
      <View style={styles.container}>
        <Text>No track selected</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.back} onPress={() => router.back()}>
        ← Back
      </Text>

      <Image source={{ uri: currentTrack.artworkUrl100 }} style={styles.cover} />
      <Text style={styles.title}>{currentTrack.trackName}</Text>
      <Text style={styles.artist}>{currentTrack.artistName}</Text>

      <TouchableOpacity style={styles.button} onPress={togglePlayPause}>
        <Text style={styles.buttonText}>{isPlaying ? "⏸ Pause" : "▶️ Play"}</Text>
      </TouchableOpacity>
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
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 6 },
  artist: { fontSize: 18, color: "gray", marginBottom: 16 },
  button: {
    backgroundColor: "#1DB954",
    paddingVertical: 10,
    paddingHorizontal: 40,
    borderRadius: 25,
  },
  buttonText: { color: "#fff", fontSize: 18 },
  back: { position: "absolute", top: 50, left: 20, fontSize: 18, color: "blue" },
});
