import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import {
  View,
  InteractionManager,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Modal,
  Pressable,
  Image,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect, useLocalSearchParams } from "expo-router";
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

type Row = TrackRow & {
  likes_count?: number;
  liked?: boolean;
  play_url?: string;
  desc_en?: string;
  bg_en?: string;
};

const DETAIL_PLACEHOLDER = "https://via.placeholder.com/300x300.png?text=No+Art";

export default function Library() {
  const router = useRouter();
  const { playTrack } = usePlayer();

  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [downloaded, setDownloaded] = useState<Record<string, string>>({});
  const [detailTrack, setDetailTrack] = useState<Row | null>(null);
  const [canLike, setCanLike] = useState(false);

  const { openId, ts } = useLocalSearchParams<{ openId?: string; ts?: string }>();

  useEffect(() => {
    if (typeof openId !== "string" || !openId) return;
    const hit = rowsRef.current.find((r) => r.id === openId);
    if (hit) {
      setDetailTrack(hit);
      return;
    }
    (async () => {
      const { data, error } = await supabase.from("tracks").select("*").eq("id", openId).single();
      if (!error && data) {
        let row: Row = data as Row;
        try {
          const map = await getLikesForIds([row.id]);
          if (map[row.id]) row = { ...row, liked: map[row.id].liked, likes_count: map[row.id].likes_count };
        } catch {}
        setRows((prev) => {
          const exists = prev.some((x) => x.id === row.id);
          return exists ? prev.map((x) => (x.id === row.id ? { ...x, ...row } : x)) : [row, ...prev];
        });
        setDetailTrack(row);
      }
    })();
  }, [openId, ts]);

  const rowsRef = useRef<Row[]>([]);
  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  const ensurePlayUrl = useCallback(
    async (item: Row) => {
      if (item.play_url) return item.play_url;
      const downloadedPath = downloaded[item.id];
      if (downloadedPath) {
        setRows((prev) => prev.map((row) => (row.id === item.id ? { ...row, play_url: downloadedPath } : row)));
        return downloadedPath;
      }
      try {
        const url = await getSignedDownloadUrl(item.object_path, 3600);
        if (!url) throw new Error("No signed URL returned");
        setRows((prev) => prev.map((row) => (row.id === item.id ? { ...row, play_url: url } : row)));
        return url;
      } catch (err: any) {
        console.error("Signed URL failed", err);
        Alert.alert("Unavailable", "This track's audio file could not be retrieved from storage.");
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
    if (!detailTrack?.id) return;
    if (detailTrack.desc_en || detailTrack.bg_en) return;
  
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("tracks")
        .select("desc_en, bg_en")
        .eq("id", detailTrack.id)
        .single();
  
      if (!cancelled && !error && data) {
        setDetailTrack(prev =>
          prev && prev.id === detailTrack.id ? { ...prev, ...data } : prev
        );
      }
    })();
    return () => { cancelled = true; };
  }, [detailTrack?.id]);
  useEffect(() => {
    let sub: any;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setCanLike(!!session);
      sub = supabase.auth.onAuthStateChange((_e, s) => setCanLike(!!s?.user));
    })();
    return () => {
      try {
        sub?.data?.subscription?.unsubscribe?.();
      } catch {}
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      InteractionManager.runAfterInteractions(async () => {
        if (cancelled) return;
        await refreshDownloads();
        await refreshLikesForCurrent();
        if (!rowsRef.current.length) await initialLoad();
      });
      return () => {
        cancelled = true;
      };
    }, [])
  );

  useEffect(() => {
    let unsub: (() => void) | undefined;
    (async () => {
      await refreshDownloads();
      await initialLoad();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        unsub = onFavoriteChanged(({ track_id, liked, likes_count }) => {
          setRows((prev) => prev.map((r) => (r.id === track_id ? { ...r, liked, likes_count } : r)));
          setDetailTrack((prev) => (prev && prev.id === track_id ? { ...prev, liked, likes_count } : prev));
        });
      }
    })();
    return () => {
      try {
        unsub?.();
      } catch {}
    };
  }, []);

  async function refreshDownloads() {
    const idx = await getDownloadedIndex();
    setDownloaded(idx);
  }

  async function refreshLikesForCurrent() {
    const ids = rowsRef.current.map((r) => r.id);
    if (!ids.length) return;
    try {
      const map = await getLikesForIds(ids);
      setRows((prev) =>
        prev.map((r) => {
          const m = map[r.id];
          return m ? { ...r, liked: m.liked, likes_count: m.likes_count } : r;
        })
      );
    } catch {}
  }

  async function mergeLikes(base: Row[]): Promise<Row[]> {
    if (!base.length) return base;
    const map = await getLikesForIds(base.map((r) => r.id));
    return base.map((r) => {
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
      await downloadTrack(t.id, url, `${t.id}.mp3`, { displayName: t.title });
      await refreshDownloads();
    } catch (e: any) {
      console.warn("Download error", e?.message ?? String(e));
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

  async function ensureAuthedFor(action: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      Alert.alert("please login first", `if you wish-${action}please login`, [
        { text: "cancel", style: "cancel" },
        { text: "login", onPress: () => router.push("/login") },
      ]);
      return null;
    }
    return user;
  }

  async function onLike(t: Row) {
    const user = await ensureAuthedFor("like");
    if (!user) return;
    const nextLiked = !t.liked;
    const nextCount = (t.likes_count ?? 0) + (t.liked ? -1 : 1);
    setRows((prev) => prev.map((x) => (x.id === t.id ? { ...x, liked: nextLiked, likes_count: nextCount } : x)));
    setDetailTrack((prev) => (prev && prev.id === t.id ? { ...prev, liked: nextLiked, likes_count: nextCount } : prev));
    try {
      const { liked, likes_count } = await FavoritesApi.toggleFavorite(t.id);
      setRows((prev) => prev.map((x) => (x.id === t.id ? { ...x, liked, likes_count } : x)));
      setDetailTrack((prev) => (prev && prev.id === t.id ? { ...prev, liked, likes_count } : prev));
    } catch (e:any) {
      setRows((prev) => prev.map((x) => (x.id === t.id ? { ...x, liked: t.liked, likes_count: t.likes_count } : x)));
      setDetailTrack((prev) => (prev && prev.id === t.id ? { ...prev, liked: t.liked, likes_count: t.likes_count } : prev));
      console.warn("Favorite error", e?.message ?? String(e));
    }
  }

  async function onSignOut() {
    await signOut();
  }

  const HITSLOP = useMemo(() => ({ top: 10, bottom: 10, left: 10, right: 10 }), []);

  const renderItem = useCallback(
    ({ item, index }: { item: Row; index: number }) => {
      const trackShape = playbackQueue[index] ?? toPlaybackTrack(item, () => ensurePlayUrl(item));
      return (
        <View style={styles.trackCard}>
          <View style={styles.row}>
            <View style={styles.flex1}>
              <TrackListItem track={trackShape} />
            </View>
            <TouchableOpacity onPress={() => setDetailTrack(item)} hitSlop={HITSLOP}>
              <Text style={styles.detailsLink}>Details</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    },
    [playbackQueue, ensurePlayUrl, HITSLOP]
  );

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
        <Text style={{ fontSize: 16, color: "rgba(255,255,255,0.8)", marginTop: 4 }}>Enjoy the pure ambient vibes</Text>
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
        renderItem={renderItem}
        windowSize={9}
        initialNumToRender={12}
        maxToRenderPerBatch={12}
        updateCellsBatchingPeriod={16}
        removeClippedSubviews
      />

      <TrackDetailsModal
        track={detailTrack}
        visible={!!detailTrack}
        onClose={() => setDetailTrack(null)}
        onLike={() => detailTrack && onLike(detailTrack)}
        onDownload={() => detailTrack && onDownload(detailTrack)}
        onPlay={() => detailTrack && handlePlay(detailTrack)}
        canLike={canLike}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  trackCard: {
    paddingVertical: 4,
  },
  row: { flexDirection: "row", alignItems: "center" },
  flex1: { flex: 1 },
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
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0c1d37",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  sectionBody: {
    fontSize: 14,
    color: "#334155",
    lineHeight: 20,
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

type TrackDetailsModalProps = {
  track: Row | null;
  visible: boolean;
  onClose: () => void;
  onLike: () => void;
  onDownload: () => void;
  onPlay: () => void;
  canLike?: boolean;
};

const TrackDetailsModal = ({
  track, visible, onClose, onLike, onDownload, onPlay, canLike
}: TrackDetailsModalProps) => {
  if (!visible || !track) return null;

  const cover = track.artwork_url ?? DETAIL_PLACEHOLDER;
  const meta = [track.genre || "Unknown genre", track.language || "Unknown language", track.duration_sec ? `${track.duration_sec}s` : null]
    .filter(Boolean)
    .join(" • ");

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View
          style={[styles.modalCard, { paddingTop: 44 }]}
          renderToHardwareTextureAndroid

          shouldRasterizeIOS
        >
          <TouchableOpacity
            onPress={onClose}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={{ position: "absolute", top: 14, right: 14, zIndex: 2, backgroundColor: "#0c1d37", borderRadius: 999, padding: 6 }}
          >
            <Ionicons name="close" size={16} color="#fff" />
          </TouchableOpacity>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 12 }}
            scrollEventThrottle={16}
            overScrollMode="never"
          >
            <Image source={{ uri: cover }} style={styles.modalCover} />
            <Text style={styles.modalTitle}>{track.title}</Text>
            <Text style={styles.modalArtist}>{track.artist ?? "Unknown artist"}</Text>
            <Text style={styles.modalMeta}>{meta}</Text>

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={[
                  styles.modalActionButton,
                  { backgroundColor: track.liked ? "#fee2e2" : (canLike ? "#e0f2fe" : "#e5e7eb") },
                  !canLike && { opacity: 0.7 }
                ]}
                onPress={onLike}
                disabled={!canLike}
              >
                <Text style={{ color: track.liked ? "#dc2626" : (canLike ? "#0369a1" : "#6b7280"), fontWeight: "600" }}>
                  {canLike ? (track.liked ? "★ Favorited" : "☆ Favorite") : "after login can subscribe"} ({track.likes_count ?? 0})
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

            {(track.bg_en || track.desc_en) ? (
              <View style={{ marginTop: 18, gap: 16 }}>
                {!!track.bg_en && (
                  <View>
                    <Text style={styles.sectionTitle}>Background</Text>
                    <Text style={styles.sectionBody}>{track.bg_en}</Text>
                  </View>
                )}
                {!!track.desc_en && (
                  <View>
                    <Text style={styles.sectionTitle}>Description</Text>
                    <Text style={styles.sectionBody}>{track.desc_en}</Text>
                  </View>
                )}
              </View>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

