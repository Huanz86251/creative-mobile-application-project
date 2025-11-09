// components/TrackListItem.tsx
import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { usePlayer } from "../context/PlayerContext";

type TrackListItemProps = {
  track: any;           // accept mixed shapes (iTunes or DB)
  index?: number;       // kept for callers that pass it
  allTracks?: any[];    // kept for callers that pass it
  onPress?: () => void; // optional override
};

const FALLBACK_COVER =
  "https://dummyimage.com/100x100/cccccc/ffffff.png&text=%E2%99%AA";

// Normalize common fields across different track shapes
function normalizeTrack(t: any) {
  const id = String(t?.trackId ?? t?.id ?? "");
  const title = t?.trackName ?? t?.title ?? "(no title)";
  const artist = t?.artistName ?? t?.artist ?? "Unknown";
  const cover = t?.artworkUrl100 ?? t?.artwork_url ?? FALLBACK_COVER;
  return { id, title, artist, cover };
}

export const TrackListItem: React.FC<TrackListItemProps> = ({
  track,
  index,     // not used, but declared to satisfy callers
  allTracks, // not used, but declared to satisfy callers
  onPress,
}) => {
  const { playTrack, currentTrackId, isPlaying } = usePlayer();
  const { id, title, artist, cover } = normalizeTrack(track);

  // Compare by normalized id
  const isThisPlaying = !!id && currentTrackId === id && isPlaying;

  const handlePress = async () => {
    // Allow parent override (e.g., navigate to details instead)
    if (onPress) return onPress();

    // PlayerContext expects its own Track shape; passing through as-is is fine
    // for your current PlayerContext; cast to silence TS.
    await playTrack(track as any);
  };

  return (
    <TouchableOpacity style={styles.item} onPress={handlePress}>
      <Image source={{ uri: cover }} style={styles.cover} />
      <View style={{ flex: 1 }}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.artist} numberOfLines={1}>
          {artist}
        </Text>
        {isThisPlaying && <Text style={styles.playing}>▶️ Playing</Text>}
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
  cover: {
    width: 60,
    height: 60,
    borderRadius: 6,
    marginRight: 10,
    backgroundColor: "#ddd",
  },
  title: { fontWeight: "bold" },
  artist: { color: "#666" },
  playing: { color: "green", fontSize: 12, marginTop: 2 },
});

export default TrackListItem;
