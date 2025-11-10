import { useEffect, useState } from "react";
import { View, Text, Button, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";
import { signOut } from "../../cloudapi/auth";
import { pickAndSetBackgroundCover, clearBackground } from "../../storage/background";
import { useBackground } from "../../context/Background";

export default function Account() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { refresh } = useBackground(); 
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUserEmail(session?.user?.email ?? null);
    })();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flex: 1, padding: 16, gap: 12, backgroundColor: "transparent" }}>
        <Text style={{ fontSize: 22, fontWeight: "700" }}>Account</Text>

        <Text style={{ opacity: 0.8 }}>
          {userEmail ? `Signed in as: ${userEmail}` : "Not signed in"}
        </Text>

        {userEmail ? (
          <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
            <Button
              title={busy ? "Setting..." : "Set Background"}
              onPress={async () => {
                try {
                  setBusy(true);
                  const newUri = await pickAndSetBackgroundCover(); 
                  console.log("[BG] set ->", newUri);
                  await refresh();                                  
                  Alert.alert("Done", "Background set");
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
                try {
                  setBusy(true);
                  await clearBackground();
                  await refresh();   
                  Alert.alert("Cleared", "Background removed");
                } catch (e: any) {
                  Alert.alert("Error", e.message ?? String(e));
                } finally {
                  setBusy(false);
                }
              }}
            />
            <Button
              title="Sign out"
              onPress={async () => {
                await signOut();
                setUserEmail(null);
                Alert.alert("Signed out");
              }}
            />
          </View>
        ) : (
          <Button title="Sign in / Account" onPress={() => router.push("/login")} />
        )}

        <View style={{ height: 8 }} />
        <Text style={{ fontSize: 16, fontWeight: "600" }}>Settings</Text>
        <Text style={{ opacity: 0.7 }}>（constructing....）</Text>
      </View>
    </SafeAreaView>
  );
}
