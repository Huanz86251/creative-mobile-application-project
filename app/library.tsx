
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { View, InteractionManager, Text, TextInput, FlatList, TouchableOpacity, Alert, Platform, StyleSheet, Modal, Pressable, Image, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { supabase } from "../lib/supabase";
import { SafeAreaView } from "react-native-safe-area-context";
import { getSignedDownloadUrl } from "../cloudapi/signedUrl";
import { listTracks, searchTracks, type TrackRow } from "../cloudapi/tracks";
import * as FavoritesApi from "../cloudapi/favorites";
import { getLikesForIds, onFavoriteChanged } from "../cloudapi/favorites";
import { signOut } from "../cloudapi/auth";

import { downloadTrack, getDownloadedIndex } from "../storage/downloader";
import { TrackListItem } from "../components/TrackListItem";
import { usePlayer } from "../context/PlayerContext";

type Row = TrackRow & { likes_count?: number; liked?: boolean; play_url?: string };
const DETAIL_PLACEHOLDER = "https://via.placeholder.com/300x300.png?text=No+Art";
const D = (...args: any[]) => console.log("[LIB DEBUG]", ...args);

export default function Library() {
  const router = useRouter();
  const { playTrack } = usePlayer();

  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [downloaded, setDownloaded] = useState<Record<string, string>>({});
  const [detailTrack, setDetailTrack] = useState<Row | null>(null);

  const rowsRef = useRef<Row[]>([]);
  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  const ensurePlayUrl = useCallback(
    async (item: Row) => {
      if (item.play_url) return item.play_url;

      const downloadedPath = downloaded[item.id];
      if (downloadedPath) {
        setRows((prev) =>
          prev.map((row) =>
            row.id === item.id ? { ...row, play_url: downloadedPath } : row
          )
        );
        return downloadedPath;
      }

      try {
        const url = await getSignedDownloadUrl(item.object_path, 3600);
        if (!url) throw new Error("No signed URL returned");
        setRows((prev) =>
          prev.map((row) => (row.id === item.id ? { ...row, play_url: url } : row))
        );
        return url;
      } catch (err: any) {
        console.error("Signed URL failed", err);
        Alert.alert(
          "Unavailable",
          "This track's audio file could not be retrieved from storage."
        );
        return null;
      }
    },
    [downloaded]
  );

  const playbackQueue = useMemo(
    () => rows.map((row) => toPlaybackTrack(row, () => ensurePlayUrl(row))),
    [rows, ensurePlayUrl]
  );

  useEffect(() => {
    if (!detailTrack) return;
    const latest = rows.find((r) => r.id === detailTrack.id);
    if (latest && latest !== detailTrack) {
      setDetailTrack(latest);
    }
  }, [rows, detailTrack?.id]);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      /*if (!session) router.replace("/login")*/;
    })();
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      InteractionManager.runAfterInteractions(async () => {
        if (cancelled) return;

        await refreshDownloads();
        await refreshLikesForCurrent();
        if (!rowsRef.current.length) await initialLoad();
      });
      return () => { cancelled = true; };
    }, [])
  );

  useEffect(() => {
    let unsub: (() => void) | undefined;
    (async () => {
      await refreshDownloads();
      await initialLoad();
      unsub = onFavoriteChanged(({ track_id, liked, likes_count }) => {
        setRows(prev => prev.map(r => r.id === track_id ? { ...r, liked, likes_count } : r));
      });
    })();
    return () => { try { unsub?.(); } catch {} };
  }, []);

  async function refreshDownloads() {
    const idx = await getDownloadedIndex();
    setDownloaded(idx);
  }

  async function refreshLikesForCurrent() {
    const ids = rowsRef.current.map(r => r.id);
    if (!ids.length) return;
    try {
      const map = await getLikesForIds(ids);
      setRows(prev => prev.map(r => {
        const m = map[r.id];
        return m ? { ...r, liked: m.liked, likes_count: m.likes_count } : r;
      }));
    } catch {}
  }

  async function mergeLikes(base: Row[]): Promise<Row[]> {
    if (!base.length) return base;
    const map = await getLikesForIds(base.map(r => r.id));
    return base.map(r => {
      const m = map[r.id];
      return m ? { ...r, liked: m.liked, likes_count: m.likes_count } : r;
    });
  }

  async function initialLoad() {
    setBusy(true);
    try {
      const list = await listTracks(50, 0);
      const withLikes = await mergeLikes(list as Row[]);
      setRows(withLikes);
    } finally {
      setBusy(false);
    }
  }

  async function doSearch(term?: string) {
    setBusy(true);
    try {
      const keyword = term ?? q;
      const trimmed = keyword.trim();
      let data: Row[] = [];
      if (trimmed) {
        data = (await searchTracks(trimmed, 40, 0)) as any;
      } else {
        data = await listTracks(50, 0);
      }
      const withLikes = await mergeLikes(data);
      setRows(withLikes);
    } catch (e: any) {
      Alert.alert("Search error", e.message ?? String(e));
    } finally {
      setBusy(false);
    }
  }

  const handleSearch = () => {
    doSearch();
  };

  async function onDownload(t: Row) {
    try {
      setBusy(true);
      const url = await getSignedDownloadUrl(t.object_path, 600);
      if (!url) throw new Error("No signed URL");
      const local = await downloadTrack(t.id, url, `${t.id}.mp3`);
      await refreshDownloads();
      Alert.alert("Downloaded", Platform.OS === "web" ? "Saved by browser download" : local);
    } catch (e: any) {
      Alert.alert("Download error", e.message ?? String(e));
    } finally {
      setBusy(false);
    }
  }
  const handlePlay = async (track: Row) => {
    try {
      const index = rows.findIndex((r) => r.id === track.id);
      const fallback = toPlaybackTrack(track, () => ensurePlayUrl(track));
      const playable = index >= 0 ? playbackQueue[index] ?? fallback : fallback;
      await playTrack(playable as any, {
        queue: playbackQueue,
        index: index >= 0 ? index : undefined,
      });
      setDetailTrack(null);
    } catch (e: any) {
      Alert.alert("Playback error", e.message ?? String(e));
    }
  };
  async function onLike(t: Row) {
    try {
      const { liked, likes_count } = await FavoritesApi.toggleFavorite(t.id);
      setRows(prev => prev.map(x => (x.id === t.id ? { ...x, liked, likes_count } : x)));
    } catch (e: any) {
      Alert.alert("Favorite error", e.message ?? String(e));
    }
  }

  async function onSignOut() {
    await signOut();
    /*router.replace("/login")*/;
  }

  return (
    <SafeAreaView style={{ flex: 1, padding: 16, gap: 12, backgroundColor: "transparent" }}>
 


      <View
        style={{
          backgroundColor: "rgba(12, 29, 55, 0.74)",
          borderRadius: 20,
          padding: 16,
          marginBottom: 12,
          shadowColor: "#000",
          shadowOpacity: 0.15,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 4 },
        }}
      >
        <Text style={{ fontSize: 32, fontWeight: "800", color: "#fff" }}>Library</Text>
        <Text style={{ fontSize: 16, color: "rgba(255,255,255,0.8)", marginTop: 4 }}>
          Enjoy the pure ambient vibes
        </Text>
      </View>

      <View style={{ marginBottom: 12 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            borderRadius: 18,
            paddingHorizontal: 12,
            paddingVertical: 10,
            backgroundColor: "#fff",
            shadowColor: "#0c1d37",
            shadowOpacity: 0.03,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 4 },
            elevation: 2,
          }}
        >
          <Ionicons name="search" size={20} color="#4b5d75" />
          <TextInput
            style={{ flex: 1, fontSize: 16 }}
            placeholder="Search artist or song..."
            placeholderTextColor="#7c8ba1"
            value={q}
            onChangeText={setQ}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {!!q && (
            <TouchableOpacity
              onPress={() => {
                setQ("");
                initialLoad();
              }}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons name="close-circle" size={20} color="#7c8ba1" />
            </TouchableOpacity>
          )}
        </View>

      </View>

      <FlatList
        data={rows}
        style={{ backgroundColor: "transparent" }}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ paddingBottom: 8 }}
        renderItem={({ item, index }) => {
          const isDownloaded = !!downloaded[item.id];
          const trackShape = playbackQueue[index] ?? toPlaybackTrack(item, () => ensurePlayUrl(item));
          return (
            <View style={styles.trackCard}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View style={{ flex: 1 }}>
                  <TrackListItem
                    track={trackShape}
                    index={index}
                    allTracks={playbackQueue}
                  />
                </View>
                <TouchableOpacity onPress={() => setDetailTrack(item)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Text style={styles.detailsLink}>Details</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />
      <TrackDetailsModal
        track={detailTrack}
        visible={!!detailTrack}
        onClose={() => setDetailTrack(null)}
        onLike={() => detailTrack && onLike(detailTrack)}
        onDownload={() => detailTrack && onDownload(detailTrack)}
        onPlay={() => detailTrack && handlePlay(detailTrack)}
      />


    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  trackCard: {
    paddingVertical: 4,
  },
  detailsLink: {
    color: "#2563eb",
    fontSize: 12,
    fontWeight: "600",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.95)",
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
    maxHeight: "85%",
  },
  modalCover: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 20,
    backgroundColor: "#e2e8f0",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0c1d37",
    marginTop: 16,
  },
  modalArtist: {
    color: "#4b5d75",
    marginTop: 4,
  },
  modalMeta: {
    marginTop: 6,
    color: "#64748b",
  },
  modalActionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 16,
  },
  modalActionButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 16,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(12,29,55,0.08)",
  },
  chipText: {
    fontSize: 12,
    color: "#0c1d37",
  },
});

const toPlaybackTrack = (row: Row, resolver: () => Promise<string | null>) => ({
  trackId: row.id,
  trackName: row.title,
  artistName: row.artist ?? "Unknown",
  artworkUrl100: row.artwork_url ?? undefined,
  artworkUrl60: row.artwork_url ?? undefined,
  previewUrl: row.play_url ?? undefined,
  objectPath: row.object_path,
  previewUrlResolver: resolver,
});

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${mins}:${secs}`;
};

type TrackDetailsModalProps = {
  track: Row | null;
  visible: boolean;
  onClose: () => void;
  onLike: () => void;
  onDownload: () => void;
  onPlay: () => void;
};

const TrackDetailsModal = ({ track, visible, onClose, onLike, onDownload, onPlay }: TrackDetailsModalProps) => {
  if (!visible || !track) return null;

  const cover = track.artwork_url ?? DETAIL_PLACEHOLDER;
  const meta = [track.genre || "Unknown genre", track.language || "Unknown language", track.duration_sec ? `${track.duration_sec}s` : null]
    .filter(Boolean)
    .join(" • ");

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={[styles.modalCard, { paddingTop: 44 }]} onPress={(e) => e.stopPropagation()}>
          <TouchableOpacity
            onPress={onClose}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={{ position: "absolute", top: 14, right: 14, zIndex: 2, backgroundColor: "#0c1d37", borderRadius: 999, padding: 6 }}
          >
            <Ionicons name="close" size={16} color="#fff" />
          </TouchableOpacity>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 12 }}>
            <Image source={{ uri: cover }} style={styles.modalCover} />
            <Text style={styles.modalTitle}>{track.title}</Text>
            <Text style={styles.modalArtist}>{track.artist ?? "Unknown artist"}</Text>
            <Text style={styles.modalMeta}>{meta}</Text>

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={[styles.modalActionButton, { backgroundColor: track.liked ? "#fee2e2" : "#e0f2fe" }]}
                onPress={onLike}
              >
                <Text style={{ color: track.liked ? "#dc2626" : "#0369a1", fontWeight: "600" }}>
                  {track.liked ? "★ Favorited" : "☆ Favorite"} ({track.likes_count ?? 0})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalActionButton, { backgroundColor: "#dcfce7" }]}
                onPress={onDownload}
              >
                <Text style={{ color: "#065f46", fontWeight: "600" }}>Download</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalActionButton, { flex: 1, backgroundColor: "#ea4c79" }]}
                onPress={onPlay}
              >
                <Text style={{ color: "#fff", fontWeight: "700", textAlign: "center" }}>Play</Text>
              </TouchableOpacity>
            </View>

            {!!(track.tags?.length || track.themes?.length) && (
              <View>
                {track.tags?.length ? (
                  <View style={styles.chipRow}>
                    {track.tags.map((tag, i) => (
                      <View key={`tag-${i}`} style={styles.chip}>
                        <Text style={styles.chipText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
                {track.themes?.length ? (
                  <View style={styles.chipRow}>
                    {track.themes.map((theme, i) => (
                      <View key={`theme-${i}`} style={styles.chip}>
                        <Text style={styles.chipText}>{theme}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            )}

          </ScrollView>

        </Pressable>
      </Pressable>
    </Modal>
  );
};
