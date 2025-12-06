import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface Track {
  trackId: number | string;
  artistName: string;
  trackName: string;
  previewUrl?: string;           
  previewUrlResolver?: () => Promise<string | null | undefined>;
  artworkUrl30?: string;        
  artworkUrl60?: string;         
  artworkUrl100?: string;        
  collectionName?: string;       
  trackTimeMillis?: number;      
  favorite?: boolean;            
  objectPath?: string;
}


interface TracksState {
  tracks: Track[];
  loaded: boolean;
}

const initialState: TracksState = {
  tracks: [],
  loaded: false,
};

const tracksSlice = createSlice({
  name: "tracks",
  initialState,
  reducers: {
    setTracks: (state, action: PayloadAction<Track[]>) => {
      state.tracks = action.payload;
      state.loaded = true;
    },
    toggleFavorite: (state, action: PayloadAction<string>) => {
      const track = state.tracks.find((t) => t.trackId === Number(action.payload));
      if (track) track.favorite = !track.favorite;
    },
  },
});

export const { setTracks, toggleFavorite } = tracksSlice.actions;
export const selectTracks = (state: any) => state.tracks.tracks;
export const selectTrackById = (state: any, id: string) =>
  state.tracks.tracks.find((t:Track) => t.trackId === Number(id));
export default tracksSlice.reducer;
