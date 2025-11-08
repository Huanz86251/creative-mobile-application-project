import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { TrackListItem } from "../components/TrackListItem";

export default function SearchPage() {
  const { query } = useLocalSearchParams<{ query: string }>();
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://itunes.apple.com/search?term=${encodeURIComponent(
            query
          )}&entity=song&limit=30`
        );
        const data = await res.json();
        setResults(data.results);
      } catch (err) {
        console.error("❌ Search failed:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [query]);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" />
        <Text>Searching for "{query}"...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.back}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Results for "{query}"</Text>

      {results.length === 0 ? (
        <Text style={styles.noResult}>No songs found</Text>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.trackId.toString()}
          renderItem={({ item, index }) => (
            <TrackListItem track={item} index={index} allTracks={results} />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16 },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  back: { color: "#007AFF", fontSize: 18, marginBottom: 10 },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },
  noResult: { textAlign: "center", marginTop: 20, color: "gray" },
});
