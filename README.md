# MiniTune — A Lightweight Music Streaming App

## Team Members
| Name           | Email                        |
|----------------|------------------------------|
| Xiangyu Liu    | swift.liu@mail.utoronto.ca   |
| Zigong Hao     | zihao.gong@mail.utoronto.ca  |
| Zixuan Huang   | chrim.huang@mail.utoronto.ca |

## Motivation
Music apps are a great canvas to showcase real mobile capabilities: continuous audio playback, background controls, offline caching, push notifications, and clean navigation. MiniTune focuses on the essential experience—browse playlists, play 30-second previews (or royalty-free full tracks), favorite songs, and listen offline—while avoiding licensing issues.

## Objectives
- Build a polished RN app with smooth audio playback, background controls, and clean navigation.
- Demonstrate state management with Redux Toolkit, persistence (AsyncStorage), REST integration, device APIs, and EAS deployment.
- Implement **≥ 2 advanced features**: target **Authentication** and **Offline Support**.
- Deliver a GitHub repo with README, a short demo video, and an in-class presentation.

## Features
- **Browse & Search** playlists/tracks (API-backed metadata).
- **Now Playing** + **Mini Player** (play/pause/seek, basic queue, repeat/shuffle minimal).
- **Favorites & Playlists**: save tracks; create simple custom lists.
- **Persistence**: last queue, preferences, cached metadata (AsyncStorage).
- **Background Audio** via `expo-av`.
- **Advanced 1 — Authentication** (Firebase/Supabase email/password).
- **Advanced 2 — Offline Mode**: download preview/RF tracks with `expo-file-system`; connectivity awareness (`expo-network`).
- *(Optional stretch)* Notifications for “new playlist” drops; simple realtime “Trending”.

## Plan
- **Week 1 — Setup & Proposal**: Expo scaffold; theme; navigation skeleton (tabs + stacks); state store (Zustand/Redux). Choose backend (Supabase or Express) and seed sample data.
- **Week 2 — Core Playback**: Track list UI; Now Playing; mini player; queue management; background audio and audio focus basics.
- **Week 3 — Persistence & Auth**: Favorites; user playlists; AsyncStorage hydration; email/password auth; gated Library screens.
- **Week 4 — Offline Mode**: Download manager; local file cache; storage quota & eviction; connectivity checks; offline UI states.
- **Week 5 — Polish & (Optional) Notifications**: Push notifications (`expo-notifications`) or lightweight realtime feed; UX refinements; error states; performance passes.
- **Week 6 — Delivery**: EAS build (Android APK/AAB; iOS TestFlight if feasible); final README/report; 1–5 min demo video; 4–5 min in-class presentation.
