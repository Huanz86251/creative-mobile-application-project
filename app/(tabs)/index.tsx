
import { View, Text, FlatList, TextInput, ActivityIndicator, Alert } from "react-native";
import { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { TrackListItem } from "../../components/TrackListItem";   
import { Track } from "../../features/tracks/tracksSlice";       

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
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 32, fontWeight: "800", color: "#0c1d37" }}>Search</Text>
          <Text style={{ fontSize: 16, color: "#4b5d75" }}>Find tracks and artists you love</Text>
        </View>

        <View
          style={{
            flexDirection: "row",
            marginBottom: 16,
            alignItems: "center",
            gap: 8,
            backgroundColor: "rgba(255,255,255,0.85)",
            borderRadius: 14,
            paddingHorizontal: 14,
            paddingVertical: 6,
            borderWidth: 1,
            borderColor: "rgba(12,29,55,0.08)",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 6,
            elevation: 2,
          }}
        >
          <TextInput
            style={{ flex: 1, fontSize: 16, paddingVertical: 6 }}
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
    </SafeAreaView>
  );
}
