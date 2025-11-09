import { Platform, Dimensions } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  launchImageLibraryAsync,
  requestMediaLibraryPermissionsAsync,
  type ImagePickerAsset,
} from "expo-image-picker";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import * as FileSystem from "expo-file-system";
let FSN: any = null; try { FSN = require("expo-file-system/next"); } catch {}
let FSL: any = null; try { FSL = require("expo-file-system/legacy"); } catch {}

const KEY = "appBackgroundUri";
const TARGET_W = 1080;
const JPEG_QUALITY = 0.95;

/** Get base document/cache directory path (handles Next/Legacy APIs) */
function baseDir(): string | null {
  const nextDoc = FSN?.Paths?.document?.uri ?? FSN?.Paths?.document ?? null;
  const nextCache = FSN?.Paths?.cache?.uri ?? FSN?.Paths?.cache ?? null;
  const oldDoc = (FileSystem as any)?.documentDirectory ?? null;
  const oldCache = (FileSystem as any)?.cacheDirectory ?? null;
  return (nextDoc || nextCache || oldDoc || oldCache || null) as string | null;
}

/** Ensure a directory exists (create it if not) */
async function ensureDir(uri: string) {
  if (FSN?.Directory) {
    const d = new FSN.Directory(uri);
    if (!d.exists) await d.create();
    return;
  }
  if (FSL?.makeDirectoryAsync) {
    const info = await FSL.getInfoAsync(uri);
    if (!info.exists) await FSL.makeDirectoryAsync(uri, { intermediates: true });
    return;
  }
  const info = await (FileSystem as any).getInfoAsync(uri);
  if (!info.exists) await (FileSystem as any).makeDirectoryAsync(uri, { intermediates: true });
}

/** Read the currently saved background image URI (if any) */
export async function getBackgroundLocalUri(): Promise<string | undefined> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ?? undefined;
}

/** Delete stored background image and clear AsyncStorage key */
export async function clearBackground(): Promise<void> {
  const uri = await getBackgroundLocalUri();
  if (uri && !uri.startsWith("external://") && !uri.startsWith("browser://")) {
    try {
      if (FSL?.deleteAsync) await FSL.deleteAsync(uri, { idempotent: true });
      else await (FileSystem as any).deleteAsync(uri, { idempotent: true });
    } catch {}
  }
  await AsyncStorage.removeItem(KEY);
}

/**
 * Pick an image from the gallery, resize/crop it to fit screen ratio,
 * save as "background.jpg", and persist its local URI.
 */
export async function pickAndSetBackgroundCover(): Promise<string> {
  const perm = await requestMediaLibraryPermissionsAsync();
  if (!perm.granted) throw new Error("Permission denied");

  const pick = await launchImageLibraryAsync({
    mediaTypes: "images",
    quality: 1,
    allowsEditing: false,
  });
  if (pick.canceled || !pick.assets?.length) throw new Error("Canceled");

  const src = pick.assets[0] as ImagePickerAsset;
  if (!src.width || !src.height || !src.uri) throw new Error("Invalid image");

  const win = Dimensions.get("window");
  const targetW = TARGET_W;
  const targetH = Math.round((TARGET_W * win.height) / Math.max(1, win.width));

  const scale = Math.max(targetW / src.width, targetH / src.height);
  const resizedW = Math.round(src.width * scale);
  const resizedH = Math.round(src.height * scale);

  // Resize image proportionally
  const resized = await manipulateAsync(
    src.uri,
    [{ resize: { width: resizedW, height: resizedH } }],
    { compress: JPEG_QUALITY, format: SaveFormat.JPEG }
  );

  const originX = Math.max(0, Math.floor((resizedW - targetW) / 2));
  const originY = Math.max(0, Math.floor((resizedH - targetH) / 2));

  // Crop center region to fit screen ratio
  const cropped = await manipulateAsync(
    resized.uri,
    [{ crop: { originX, originY, width: targetW, height: targetH } }],
    { compress: JPEG_QUALITY, format: SaveFormat.JPEG }
  );

  // Save to AsyncStorage or file depending on platform
  if (Platform.OS === "web") {
    const blob = await fetch(cropped.uri).then((r) => r.blob());
    const webUri = URL.createObjectURL(blob);
    await AsyncStorage.setItem(KEY, webUri);
    return webUri;
  }

  const base = baseDir();
  if (!base) {
    await AsyncStorage.setItem(KEY, "external://background.jpg");
    return "external://background.jpg";
  }

  const dir = base.replace(/\/+$/, "") + "/bg/";
  await ensureDir(dir);
  const dest = dir + "background.jpg";

  if (FSL?.copyAsync) await FSL.copyAsync({ from: cropped.uri, to: dest });
  else await (FileSystem as any).copyAsync({ from: cropped.uri, to: dest });

  await AsyncStorage.setItem(KEY, dest);
  return dest;
}
