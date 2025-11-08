import { View, Text, Image, TouchableOpacity } from "react-native";
import { usePlayer } from "../context/PlayerContext";
import { useRouter } from "expo-router";

export default function NowPlayingBar() {
  const { currentTrack } = usePlayer();
  const router = useRouter();

  if (!currentTrack) {
    console.log("🎵 No current track found");
    return (
        <View
        style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: "red",
            padding: 10,
        }}
        >
        <Text style={{ color: "#fff" }}>No track selected</Text>
        </View>
    );
    }

  return (
    <TouchableOpacity
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "#222",
        flexDirection: "row",
        alignItems: "center",
        padding: 10,
        borderTopWidth: 1,
        borderTopColor: "#444",
      }}
      onPress={() =>
        router.push({
          pathname: "/track/[id]",
          params: { id: currentTrack.trackId.toString() },
        })
      }
    >
      <Image
        source={{ uri: currentTrack.artworkUrl60 }}
        style={{ width: 50, height: 50, borderRadius: 4 }}
      />
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={{ color: "#fff", fontWeight: "bold" }} numberOfLines={1}>
          {currentTrack.trackName}
        </Text>
        <Text style={{ color: "#aaa" }} numberOfLines={1}>
          {currentTrack.artistName}
        </Text>
      </View>
      <Text style={{ color: "#1DB954", fontWeight: "bold" }}>▶</Text>
    </TouchableOpacity>
  );
}
