import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface Track {
  trackId: number;
  artistName: string;
  trackName: string;
  previewUrl?: string;           // 歌曲预览音频
  artworkUrl30?: string;         // 小封面
  artworkUrl60?: string;         // 中封面
  artworkUrl100?: string;        // 大封面
  collectionName?: string;       // 专辑名
  trackTimeMillis?: number;      // 歌曲时长 (ms)
  favorite?: boolean;            // 是否收藏
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
