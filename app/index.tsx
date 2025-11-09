import { View, Text, FlatList, TextInput, ActivityIndicator, Alert,Button } from "react-native";
import { useEffect, useState } from "react";
import { Link ,useRouter} from "expo-router";
import { TrackListItem } from "../components/TrackListItem";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Track } from "../features/tracks/tracksSlice";

export default function HomeScreen() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [artist, setArtist] = useState("");
  const router = useRouter();

  // 随机歌手列表
  const artists = ["Taylor Swift", "Ed Sheeran", "Drake", "Adele", "Justin Bieber", "The Weeknd", "Bruno Mars"];

  const fetchSongs = async (term: string) => {
    setLoading(true);
    try {
      console.log(`🎵 Fetching songs for: ${term}`);
      const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&limit=15`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      const data = await res.json();
      if (!data.results?.length) {
        Alert.alert("No Results", "Try a different artist or song name.");
        setTracks([]);
      } else {
        setTracks(data.results);
      }
    } catch (err) {
      console.error("❌ Fetch Error:", err);
      Alert.alert("Error", "Failed to fetch songs.");
    } finally {
      setLoading(false);
    }
  };

  // 初次加载：随机选一个歌手
  useEffect(() => {
    const randomArtist = artists[Math.floor(Math.random() * artists.length)];
    setArtist(randomArtist);
    fetchSongs(randomArtist);
  }, []);

  const handleSearch = () => {
    if (!query.trim()) {
      Alert.alert("Please enter a keyword");
      return;
    }
    setArtist(query.trim());
    fetchSongs(query.trim());
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 8 }}>All Songs</Text>

      {/* 搜索栏 */}
      <View
        style={{
          flexDirection: "row",
          marginBottom: 12,
          alignItems: "center",
          gap: 8,
        }}
      >
        <TextInput
          style={{
            flex: 1,
            borderColor: "#ccc",
            borderWidth: 1,
            borderRadius: 8,
            padding: 8,
            fontSize: 16,
          }}
          placeholder="Search artist or song..."
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
      </View>

      <Text style={{ fontSize: 16, color: "#555", marginBottom: 6 }}>
        Showing results for: <Text style={{ fontWeight: "bold" }}>{artist}</Text>
      </Text>

      {/* 加载中状态 */}
      {loading ? (
        <ActivityIndicator size="large" style={{ flex: 1, marginTop: 20 }} />
      ) : (
        <FlatList
          data={tracks}
          keyExtractor={(item) => item.trackId.toString()}
          renderItem={({ item, index }) => (
            <TrackListItem track={item} index={index} allTracks={tracks} />
          )}
          ListEmptyComponent={<Text style={{ textAlign: "center", marginTop: 20 }}>No songs found.</Text>}
        />
      )}

      <Link href="/favorites" style={{ color: "blue", marginTop: 16 }}>
        Go to Favorites →
      </Link>
      <View style={{ marginTop: 12 }}>
        <Button title="Open Cloud Test" onPress={() => router.push("/cloud-test")} />
      </View>
    </View>
  );
}
