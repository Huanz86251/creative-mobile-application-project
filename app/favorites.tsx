
import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  Pressable,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";
import type { FavoriteRow } from "../cloudapi/favorites";
import { listMyFavorites, toggleFavorite } from "../cloudapi/favorites";
import { getSignedDownloadUrl } from "../cloudapi/signedUrl";
import { getDownloadedIndex, downloadTrack } from "../storage/downloader";

type Row = FavoriteRow & { downloaded?: boolean };

export default function Favorites() {
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      await supabase.auth.getSession();
      await refresh();
    })();
  }, []);

  async function refresh() {
    const [fav, idx] = await Promise.all([listMyFavorites(), getDownloadedIndex()]);
    setRows(fav.map((f) => ({ ...f, downloaded: !!idx[f.track_id] })));
  }

  async function onToggle(track_id: string) {
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
          <ActionChip
            icon="cloud-download-outline"
            label={busy ? "Working..." : "Download missing"}
            disabled={busy}
            onPress={downloadAllMissing}
          />
          <ActionChip icon="refresh" label="Refresh" disabled={busy} onPress={refresh} />
        </View>

        <FlatList
          data={rows}
          keyExtractor={(i) => i.track_id}
          contentContainerStyle={[
            styles.listContent,
            rows.length === 0 && styles.emptyListGrow,
          ]}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={{ flex: 1, gap: 4 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Text style={styles.cardTitle}>{item.title ?? "(no title)"}</Text>
                  {item.downloaded ? (
                    <View style={styles.badgeSuccess}>
                      <Ionicons name="download" size={12} color="#0e1b2d" />
                      <Text style={styles.badgeSuccessText}>Offline</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.cardMeta}>{item.artist ?? "Unknown"}</Text>
                <Text style={styles.cardUri} numberOfLines={1}>
                  {item.object_path}
                </Text>
              </View>
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
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="heart-outline" size={32} color="#ffc6d9" />
              </View>
              <Text style={styles.emptyTitle}>No favorites yet</Text>
              <Text style={styles.emptyBody}>
                Mark tracks with the heart icon in Discover or Library to collect them here.
              </Text>
            </View>
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
    padding: 16,
    borderRadius: 20,
    backgroundColor: "rgba(12,18,32,0.92)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 10 },
    gap: 12,
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
    gap: 10,
  },
  pillRemove: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
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
    paddingHorizontal: 12,
    paddingVertical: 8,
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
