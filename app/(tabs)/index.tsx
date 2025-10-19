// app/(tabs)/index.tsx
import { Image } from 'expo-image';
import { Link, router } from 'expo-router';
import { Platform, Pressable, StyleSheet } from 'react-native';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

function CTA({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.btn, { opacity: pressed ? 0.7 : 1 }]}>
      <ThemedText type="defaultSemiBold" style={styles.btnText}>{title}</ThemedText>
    </Pressable>
  );
}

export default function HomeScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image source={require('@/assets/images/partial-react-logo.png')} style={styles.reactLogo} />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">MiniTune</ThemedText>
      </ThemedView>

      {/* Intro */}
      <ThemedView style={styles.block}>
        <ThemedText>
          A lightweight music app: browse playlists, play previews, and manage favorites (offline support coming soon).
          Start with <ThemedText type="defaultSemiBold">Browse</ThemedText> or <ThemedText type="defaultSemiBold">Now Playing</ThemedText> below.
        </ThemedText>
      </ThemedView>

      {/* Primary actions */}
      <ThemedView style={[styles.block, styles.row]}>
        <Link href="/(tabs)/explore" asChild>
          <CTA title="Browse Playlists" onPress={() => {}} />
        </Link>
        <CTA title="Now Playing" onPress={() => router.push('/details')} />
      </ThemedView>

      {/* Help / tips (keeps some template flavor, updated copy) */}
      <ThemedView style={styles.block}>
        <ThemedText type="subtitle">Developer Tips</ThemedText>
        <ThemedText>
          Edit <ThemedText type="defaultSemiBold">app/(tabs)/index.tsx</ThemedText> to update this home screen.
          While the app is running, press{' '}
          <ThemedText type="defaultSemiBold">
            {Platform.select({ ios: 'Cmd + D', android: 'Cmd + M', web: 'F12' })}
          </ThemedText>{' '}
          to open developer tools.
        </ThemedText>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  block: { gap: 8, marginBottom: 12 },
  row: { flexDirection: 'row' },
  btn: {
    flex: 1, backgroundColor: '#4F46E5', paddingVertical: 12, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', marginRight: 12, shadowOpacity: 0.15,
    shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2
  },
  btnText: { color: 'white' },
  reactLogo: { height: 178, width: 290, bottom: 0, left: 0, position: 'absolute' },
});
