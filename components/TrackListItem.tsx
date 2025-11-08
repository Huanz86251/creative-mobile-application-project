import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { usePlayer } from "../context/PlayerContext";

export const TrackListItem = ({ track }: { track: any }) => {
  const { playTrack, currentTrackId, isPlaying } = usePlayer();

  const isThisPlaying = currentTrackId === track.trackId.toString() && isPlaying;

  const handlePress = async () => {
    await playTrack(track);
  };

  return (
    <TouchableOpacity style={styles.item} onPress={handlePress}>
      <Image source={{ uri: track.artworkUrl100 }} style={styles.cover} />
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{track.trackName}</Text>
        <Text style={styles.artist}>{track.artistName}</Text>
        {isThisPlaying && <Text style={styles.playing}>▶️ Playing</Text>}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  item: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 8,
  },
  cover: { width: 60, height: 60, borderRadius: 6, marginRight: 10 },
  title: { fontWeight: "bold" },
  artist: { color: "#666" },
  playing: { color: "green", fontSize: 12, marginTop: 2 },
});
