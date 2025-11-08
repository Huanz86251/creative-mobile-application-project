import { Stack } from "expo-router";
import { PlayerProvider } from "../context/PlayerContext";
import NowPlayingBar from "../components/NowPlayingBar";

export default function Layout() {
  return (
    <PlayerProvider>
      <Stack screenOptions={{ headerShown: false }} />
      <NowPlayingBar />
    </PlayerProvider>
  );
}
