import { View, Text } from "react-native";

export default function FavoritesScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <Text className="text-white text-xl font-bold">Favorites ❤️</Text>
      <Text className="text-gray-400 mt-2">Your saved tracks will appear here.</Text>
    </View>
  );
}
