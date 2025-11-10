// components/NowPlayingBar.tsx
import { View, Text, Image, TouchableOpacity } from "react-native";
import { usePlayer } from "../context/PlayerContext";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function NowPlayingBar() {
  const { currentTrack, isPlaying, togglePlayPause, playPrev, playNext } = usePlayer();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const TAB_BAR_BASE = 60;
  const barBottom = insets.bottom + TAB_BAR_BASE + 8;

  if (!currentTrack) return null;

  return (
    <View
      style={{
        position: "absolute",
        bottom: barBottom, // 避让 TabBar
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
      {/* 左侧：封面 + 标题/歌手，点击跳详情 */}
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
          source={{ uri: (currentTrack as any).artworkUrl60 || (currentTrack as any).artwork_url }}
          style={{ width: 50, height: 50, borderRadius: 4 }}
        />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={{ color: "#fff", fontWeight: "bold" }} numberOfLines={1}>
            {currentTrack.trackName || (currentTrack as any).title}
          </Text>
          <Text style={{ color: "#aaa" }} numberOfLines={1}>
            {currentTrack.artistName || (currentTrack as any).artist || "Unknown"}
          </Text>
        </View>
      </TouchableOpacity>

      {/* 右侧控制区：上一首 / 播放暂停 / 下一首 */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <TouchableOpacity
          onPress={playPrev}
          style={{
            backgroundColor: "#444",
            borderRadius: 20,
            paddingVertical: 8,
            paddingHorizontal: 10,
            marginLeft: 6,
          }}
        >
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "bold" }}>⏮</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={togglePlayPause}
          style={{
            backgroundColor: "#FF9500",
            borderRadius: 20,
            paddingVertical: 8,
            paddingHorizontal: 12,
            marginHorizontal: 4,
          }}
        >
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "bold" }}>
            {isPlaying ? "⏸" : "▶️"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={playNext}
          style={{
            backgroundColor: "#444",
            borderRadius: 20,
            paddingVertical: 8,
            paddingHorizontal: 10,
            marginRight: 6,
          }}
        >
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "bold" }}>⏭</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
