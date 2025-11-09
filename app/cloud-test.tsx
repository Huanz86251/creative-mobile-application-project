// app/cloud-test.tsx
import { useEffect, useState } from "react";
import { View, Text, TextInput, Button, FlatList, Alert } from "react-native";
import { Paths } from "expo-file-system/next";
import { supabase } from "../lib/supabase";

// Use namespace imports to avoid named-export pitfalls
import { fetchTracks, type Datarow } from "../cloudapi/tracks";
import { getSignedDownloadUrl } from "../cloudapi/signedUrl";


export default function CloudTest() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sessionReady, setSessionReady] = useState(false);
  const [tracks, setTracks] = useState<Datarow[]>([]);
  const [busy, setBusy] = useState(false);
  const [localIndex, setLocalIndex] = useState<Record<string, string>>({});

  // lazy import fallback (double safety)

  async function refreshLocalIndex() {
    const { getDownloadedIndex } = await import("../storage/downloader");
    const idx = await getDownloadedIndex();
    setLocalIndex(idx);
  }

  // On mount: only restore session; DO NOT call fetchTracks here (avoid crash)
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSessionReady(!!session);
      await refreshLocalIndex();
    })();
  }, []);

  async function onLogin() {
    try {
      setBusy(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      setSessionReady(true);
      const list = await fetchTracks();
      setTracks(list);
      await refreshLocalIndex();
      Alert.alert("Signed in", `Fetched ${list.length} track(s).`);
    } catch (e: any) {
      Alert.alert("Sign-in failed", e.message ?? String(e));
    } finally {
      setBusy(false);
    }
  }

  async function refreshList() {
    try {
      setBusy(true);
      const list = await fetchTracks();
      setTracks(list);
      await refreshLocalIndex();
      Alert.alert("Refreshed", `Now have ${list.length} track(s).`);
    } catch (e: any) {
      Alert.alert("Refresh failed", e.message ?? String(e));
    } finally {
      setBusy(false);
    }
  }

  async function showSignedUrl(t: Datarow) {
    try {
        const url = await getSignedDownloadUrl(t.object_path, 600);
      Alert.alert("Signed URL", (url ?? "").slice(0, 100) + "...");
    } catch (e: any) {
      Alert.alert("Signed URL error", e.message ?? String(e));
    }
  }

  async function downloadOne(t: Datarow) {
    try {
      setBusy(true);
      const url = await getSignedDownloadUrl(t.object_path, 600);
      const { downloadTrack } = await import("../storage/downloader");
      const localUri = await downloadTrack(t.id, url, `${t.id}.mp3`);
      await refreshLocalIndex();
      const baseUri = (Paths.document ?? Paths.cache).uri;
      Alert.alert("Downloaded", localUri.replace(baseUri, "document://"));
    } catch (e: any) {
      Alert.alert("Download failed", e.message ?? String(e));
    } finally {
      setBusy(false);
    }
  }

  async function removeLocal(t: Datarow) {
    try {
      setBusy(true);
      const { removeLocalTrack } = await import("../storage/downloader");
      await removeLocalTrack(t.id);
      await refreshLocalIndex();
      Alert.alert("Removed", "Local file deleted (if existed).");
    } catch (e: any) {
      Alert.alert("Remove failed", e.message ?? String(e));
    } finally {
      setBusy(false);
    }
  }

  // Debug helpers (optional)
  async function debugImports() {
    const mt = await import("../cloudapi/tracks");
    const ms = await import("../cloudapi/signedUrl");
    const msg =
      `tracks keys: ${Object.getOwnPropertyNames(mt).join(", ")}\n` +
      `tracks typeof default: ${typeof (mt as any).default}\n` +
      `tracks typeof fetchTracks: ${typeof (mt as any).fetchTracks}\n\n` +
      `signedUrl keys: ${Object.getOwnPropertyNames(ms).join(", ")}\n` +
      `signedUrl typeof default: ${typeof (ms as any).default}\n` +
      `signedUrl typeof getSignedDownloadUrl: ${typeof (ms as any).getSignedDownloadUrl}`;
    Alert.alert("Module introspect", msg);
  }
  
  async function showSession() {
    const { data: { session } } = await supabase.auth.getSession();
    const { data: userData } = await supabase.auth.getUser();
    Alert.alert(
      "Session",
      session
        ? `user id: ${userData.user?.id}\nemail: ${userData.user?.email}\nexpires: ${session.expires_at}`
        : "No session"
    );
  }

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 20, fontWeight: "bold" }}>Cloud Smoke Test</Text>
      <Text style={{ opacity: 0.7 }}>
        URL: {process.env.EXPO_PUBLIC_SUPABASE_URL?.slice(0, 48) ?? "not set"}…
      </Text>

      {!sessionReady && (
        <View style={{ gap: 8 }}>
          <Text style={{ fontWeight: "600" }}>
            Sign in (RLS requires an authenticated user):
          </Text>
          <TextInput
            placeholder="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            style={{ borderWidth: 1, padding: 8, borderRadius: 8 }}
          />
          <TextInput
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            style={{ borderWidth: 1, padding: 8, borderRadius: 8 }}
          />
          <Button title={busy ? "Signing in..." : "Sign in"} onPress={onLogin} disabled={busy} />
        </View>
      )}

      {sessionReady && (
        <>
          <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
            <Button title={busy ? "Working..." : "Refresh list"} onPress={refreshList} disabled={busy} />
            <Button title="Show local index" onPress={refreshLocalIndex} />
            <Button title="Debug imports" onPress={debugImports} />
            <Button title="Show session" onPress={showSession} />
          </View>

          <FlatList
            data={tracks}
            keyExtractor={(i) => i.id}
            contentContainerStyle={{ paddingVertical: 8 }}
            renderItem={({ item }) => {
              const localUri = localIndex[item.id];
              return (
                <View style={{ paddingVertical: 8, borderBottomWidth: 0.5, borderColor: "#ddd", gap: 4 }}>
                  <Text style={{ fontSize: 16, fontWeight: "600" }}>{item.title}</Text>
                  <Text style={{ opacity: 0.7 }}>{item.artist ?? "Unknown"}</Text>
                  <Text style={{ opacity: 0.6, fontSize: 12 }}>{item.object_path}</Text>
                  {localUri ? (
                    <Text style={{ color: "green", fontSize: 12 }}>Downloaded ✓</Text>
                  ) : (
                    <Text style={{ color: "tomato", fontSize: 12 }}>Not downloaded</Text>
                  )}
                  <View style={{ flexDirection: "row", gap: 8, marginTop: 6 }}>
                    <Button title="Signed URL" onPress={() => showSignedUrl(item)} />
                    <Button title={localUri ? "Re-download" : "Download"} onPress={() => downloadOne(item)} disabled={busy} />
                    <Button title="Remove local" onPress={() => removeLocal(item)} disabled={busy || !localUri} />
                  </View>
                </View>
              );
            }}
          />
        </>
      )}
    </View>
  );
}
