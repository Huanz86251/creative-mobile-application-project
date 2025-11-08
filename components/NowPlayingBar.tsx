import { View, Text, Image, TouchableOpacity } from "react-native";
import { usePlayer } from "../context/PlayerContext";
import { useRouter } from "expo-router";

export default function NowPlayingBar() {
  const { currentTrack, isPlaying, togglePlayPause } = usePlayer();
  const router = useRouter();

  if (!currentTrack) return null;

  return (
    <View
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
    >
      {/* 点击左侧歌曲信息跳转详情页 */}
      <TouchableOpacity
        style={{ flexDirection: "row", flex: 1, alignItems: "center" }}
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
      </TouchableOpacity>

      {/* 右侧播放/暂停按钮 */}
      <TouchableOpacity
        onPress={togglePlayPause}
        style={{
          marginLeft: 10,
          backgroundColor: "#FF9500",
          borderRadius: 20,
          padding: 8,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text style={{ color: "#fff", fontSize: 16, fontWeight: "bold" }}>
          {isPlaying ? "⏸" : "▶️"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
