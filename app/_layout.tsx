import { Stack,ErrorBoundaryProps } from "expo-router";
import { PlayerProvider } from "../context/PlayerContext";
import NowPlayingBar from "../components/NowPlayingBar";
import { ScrollView, Text, Button, View } from "react-native";
import BackgroundProvider from "../context/Background";
import { ThemeProvider, DefaultTheme } from "@react-navigation/native";
// Make nav theme transparent so screens inherit transparency
const TransparentTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: "transparent", // key: no white canvas
    card: "transparent",
  },
};
export default function Layout() {
  return (
    <PlayerProvider>
      <BackgroundProvider>
      <ThemeProvider value={TransparentTheme}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "transparent" }}} 
      />
      <NowPlayingBar />
      </ThemeProvider>
      </BackgroundProvider>
    </PlayerProvider>
  );
}

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  const msg =
    (error as any)?.stack ||
    (error as any)?.message ||
    String(error ?? "Unknown error");
  return (
    <ScrollView style={{ padding: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 8 }}>
        App crashed at startup
      </Text>
      <Text selectable style={{ fontFamily: "monospace" }}>{msg}</Text>
      <View style={{ height: 12 }} />
      <Button title="Retry" onPress={retry} />
    </ScrollView>
  );
}