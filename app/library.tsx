// app/library.tsx
import { useEffect, useState } from "react";
import { View, Text, TextInput, Button, FlatList, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../lib/supabase";

import { getSignedDownloadUrl } from "../cloudapi/signedUrl";
import { listTracks, searchTracks, listByArtist, listByGenre, type TrackRow } from "../cloudapi/tracks";
import * as FavoritesApi from "../cloudapi/favorites";
import { signOut } from "../cloudapi/auth";
import { downloadTrack, getDownloadedIndex } from "../storage/downloader";

type Row = TrackRow & { likes_count?: number; liked?: boolean };

const D = (...args: any[]) => console.log("[LIB DEBUG]", ...args);

export default function Library() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [artist, setArtist] = useState("");
  const [genre, setGenre] = useState("");
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [downloaded, setDownloaded] = useState<Record<string, string>>({});

  // guard: redirect to /login if no session
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      D("session?", !!session);
      if (!session) router.replace("/login");
    })();
  }, []);

  useEffect(() => {
    (async () => {
      // --- MODULE EXPORT DIAG ---
      D("FavoritesApi keys (static):", Object.keys(FavoritesApi));
      try {
        const favDyn = await import("../cloudapi/favorites");
        D("FavoritesApi keys (dynamic):", Object.keys(favDyn));
        D("typeof favDyn.toggleFavorite:", typeof favDyn.toggleFavorite);
      } catch (e) {
        D("dynamic import favorites FAILED:", String(e));
      }
      try {
        const urlDyn = await import("../cloudapi/signedUrl");
        D("signedUrl keys (dynamic):", Object.keys(urlDyn));
        D("typeof urlDyn.getSignedDownloadUrl:", typeof urlDyn.getSignedDownloadUrl);
      } catch (e) {
        D("dynamic import signedUrl FAILED:", String(e));
      }

      await refreshDownloads();
      await initialLoad();
    })();
  }, []);

  async function refreshDownloads() {
    const idx = await getDownloadedIndex();
    D("downloaded index keys:", Object.keys(idx));
    setDownloaded(idx);
  }

  async function initialLoad() {
    setBusy(true);
    try {
      const list = await listTracks(50, 0);
      D("initial rows:", list.length);
      setRows(list);
    } finally {
      setBusy(false);
    }
  }

  async function doSearch() {
    setBusy(true);
    try {
      let data: Row[] = [];
      if (q.trim()) data = await searchTracks(q.trim(), 40, 0) as any;
      else if (artist.trim()) data = await listByArtist(artist.trim(), 40, 0);
      else if (genre.trim()) data = await listByGenre(genre.trim(), 40, 0);
      else data = await listTracks(50, 0);
      D("search result:", data.length);
      setRows(data);
    } catch (e: any) {
      Alert.alert("Search error", e.message ?? String(e));
    } finally {
      setBusy(false);
    }
  }

  async function onDownload(t: Row) {
    try {
      setBusy(true);
      D("onDownload object_path:", t.object_path);
      D("typeof getSignedDownloadUrl (static):", typeof getSignedDownloadUrl);
      const url = await getSignedDownloadUrl(t.object_path, 600);
      D("signed url:", url?.slice(0, 100));
      const local = await downloadTrack(t.id, url, `${t.id}.mp3`);
      await refreshDownloads();
      Alert.alert("Downloaded", local);
    } catch (e: any) {
      Alert.alert("Download error", e.message ?? String(e));
    } finally {
      setBusy(false);
    }
  }

  async function onLike(t: Row) {
    try {
      D("onLike -> FavoritesApi keys:", Object.keys(FavoritesApi));
      D("onLike -> typeof FavoritesApi.toggleFavorite:", typeof (FavoritesApi as any).toggleFavorite);
      const favDyn = await import("../cloudapi/favorites");
      D("onLike -> typeof dynamic toggleFavorite:", typeof favDyn.toggleFavorite);

      const { liked, likes_count } = await FavoritesApi.toggleFavorite(t.id);
      setRows(prev => prev.map(x => x.id === t.id ? ({ ...x, liked, likes_count }) : x));
    } catch (e: any) {
      Alert.alert("Favorite error", e.message ?? String(e));
    }
  }

  async function onSignOut() {
    await signOut();
    router.replace("/login");
  }

  // --- TEMP DEBUG ACTIONS ---
  async function debugListBucket() {
    try {
      const root = await supabase.storage.from("music").list("", { limit: 100 });
      D("bucket list /:", root.data?.map(x => x.name), root.error?.message);
      const sub = await supabase.storage.from("music").list("music", { limit: 100 });
      D("bucket list /music:", sub.data?.map(x => x.name), sub.error?.message);
      Alert.alert("Listed", "See Metro console logs.");
    } catch (e: any) {
      Alert.alert("List error", e.message ?? String(e));
    }
  }
  function debugDumpPaths() {
    D("rows object_path (first 10):", rows.slice(0, 10).map(r => r.object_path));
    Alert.alert("Dumped", "See Metro console logs.");
  }

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ fontSize: 22, fontWeight: "700" }}>Library</Text>
        <Button title="Sign out" onPress={onSignOut} />
      </View>

      <View style={{ gap: 6 }}>
        <TextInput
          placeholder="Search (title/artist/tags/lyrics)"
          value={q} onChangeText={setQ}
          style={{ borderWidth: 1, borderRadius: 8, padding: 8 }}
        />
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TextInput
            placeholder="Filter by artist"
            value={artist} onChangeText={setArtist}
            style={{ flex: 1, borderWidth: 1, borderRadius: 8, padding: 8 }}
          />
          <TextInput
            placeholder="Filter by genre"
            value={genre} onChangeText={setGenre}
            style={{ flex: 1, borderWidth: 1, borderRadius: 8, padding: 8 }}
          />
        </View>
        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
          <Button title={busy ? "Working..." : "Search"} onPress={doSearch} disabled={busy} />
          <Button title="Reset" onPress={() => { setQ(""); setArtist(""); setGenre(""); initialLoad(); }} />
          {__DEV__ && <Button title="List bucket" onPress={debugListBucket} />}
          {__DEV__ && <Button title="Dump paths" onPress={debugDumpPaths} />}
        </View>
      </View>

      <FlatList
        data={rows}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ paddingVertical: 8 }}
        renderItem={({ item }) => {
          const isDownloaded = !!downloaded[item.id];
          return (
            <View style={{ paddingVertical: 10, borderBottomWidth: 0.5, borderColor: "#ddd" }}>
              <Text style={{ fontSize: 16, fontWeight: "600" }}>{item.title}</Text>
              <Text style={{ opacity: 0.7 }}>{item.artist ?? "Unknown"} · {item.genre ?? "n/a"}</Text>
              <Text style={{ opacity: 0.6, fontSize: 12 }}>{item.object_path}</Text>
              <View style={{ flexDirection: "row", gap: 14, marginTop: 6 }}>
                <TouchableOpacity onPress={() => onLike(item)}>
                  <Text style={{ color: item.liked ? "tomato" : "#333" }}>
                    ★ {item.likes_count ?? 0}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => onDownload(item)} disabled={busy}>
                  <Text style={{ color: isDownloaded ? "green" : "#007aff" }}>
                    {isDownloaded ? "Downloaded ✓" : "Download"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}
