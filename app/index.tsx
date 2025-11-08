import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { useEffect, useState } from "react";
import { Link } from "expo-router";
import { TrackListItem } from "../components/TrackListItem";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { Track } from "../features/tracks/tracksSlice";
export default function HomeScreen() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

    useEffect(() => {
    const fetchSongs = async () => {
        try {
        console.log("🎵 正在请求 iTunes API...");
        const res = await fetch(
            "https://itunes.apple.com/search?term=taylor+swift&entity=song&limit=10"
        );

        console.log("✅ Status:", res.status);
        const text = await res.text();
        console.log("📦 Content:", text.slice(0, 300)); // 只打印前300字符

        const data = JSON.parse(text);
        console.log("🎶 Number:", data.results?.length);

        setTracks(data.results);
        } catch (err) {
        console.error("❌ Fetch Error:", err);
        } finally {
        setLoading(false);
        }
    };

    fetchSongs();
    }, []);


  if (loading) return <ActivityIndicator size="large" style={{ flex: 1 }} />;

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 12 }}>All Songs</Text>
        <FlatList
        data={tracks}
        keyExtractor={(item) => item.trackId.toString()}
        renderItem={({ item, index }) => (
            <TrackListItem track={item} index={index} allTracks={tracks} />
        )}
        />

      <Link href="/favorites" style={{ color: "blue", marginTop: 12 }}>
        Go to Favorites →
      </Link>
    </View>
  );
}
