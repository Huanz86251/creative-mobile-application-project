# MiniTune — Final Report

## Team Information
| Name | Student # | Email |
| --- | --- | --- |
| Xiangyu Liu | 1006743179 | swift.liu@mail.utoronto.ca |
| Zihao Gong | 1005036916 | zihao.gong@mail.utoronto.ca |
| Zixuan Huang |1006288376 | chrim.huang@mail.utoronto.ca |

## Motivation
- Provide a lightweight, ad-free music experience that highlights core native capabilities: streaming, background playback, offline caching, and notifications.
- Practice the course stack end-to-end (Expo Router + TypeScript + Supabase) while avoiding licensing risk by relying on previews/royalty-free tracks.
- Target users: students and enthusiasts who want quick discovery, simple queues, and offline access without heavy commercial apps.

## Objectives
- Ship a polished Expo/React Native app with smooth playback, a mini “now playing” bar, and background-safe controls.
- Implement two advanced capabilities: authenticated profiles (Supabase email/password with verification) and offline downloads.
- Persist key state (queue, favorites, downloads) and provide notifications for recommendations and download status.
- Deliver a runnable build (APK) plus clear setup and deployment instructions.

## Technical Stack
- **Navigation**: Expo Router (file-based routing, tabs + nested stacks) with TypeScript-typed params; main tabs are Library, Discover, Downloads, Favorites, and Account; deep links handled through Expo scheme `musicapp`.
- **State management**: React Context for Player (`context/PlayerContext`) and Background theme, with local screen state. Favorite/like status and download state are shared between the track detail card and the Favorites/Downloads tabs via Supabase RPCs + AsyncStorage so toggles stay consistent across screens.
- **Language/Runtime**: React Native + TypeScript on Expo SDK 54; platform targets Android, and iOS.
- **Audio & playback**: `expo-av` for streaming with background-safe playback and status callbacks; custom queue logic with sequential/shuffle/repeat-one modes, play/pause, and skip previous/next; mini now-playing bar + full player controls; fallback handling when preview URLs are missing.
- **Backend**: Supabase (managed Postgres, Auth, Storage, RPC). Auth via email/password; storage bucket holds audio files; signed URLs control access.
- **APIs & data**: iTunes Search API for discovery (artist/title search with curated defaults); Supabase RPCs (`search_tracks`, `toggle_favorite`, `get_likes_for_tracks`, `list_my_favorites`, `recommend_from_last_likes`) for catalog, likes, and recommendations.
- **Persistence & offline**: AsyncStorage stores sessions and download index; `expo-file-system` saves cached tracks with fallbacks; signed download URLs are refreshed when needed.
- **Device integrations**: `expo-notifications` for recommendations and download status channels; `expo-network` for connectivity checks; `expo-linking`/`Linking` for browser fallbacks.
- **Build/Deploy**: EAS Build configured in `eas.json` and `app.config.ts`; distributable Android APK included (`application-e8b22559-9e53-4d55-9fa6-e73bec75f37b.apk`); `.env` injects Supabase keys.

## Features
- **Discovery & Search**: Artist/track search via iTunes API with curated default picks.
- **Playback & Queue**: Play/pause/seek, previous/next, shuffle/sequential/repeat-one, mini now-playing bar, and background-safe audio.
- **Track Details**: Supabase-backed metadata with genres/tags/themes; view artwork, duration, and storage path.
- **Favorites**: Toggle likes (Supabase RPC), live like counts, and favorites list.
- **Offline Downloads**: Signed URL downloads to device storage, download index in AsyncStorage, delete/clear actions, and offline playback from locally saved files.
- **Authentication**: Email/password sign-up, verification, login, logout, password reset (code), and session persistence.
- **Notifications**: Daily recommendation scheduling plus download status notifications with deep links to Library/Downloads.
- **Extras**: Draggable mascot, decorative gradients/cards, and guarded connectivity checks for downloads.

## User Guide
1) **Install**  
   - Option A: Run locally with Expo Go (see Development Guide).  
   - Option B: Side-load the provided APK `application-e8b22559-9e53-4d55-9fa6-e73bec75f37b.apk` onto Android.
2) **Sign up / Log in**  
   - Open the app → Account/Login. Create an account, verify email if prompted, or sign in. Use “Forgot password” to request a reset code and set a new password.
3) **Discover music**  
   - The Discover tab shows a curated artist by default. Search by artist or song, tap a result to start playback.
4) **Player controls**  
   - Tap any track to play. Use the mini bar or Now Playing view to pause, seek, skip, and cycle playback modes (sequential → shuffle → repeat-one). Playback continues in background.
5) **Favorites**  
   - Open any track detail → toggle ★ to like/unlike. Favorites tab lists your liked tracks and keeps Supabase like counts in sync.
6) **Downloads & Offline**  
   - From track detail, tap Download to save the file (signed Supabase URL). Downloads tab shows cached files, supports delete/clear, and plays offline when network is unavailable.
7) **Library**  
   - Browse Supabase-hosted catalog (genre/tags/themes). Open a track to view metadata, like, or download.
8) **Notifications**  
   - Accept notification permission. Daily recommendations can be scheduled; download status notifications deep link you into Downloads.
9) **Account management**  
   - In Login view: sign out, resend verification, or reset password. Session persists between launches.


## Development Guide
1) **Prerequisites**  
   - Node 18+, npm, Git, Expo CLI (`npm i -g expo`), Android Studio or iOS simulators for native testing. Real device recommended for notifications/file-system tests.
2) **Environment variables**  
   - Create `.env` in the project root:  
     ```
     EXPO_PUBLIC_SUPABASE_URL=<supabase-url>
     EXPO_PUBLIC_SUPABASE_ANON_KEY=<supabase-anon-key>
     ```  
   - Injected via `app.config.ts` and used by `lib/supabase.ts`.
3) **Install & run**  
   - `npm install`  
   - `npm start` (press `a` for Android emulator, `i` for iOS simulator, or scan QR with Expo Go).  
4) **Backend setup (Supabase)**  
   - Tables: `tracks` (id, title, artist, duration_sec, object_path, artwork_url, instrumental, is_public, genre, language, tags, themes), `user_favorites` (track_id FK), and Storage bucket containing track assets matching `object_path`.  
   - RPCs used: `search_tracks`, `toggle_favorite`, `get_likes_for_tracks`, `list_my_favorites`, `recommend_from_last_likes`. Policies should allow authenticated users to read public tracks and manage their own favorites.  
   - Storage: enable signed URL access for downloads; the app requests temporary signed URLs per object.
5) **Offline/download testing**  
   - Use a physical device. Trigger a download from Track Detail, then switch to airplane mode and play from Downloads.
6) **Notifications testing**  
   - On device, tap the in-app button to trigger recommendation notification; download a track to see download start/success notifications; allow permission dialogs.
7) **Quality checks**  
   - `npm test` runs Jest/RTL tests (limited coverage). Keep Expo/TypeScript warnings clean.

## Deployment Information
- **Android build**: Prebuilt APK at `application-e8b22559-9e53-4d55-9fa6-e73bec75f37b.apk`. Install via `adb install <apk>` or device file manager.  
- **EAS Build**: `eas build --platform android` (and `--platform ios` if provisioned). Config in `eas.json` and `app.config.ts`.  
- Distribution is mobile-first; no separate web/K8s/Swarm deployment.

## Individual Contributions (align with Git history)
- **Xiangyu Liu**: UI/UX across the app (all pages), search/discovery screen, track detail view (likes/downloads), favorites tab, and event wiring.
- **Zihao Gong**: Playback experience (Now Playing/mini bar, queue logic in `context/PlayerContext`), navigation polish, visual styling components.  
- **Zixuan Huang**: Supabase integration (auth client, RPC wiring), offline download pipeline (`storage/downloader.ts`), notification flows, deployment packaging (APK/EAS). 

## Lessons Learned & Concluding Remarks
- **What worked**: Expo Router kept navigation simple; Supabase combined auth, DB, and storage with minimal backend code; `expo-av` handled background playback reliably once lifecycle edges were managed.  
- **Challenges**: File-system API differences across platforms required fallbacks; notification testing demanded real devices; handling signed URLs and offline resilience needed careful caching.  
- **Future work**: Finish in-app playback for Supabase-hosted tracks directly from signed URLs, richer playlist management, and broader automated tests (E2E with Detox).  
- **Closing**: Delivered a functional, offline-capable music app with authenticated profiles and a deployable build, meeting the course requirements while showcasing practical mobile patterns.
