
import { View, Text, FlatList, TextInput, ActivityIndicator, Alert } from "react-native";
import { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { TrackListItem } from "../../components/TrackListItem";   
import { Track } from "../../features/tracks/tracksSlice";       
import { DraggableMascot } from "../../components/DraggableMascot";
export default function DiscoverScreen() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [artist, setArtist] = useState("");

  const artists = ["Taylor Swift", "Ed Sheeran", "Drake", "Adele", "Justin Bieber", "The Weeknd", "Bruno Mars"];

  const fetchSongs = async (term: string) => {
    setLoading(true);
    try {
      console.log(`🎵 Fetching songs for: ${term}`);
      const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&limit=15`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setTracks(data.results ?? []);
      if (!data.results?.length) Alert.alert("No Results", "Try a different artist or song name.");
    } catch (err) {
      console.error("❌ Fetch Error:", err);
      Alert.alert("Error", "Failed to fetch songs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const random = artists[Math.floor(Math.random() * artists.length)];
    setArtist(random);
    fetchSongs(random);
  }, []);

  const handleSearch = () => {
    const term = query.trim();
    if (!term) return Alert.alert("Please enter a keyword");
    setArtist(term);
    fetchSongs(term);
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flex: 1, padding: 16 }}>
        <View
          style={{
            backgroundColor: "rgba(12, 29, 55, 0.74)",
            borderRadius: 20,
            padding: 16,
            marginBottom: 16,
            shadowColor: "#000",
            shadowOpacity: 0.15,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 4 },
          }}
        >
          <Text style={{ fontSize: 32, fontWeight: "800", color: "#fff" }}>Search</Text>
          <Text style={{ fontSize: 16, color: "rgba(255,255,255,0.8)" }}>
            Find tracks and artists you love
          </Text>
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            backgroundColor: "#fff",
            borderRadius: 999,
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderWidth: 1,
            borderColor: "rgba(12,29,55,0.08)",
            marginBottom: 12,
          }}
        >
          <Ionicons name="search" size={18} color="#5a6b88" />
          <TextInput
            style={{ flex: 1, fontSize: 16 }}
            placeholder="Search artist or song..."
            placeholderTextColor="#7b8ba6"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
        </View>

        <Text style={{ fontSize: 16, color: "#555", marginBottom: 6 }}>
          Showing results for: <Text style={{ fontWeight: "bold" }}>{artist}</Text>
        </Text>

        {loading ? (
          <ActivityIndicator size="large" style={{ flex: 1, marginTop: 20 }} />
        ) : (
          <FlatList
            data={tracks}
            keyExtractor={(item) => item.trackId.toString()}
            renderItem={({ item, index }) => <TrackListItem track={item} index={index} allTracks={tracks} />}
            ListEmptyComponent={<Text style={{ textAlign: "center", marginTop: 20 }}>No songs found.</Text>}
          />
        )}

      </View>
      <DraggableMascot />
    </SafeAreaView>
  );
}
