import { View, Text, Image, ScrollView } from "react-native";
import { useLocalSearchParams } from "expo-router";

export default function PlaylistDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();


  const playlists = {
    pl_1: { title: "Focus Flow", cover: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=1200&auto=format&fit=crop" },
    pl_2: { title: "Lo-Fi Chill", cover: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1200&auto=format&fit=crop" },
    pl_3: { title: "EDM Hits", cover: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=1200&auto=format&fit=crop" },
  };

  const playlist = playlists[id as keyof typeof playlists];

  return (
    <ScrollView className="flex-1 bg-background">
      <Image source={{ uri: playlist?.cover }} style={{ width: "100%", height: 260 }} />
      <View className="p-4">
        <Text className="text-white text-2xl font-bold">{playlist?.title}</Text>
        <Text className="text-gray-400 mt-2">Playlist ID: {id}</Text>
      </View>
    </ScrollView>
  );
}
