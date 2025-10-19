import React from "react";
import { View, Text, Image, Pressable } from "react-native";

type Props = {
  playlist: { id: string; title: string; cover: string; tracksCount: number };
  onPress?: () => void;
  size?: "small" | "large";
};

export default function PlaylistCard({ playlist, onPress, size = "small" }: Props) {
  const isLarge = size === "large";
  return (
    <Pressable
      onPress={onPress}
      className={`rounded-2xl overflow-hidden bg-white/5 ${isLarge ? "w-56" : "w-40"}`}
    >
      <Image source={{ uri: playlist.cover }} className={`${isLarge ? "h-36" : "h-32"} w-full`} />
      <View className="p-2.5">
        <Text numberOfLines={1} className="text-white font-bold">{playlist.title}</Text>
        <Text className="text-gray-300 text-xs font-semibold mt-0.5">{playlist.tracksCount} tracks</Text>
      </View>
    </Pressable>
  );
}
