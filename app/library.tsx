
import { useEffect, useRef, useState, useCallback } from "react";
import { View, InteractionManager,Text, TextInput, Button, FlatList, TouchableOpacity, Alert, Platform } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { supabase } from "../lib/supabase";
import { SafeAreaView } from "react-native-safe-area-context";
import { getSignedDownloadUrl } from "../cloudapi/signedUrl";
import { listTracks, searchTracks, listByArtist, listByGenre, type TrackRow } from "../cloudapi/tracks";
import * as FavoritesApi from "../cloudapi/favorites";
import { getLikesForIds, onFavoriteChanged } from "../cloudapi/favorites";
import { signOut } from "../cloudapi/auth";

import { downloadTrack, getDownloadedIndex } from "../storage/downloader";

type Row = TrackRow & { likes_count?: number; liked?: boolean; play_url?: string };
const D = (...args: any[]) => console.log("[LIB DEBUG]", ...args);

export default function Library() {
  const router = useRouter();

  const [q, setQ] = useState("");
  const [artist, setArtist] = useState("");
  const [genre, setGenre] = useState("");

  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [downloaded, setDownloaded] = useState<Record<string, string>>({});

  const rowsRef = useRef<Row[]>([]);
  useEffect(() => { rowsRef.current = rows; }, [rows]);



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

  async function doSearch() {
    setBusy(true);
    try {
      let data: Row[] = [];
      if (q.trim()) data = (await searchTracks(q.trim(), 40, 0)) as any;
      else if (artist.trim()) data = await listByArtist(artist.trim(), 40, 0);
      else if (genre.trim()) data = await listByGenre(genre.trim(), 40, 0);
      else data = await listTracks(50, 0);
      const withLikes = await mergeLikes(data);
      setRows(withLikes);
    } catch (e: any) {
      Alert.alert("Search error", e.message ?? String(e));
    } finally {
      setBusy(false);
    }
  }

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
  async function onGetPlayUrl(t: Row) {
    try {
      setBusy(true);
      const url = await getSignedDownloadUrl(t.object_path, 86400); // 1day
      setRows(prev => prev.map(r => (r.id === t.id ? { ...r, play_url: url } : r)));
        // TODO(player)...................................................................
      } catch (e: any) {
      Alert.alert("Play URL error", e.message ?? String(e));
      } finally {
      setBusy(false);
      }
    }
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
 


      <View style={{ gap: 6 }}>
        <TextInput
          placeholder="Search (title/artist/tags/lyrics)"
          value={q}
          onChangeText={setQ}
          style={{ borderWidth: 1, borderRadius: 8, padding: 8 }}
        />
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TextInput placeholder="Filter by artist" value={artist} onChangeText={setArtist}
            style={{ flex: 1, borderWidth: 1, borderRadius: 8, padding: 8 }} />
          <TextInput placeholder="Filter by genre" value={genre} onChangeText={setGenre}
            style={{ flex: 1, borderWidth: 1, borderRadius: 8, padding: 8 }} />
        </View>
        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
          <Button title={busy ? "Working..." : "Search"} onPress={doSearch} disabled={busy} />
          <Button title="Reset" onPress={() => { setQ(""); setArtist(""); setGenre(""); initialLoad(); }} />
        </View>
      </View>

      <FlatList
        data={rows}
        style={{ backgroundColor: "transparent" }}
        keyExtractor={i => i.id}
        contentContainerStyle={{ paddingVertical: 8 }}
        renderItem={({ item }) => {
          const isDownloaded = !!downloaded[item.id];
          return (
            <View style={{ paddingVertical: 10, borderBottomWidth: 0.5, borderColor: "#ddd" }}>
              {/* Title → go to details (no Link, only Touchable) */}
              <TouchableOpacity onPress={() => router.push(`/track/${item.id}`)}>
                <Text style={{ fontSize: 16, fontWeight: "600", textDecorationLine: "underline" }}>
                  {item.title}
                </Text>
              </TouchableOpacity>

              <Text style={{ opacity: 0.7 }}>{item.artist ?? "Unknown"} · {item.genre ?? "n/a"}</Text>
              <Text style={{ opacity: 0.6, fontSize: 12 }}>{item.object_path}</Text>

              <View style={{ flexDirection: "row", marginTop: 6 }}>
                <TouchableOpacity onPress={() => onLike(item)}>
                  <Text style={{ color: item.liked ? "tomato" : "#333", marginRight: 16 }}>
                    ★ {item.likes_count ?? 0}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => onGetPlayUrl(item)} disabled={busy}>
                  <Text style={{ color: "#0a7", marginRight: 16 }}>
                    {busy ? "Working..." : "Play"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => onDownload(item)} disabled={busy}>
                  <Text style={{ color: isDownloaded ? "green" : "#007aff", marginRight: 16 }}>
                    {isDownloaded ? "Downloaded ✓" : "Download"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.push(`/track/${item.id}`)}>
                  <Text style={{ color: "#4da3ff" }}>Details</Text>
                </TouchableOpacity>
              </View>
              {item.play_url && (
              <Text style={{ opacity: 0.7, fontSize: 12, marginTop: 6 }} selectable>
              {/* TODO(player)................. */}
              {item.play_url}
              </Text>
            )}
            </View>
          );
        }}
      />


    </SafeAreaView>
  );
}
