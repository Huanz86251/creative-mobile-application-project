import React from "react";
import { View, Text, Image, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  track: { id: string; title: string; artist: string; cover: string } | null;
  onPress?: () => void;
};

export default function MiniPlayer({ track, onPress }: Props) {
  const insets = useSafeAreaInsets();
  if (!track) return null;

  return (
    <Pressable
      onPress={onPress}
      style={{ paddingBottom: Math.max(8, insets.bottom) }}
      className="absolute left-3 right-3 bottom-3 h-16 rounded-2xl bg-gray-900/90 border border-white/10 flex-row items-center px-2.5 gap-2.5"
    >
      <Image source={{ uri: track.cover }} className="w-11 h-11 rounded-lg" />
      <View className="flex-1">
        <Text numberOfLines={1} className="text-white font-bold">{track.title}</Text>
        <Text numberOfLines={1} className="text-gray-300 text-xs mt-0.5">{track.artist}</Text>
      </View>
      <View className="w-1.5 h-1.5 rounded-full bg-gray-300 ml-1" />
      <View className="w-1.5 h-1.5 rounded-full bg-gray-300 ml-1" />
      <View className="w-1.5 h-1.5 rounded-full bg-gray-300 ml-1" />
    </Pressable>
  );
}
