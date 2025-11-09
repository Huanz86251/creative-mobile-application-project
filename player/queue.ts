import TrackPlayer, { Capability } from 'react-native-track-player';

export async function setupPlayerOnce() {
  await TrackPlayer.setupPlayer();
  await TrackPlayer.updateOptions({
    capabilities: [Capability.Play, Capability.Pause, Capability.SkipToNext, Capability.SkipToPrevious, Capability.SeekTo],
  });
}

export async function loadLocalQueue(items: Array<{id:string; uri:string; title:string; artist?:string; artwork?:string}>) {
  await TrackPlayer.reset();
  await TrackPlayer.add(items.map(t => ({
    id: t.id,
    url: t.uri,
    title: t.title,
    artist: t.artist,
    artwork: t.artwork,
  })));
}
