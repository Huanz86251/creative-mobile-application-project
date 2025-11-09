
import { TouchableOpacity, Text } from "react-native";
import { useRouter } from "expo-router";

export default function FloatingBack({ label = "Back" }: { label?: string }) {
  const router = useRouter();
  return (
    <TouchableOpacity
      onPress={() => router.back()}
      accessibilityRole="button"
      testID="floating-back"
      style={{
        position: "absolute",
        right: 16,
        bottom: 16,
        backgroundColor: "rgba(0,0,0,0.75)",
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 22,
      }}
    >
      <Text style={{ color: "#fff", fontWeight: "700" }}>{label}</Text>
    </TouchableOpacity>
  );
}
