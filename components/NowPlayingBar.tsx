import { useState, useRef, useEffect } from "react";
import {
  View, Text, Image, TouchableOpacity, Pressable, Dimensions,
  Animated, Easing, PanResponder, Platform, Share as RNShare,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { usePlayer } from "../context/PlayerContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as FileSystem from "expo-file-system/legacy";

async function shareWithFallback(previewUrl: string, filenameBase: string) {
  if (!previewUrl) return;
  try {
    if (Platform.OS === "web") {
      await RNShare.share({ message: previewUrl });
      return;
    }
    let Sharing: any = null;
    try { Sharing = await import("expo-sharing"); } catch { Sharing = null; }
    if (!Sharing || !(await Sharing.isAvailableAsync?.())) {
      await RNShare.share({ message: previewUrl });
      return;
    }
    const filename = `share-${filenameBase}.mp3`;
    const target = FileSystem.cacheDirectory + filename;
    const { uri } = await FileSystem.downloadAsync(previewUrl, target);
    await Sharing.shareAsync(uri, { mimeType: "audio/mpeg", dialogTitle: "Share track" });
  } catch {
    await RNShare.share({ message: previewUrl });
  }
}

export default function NowPlayingBar() {
  const player = usePlayer();
  const insets = useSafeAreaInsets();
  const TAB_BAR_BASE = 60;
  const barBottom = insets.bottom + TAB_BAR_BASE + 8;
  if (!player.currentTrack) return null;
  return <NowPlayingBarInner barBottom={barBottom} player={player} />;
}

type PlayerSlice = ReturnType<typeof usePlayer>;

function NowPlayingBarInner({ barBottom, player }: { barBottom: number; player: PlayerSlice }) {
  const {
    currentTrack, isPlaying, togglePlayPause, positionMillis, durationMillis,
    playNext, playPrevious, canSkipNext, canSkipPrevious,
    playbackMode, cyclePlaybackMode,
  } = player;

  const [sharing, setSharing] = useState(false);
  const progressAnimMini = useRef(new Animated.Value(0)).current;
  const progressAnimSheet = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const pct = (durationMillis ? positionMillis / durationMillis : 0) * 100;
    const cfg = { duration: 160, easing: Easing.linear as any, useNativeDriver: false };
    Animated.timing(progressAnimMini, { toValue: pct, ...cfg }).start();
    Animated.timing(progressAnimSheet, { toValue: pct, ...cfg }).start();
  }, [positionMillis, durationMillis]);

  const H = Math.min(560, Math.round(Dimensions.get("window").height * 0.80));
  const SHEET_HIDDEN_Y = H + 40;
  const sheetY = useRef(new Animated.Value(SHEET_HIDDEN_Y)).current;
  const [isOpen, setIsOpen] = useState(false);

  const scrimOpacity = sheetY.interpolate({ inputRange: [0, SHEET_HIDDEN_Y], outputRange: [1, 0], extrapolate: "clamp" });
  const scrimPointerEvents = isOpen ? "auto" : ("none" as const);

  const openSheet = () => {
    setIsOpen(true);
    Animated.spring(sheetY, { toValue: 0, useNativeDriver: true, damping: 18, stiffness: 180, mass: 0.8 }).start();
  };
  const closeSheet = () => {
    Animated.spring(sheetY, { toValue: SHEET_HIDDEN_Y, useNativeDriver: true, damping: 18, stiffness: 180, mass: 0.8 })
      .start(() => setIsOpen(false));
  };

  const startYRef = useRef(SHEET_HIDDEN_Y);
  useEffect(() => {
    const sub = sheetY.addListener(({ value }) => { startYRef.current = value; });
    return () => sheetY.removeListener(sub);
  }, [sheetY]);

  const drag = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dy) > Math.abs(g.dx) && Math.abs(g.dy) > 6,
      onPanResponderGrant: () => {
        // @ts-ignore
        startYRef.current = sheetY.__getValue?.() ?? (sheetY as any)._value ?? SHEET_HIDDEN_Y;
      },
      onPanResponderMove: (_e, g) => sheetY.setValue(clamp(0, SHEET_HIDDEN_Y, startYRef.current + g.dy)),
      onPanResponderRelease: (_e, g) => {
        const current = sheetY.__getValue?.() ?? (sheetY as any)._value ?? SHEET_HIDDEN_Y;
        const shouldClose = g.vy > 0.6 || current > H * 0.25;
        shouldClose ? closeSheet() : openSheet();
      },
      onPanResponderTerminate: () => {
        const current = sheetY.__getValue?.() ?? (sheetY as any)._value ?? SHEET_HIDDEN_Y;
        current > H * 0.25 ? closeSheet() : openSheet();
      },
    })
  ).current;

  const miniBtnPress = useRef(new Animated.Value(0)).current;
  const miniBtnScale = miniBtnPress.interpolate({ inputRange: [0, 1], outputRange: [1, 0.94] });
  const bigBtnPress = useRef(new Animated.Value(0)).current;
  const bigBtnScale = bigBtnPress.interpolate({ inputRange: [0, 1], outputRange: [1, 0.92] });

  const shareCurrent = async () => {
    if (!currentTrack?.previewUrl) return;
    setSharing(true);
    await shareWithFallback(currentTrack.previewUrl, String(currentTrack.trackId ?? Date.now()));
    setSharing(false);
  };

  const progress = durationMillis ? Math.min(positionMillis / durationMillis, 1) : 0;
  const elapsedLabel = formatMillis(positionMillis);
  const durationLabel = formatMillis(durationMillis || currentTrack!.trackTimeMillis || 0);

  return (
    <>
      {/* Mini bar */}
      <View style={{ position: "absolute", bottom: barBottom, left: 0, right: 0, paddingHorizontal: 20 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "rgba(12, 18, 32, 0.92)",
            borderRadius: 20,
            padding: 12,
            gap: 12,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.07)",
            shadowColor: "#000",
            shadowOpacity: 0.2,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 6 },
            elevation: 6,
          }}
        >
          <TouchableOpacity
            style={{ flexDirection: "row", flex: 1, alignItems: "center", gap: 12 }}
            activeOpacity={0.8}
            onPress={openSheet}
            onLongPress={openSheet}
          >
            <Image source={{ uri: currentTrack!.artworkUrl60 }} style={{ width: 56, height: 56, borderRadius: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }} numberOfLines={1}>
                {currentTrack!.trackName}
              </Text>
              <Text style={{ color: "#8ea2c5" }} numberOfLines={1}>
                {currentTrack!.artistName}
              </Text>
              <View style={{ height: 4, backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 999, marginTop: 6, overflow: "hidden" }}>
                <Animated.View
                  style={{
                    height: 4,
                    width: progressAnimMini.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] }),
                    backgroundColor: "#63b3ff",
                  }}
                />
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.9}
            onPressIn={() => Animated.spring(miniBtnPress, { toValue: 1, useNativeDriver: true }).start()}
            onPressOut={() => Animated.spring(miniBtnPress, { toValue: 0, friction: 5, useNativeDriver: true }).start()}
            onPress={togglePlayPause}
          >
            <Animated.View
              style={{
                transform: [{ scale: miniBtnScale }],
                width: 48,
                height: 48,
                borderRadius: 24,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "#ea4c79",
              }}
            >
              <Ionicons name={isPlaying ? "pause" : "play"} size={26} color="#fff" style={{ marginLeft: isPlaying ? 0 : 2 }} />
            </Animated.View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Scrim */}
      <Animated.View pointerEvents={scrimPointerEvents} style={absFill}>
        <Pressable onPress={closeSheet} style={absFill}>
          <Animated.View style={[absFill, { backgroundColor: "rgba(0,0,0,0.55)", opacity: scrimOpacity }]} />
        </Pressable>
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        {...drag.panHandlers}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: -40,
          height: H + 40,
          paddingHorizontal: 24,
          transform: [{ translateY: sheetY }],
        }}
        pointerEvents="box-none"
      >
        <View
          style={{
            backgroundColor: "#181b22",
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            padding: 20,
            gap: 18,
            height: H,
          }}
        >
          <View style={{ alignItems: "center", marginTop: -6 }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.24)" }} />
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={{ color: "#d1d5db", fontWeight: "600", letterSpacing: 0.5 }}>Now Playing</Text>

            {/* Right header icons removed so share can live near Next as requested */}
            <TouchableOpacity
              onPress={closeSheet}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={{
                padding: 6,
                borderRadius: 999,
                backgroundColor: "rgba(255,255,255,0.12)",
              }}
            >
              <Ionicons name="close" size={18} color="#fff" />
            </TouchableOpacity>
          </View>

          <Image
            source={{ uri: currentTrack!.artworkUrl100 ?? currentTrack!.artworkUrl60 }}
            style={{ width: "100%", height: 240, borderRadius: 22, backgroundColor: "#1f1f1f" }}
          />

          <View style={{ alignItems: "center" }}>
            <Text style={{ color: "#fff", fontSize: 22, fontWeight: "800" }}>{currentTrack!.trackName}</Text>
            <Text style={{ color: "#9ca3af", fontSize: 16 }}>{currentTrack!.artistName}</Text>
          </View>

          <View>
            <View style={{ height: 4, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 999, overflow: "hidden" }}>
              <Animated.View
                style={{
                  height: 4,
                  width: progressAnimSheet.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] }),
                  backgroundColor: "#f87171",
                }}
              />
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 6 }}>
              <Text style={{ color: "#eee", fontSize: 12 }}>{elapsedLabel}</Text>
              <Text style={{ color: "#9ca3af", fontSize: 12 }}>{durationLabel}</Text>
            </View>
          </View>

          {/* Controls: left small mode, center transport (prev/big/next), right share */}
          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
            {/* Left: mode */}
            <View style={{ width: 56, alignItems: "flex-start", justifyContent: "center" }}>
              <ModeButtonSmall mode={playbackMode} onPress={cyclePlaybackMode} />
            </View>

            {/* Center: EXACTLY the three transport controls */}
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 24 }}>
                <MiniIcon name="play-skip-back" disabled={!canSkipPrevious} onPress={playPrevious} />
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPressIn={() => Animated.spring(bigBtnPress, { toValue: 1, useNativeDriver: true }).start()}
                  onPressOut={() => Animated.spring(bigBtnPress, { toValue: 0, friction: 5, useNativeDriver: true }).start()}
                  onPress={togglePlayPause}
                >
                  <Animated.View
                    style={{
                      transform: [{ scale: bigBtnScale }],
                      width: 72,
                      height: 72,
                      borderRadius: 36,
                      backgroundColor: "#ea4c79",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Ionicons name={isPlaying ? "pause" : "play"} size={32} color="#fff" />
                  </Animated.View>
                </TouchableOpacity>
                <MiniIcon name="play-skip-forward" disabled={!canSkipNext} onPress={playNext} />
              </View>
            </View>

            {/* Right: share button (to the right of Next) */}
            <View style={{ width: 56, alignItems: "flex-end", justifyContent: "center" }}>
              <TouchableOpacity
                onPress={shareCurrent}
                disabled={sharing || !currentTrack?.previewUrl}
                style={{ padding: 8, opacity: sharing || !currentTrack?.previewUrl ? 0.5 : 1 }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="share-social" size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Animated.View>
    </>
  );
}

function ModeButtonSmall({
  mode,
  onPress,
}: {
  mode: "sequential" | "shuffle" | "repeat-one";
  onPress: () => void;
}) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={{ padding: 8 }}>
      {mode === "sequential" && <Ionicons name="reorder-three" size={20} color="#9aa3b2" />}
      {mode === "shuffle" && <Ionicons name="shuffle" size={20} color="#ea4c79" />}
      {mode === "repeat-one" && (
        <View style={{ width: 20, height: 20 }}>
          <Ionicons name="repeat" size={20} color="#ea4c79" />
          <View
            style={{
              position: "absolute", right: -2, top: -2, width: 12, height: 12,
              borderRadius: 6, backgroundColor: "#ea4c79", justifyContent: "center", alignItems: "center",
            }}
          >
            <Text style={{ color: "#fff", fontSize: 8, fontWeight: "800" }}>1</Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

function MiniIcon({
  name,
  disabled,
  onPress,
}: {
  name: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity disabled={disabled} onPress={onPress} style={{ opacity: disabled ? 0.35 : 1, padding: 12 }}>
      <Ionicons name={name} size={26} color="#fff" />
    </TouchableOpacity>
  );
}

function formatMillis(ms?: number | null) {
  if (!ms || Number.isNaN(ms)) return "0:00";
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

const absFill = {
  position: "absolute" as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
};

function clamp(min: number, max: number, v: number) {
  return Math.max(min, Math.min(max, v));
}
