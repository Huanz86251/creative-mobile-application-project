import { View, Text, Image } from "react-native";
import { usePlayer } from "../context/PlayerContext";

export default function PlayerScreen() {
  const { currentTrack } = usePlayer();

  if (!currentTrack)
    return <Text style={{ textAlign: "center", marginTop: 40 }}>No track selected</Text>;

  return (
    <View style={{ flex: 1, alignItems: "center", padding: 20 }}>
      <Image
        source={{ uri: currentTrack.artworkUrl100 }}
        style={{ width: 250, height: 250, borderRadius: 12, marginBottom: 20 }}
      />
      <Text style={{ fontSize: 22, fontWeight: "bold" }}>{currentTrack.trackName}</Text>
      <Text style={{ fontSize: 16, color: "#888", marginBottom: 30 }}>{currentTrack.artistName}</Text>
      <Text style={{ fontSize: 14, color: "#555" }}>🎧 Track ID: {currentTrack.trackId}</Text>
    </View>
  );
}
