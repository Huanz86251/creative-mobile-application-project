import { TouchableOpacity, Text } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function FloatingBack({ label = "Back" }: { label?: string }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handlePress = () => {

    if (router.canGoBack?.()) router.back();
    else router.replace("/(tabs)/library");
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      accessibilityRole="button"
      testID="floating-back"
      activeOpacity={0.8}
      hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
      style={{
        position: "absolute",
        top: insets.top + 12,
        right: 16,
        backgroundColor: "rgba(0,0,0,0.75)",
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 22,
        zIndex: 1000,
        elevation: 6,
        shadowColor: "#000",
        shadowOpacity: 0.25,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
      }}
    >
      <Text style={{ color: "#fff", fontWeight: "700" }}>{label}</Text>
    </TouchableOpacity>
  );
}
