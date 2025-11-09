
import { useEffect, useState, useCallback } from "react";
import { View, Text, TextInput, Button, FlatList, TouchableOpacity, Alert, Platform } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { supabase } from "../lib/supabase";
import FloatingBack from "../components/Floatback";

import { getSignedDownloadUrl } from "../cloudapi/signedUrl";
import { listTracks, searchTracks, listByArtist, listByGenre, type TrackRow } from "../cloudapi/tracks";
import * as FavoritesApi from "../cloudapi/favorites";
import { signOut } from "../cloudapi/auth";

import { useBackground } from "../context/Background"; 
import { pickAndSetBackgroundCover, clearBackground } from "../storage/background";

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

  const bg = useBackground(); // global background controller

  // Guard: redirect to /login if no session
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      D("session?", !!session);
      if (!session) router.replace("/login");
    })();
  }, [router]);

  // Refresh local download index when screen focuses
  useFocusEffect(
    useCallback(() => {
      refreshDownloads();
      return () => {};
    }, [])
  );

  // Initial load: local downloads + latest tracks
  useEffect(() => {
    (async () => {
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
      if (q.trim()) data = (await searchTracks(q.trim(), 40, 0)) as any;
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
      const url = await getSignedDownloadUrl(t.object_path, 600);
      if (!url) throw new Error("No signed URL (check storage path / RLS)");
      const local = await downloadTrack(t.id, url, `${t.id}.mp3`);
      await refreshDownloads();
      Alert.alert("Downloaded", Platform.OS === "web" ? "Saved by browser download" : local);
    } catch (e: any) {
      Alert.alert("Download error", e.message ?? String(e));
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
    router.replace("/login");
  }

  // Dev helpers (optional)
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
    <View style={{ flex: 1, padding: 16, gap: 12 ,backgroundColor: "transparent"}}>
      {/* Header */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ fontSize: 22, fontWeight: "700" }}>Library</Text>
        <Button title="Sign out" onPress={onSignOut} />
      </View>

      {/* Quick nav */}
      <View style={{ flexDirection: "row", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
        <Button title="Open Downloads" onPress={() => router.push("/downloads")} />
        <Button title="My Favorites" onPress={() => router.push("/favorites")} />
        {/* Background actions (local-only) */}
        <Button
          title="Set Background"
          onPress={async () => {
            try {
              setBusy(true);
              await pickAndSetBackgroundCover(); // Pick → cover crop → save
              await bg.reload();                  // Apply globally
              Alert.alert("Done", "Background set!");
            } catch (e: any) {
              Alert.alert("Error", e.message ?? String(e));
            } finally {
              setBusy(false);
            }
          }}
        />
        <Button
          title="Clear Background"
          onPress={async () => {
            setBusy(true);
            await clearBackground(); // Remove local bg
            await bg.reload();       // Back to solid color
            setBusy(false);
          }}
        />
      </View>

      {/* Search form */}
      <View style={{ gap: 6 }}>
        <TextInput
          placeholder="Search (title/artist/tags/lyrics)"
          value={q}
          onChangeText={setQ}
          style={{ borderWidth: 1, borderRadius: 8, padding: 8 }}
        />
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TextInput
            placeholder="Filter by artist"
            value={artist}
            onChangeText={setArtist}
            style={{ flex: 1, borderWidth: 1, borderRadius: 8, padding: 8 }}
          />
          <TextInput
            placeholder="Filter by genre"
            value={genre}
            onChangeText={setGenre}
            style={{ flex: 1, borderWidth: 1, borderRadius: 8, padding: 8 }}
          />
        </View>
        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
          <Button title={busy ? "Working..." : "Search"} onPress={doSearch} disabled={busy} />
          <Button
            title="Reset"
            onPress={() => {
              setQ("");
              setArtist("");
              setGenre("");
              initialLoad();
            }}
          />
          {__DEV__ && <Button title="List bucket" onPress={debugListBucket} />}
          {__DEV__ && <Button title="Dump paths" onPress={debugDumpPaths} />}
        </View>
      </View>

      {/* List */}
      <FlatList
        data={rows}
        keyExtractor={i => i.id}
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
                  <Text style={{ color: item.liked ? "tomato" : "#333" }}>★ {item.likes_count ?? 0}</Text>
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

      <FloatingBack />
    </View>
  );
}
