// lib/notifications.ts
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { router } from "expo-router";
import { supabase } from "./supabase";

type RecData = { trackId?: string; title?: string; type?: string; action?: string };
const LIBRARY_ROUTE = "/(tabs)/library";


export async function ensureNotifSetup() {
  const cur = await Notifications.getPermissionsAsync();
  if (!cur.granted) {
    const req = await Notifications.requestPermissionsAsync();
    if (!req.granted) throw new Error("Notification permission denied");
  }
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("recommendations", {
      name: "Recommendations",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
}


export async function pickOneTrack(): Promise<{ id: string; title: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    try {
      const { data, error } = await supabase.rpc("recommend_from_last_likes", {
        p_user: user.id, p_limit: 1
      });
      if (!error && data?.length) return { id: data[0].id, title: data[0].title };
    } catch {}
  }
  const { data: rows } = await supabase
    .from("tracks").select("id,title").eq("is_public", true).limit(50);
  if (rows?.length) {
    const t = rows[Math.floor(Math.random() * rows.length)];
    return { id: t.id, title: t.title };
  }
  throw new Error("No tracks available");
}


export async function notifyRecommendationNow() {
  await ensureNotifSetup();
  const t = await pickOneTrack();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Today’s pick 🎧, just for you ~",
      body: t.title,
      data: { trackId: t.id, title: t.title, type: "rec-now" } as RecData,
    },
    trigger: null, 
  });
}






export async function scheduleDailyRecommendation(hour = 9, minute = 0) {
  await ensureNotifSetup();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Daily music pick 🎵",
      body: "Tap to open today’s recommendation",
    },
    trigger: { hour, minute, repeats: true, channelId: "recommendations" },
  });
}

export async function subscribeDailyNextMinute() {
    const now = new Date();
    const next = new Date(now.getTime() + 60_000);
    return scheduleDailyRecommendation(next.getHours(), next.getMinutes());
  }


export function attachGlobalNotificationHandlers() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({

      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });

  const openInLibrary = (trackId: string) => {
    router.push({ pathname: LIBRARY_ROUTE, params: { openId: trackId, ts: String(Date.now()) } });
  };

  const handleResponse = async (resp: Notifications.NotificationResponse) => {
    try {
      const data: any = resp?.notification?.request?.content?.data || {};
      let targetId: string | undefined = data.trackId;

      if (!targetId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase.rpc("recommend_from_last_likes", { p_user: user.id, p_limit: 1 });
          if (data?.length) targetId = data[0].id;
        }
      }
      if (!targetId) {
        const { data: rows } = await supabase.from("tracks").select("id").eq("is_public", true).limit(1);
        targetId = rows?.[0]?.id;
      }
      if (targetId) openInLibrary(targetId);
    } catch {}
  };

  Notifications.addNotificationResponseReceivedListener(handleResponse);


  (async () => {
    const last = await Notifications.getLastNotificationResponseAsync();
    if (last) handleResponse(last);
  })();
}

export async function scheduleDailyAt(date: Date) {
    return scheduleDailyRecommendation(date.getHours(), date.getMinutes());
  }