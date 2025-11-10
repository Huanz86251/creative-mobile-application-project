import { Tabs } from "expo-router";

import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const tabBarStyle = {
    height: 60 + insets.bottom,           
    paddingBottom: Math.max(8, insets.bottom),
  };
  return (
<Tabs

  screenOptions={({ route }) => ({
    headerShown: false,
    tabBarStyle,    
    tabBarLabelStyle: { fontSize: 12 },
    tabBarActiveTintColor: "#4da3ff",
    tabBarInactiveTintColor: "#888",
    tabBarIcon: ({ color, size }) => {
      const name =
        route.name === "index"     ? "search" :
        route.name === "library"   ? "musical-notes" :
        route.name === "downloads" ? "cloud-download" :
        route.name === "favorites" ? "heart" :
        /* account */                 "person-circle";
      return <Ionicons name={name as any} size={size ?? 22} color={color} />;
    },
  })}
>      <Tabs.Screen
        name="library"
        options={{ title: "Library" }}
      />
      <Tabs.Screen
        name="index"
        options={{ title: "Discover" }} 
      />

      <Tabs.Screen
        name="downloads"
        options={{ title: "Downloads" }}
      />
      <Tabs.Screen
        name="favorites"
        options={{ title: "Favorites" }}
      />
      <Tabs.Screen
        name="account"
        options={{ title: "Account" }}
      />
    </Tabs>
  );
}
