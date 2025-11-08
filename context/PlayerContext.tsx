import React, { createContext, useContext, useState, ReactNode } from "react";
import { Audio } from "expo-av";
import { Track } from "../features/tracks/tracksSlice";

type PlayerContextType = {
  currentTrack: Track | null;
  currentTrackId: string | null;
  setCurrentTrack: (track: Track) => void;
  playSound: (previewUrl: string) => Promise<void>;
  stopSound: () => Promise<void>;
};

export const PlayerContext = createContext<PlayerContextType>({
  currentTrack: null,
  currentTrackId: null,
  setCurrentTrack: () => {},
  playSound: async () => {},
  stopSound: async () => {},
});

export const usePlayer = () => useContext(PlayerContext);

export const PlayerProvider = ({ children }: { children: ReactNode }) => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [soundObj, setSoundObj] = useState<Audio.Sound | null>(null);

  const playSound = async (previewUrl: string) => {
    try {
      if (soundObj) {
        await soundObj.unloadAsync();
      }
      const { sound } = await Audio.Sound.createAsync({ uri: previewUrl });
      setSoundObj(sound);
      await sound.playAsync();
    } catch (e) {
      console.error("Error playing sound:", e);
    }
  };

  const stopSound = async () => {
    try {
      if (soundObj) await soundObj.stopAsync();
    } catch (e) {
      console.error("Error stopping sound:", e);
    }
  };

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        currentTrackId: currentTrack?.trackId?.toString() ?? null,
        setCurrentTrack,
        playSound,
        stopSound,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};
