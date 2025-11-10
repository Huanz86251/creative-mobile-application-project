
import { useEffect, useState } from "react";
import { View, Text, FlatList, Button, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../lib/supabase";
import { getDownloadedIndex, removeDownloaded, clearAllDownloads } from "../storage/downloader";
import { getTracksByIds, type TrackRow } from "../cloudapi/tracks";
import FloatingBack from "../components/Floatback";
type Row = Omit<Partial<TrackRow>, "id"> & { id: string; uri: string };

export default function Downloads() {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => { refresh(); }, []);

  async function refresh() {
    const idx = await getDownloadedIndex();
    const ids = Object.keys(idx);
    if (ids.length === 0) { setRows([]); return; }


    let metas: TrackRow[] = [];
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) metas = await getTracksByIds(ids);
    } catch { metas = []; }

    const metaMap = Object.fromEntries(metas.map(m => [m.id, m]));
    const mapped: Row[] = ids.map((id) => {
      const meta = metaMap[id] as TrackRow | undefined;
      const { id: _drop, ...rest } = (meta ?? {}) as TrackRow;
      return { id, uri: idx[id], ...(rest as Omit<TrackRow, "id">) };
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

  return (
    <View style={{ flex:1, padding:16,backgroundColor: "transparent" }}>
     <View style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"center" }}>
       <Text style={{ fontSize:22, fontWeight:"700" }}>Local Downloads</Text>
     </View>

      <View style={{ flexDirection:"row", gap:8, marginVertical:8 }}>
        <Button title={busy ? "Working..." : "Delete all"} onPress={onClearAll} disabled={busy || rows.length===0} />
        <Button title="Refresh" onPress={refresh} disabled={busy} />
      </View>

      {rows.length === 0 ? (
        <Text style={{ marginTop:16, opacity:0.7 }}>No local files.</Text>
      ) : (
        <FlatList
        style={{ backgroundColor: "transparent" }} 
          data={rows}
          keyExtractor={i => i.id}
          renderItem={({ item }) => (
            <View style={{ paddingVertical:10, borderBottomWidth:0.5, borderColor:"#ddd" }}>
              <Text style={{ fontSize:16, fontWeight:"600" }}>{item.title ?? "(no title)"}</Text>
              <Text style={{ opacity:0.7 }}>{item.artist ?? "Unknown"} · {item.genre ?? "n/a"}</Text>
              <Text style={{ opacity:0.6, fontSize:12 }} numberOfLines={1}>{item.uri}</Text>
              <View style={{ flexDirection:"row", gap:14, marginTop:6 }}>
                <TouchableOpacity onPress={() => onRemove(item.id)} disabled={busy}>
                  <Text style={{ color:"#d00" }}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
      <FloatingBack />
    </View>
  );
}
