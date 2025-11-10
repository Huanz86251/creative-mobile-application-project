// app/_layout.tsx
import React, { useEffect, useState } from "react";
import { Stack, ErrorBoundaryProps, useRouter, useSegments } from "expo-router";
import { ScrollView, Text, Button, View } from "react-native";
import { ThemeProvider, DefaultTheme } from "@react-navigation/native";

import { PlayerProvider } from "../context/PlayerContext";
import BackgroundProvider from "../context/Background";
import NowPlayingBar from "../components/NowPlayingBar";
import { supabase } from "../lib/supabase";

export const unstable_settings = { initialRouteName: "(tabs)" };

// Transparent nav theme so screens don't paint white
const TransparentTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: "transparent", card: "transparent" },
};


function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const segments = useSegments(); 
  const [checking, setChecking] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    let unsub: { unsubscribe?: () => void } | undefined;

    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setLoggedIn(!!session);
      setChecking(false);

      const sub = supabase.auth.onAuthStateChange((_event, s) => {
        setLoggedIn(!!s);
      });
      unsub = sub?.data?.subscription;
    })();

    return () => {
      try { unsub?.unsubscribe?.(); } catch {}
    };
  }, []);

  useEffect(() => {
    if (checking) return;
    const first = segments[0];          
    const inTabs = first === "(tabs)";
  
    if (!loggedIn && inTabs) {

      router.replace("/login");
    } else if (loggedIn && first === "login") {

      router.replace("/(tabs)/library");
    }

  }, [checking, loggedIn, segments, router]);


  if (checking) return null;
  return <>{children}</>;
}

export default function Layout() {
  return (
    <PlayerProvider>
      <BackgroundProvider>
        <ThemeProvider value={TransparentTheme}>
          <AuthGate>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: "transparent" }, // key for native-stack
              }}
            />
            <NowPlayingBar />
          </AuthGate>
        </ThemeProvider>
      </BackgroundProvider>
    </PlayerProvider>
  );
}

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  const msg = (error as any)?.stack || (error as any)?.message || String(error ?? "Unknown error");
  return (
    <ScrollView style={{ padding: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 8 }}>App crashed at startup</Text>
      <Text selectable style={{ fontFamily: "monospace" }}>{msg}</Text>
      <View style={{ height: 12 }} />
      <Button title="Retry" onPress={retry} />
    </ScrollView>
  );
}
