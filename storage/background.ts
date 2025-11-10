
import { Platform, Dimensions } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  launchImageLibraryAsync,
  requestMediaLibraryPermissionsAsync,
  type ImagePickerAsset,
} from "expo-image-picker";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";

import * as FS from "expo-file-system/legacy";

const KEY = "appBackgroundUri";      
const TARGET_W = 1080;              
const JPEG_QUALITY = 0.95;


function baseDir(): string {
  const dir = FS.documentDirectory ?? FS.cacheDirectory;
  if (!dir) throw new Error("No base directory");
  return dir.endsWith("/") ? dir : dir + "/";
}


async function ensureDir(dirUri: string) {
  try {
    const info = await FS.getInfoAsync(dirUri);
    if (!info.exists) {
      await FS.makeDirectoryAsync(dirUri, { intermediates: true });
    }
  } catch {

    try { await FS.makeDirectoryAsync(dirUri, { intermediates: true }); } catch {}
  }
}


export async function getBackgroundLocalUri(): Promise<string | undefined> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ?? undefined;
}


export async function clearBackground(): Promise<void> {
  const prev = await getBackgroundLocalUri();
  try {
    if (Platform.OS === "web") {
      if (prev?.startsWith("blob:")) {
        try { URL.revokeObjectURL(prev); } catch {}
      }
    } else if (prev?.startsWith("file://")) {
      await FS.deleteAsync(prev, { idempotent: true });
    }
  } catch {}
  await AsyncStorage.removeItem(KEY);
}


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


  const resized = await manipulateAsync(
    src.uri,
    [{ resize: { width: resizedW, height: resizedH } }],
    { compress: JPEG_QUALITY, format: SaveFormat.JPEG }
  );


  const originX = Math.max(0, Math.floor((resizedW - targetW) / 2));
  const originY = Math.max(0, Math.floor((resizedH - targetH) / 2));
  const cropped = await manipulateAsync(
    resized.uri,
    [{ crop: { originX, originY, width: targetW, height: targetH } }],
    { compress: JPEG_QUALITY, format: SaveFormat.JPEG }
  );

  const prev = await getBackgroundLocalUri();


  if (Platform.OS === "web") {
    try { if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev); } catch {}
    const blob = await fetch(cropped.uri).then(r => r.blob());
    const webUri = URL.createObjectURL(blob);
    await AsyncStorage.setItem(KEY, webUri);
    return webUri;
  }

  const dir = baseDir() + "bg/";
  await ensureDir(dir);

  const name = `background_${Date.now()}.jpg`;
  const dest = dir + name; 

  await FS.copyAsync({ from: cropped.uri, to: dest });
  await AsyncStorage.setItem(KEY, dest);


  try {
    if (prev && prev !== dest && prev.startsWith("file://")) {
      await FS.deleteAsync(prev, { idempotent: true });
    }
  } catch {}

  return dest;
}
