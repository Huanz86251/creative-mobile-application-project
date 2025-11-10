import { Tabs } from "expo-router";

import { Ionicons } from "@expo/vector-icons";
export default function TabsLayout() {
  return (
<Tabs

  screenOptions={({ route }) => ({
    headerShown: false,
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
