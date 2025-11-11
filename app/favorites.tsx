
import { useEffect, useState } from "react";
import { View,Text,FlatList,TouchableOpacity,Alert,Pressable,StyleSheet,Image,} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";
import { useRouter } from "expo-router";
import type { FavoriteRow } from "../cloudapi/favorites";
import { listMyFavorites, toggleFavorite } from "../cloudapi/favorites";
import { getSignedDownloadUrl } from "../cloudapi/signedUrl";
import { getDownloadedIndex, downloadTrack } from "../storage/downloader";
import { usePlayer } from "../context/PlayerContext";

const FALLBACK_COVER = "https://via.placeholder.com/200x200.png?text=Music";

type Row = FavoriteRow & { downloaded?: boolean; downloadedUri?: string };

export default function Favorites() {
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const player = usePlayer();
  const router = useRouter();
  const [isAuthed, setIsAuthed] = useState(false);
  async function ensureAuthedFor(action: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      Alert.alert("Please sign in", `To ${action}, please sign in first.`, [
        { text: "Cancel", style: "cancel" },
        { text: "Sign in", onPress: () => router.push("/login") },
      ]);
      return null;
    }
    return user;
  }
  useEffect(() => {
    let sub: any;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthed(!!session);
      if (session) await refresh();
  
      sub = supabase.auth.onAuthStateChange((_e, s) => {
        const authed = !!s?.user;
        setIsAuthed(authed);
        if (authed) {
          refresh();
        } else {
          setRows([]); 
        }
      });
    })();
  
    return () => { try { sub?.data?.subscription?.unsubscribe?.(); } catch {} };
  }, []);
  

  async function refresh() {
    const [fav, idx] = await Promise.all([listMyFavorites(), getDownloadedIndex()]);
    setRows(
      fav.map((f) => ({
        ...f,
        downloaded: !!idx[f.track_id],
        downloadedUri: idx[f.track_id],
      }))
    );
  }

  async function onToggle(track_id: string) {
    const user = await ensureAuthedFor("remove from favorites");
    if (!user) return;
    try {
      const { liked } = await toggleFavorite(track_id);
      if (!liked) setRows((prev) => prev.filter((x) => x.track_id !== track_id));
    } catch (e: any) {
      Alert.alert("Favorite error", e.message ?? String(e));
    }
  }

  async function onDownloadOne(r: Row) {
    try {
      setBusy(true);
      const url = await getSignedDownloadUrl(r.object_path, 600);
      await downloadTrack(r.track_id, url, `${r.track_id}.mp3`);
      await refresh();
    } catch (e: any) {
      Alert.alert("Download error", e.message ?? String(e));
    } finally {
      setBusy(false);
    }
  }

  async function downloadAllMissing() {
    const user = await ensureAuthedFor("batch download");
    if (!user) return;
  
    try {
      setBusy(true);
      const missing = rows.filter((x) => !x.downloaded);
      for (const r of missing) {
        const url = await getSignedDownloadUrl(r.object_path, 600);
        await downloadTrack(r.track_id, url, `${r.track_id}.mp3`);
      }
      await refresh();
      Alert.alert("Done", `Downloaded ${missing.length} item(s).`);
    } catch (e: any) {
      Alert.alert("Batch download failed", e.message ?? String(e));
    } finally {
      setBusy(false);
    }
  }

  const ensurePlayableUrl = async (item: Row): Promise<string | null> => {
    if (item.downloadedUri) return item.downloadedUri;
    if (!item.object_path) return null;
    try {
      const signed = await getSignedDownloadUrl(item.object_path, 600);
      setRows((prev) =>
        prev.map((row) =>
          row.track_id === item.track_id ? { ...row, downloadedUri: signed ?? undefined } : row
        )
      );
      return signed ?? null;
    } catch (err: any) {
      Alert.alert("Playback error", err?.message ?? String(err));
      return null;
    }
  };

  const handlePlay = async (item: Row) => {
    try {
      const url = await ensurePlayableUrl(item);
      if (!url) return;
      await player.playTrack({
        trackId: item.track_id,
        trackName: item.title ?? "(no title)",
        artistName: item.artist ?? "Unknown",
        artworkUrl100: item.artwork_url ?? undefined,
        artworkUrl60: item.artwork_url ?? undefined,
        previewUrl: url,
        objectPath: item.object_path,
      } as any);
    } catch (error) {
      console.error("Failed to start playback from favorites", error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>My Favorites</Text>
              <Text style={styles.subtitle}>
                {rows.length
                  ? `${rows.length} saved track${rows.length > 1 ? "s" : ""} at your fingertips`
                  : "Pin the songs you adore and jump back in anytime."}
              </Text>
            </View>
            <View style={styles.headerIcon}>
              <Ionicons name="heart" size={22} color="#ffadc4" />
            </View>
          </View>
        </View>

        <View style={styles.actionsRow}>
          {!isAuthed && (
            <ActionChip
              icon="log-in-outline"
              label="Login to view favorites"
              disabled={busy}
              onPress={() => router.push("/login")}
            />
          )}
          <ActionChip
            icon="cloud-download-outline"
            label={busy ? "Working..." : "Download missing"}
            disabled={busy || !isAuthed}
            onPress={downloadAllMissing}
          />
          <ActionChip
            icon="refresh"
            label="Refresh"
            disabled={busy || !isAuthed}
            onPress={refresh}
          />
        </View>

        <FlatList
          data={rows}
          keyExtractor={(i) => i.track_id}
          contentContainerStyle={[
            styles.listContent,
            rows.length === 0 && styles.emptyListGrow,
          ]}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          renderItem={({ item }) => {
            const cover = item.artwork_url || FALLBACK_COVER;
            return (
              <Pressable style={styles.card} onPress={() => handlePlay(item)}>
                <Image
                  source={{ uri: cover }}
                  style={styles.cardCover}
                  resizeMode="cover"
                />
              <View style={{ flex: 1, gap: 6, justifyContent: "center" }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Text style={styles.cardTitle} numberOfLines={1} ellipsizeMode="tail">
                      {item.title ?? "(no title)"}
                    </Text>
                    {item.downloaded ? (
                      <View style={styles.badgeSuccess}>
                        <Ionicons name="download" size={12} color="#0e1b2d" />
                        <Text style={styles.badgeSuccessText}>Offline</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.cardMeta}>{item.artist ?? "Unknown"}</Text>
                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={styles.pillRemove}
                      onPress={() => onToggle(item.track_id)}
                    >
                      <Ionicons name="heart-dislike" size={14} color="#ffd6de" />
                      <Text style={styles.pillRemoveText}>Remove</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.pillDownload,
                        (busy || item.downloaded) && styles.pillDisabled,
                      ]}
                      onPress={() => onDownloadOne(item)}
                      disabled={busy || item.downloaded}
                    >
                      <Ionicons
                        name="download"
                        size={14}
                        color={item.downloaded ? "#a1aec8" : "#0f1c33"}
                      />
                      <Text
                        style={[
                          styles.pillDownloadText,
                          item.downloaded && { color: "#a1aec8" },
                        ]}
                      >
                        {item.downloaded ? "Downloaded" : "Download"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Pressable>
            );
          }}
          ListEmptyComponent={
            isAuthed ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconWrap}>
                  <Ionicons name="heart-outline" size={32} color="#ffc6d9" />
                </View>
                <Text style={styles.emptyTitle}>No favorites yet</Text>
                <Text style={styles.emptyBody}>
                  Mark tracks with the heart icon in Library to collect them here.
                </Text>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconWrap}>
                  <Ionicons name="log-in-outline" size={32} color="#cfe4ff" />
                </View>
                <Text style={styles.emptyTitle}>Log in to view your collection</Text>
                <Text style={styles.emptyBody}>
                You can listen to and download public tracks without logging in, but you need to log in to access your favorites list.
                </Text>
                <View style={{ marginTop: 8 }}>
                  <ActionChip
                    icon="log-in-outline"
                    label="Sign in"
                    onPress={() => router.push("/login")}
                  />
                </View>
              </View>
            )
          }
        />
      </View>
    </SafeAreaView>
  );
}

type ActionChipProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  disabled?: boolean;
};

const ActionChip = ({ icon, label, onPress, disabled }: ActionChipProps) => (
  <Pressable
    onPress={onPress}
    disabled={disabled}
    style={({ pressed }) => [
      styles.actionChip,
      disabled && styles.actionChipDisabled,
      pressed && !disabled && { transform: [{ translateY: 1 }] },
    ]}
  >
    <Ionicons name={icon} size={16} color="#cfe4ff" style={{ marginRight: 6 }} />
    <Text style={styles.actionChipText}>{label}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingHorizontal: 20,
  },
  container: {
    flex: 1,
    paddingTop: 8,
    paddingBottom: 24,
    gap: 12,
  },
  header: {
    paddingVertical: 8,
  },
  headerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(12, 29, 55, 0.74)",
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#fff",
  },
  subtitle: {
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 12,
  },
  actionChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(35, 54, 92, 0.75)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  actionChipDisabled: {
    opacity: 0.5,
  },
  actionChipText: {
    color: "#d9e8ff",
    fontWeight: "600",
  },
  listContent: {
    paddingTop: 8,
    paddingBottom: 120,
  },
  emptyListGrow: {
    flexGrow: 1,
    justifyContent: "center",
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 20,
    backgroundColor: "rgba(12,18,32,0.92)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 10 },
    gap: 14,
  },
  cardCover: {
    width: 72,
    height: 72,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  cardTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    flexShrink: 1,
  },
  cardMeta: {
    color: "#8aa0c7",
    fontSize: 13,
  },
  cardUri: {
    color: "#7182a3",
    fontSize: 12,
  },
  cardActions: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    marginTop: 4,
    alignItems: "center",
  },
  pillRemove: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(197, 47, 86, 0.5)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  pillRemoveText: {
    marginLeft: 4,
    color: "#ffd6de",
    fontWeight: "600",
  },
  pillDownload: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(99, 179, 255, 0.95)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  pillDownloadText: {
    marginLeft: 4,
    color: "#0f1c33",
    fontWeight: "700",
  },
  pillDisabled: {
    opacity: 0.55,
  },
  badgeSuccess: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#9bf7c0",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  badgeSuccessText: {
    marginLeft: 4,
    color: "#0e1b2d",
    fontSize: 11,
    fontWeight: "700",
  },
  emptyState: {
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 12,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  emptyTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  emptyBody: {
    color: "#b3c2e1",
    textAlign: "center",
    lineHeight: 20,
  },
});
