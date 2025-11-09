// context/Background.tsx
import React, { createContext, useContext, useCallback, useEffect, useRef, useState } from "react";
import { View, Image, StyleSheet, Platform, ImageSourcePropType } from "react-native";
import * as FileSystem from "expo-file-system";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getBackgroundLocalUri, clearBackground as clearBgKey } from "../storage/background";

// Default bundled image (ensure this file exists: project/assets/default.jpg)
const DEFAULT_BG: ImageSourcePropType = require("../assets/default.jpg");

type Ctx = { uri?: string; reload: () => Promise<void>; clearBroken: () => Promise<void> };
const BgCtx = createContext<Ctx>({ reload: async () => {}, clearBroken: async () => {} });
export const useBackground = () => useContext(BgCtx);

// Quick fs existence check
async function fileExists(uri: string): Promise<boolean> {
  try {
    // web: blob/object URLs or http(s) are fine
    if (Platform.OS === "web") return !!uri && !uri.startsWith("external://");
    // native: must be actual local file/content
    if (!uri.startsWith("file://") && !uri.startsWith("content://")) return false;
    const info = await FileSystem.getInfoAsync(uri);
    return !!info.exists;
  } catch {
    return false;
  }
}

export default function BackgroundProvider({ children }: { children: React.ReactNode }) {
  const [uri, setUri] = useState<string | undefined>();
  const [useDefault, setUseDefault] = useState<boolean>(true);
  const lastWebUrl = useRef<string | undefined>(undefined);

  const reload = useCallback(async () => {
    // 1) read saved uri
    const saved = await getBackgroundLocalUri().catch(() => undefined);
    let ok: string | undefined = saved && !saved.startsWith("external://") ? saved : undefined;

    // 2) verify existence on native; if missing → ignore
    if (ok && Platform.OS !== "web") {
      if (!(await fileExists(ok))) ok = undefined;
    }

    // 3) web: revoke old object URL
    if (Platform.OS === "web" && lastWebUrl.current && lastWebUrl.current !== ok) {
      try { URL.revokeObjectURL(lastWebUrl.current); } catch {}
    }
    if (Platform.OS === "web") lastWebUrl.current = ok;

    setUri(ok);
    setUseDefault(!ok);
  }, []);

  // Allow caller to force-clear corrupted key
  const clearBroken = useCallback(async () => {
    try { await clearBgKey(); } catch {}
    setUri(undefined);
    setUseDefault(true);
  }, []);

  useEffect(() => { reload(); }, [reload]);

  return (
    <BgCtx.Provider value={{ uri, reload, clearBroken }}>
      <View style={{ flex: 1, backgroundColor: "transparent" }}>
        {/* Background layer */}
        {useDefault ? (
          <Image source={DEFAULT_BG} resizeMode="cover" style={StyleSheet.absoluteFillObject} />
        ) : (
          <Image
            source={{ uri: uri! }}
            resizeMode="cover"
            style={StyleSheet.absoluteFillObject}
            // If image fails on Android (bad uri), fallback to default and clear key
            onError={async () => {
              setUseDefault(true);
              await clearBroken();
            }}
          />
        )}

        {/* Light overlay to keep text readable (weaker when custom bg exists) */}
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFillObject,
            { backgroundColor: `rgba(255,255,255,${useDefault ? 0.36 : 0.18})` },
          ]}
        />

        {children}
      </View>
    </BgCtx.Provider>
  );
}
