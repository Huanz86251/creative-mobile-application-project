
import { Platform, Linking } from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { notifyDownloadResult } from "../lib/notifications"; 
import * as FileSystem from "expo-file-system";


let FSN: any = null;
try { FSN = require("expo-file-system/next"); } catch {}


let FSLegacy: any = null;
try { FSLegacy = require("expo-file-system/legacy"); } catch {}


const FSStatics = {
  getInfoAsync: (FileSystem as any).getInfoAsync,
  makeDirectoryAsync: (FileSystem as any).makeDirectoryAsync,
  deleteAsync: (FileSystem as any).deleteAsync,
  downloadAsync: (FileSystem as any).downloadAsync,
};

let Network: any = null;                                        
try { Network = require("expo-network"); } catch {}
const SAVED_INDEX_KEY = "downloadedTracksIndex"; // { [trackId]: uri }

function sanitizeFilename(name: string): string {
  return name.replace(/[\\/:*?"<>|\s]+/g, "_");
}

function getBaseDir(): string | null {

  const nextDoc = FSN?.Paths?.document?.uri ?? FSN?.Paths?.document ?? null;
  const nextCache = FSN?.Paths?.cache?.uri ?? FSN?.Paths?.cache ?? null;

  const oldDoc = (FileSystem as any)?.documentDirectory ?? null;
  const oldCache = (FileSystem as any)?.cacheDirectory ?? null;

  return (nextDoc || nextCache || oldDoc || oldCache || null) as string | null;
}

async function ensureDirExists(dirUri: string) {
  if (FSN?.Directory) {

    const base = new FSN.Directory(dirUri);
    if (!base.exists) await base.create();
  } else if (FSLegacy?.makeDirectoryAsync) {
    const info = await (FSLegacy as any).getInfoAsync(dirUri);
    if (!info.exists) await (FSLegacy as any).makeDirectoryAsync(dirUri, { intermediates: true });
  } else if (FSStatics.makeDirectoryAsync) {
    const info = await FSStatics.getInfoAsync(dirUri);
    if (!info.exists) await FSStatics.makeDirectoryAsync(dirUri, { intermediates: true });
  }
}

async function remember(trackId: string, uri: string) {
  const raw = await AsyncStorage.getItem(SAVED_INDEX_KEY);
  const idx: Record<string, string> = raw ? JSON.parse(raw) : {};
  idx[trackId] = uri;
  await AsyncStorage.setItem(SAVED_INDEX_KEY, JSON.stringify(idx));
}

async function isOffline(): Promise<boolean> {
  try {
    if (Network?.getNetworkStateAsync) {
      const st = await Network.getNetworkStateAsync();
      if (st && (st.isConnected === false || st.isInternetReachable === false)) return true;
    }
  } catch {}
  if (typeof navigator !== "undefined" && "onLine" in navigator) return (navigator as any).onLine === false;
  return false;
}

type DownloadOpts = {
  displayName?: string;  
  notify?: boolean;     
};

export async function downloadTrack(trackId: string, signedUrl: string, filename: string, opts?: DownloadOpts): Promise<string> {
  const safe = sanitizeFilename(filename);
  const notify = opts?.notify !== false;
  const label = (opts?.displayName || filename).trim() || filename;
  if (notify) await notifyDownloadResult("started", label);
  if (await isOffline()) {
    if (notify) await notifyDownloadResult("failure", `${label} (offline)`);
    throw new Error("No network connection");
  }

  try {
    // —— Web：交给浏览器下载
    if (Platform.OS === "web") {
      try { window.open(signedUrl, "_blank"); } catch {}
      const fake = `browser://${safe}`;
      await remember(trackId, fake);
      if (notify) await notifyDownloadResult("success", `${label} (opened in browser)`);
      return fake;
    }

    // —— 无文件系统（如某些受限运行环境）
    const base = getBaseDir();
    if (!base) {
      try { await Linking.openURL(signedUrl); } catch {}
      const fake = `external://${safe}`;
      await remember(trackId, fake);
      if (notify) await notifyDownloadResult("success", `${label} (opened externally)`);
      return fake;
    }

    const dir = base.replace(/\/+$/, "") + "/tracks/";
    await ensureDirExists(dir);
    const dest = dir + safe;

    // —— 新 API
    if (FSN?.File) {
      const parent = new FSN.Directory(dir);
      if (!parent.exists) await parent.create();

      const file = new FSN.File(parent, safe);
      if (file.exists) {
        await remember(trackId, file.uri);
        if (notify) await notifyDownloadResult("exists", label);
        return file.uri;
      }
      const out = await FSN.File.downloadFileAsync(signedUrl, file);
      if (!out?.exists) throw new Error("Download failed (new API)");
      await remember(trackId, out.uri);
      if (notify) await notifyDownloadResult("success", label);
      return out.uri;
    }

    // —— 旧 API（legacy）
    if (FSLegacy?.downloadAsync) {
      const exists = await (FSLegacy as any).getInfoAsync(dest);
      if (exists.exists) {
        await remember(trackId, dest);
        if (notify) await notifyDownloadResult("exists", label);
        return dest;
      }
      const { uri } = await (FSLegacy as any).downloadAsync(signedUrl, dest);
      const ok = await (FSLegacy as any).getInfoAsync(uri);
      if (!ok.exists) throw new Error("Download failed (legacy)");
      await remember(trackId, uri);
      if (notify) await notifyDownloadResult("success", label);
      return uri;
    }

    // —— 静态兜底
    const exists = await FSStatics.getInfoAsync(dest);
    if (exists.exists) {
      await remember(trackId, dest);
      if (notify) await notifyDownloadResult("exists", label);
      return dest;
    }
    const { uri } = await FSStatics.downloadAsync(signedUrl, dest);
    const ok = await FSStatics.getInfoAsync(uri);
    if (!ok.exists) throw new Error("Download failed (static)");
    await remember(trackId, uri);
    if (notify) await notifyDownloadResult("success", label);
    return uri;

  } catch (e) {
    if (notify) await notifyDownloadResult("failure", label);
    throw e;
  }
}

export async function getDownloadedIndex(): Promise<Record<string, string>> {
  const raw = await AsyncStorage.getItem(SAVED_INDEX_KEY);
  return raw ? (JSON.parse(raw) as Record<string, string>) : {};
}

export async function removeDownloaded(trackId: string): Promise<boolean> {
  const raw = await AsyncStorage.getItem(SAVED_INDEX_KEY);
  const idx: Record<string, string> = raw ? JSON.parse(raw) : {};
  const uri = idx[trackId];
  if (!uri) return false;


  if (uri.startsWith("external://") || uri.startsWith("browser://")) {
    delete idx[trackId];
    await AsyncStorage.setItem(SAVED_INDEX_KEY, JSON.stringify(idx));
    return true;
  }


  try {
    if (FSLegacy?.deleteAsync) {
      await (FSLegacy as any).deleteAsync(uri, { idempotent: true });
    } else if (FSStatics.deleteAsync) {
      await FSStatics.deleteAsync(uri, { idempotent: true });
    }
  } catch { }

  delete idx[trackId];
  await AsyncStorage.setItem(SAVED_INDEX_KEY, JSON.stringify(idx));
  return true;
}

export async function clearAllDownloads(): Promise<number> {
  const raw = await AsyncStorage.getItem(SAVED_INDEX_KEY);
  const idx: Record<string, string> = raw ? JSON.parse(raw) : {};
  let n = 0;

  for (const uri of Object.values(idx)) {
    if (uri.startsWith("external://") || uri.startsWith("browser://")) { n++; continue; }
    try {
      if (FSLegacy?.deleteAsync) {
        await (FSLegacy as any).deleteAsync(uri, { idempotent: true });
        n++;
      } else if (FSStatics.deleteAsync) {
        const info = await FSStatics.getInfoAsync(uri);
        if (info.exists) await FSStatics.deleteAsync(uri, { idempotent: true });
        n++;
      }
    } catch {  }
  }

  await AsyncStorage.setItem(SAVED_INDEX_KEY, JSON.stringify({}));
  return n;
}
