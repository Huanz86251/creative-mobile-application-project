// app/track/[id].tsx
import { useEffect, useMemo, useState, useCallback } from "react";
import { View, Text, Image, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { supabase } from "../../lib/supabase";
import type { TrackRow } from "../../cloudapi/tracks";
import { getSignedDownloadUrl } from "../../cloudapi/signedUrl";
import { downloadTrack, getDownloadedIndex, removeDownloaded } from "../../storage/downloader";
import { toggleFavorite, getLikesForIds, onFavoriteChanged } from "../../cloudapi/favorites";
import FloatingBack from "../../components/Floatback";

const PLACEHOLDER = "https://via.placeholder.com/600x600.png?text=No+Artwork";

export default function TrackDetails() {
  const params = useLocalSearchParams();
  const id = useMemo(() => {
    const p = params?.id as string | string[] | undefined;
    return Array.isArray(p) ? p[0] : (p ? String(p) : undefined);
  }, [params?.id]);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [t, setT] = useState<TrackRow | null>(null);

  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState<number>(0);

  const [downIdx, setDownIdx] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const isDownloaded = !!(id && downIdx[id]);
  const [playUrl, setPlayUrl] = useState<string | null>(null);
  const refreshDownloads = useCallback(async () => {
    try {
      const idx = await getDownloadedIndex();
      setDownIdx(idx);
    } catch {}
  }, []);

  useEffect(() => {
    let alive = true;

    (async () => {
      if (!id) { setErr("Missing track id"); setLoading(false); return; }
      setLoading(true); setErr(null);
      try {
        const { data, error } = await supabase
          .from("tracks")
          .select("id,title,artist,duration_sec,object_path,artwork_url,instrumental,is_public,genre,language,tags,themes")
          .eq("id", id)
          .maybeSingle();
        if (error) throw error;
        if (!data) throw new Error("Track not found");
        if (!alive) return;

        setT(data as TrackRow);

        const likeMap = await getLikesForIds([id]);
        const meta = likeMap[id] ?? { likes_count: 0, liked: false };
        if (!alive) return;
        setLikesCount(Number(meta.likes_count || 0));
        setLiked(!!meta.liked);

        await refreshDownloads();
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.message ?? String(e));
      } finally {
        if (alive) setLoading(false);
      }
    })();

    const off = onFavoriteChanged((ev) => {
      if (!id || ev.track_id !== id) return;
      setLiked(ev.liked);
      if (typeof ev.likes_count === "number") setLikesCount(ev.likes_count);
    });

    return () => { alive = false; try { off?.(); } catch {} };
  }, [id, refreshDownloads]);

  async function onToggleFavorite() {
    if (!t) return;
    try {
      const { liked, likes_count } = await toggleFavorite(t.id);
      setLiked(liked);
      setLikesCount(likes_count);
    } catch (e: any) {
      Alert.alert("Favorite error", e.message ?? String(e));
    }
  }

  async function onToggleDownload() {
    if (!t || !id) return;
    try {
      setBusy(true);
      if (isDownloaded) {
        await removeDownloaded(id);
        await refreshDownloads();
        Alert.alert("Removed", "Local file deleted");
      } else {
        const url = await getSignedDownloadUrl(t.object_path, 600);
        if (!url) throw new Error("No signed URL");
        await downloadTrack(t.id, url, `${t.id}.mp3`);
        await refreshDownloads();
        Alert.alert("Downloaded", "Saved to local storage");
      }
    } catch (e: any) {
      Alert.alert(isDownloaded ? "Delete error" : "Download error", e.message ?? String(e));
    } finally {
      setBusy(false);
    }
  }
  async function onGetPlayUrl() {
    if (!t) return;
      try {
        setBusy(true);
        const url = await getSignedDownloadUrl(t.object_path, 86400); // 1 day
        setPlayUrl(url);
        // TODO(player):........................................................................

        } catch (e: any) {
          Alert.alert("Play URL error", e.message ?? String(e));
        } finally {
          setBusy(false);
        }
    }

  if (!id) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 16 }}>
        <Text>Invalid link (no id)</Text>
        <FloatingBack />
      </View>
    );
  }

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 16 }}>
        <ActivityIndicator />
        <Text style={{ marginTop: 12 }}>Loading...</Text>
        <FloatingBack />
      </View>
    );
  }

  if (err) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 16 }}>
        <Text style={{ fontWeight: "700", marginBottom: 8 }}>Failed to load</Text>
        <Text style={{ opacity: 0.8 }}>{err}</Text>
        <FloatingBack />
      </View>
    );
  }

  const cover = t?.artwork_url || PLACEHOLDER;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "transparent" }} contentContainerStyle={{ padding: 16 }}>
      <View style={{ borderRadius: 12, padding: 14, backgroundColor: "rgba(255,255,255,0.85)" }}>
        <View style={{ flexDirection: "row" }}>
          <Image source={{ uri: cover }} style={{ width: 120, height: 120, borderRadius: 12, backgroundColor: "#eee", marginRight: 14 }} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 18, fontWeight: "700" }}>{t?.title || "(no title)"}</Text>
            <Text style={{ opacity: 0.8 }}>{t?.artist || "Unknown"}</Text>
            <Text style={{ opacity: 0.7, fontSize: 12 }}>
              {(t?.genre || "n/a")} - {(t?.language || "n/a")} - {t?.duration_sec ? `${t.duration_sec}s` : "-"}
            </Text>

            <View style={{ flexDirection: "row", marginTop: 8 }}>
              <TouchableOpacity onPress={onToggleFavorite}>
                <Text style={{ color: liked ? "tomato" : "#333", marginRight: 16 }}>★ {likesCount}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onToggleDownload} disabled={busy}>
                <Text style={{ color: isDownloaded ? "#d00" : "#007aff" }}>
                  {busy ? (isDownloaded ? "Removing..." : "Downloading...") : (isDownloaded ? "Delete" : "Download")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onGetPlayUrl} disabled={busy} style={{ marginLeft: 16 }}>
                <Text style={{ color: "#0a7", opacity: busy ? 0.6 : 1 }}>
                  {busy ? "Working..." : "Get Play URL"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {!!(t?.tags?.length || t?.themes?.length) && (
          <View style={{ marginTop: 12 }}>
            {t?.tags?.length ? (
              <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                {t.tags.map((g, i) => (
                  <View key={`tag-${i}`} style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, backgroundColor: "rgba(0,0,0,0.08)", marginRight: 8, marginBottom: 8 }}>
                    <Text style={{ fontSize: 12 }}>{g}</Text>
                  </View>
                ))}
              </View>
            ) : null}
            {t?.themes?.length ? (
              <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                {t.themes.map((g, i) => (
                  <View key={`th-${i}`} style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, backgroundColor: "rgba(0,0,0,0.08)", marginRight: 8, marginBottom: 8 }}>
                    <Text style={{ fontSize: 12 }}>{g}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        )}

        <Text style={{ opacity: 0.7, fontSize: 12, marginTop: 12 }} selectable>
          {t?.object_path}
        </Text>
        {playUrl && (
          <View style={{ marginTop: 8 }}>
            <Text style={{ fontSize: 12, opacity: 0.8 }} selectable>
              {/* TODO(player): ............................*/}
              {playUrl}
            </Text>
      </View>
)}</View>
      <FloatingBack />
    </ScrollView>
  );
}
