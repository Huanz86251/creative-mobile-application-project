
import React, { createContext, useContext, useCallback, useEffect, useRef, useState } from "react";
import { View, Image, StyleSheet, Platform, ImageSourcePropType } from "react-native";
import { getBackgroundLocalUri, clearBackground as clearBgKey } from "../storage/background";


const DEFAULT_BG: ImageSourcePropType = require("../assets/default.jpg");

type Ctx = { uri?: string; reload: () => Promise<void>; clearBroken: () => Promise<void> };
const BgCtx = createContext<Ctx>({ reload: async () => {}, clearBroken: async () => {} });
export const useBackground = () => useContext(BgCtx);

export default function BackgroundProvider({ children }: { children: React.ReactNode }) {
  const [uri, setUri] = useState<string | undefined>();
  const [useDefault, setUseDefault] = useState<boolean>(true);
  const lastWebUrl = useRef<string | undefined>(undefined);

  const reload = useCallback(async () => {
    let u = await getBackgroundLocalUri().catch(() => undefined);

    // Normalize native: add file:// to absolute paths
    if (u && Platform.OS !== "web" && !u.startsWith("file://") && !u.startsWith("content://")) {
      if (u.startsWith("/")) u = `file://${u}`;
    }

    // Web: track blob URL to revoke later
    if (Platform.OS === "web" && lastWebUrl.current && lastWebUrl.current !== u) {
      try { URL.revokeObjectURL(lastWebUrl.current); } catch {}
    }
    if (Platform.OS === "web") lastWebUrl.current = u;

    setUri(u);
    setUseDefault(!u);
  }, []);

  const clearBroken = useCallback(async () => {
    try { await clearBgKey(); } catch {}
    setUri(undefined);
    setUseDefault(true);
  }, []);

  useEffect(() => { reload(); }, [reload]);

  return (
    <BgCtx.Provider value={{ uri, reload, clearBroken }}>
      <View style={{ flex: 1, backgroundColor: "transparent" }}>
        {useDefault ? (
          <Image source={DEFAULT_BG} resizeMode="cover" style={StyleSheet.absoluteFillObject} />
        ) : (
          <Image
            source={{ uri: uri! }}
            resizeMode="cover"
            style={StyleSheet.absoluteFillObject}
            onError={async () => {
              // Fallback if the saved uri is invalid/unreachable
              setUseDefault(true);
              await clearBroken();
            }}
          />
        )}
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
