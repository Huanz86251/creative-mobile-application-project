
import { useEffect, useState } from "react";
import { View, Text, FlatList, Button, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../lib/supabase";
import type {FavoriteRow} from "../cloudapi/favorites";
import { listMyFavorites, toggleFavorite } from "../cloudapi/favorites";
import FloatingBack from "../components/Floatback";
import { getSignedDownloadUrl } from "../cloudapi/signedUrl";
import { getDownloadedIndex, downloadTrack } from "../storage/downloader";

type Row = FavoriteRow & { downloaded?: boolean };

export default function Favorites() {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/login"); return; }
      await refresh();
    })();
  }, []);

  async function refresh() {
    const [fav, idx] = await Promise.all([listMyFavorites(), getDownloadedIndex()]);
    setRows(fav.map(f => ({ ...f, downloaded: !!idx[f.track_id] })));
  }

  async function onToggle(track_id: string) {
    try {
      const { liked } = await toggleFavorite(track_id);
      if (!liked) setRows(prev => prev.filter(x => x.track_id !== track_id));
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
      const missing = rows.filter(x => !x.downloaded);
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
    <View style={{ flex:1, padding:16,backgroundColor: "transparent" }}>
      <View style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"center" }}>
        <Text style={{ fontSize:22, fontWeight:"700" }}>My Favorites</Text>
      </View>

      <View style={{ flexDirection:"row", gap:8, marginVertical:8 }}>
        <Button title={busy ? "Working..." : "Download all missing"} onPress={downloadAllMissing} disabled={busy} />
        <Button title="Refresh" onPress={refresh} disabled={busy} />
      </View>

      <FlatList
        data={rows}
        keyExtractor={i => i.track_id}
        renderItem={({ item }) => (
          <View style={{ paddingVertical:10, borderBottomWidth:0.5, borderColor:"#ddd" }}>
            <Text style={{ fontSize:16, fontWeight:"600" }}>{item.title ?? "(no title)"}</Text>
            <Text style={{ opacity:0.7 }}>{item.artist ?? "Unknown"}</Text>
            <Text style={{ opacity:0.6, fontSize:12 }}>{item.object_path}</Text>
            <View style={{ flexDirection:"row", gap:14, marginTop:6 }}>
              <TouchableOpacity onPress={() => onToggle(item.track_id)}>
                <Text style={{ color:"tomato" }}>♥ Remove</Text>
              </TouchableOpacity>
              <TouchableOpacity disabled={busy || item.downloaded} onPress={() => onDownloadOne(item)}>
                <Text style={{ color: item.downloaded ? "green" : "#007aff" }}>
                  {item.downloaded ? "Downloaded ✓" : "Download"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
      <FloatingBack />
    </View>
  );
}
