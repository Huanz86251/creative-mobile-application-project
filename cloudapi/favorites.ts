import { supabase } from "../lib/supabase";


export async function toggleFavorite(trackId: string): Promise<{ liked: boolean; likes_count: number; }> {
  const { data, error } = await supabase.rpc("toggle_favorite", { p_track_id: trackId });
  if (error) throw error;
  const row = (Array.isArray(data) ? data[0] : data) as any;
  return { liked: !!row?.liked, likes_count: Number(row?.likes_count ?? 0) };
}

//get current user favorite list
export async function listMyFavorites(): Promise<{ track_id: string }[]> {
  const { data, error } = await supabase.from("user_favorites").select("track_id");
  if (error) throw error;
  return data ?? [];
}
