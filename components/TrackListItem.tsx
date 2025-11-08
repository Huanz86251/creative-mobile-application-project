import { Link } from "expo-router";
import { View, Text, Image, TouchableOpacity } from "react-native";

export const TrackListItem = ({
  track,
  index,
  allTracks,
}: {
  track: any;
  index: number;
  allTracks: any[];
}) => {
  return (
    <Link
      href={{
        pathname: "/track/[id]",
        params: {
          id: track.trackId,
          title: track.trackName,
          artist: track.artistName,
          cover: track.artworkUrl100,
          url: track.previewUrl,
          index: index.toString(),
          tracks: JSON.stringify(allTracks), // 👈 传整个歌单
        },
      }}
      asChild
    >
      <TouchableOpacity style={{ flexDirection: "row", marginVertical: 8 }}>
        <Image
          source={{ uri: track.artworkUrl100 }}
          style={{ width: 60, height: 60, borderRadius: 8, marginRight: 12 }}
        />
        <View>
          <Text style={{ fontSize: 18 }}>{track.trackName}</Text>
          <Text style={{ color: "gray" }}>{track.artistName}</Text>
        </View>
      </TouchableOpacity>
    </Link>
  );
};
