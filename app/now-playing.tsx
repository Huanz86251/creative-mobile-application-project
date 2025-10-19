import { View, Text } from "react-native";

export default function NowPlayingScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <Text className="text-white text-2xl font-bold">Now Playing 🎵</Text>
      <Text className="text-gray-400 mt-2">This will show the current track info.</Text>
    </View>
  );
}
