
import { Directory, File, Paths } from 'expo-file-system/next';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SAVED_INDEX_KEY = 'downloadedTracksIndex'; // { [trackId]: localFileUri }

function sanitizeFilename(name: string): string {// incase file name error
  return name.replace(/[\\/:*?"<>|\s]+/g, '_');
}

function ensureTracksDir(): Directory {

  const base = Paths.document ?? Paths.cache;
  const dir = new Directory(base, 'tracks');
  if (!dir.exists) dir.create();
  return dir;
}

export async function downloadTrack(
  trackId: string,
  signedUrl: string,
  filename: string
): Promise<string> {
  const tracksDir = ensureTracksDir();
  const target = new File(tracksDir, sanitizeFilename(filename));
  if (target.exists) {
    await remember(trackId, target.uri);
    return target.uri;
  }

  const outFile = await File.downloadFileAsync(signedUrl, target);
  if (!outFile.exists) throw new Error('Download failed (file not found after download)');

  await remember(trackId, outFile.uri);
  return outFile.uri;
}

async function remember(trackId: string, uri: string) {
  const raw = await AsyncStorage.getItem(SAVED_INDEX_KEY);
  const idx: Record<string, string> = raw ? JSON.parse(raw) : {};
  idx[trackId] = uri;
  await AsyncStorage.setItem(SAVED_INDEX_KEY, JSON.stringify(idx));
}

export async function getDownloadedIndex(): Promise<Record<string, string>> {
  const raw = await AsyncStorage.getItem(SAVED_INDEX_KEY);
  return raw ? JSON.parse(raw) : {};
}

export async function getLocalUri(trackId: string): Promise<string | undefined> {
  const idx = await getDownloadedIndex();
  return idx[trackId];
}

export async function removeLocalTrack(trackId: string): Promise<void> {
  const idx = await getDownloadedIndex();
  const uri = idx[trackId];
  if (!uri) return;
  const f = new File(uri);
  if (f.exists) f.delete();
  delete idx[trackId];
  await AsyncStorage.setItem(SAVED_INDEX_KEY, JSON.stringify(idx));
}
