
import React, {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
} from "react";
import { View, Image, StyleSheet, Platform, ImageSourcePropType } from "react-native";
import { getBackgroundLocalUri, clearBackground as clearBgKey } from "../storage/background";

const DEFAULT_BG: ImageSourcePropType = require("../assets/default.jpg");

export type Ctx = {
  uri: string | null;                
  refresh: () => Promise<void>;       
  clearBroken: () => Promise<void>;   
};

const BgCtx = createContext<Ctx>({
  uri: null,
  refresh: async () => {},
  clearBroken: async () => {},
});

export const useBackground = () => {
  const ctx = useContext(BgCtx);
  if (!ctx) throw new Error("useBackground must be used within BackgroundProvider");
  return ctx;
};

export default function BackgroundProvider({ children }: { children: React.ReactNode }) {
  const [uri, setUri] = useState<string | null>(null);
  const [useDefault, setUseDefault] = useState<boolean>(true);
  const lastWebUrl = useRef<string | null>(null);

  const refresh = useCallback(async () => {
    let u: string | null = null;
    try { u = (await getBackgroundLocalUri()) || null; } catch { u = null; }

    const isColor = !!u?.startsWith("color:");
    if (u && !isColor && Platform.OS !== "web" && !u.startsWith("file://") && !u.startsWith("content://")) {
      if (u.startsWith("/")) u = `file://${u}`;
    }

    if (
      Platform.OS === "web" &&
      lastWebUrl.current &&
      lastWebUrl.current !== u &&
      lastWebUrl.current.startsWith("blob:")
    ) {
      try { URL.revokeObjectURL(lastWebUrl.current); } catch {}
    }
    if (Platform.OS === "web" && u?.startsWith("blob:")) {
      lastWebUrl.current = u;
    }

    console.log("[BG] refresh ->", u);

    setUri(u);
    setUseDefault(!u);
  }, []);

  const clearBroken = useCallback(async () => {
    try {
      await clearBgKey();
    } catch {}
    setUri(null);
    setUseDefault(true);
  }, []);

  useEffect(() => {
    refresh();

    return () => {
      if (Platform.OS === "web" && lastWebUrl.current) {
        try {
          URL.revokeObjectURL(lastWebUrl.current);
        } catch {}
      }
    };
  }, [refresh]);

  const value = useMemo<Ctx>(() => ({ uri, refresh, clearBroken }), [uri, refresh, clearBroken]);

  return (
    <BgCtx.Provider value={value}>
      <View style={{ flex: 1, backgroundColor: "transparent" }}>
        {uri?.startsWith("color:") ? (
          <View
            key={uri}
            style={[
              StyleSheet.absoluteFillObject,
              { backgroundColor: uri.replace("color:", "") || "#000" },
            ]}
          />
        ) : useDefault ? (
          <Image
            key="bg-default"
            source={DEFAULT_BG}
            resizeMode="cover"
            style={StyleSheet.absoluteFillObject}
          />
        ) : (
          <Image
            key={uri || "bg-null"}
            source={{ uri: uri! }}
            resizeMode="cover"
            style={StyleSheet.absoluteFillObject}
            onError={async () => {
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
