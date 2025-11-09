import { supabase } from "../lib/supabase";

export type TrackRow = {
  id: string;
  title: string;
  artist: string | null;
  duration_sec: number | null;
  object_path: string;
  artwork_url: string | null;
  instrumental: boolean;
  is_public: boolean;
  genre: string | null;
  language: string | null;
  tags: string[];
  themes: string[];
};
//return newest audio list,s ort by created_at
export async function listTracks(limit=50, offset=0): Promise<TrackRow[]> {
  const { data, error } = await supabase
    .from("tracks")
    .select("id,title,artist,duration_sec,object_path,artwork_url,instrumental,is_public,genre,language,tags,themes")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw error;
  return data ?? [];
}

export type SearchRow = TrackRow & { rank?: number | null, likes_count?: number, liked?: boolean };
//search music
export async function searchTracks(q: string, limit=20, offset=0): Promise<SearchRow[]> {
  const { data, error } = await supabase.rpc("search_tracks", { q, lim: limit, off: offset });
  if (error) throw error;
  // `search_tracks` returns a subset; hydrate minimal fields
  return (data ?? []) as any;
}
//get music by singer
export async function listByArtist(artist: string, limit=50, offset=0): Promise<TrackRow[]> {
  const { data, error } = await supabase
    .from("tracks")
    .select("id,title,artist,duration_sec,object_path,artwork_url,instrumental,is_public,genre,language,tags,themes")
    .ilike("artist", artist)  // exact or pass `%name%` yourself
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw error;
  return data ?? [];
}
//list audio by different type, like "rock", "pop", "jazz"
export async function listByGenre(genre: string, limit=50, offset=0): Promise<TrackRow[]> {
  const { data, error } = await supabase
    .from("tracks")
    .select("id,title,artist,duration_sec,object_path,artwork_url,instrumental,is_public,genre,language,tags,themes")
    .ilike("genre", genre)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw error;
  return data ?? [];
}
//list audio by tag
export async function listByTag(tag: string, limit=50, offset=0): Promise<TrackRow[]> {
  const { data, error } = await supabase
    .from("tracks")
    .select("id,title,artist,duration_sec,object_path,artwork_url,instrumental,is_public,genre,language,tags,themes")
    .contains("tags", [tag]) // exact tag match
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw error;
  return data ?? [];
}
