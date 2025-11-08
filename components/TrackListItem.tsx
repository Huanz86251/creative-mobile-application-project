import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { useContext } from "react";
import { router } from "expo-router";
import { PlayerContext } from "../context/PlayerContext";

export const TrackListItem = ({
  track,
  index,
  allTracks,
}: {
  track: any;
  index: number;
  allTracks: any[];
}) => {
  const { currentTrackId, playSound, setCurrentTrack } = useContext(PlayerContext);
  const isPlaying = currentTrackId === track.trackId.toString();

  const handlePress = async () => {
    if (track.previewUrl) {
      // ✅ 设置当前歌曲
      setCurrentTrack(track);

      // ✅ 播放音频
      await playSound(track.previewUrl);

      // ✅ （可选）跳转详情页
      // router.push({
      //   pathname: "/track/[id]",
      //   params: { id: track.trackId.toString() },
      // });
    }
  };

  return (
    <TouchableOpacity style={styles.item} onPress={handlePress}>
      <Image source={{ uri: track.artworkUrl100 }} style={styles.cover} />

      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{track.trackName}</Text>
        <Text style={styles.artist}>{track.artistName}</Text>
        {isPlaying && <Text style={styles.playing}>▶️ Playing</Text>}
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
