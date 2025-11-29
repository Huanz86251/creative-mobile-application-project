
import { useEffect, useState } from "react";
import {  View,  Text,  FlatList,  TouchableOpacity, Alert,Pressable,StyleSheet,Image,} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";
import { getDownloadedIndex, removeDownloaded, clearAllDownloads } from "../storage/downloader";
import { getTracksByIds, type TrackRow } from "../cloudapi/tracks";
import { getSignedDownloadUrl } from "../cloudapi/signedUrl";
import { usePlayer } from "../context/PlayerContext";
import { DraggableMascot } from "../components/DraggableMascot";

const FALLBACK_COVER = "https://via.placeholder.com/200x200.png?text=Download";

type Row = Omit<Partial<TrackRow>, "id"> & { id: string; uri: string; downloadedUri?: string };

export default function Downloads() {
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const player = usePlayer();

  useEffect(() => { refresh(); }, []);

  async function refresh() {
    const idx = await getDownloadedIndex();
    const ids = Object.keys(idx);
    if (ids.length === 0) { setRows([]); return; }

    let metas: TrackRow[] = [];
    try {
      metas = await getTracksByIds(ids);
    } catch { metas = []; }

    const metaMap = Object.fromEntries(metas.map(m => [m.id, m]));
    const mapped: Row[] = ids.map((id) => {
      const meta = metaMap[id] as TrackRow | undefined;
      const { id: _drop, ...rest } = (meta ?? {}) as TrackRow;
      return { id, uri: idx[id], downloadedUri: idx[id], ...(rest as Omit<TrackRow, "id">) };
    });
    setRows(mapped);
  }

  async function onRemove(id: string) {
    try {
      setBusy(true);
      await removeDownloaded(id);
      await refresh();
    } catch (e: any) {
      Alert.alert("Delete failed", e.message ?? String(e));
    } finally {
      setBusy(false);
    }
  }

  async function onClearAll() {
    Alert.alert("Confirm", "Delete all local downloads?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
          setBusy(true);
          const n = await clearAllDownloads();
          await refresh();
          setBusy(false);
          Alert.alert("Done", `Deleted ${n} file(s).`);
        } }
    ]);
  }

  const ensurePlayableUrl = async (item: Row): Promise<string | null> => {
    if (item.downloadedUri) return item.downloadedUri;
    if (!item.object_path) return null;
    try {
      const signed = await getSignedDownloadUrl(item.object_path, 600);
      setRows((prev) =>
        prev.map((row) =>
          row.id === item.id ? { ...row, downloadedUri: signed ?? undefined } : row
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
        trackId: item.id,
        trackName: item.title ?? "(no title)",
        artistName: item.artist ?? "Unknown",
        artworkUrl100: item.artwork_url ?? undefined,
        artworkUrl60: item.artwork_url ?? undefined,
        previewUrl: url,
        objectPath: item.object_path ?? "",
      } as any);
    } catch (error) {
      console.error("Failed to start playback from downloads", error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Downloads</Text>
              <Text style={styles.subtitle}>
                {rows.length
                  ? `${rows.length} track${rows.length > 1 ? "s" : ""} ready to play offline`
                  : "Keep favorites handy even when you lose signal."}
              </Text>
            </View>
            <View style={styles.headerIcon}>
              <Ionicons name="cloud-download-outline" size={24} color="#b6c8f5" />
            </View>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <ActionChip
            icon="trash"
            label={busy ? "Working..." : "Delete all"}
            tone="danger"
            disabled={busy || rows.length === 0}
            onPress={onClearAll}
          />
          <ActionChip icon="refresh" label="Refresh" disabled={busy} onPress={refresh} />
        </View>

        <FlatList
          data={rows}
          keyExtractor={(i) => i.id}
          contentContainerStyle={[
            styles.listContent,
            rows.length === 0 && styles.emptyListGrow,
          ]}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          renderItem={({ item }) => {
            const cover = item.artwork_url ?? FALLBACK_COVER;
            return (
              <Pressable style={styles.card} onPress={() => handlePlay(item)}>
                <Image source={{ uri: cover }} style={styles.cardCover} resizeMode="cover" />
                <View style={{ flex: 1, gap: 6, justifyContent: "center" }}>
                  <Text style={styles.cardTitle}>{item.title ?? "(no title)"}</Text>
                  <Text style={styles.cardMeta}>
                    {item.artist ?? "Unknown"}
                  </Text>
                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={styles.deletePill}
                      onPress={() => onRemove(item.id)}
                      disabled={busy}
                    >
                      <Ionicons name="trash" size={14} color="#ffb0c2" />
                      <Text style={styles.deleteText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="musical-notes" size={32} color="#c9d7ff" />
              </View>
              <Text style={styles.emptyTitle}>No local files yet</Text>
              <Text style={styles.emptyBody}>
                Download a track from Discover or Library to keep listening offline.
              </Text>
            </View>
          }
        />
      </View>
      <DraggableMascot />
    </SafeAreaView>
  );
}

type ActionChipProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  tone?: "default" | "danger";
  disabled?: boolean;
};

const ActionChip = ({ icon, label, onPress, tone = "default", disabled }: ActionChipProps) => (
  <Pressable
    onPress={onPress}
    disabled={disabled}
    style={({ pressed }) => [
      styles.actionChip,
      tone === "danger" && styles.actionChipDanger,
      disabled && styles.actionChipDisabled,
      pressed && !disabled && { transform: [{ translateY: 1 }] },
    ]}
  >
    <Ionicons
      name={icon}
      size={16}
      color={tone === "danger" ? "#ffd6de" : "#cfe4ff"}
      style={{ marginRight: 6 }}
    />
    <Text
      style={[
        styles.actionChipText,
        tone === "danger" && { color: "#ffd6de" },
        disabled && { opacity: 0.6 },
      ]}
    >
      {label}
    </Text>
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
  actionChipDanger: {
    backgroundColor: "rgba(197, 47, 86, 0.75)",
    borderColor: "rgba(255,255,255,0.15)",
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
    alignItems: "center",
  },
  deletePill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  deleteText: {
    marginLeft: 4,
    color: "#ffb0c2",
    fontWeight: "600",
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
