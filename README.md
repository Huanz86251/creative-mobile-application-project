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
---
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
---
## **Plan**

**Week 1 — Setup & Core Structure:** Expo scaffold; app theme; navigation skeleton (tabs + stacks); global state store (**Redux Toolkit**); configure **Expo Router** and **Firebase** authentication skeleton.  
Initialize **expo-sqlite** local database and prepare song schema.  
**ZG:** Navigation & theme | **SZ:** Redux setup & user state | **ZH:** Firebase & SQLite configuration.  

**Week 2 — Core Playback:** Build **Track List UI**, **Now Playing**, **Mini Player**, and **queue management** using **expo-av** for background playback.  
Implement playback controls, progress tracking, and basic audio focus handling.  
**ZG:** Playback UI & styling | **SZ:** Audio logic & expo-av integration | **ZH:** Queue data flow & syncing.  

**Week 3 — Local Database & Auth:** Implement **Favorites**, **user playlists**, and **expo-sqlite** CRUD operations.  
Add **Firebase authentication** (email/password) and gated Library screens.  
**ZG:** Auth UI & navigation | **SZ:** Firebase logic & user state | **ZH:** SQLite playlist storage & data persistence.  

**Week 4 — Offline & Notifications:** Add **offline mode**, **local cache**, and **connectivity checks**.  
Integrate **expo-notifications** for daily song recommendations and **AudD API** for song recognition.  
**ZG:** Offline UI/UX | **SZ:** Notification & AudD integration | **ZH:** Cache structure & file system management.  

**Week 5 — Deployment & Presentation:** Polish UI/UX; fix bugs and optimize performance.  
Generate **EAS build** (**Android APK/AAB**, **iOS TestFlight** if feasible); finalize **README/report**; record **1–5 min demo video**; prepare **4–5 min in-class presentation**.  
**ZG:** Demo & presentation design | **SZ:** Build & deployment | **ZH:** Documentation & QA testing.  

---

**Feasibility:**  
The 5-week timeline maintains a balanced workload among **ZG**, **SZ**, and **ZH**, with clear deliverables each week.  
Core development (Weeks 1–4) ensures all primary app features—authentication, playback, and offline mode—are functional before final polish and deployment.  
All chosen frameworks (**Expo**, **Expo Router**, **Redux Toolkit**, **Firebase**, **expo-sqlite**, **expo-av**) are stable and well-documented, ensuring the project can be confidently completed on time.



