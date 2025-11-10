import { useState } from "react";
import { View, Text, Image, TouchableOpacity, Modal, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { usePlayer } from "../context/PlayerContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function NowPlayingBar() {
  const {
    currentTrack,
    isPlaying,
    togglePlayPause,
    positionMillis,
    durationMillis,
    playNext,
    playPrevious,
    canSkipNext,
    canSkipPrevious,
  } = usePlayer();
  const [showDetails, setShowDetails] = useState(false);
  const handleCloseDetails = () => setShowDetails(false);
  const insets = useSafeAreaInsets();
  const TAB_BAR_BASE = 60;
  const barBottom = insets.bottom + TAB_BAR_BASE + 8;
  if (!currentTrack) return null;

  const progress = durationMillis ? Math.min(positionMillis / durationMillis, 1) : 0;
  const elapsedLabel = formatMillis(positionMillis);
  const durationLabel = formatMillis(
    durationMillis || currentTrack.trackTimeMillis || 0
  );

  return (
    <View
      style={{
        position: "absolute",
        bottom: barBottom,
        left: 0,
        right: 0,
        paddingHorizontal: 20,
      }}
    >
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
          onPress={() => setShowDetails(true)}
        >
          <Image
            source={{ uri: currentTrack.artworkUrl60 }}
            style={{ width: 56, height: 56, borderRadius: 12 }}
          />
          <View style={{ flex: 1 }}>
            <Text
              style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}
              numberOfLines={1}
            >
              {currentTrack.trackName}
            </Text>
            <Text style={{ color: "#8ea2c5" }} numberOfLines={1}>
              {currentTrack.artistName}
            </Text>
            <View
              style={{
                height: 4,
                backgroundColor: "rgba(255,255,255,0.12)",
                borderRadius: 999,
                marginTop: 6,
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  flex: 1,
                  width: `${progress * 100}%`,
                  backgroundColor: "#63b3ff",
                }}
              />
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={togglePlayPause}
          activeOpacity={0.85}
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#ea4c79",
            shadowColor: "#ea4c79",
            shadowOpacity: 0.3,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 4 },
            elevation: 4,
          }}
        >
          <Ionicons
            name={isPlaying ? "pause" : "play"}
            size={26}
            color="#fff"
            style={{ marginLeft: isPlaying ? 0 : 2 }}
          />
        </TouchableOpacity>
      </View>

      <Modal
        animationType="slide"
        transparent
        visible={showDetails}
        onRequestClose={handleCloseDetails}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.55)",
            justifyContent: "center",
            paddingHorizontal: 24,
          }}
          onPress={handleCloseDetails}
        >
          <Pressable
            style={{
              backgroundColor: "#181b22",
              borderRadius: 28,
              padding: 20,
              gap: 18,
            }}
            onPress={(e) => e.stopPropagation()}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
              }}
            >
              <View style={{ width: 32 }} />
              <Text
                style={{
                  color: "#d1d5db",
                  textAlign: "center",
                  fontWeight: "600",
                  letterSpacing: 0.5,
                  flex: 1,
                }}
              >
                Now Playing
              </Text>
              <TouchableOpacity
                onPress={handleCloseDetails}
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
              source={{ uri: currentTrack.artworkUrl100 ?? currentTrack.artworkUrl60 }}
              style={{
                width: "100%",
                height: 240,
                borderRadius: 22,
                backgroundColor: "#1f1f1f",
              }}
            />

            <View style={{ alignItems: "center" }}>
              <Text style={{ color: "#fff", fontSize: 22, fontWeight: "800" }}>
                {currentTrack.trackName}
              </Text>
              <Text style={{ color: "#9ca3af", fontSize: 16 }}>
                {currentTrack.artistName}
              </Text>
            </View>

            <View>
              <View
                style={{
                  height: 4,
                  backgroundColor: "rgba(255,255,255,0.2)",
                  borderRadius: 999,
                  overflow: "hidden",
                }}
              >
                <View
                  style={{
                    flex: 1,
                    width: `${progress * 100}%`,
                    backgroundColor: "#f87171",
                  }}
                />
              </View>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginTop: 6,
                }}
              >
                <Text style={{ color: "#eee", fontSize: 12 }}>{elapsedLabel}</Text>
                <Text style={{ color: "#9ca3af", fontSize: 12 }}>{durationLabel}</Text>
              </View>
            </View>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: 4,
              }}
            >
              <MiniIcon
                name="play-skip-back"
                disabled={!canSkipPrevious}
                onPress={playPrevious}
              />
              <TouchableOpacity
                onPress={togglePlayPause}
                activeOpacity={0.9}
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 36,
                  backgroundColor: "#ea4c79",
                  justifyContent: "center",
                  alignItems: "center",
                  shadowColor: "#ea4c79",
                  shadowOpacity: 0.4,
                  shadowRadius: 12,
                  shadowOffset: { width: 0, height: 4 },
                  elevation: 6,
                }}
              >
                <Ionicons
                  name={isPlaying ? "pause" : "play"}
                  size={32}
                  color="#fff"
                />
              </TouchableOpacity>
              <MiniIcon
                name="play-skip-forward"
                disabled={!canSkipNext}
                onPress={playNext}
              />
            </View>

            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                gap: 16,
              }}
            >
              <MiniIcon name="shuffle" disabled small />
              <MiniIcon name="repeat" disabled small />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const MiniIcon = ({
  name,
  disabled,
  small,
  onPress,
}: {
  name: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  small?: boolean;
  onPress?: () => void;
}) => (
  <TouchableOpacity
    disabled={disabled}
    onPress={onPress}
    style={{
      opacity: disabled ? 0.35 : 1,
      padding: small ? 8 : 12,
    }}
  >
    <Ionicons
      name={name}
      size={small ? 20 : 26}
      color="#fff"
    />
  </TouchableOpacity>
);

const formatMillis = (ms?: number | null) => {
  if (!ms || Number.isNaN(ms)) return "0:00";
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${seconds}`;
};
