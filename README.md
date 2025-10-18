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

**Week 1 — Setup & Core Structure:** Expo scaffold; app theme; navigation skeleton (tabs + stacks); global state store (**Redux Toolkit**); configure **Expo Router** and **Firebase** authentication skeleton.  
Set up **expo-sqlite** local database and prepare song schema.  
**ZG:** Navigation & theme | **SZ:** Redux setup & user state | **ZH:** Firebase & SQLite configuration.  

**Week 2 — Playback & Offline Features:** Implement **track list UI**, **Now Playing**, **mini player**, and **queue management** with **expo-av** for background playback.  
Add **Favorites**, **offline mode**, **file caching**, and **connectivity checks**.  
**ZG:** Playback UI & offline UX | **SZ:** Audio logic & download manager | **ZH:** Data flow, storage management & playlist persistence.  

**Week 3 — Notifications, Polish & Delivery:** Integrate **expo-notifications** for daily song recommendations and **AudD API** for song recognition.  
Perform **UI/UX refinements**, **error handling**, and **EAS build** (Android APK/AAB, iOS TestFlight if feasible).  
Finalize **README/report**, record **1–5 min demo video**, and prepare **4–5 min in-class presentation**.  
**ZG:** Design polish & presentation | **SZ:** Notification & AudD integration | **ZH:** Build, documentation & final QA.  

---

**Feasibility:**  
The condensed 3-week timeline maintains balanced contributions among **ZG**, **SZ**, and **ZH**, with clearly defined weekly milestones.  
By focusing on essential features—playback, offline mode, and user interaction—the project remains achievable while delivering a fully functional, polished music app within the deadline.


