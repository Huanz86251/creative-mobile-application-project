# MiniTune — A Lightweight Music Streaming App

## Team Members
| Name           | Email                        |
|----------------|------------------------------|
| Xiangyu Liu    | swift.liu@mail.utoronto.ca   |
| Zigong Hao     | zihao.gong@mail.utoronto.ca  |
| Zixuan Huang   | chrim.huang@mail.utoronto.ca |

## Motivation
Music apps are a great canvas to showcase real mobile capabilities: continuous audio playback, background controls, offline caching, push notifications, and clean navigation. MiniTune focuses on the essential experience—browse playlists, play 30-second previews (or royalty-free full tracks), favorite songs, listen offline—while avoiding licensing issues and daily song recommendation notifications.
- Target Users: Students and music enthusiasts who want to discover music and manage their music libraries.
- Value: This project fully implements the core course objectives, including React Native (Expo + TypeScript), state management and persistence, device APIs, background audio, notifications, backend integration, and EAS deployment.
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
## **Plan**

**Week 1 — Setup & Proposal:** Expo scaffold; theme; navigation skeleton (tabs + stacks); state store (**Redux**). Choose backend (**Supabase** or **Express**) and seed sample data.  
**ZG:** Navigation & theme | **SZ:** State store & data model | **ZH:** Backend setup & sample data.  

**Week 2 — Core Playback:** Track list UI; Now Playing; mini player; queue management; background audio and audio focus basics.  
**ZG:** Playback UI & interactions | **SZ:** Audio logic & Expo AV integration | **ZH:** Data flow & backend syncing.  

**Week 3 — Persistence & Auth:** Favorites; user playlists; AsyncStorage hydration; email/password authentication; gated Library screens.  
**ZG:** Auth UI & navigation | **SZ:** Auth logic & Supabase integration | **ZH:** Playlist storage & persistence.  

**Week 4 — Offline Mode:** Download manager; local file cache; storage quota & eviction; connectivity checks; offline UI states.  
**ZG:** Offline UI/UX | **SZ:** File system API & download logic | **ZH:** Cache structure & storage management.  

**Week 5 — Polish & (Optional) Notifications:** Push notifications (`expo-notifications`) or realtime feed; UX refinements; error states; performance optimization.  
**ZG:** Design polish & user testing | **SZ:** Notification logic | **ZH:** Performance tuning & debugging.  

**Week 6 — Delivery:** EAS build (**Android APK/AAB**, **iOS TestFlight** if feasible); finalize README/report; record **1–5 min demo video**; prepare **4–5 min in-class presentation**.  
**ZG:** Demo & presentation | **SZ:** Build & deployment | **ZH:** Documentation & final QA.  

**Feasibility:** The workload is evenly distributed among all members (**ZG**, **SZ**, **ZH**) with clear responsibilities each week. Tasks progress logically and use stable, well-documented frameworks (**Expo**, **Supabase**, **Redux**). The schedule is realistic for delivering a fully functional and polished app by the project deadline.

