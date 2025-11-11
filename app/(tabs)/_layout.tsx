
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

type TabName = "index" | "library" | "downloads" | "favorites" | "account";

const ICONS: Record<TabName, keyof typeof Ionicons.glyphMap> = {
  index: "search",
  library: "musical-notes",
  downloads: "cloud-download",       
  favorites: "heart",
  account: "person-circle",
};

export default function TabsLayout() {
  return (
    <Tabs

      initialRouteName="library"      
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarLabelStyle: { fontSize: 12 },
        tabBarActiveTintColor: "#4da3ff",
        tabBarInactiveTintColor: "#888",
        tabBarHideOnKeyboard: true,
        tabBarIcon: ({ color, size }) => {
          const name = ICONS[(route.name as TabName)] ?? "help-circle";
          return <Ionicons name={name} size={size ?? 22} color={color} />;
        },
        tabBarStyle: { backgroundColor: "#0c1d37" }, 
      })}
    >

      <Tabs.Screen name="library"   options={{ title: "Library" }} />
      <Tabs.Screen name="index"     options={{ title: "Discover" }} />
      <Tabs.Screen name="downloads" options={{ title: "Downloads" }} />
      <Tabs.Screen name="favorites" options={{ title: "Favorites" }} />
      <Tabs.Screen name="account"   options={{ title: "Account" }} />
    </Tabs>
  );
}
