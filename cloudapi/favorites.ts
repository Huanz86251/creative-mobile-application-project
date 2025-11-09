
import { supabase } from "../lib/supabase";


export type ToggleFavoriteResult = {
  liked: boolean;
  likes_count: number;
};


export type FavoriteRow = {
  track_id: string;
  title: string | null;
  artist: string | null;
  artwork_url: string | null;
  object_path: string;   
  created_at: string;    
};


const FK_NAME = "user_favorites_track_id_fkey";


type TrackLite = {
  id: string;
  title: string | null;
  artist: string | null;
  artwork_url: string | null;
  object_path: string;
};
type JoinRow = {
  created_at: string;
  track_id: string;
  tracks: TrackLite | null; 
};

//allow user like or unlike
export async function toggleFavorite(trackId: string): Promise<ToggleFavoriteResult> {
  const { data, error } = await supabase.rpc("toggle_favorite", { p_track_id: trackId });
  if (error) throw error;
  const row = (Array.isArray(data) ? data[0] : data) as any;
  return { liked: !!row?.liked, likes_count: Number(row?.likes_count ?? 0) };
}

//list user favor list
export async function listMyFavorites(): Promise<FavoriteRow[]> {

  const rpc = await supabase.rpc("list_my_favorites");
  if (!rpc.error && Array.isArray(rpc.data)) {
    const rows = rpc.data as any[];
    return rows.map((r) => ({
      track_id: String(r.track_id ?? r.id), 
      title: r.title ?? null,
      artist: r.artist ?? null,
      artwork_url: r.artwork_url ?? null,
      object_path: r.object_path ?? "",
      created_at: r.created_at ?? new Date().toISOString(),
    }));
  }


  const { data, error } = await supabase
    .from("user_favorites")
    .select(
      `
      created_at,
      track_id,
      tracks:tracks!${FK_NAME} (
        id, title, artist, artwork_url, object_path
      )
    `
    )
    .order("created_at", { ascending: false });

  if (error) throw error;


  const rows = (data ?? []) as unknown as JoinRow[];

  return rows.map((r) => ({
    track_id: r.track_id,
    title: r.tracks?.title ?? null,
    artist: r.tracks?.artist ?? null,
    artwork_url: r.tracks?.artwork_url ?? null,
    object_path: r.tracks?.object_path ?? "",
    created_at: r.created_at,
  }));
}


export async function listMyFavoriteIds(): Promise<string[]> {
  const { data, error } = await supabase
    .from("user_favorites")
    .select("track_id")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((r: any) => String(r.track_id));
}
