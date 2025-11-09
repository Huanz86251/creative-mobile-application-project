// context/Background.tsx
import React, { createContext, useContext, useCallback, useEffect, useRef, useState } from "react";
import { View, Image, StyleSheet, Platform } from "react-native";
import { getBackgroundLocalUri } from "../storage/background";

type Ctx = { uri?: string; reload: () => Promise<void> };
const BgCtx = createContext<Ctx>({ reload: async () => {} });

export const useBackground = () => useContext(BgCtx);

function BackgroundLayer({ uri }: { uri?: string }) {
  // Fallback: light paper-like background (not pure black)
  if (!uri) return <View style={[StyleSheet.absoluteFillObject, { backgroundColor: "#eef2f7" }]} />;
  // Custom: cover image as absolute layer
  return (
    <Image
      source={{ uri }}
      resizeMode="cover"
      style={StyleSheet.absoluteFillObject}
      fadeDuration={150}
      progressiveRenderingEnabled
    />
  );
}

// Sits above background, below content, to ensure text contrast
function ContrastOverlay({ hasCustom }: { hasCustom: boolean }) {
  // Stronger when no custom image, lighter when image exists
  const alpha = hasCustom ? 0.20 : 0.85; // tune if needed
  return (
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFillObject, { backgroundColor: `rgba(255,255,255,${alpha})` }]}
    />
  );
}

export default function BackgroundProvider({ children }: { children: React.ReactNode }) {
  const [uri, setUri] = useState<string | undefined>();
  const lastWebUrl = useRef<string | undefined>(undefined); // TS: initial value required

  const reload = useCallback(async () => {
    const u = await getBackgroundLocalUri().catch(() => undefined);
    const ok = u && !u.startsWith("external://") ? u : undefined;

    // Web: revoke previous object URL to prevent leaks
    if (Platform.OS === "web" && lastWebUrl.current && lastWebUrl.current !== ok) {
      try { URL.revokeObjectURL(lastWebUrl.current); } catch {}
    }
    if (Platform.OS === "web") lastWebUrl.current = ok;

    setUri(ok);
  }, []);

  useEffect(() => { reload(); }, [reload]);

  return (
    <BgCtx.Provider value={{ uri, reload }}>
      <View style={{ flex: 1, backgroundColor: "transparent" }}>
        <BackgroundLayer uri={uri} />
        <ContrastOverlay hasCustom={!!uri} />
        {children}
      </View>
    </BgCtx.Provider>
  );
}
