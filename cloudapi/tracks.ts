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


const like = (s: string, mode: "contains" | "starts" | "ends" | "exact" = "contains") => {
  const core = s.replace(/[%_]/g, "\\$&"); 
  if (mode === "exact") return core;
  if (mode === "starts") return `${core}%`;
  if (mode === "ends") return `%${core}`;
  return `%${core}%`;
};

// newest list
export async function listTracks(limit = 50, offset = 0): Promise<TrackRow[]> {
  const { data, error } = await supabase
    .from("tracks")
    .select("id,title,artist,duration_sec,object_path,artwork_url,instrumental,is_public,genre,language,tags,themes")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw error;
  return (data ?? []) as TrackRow[];
}

export type SearchRow = TrackRow & { rank?: number | null; likes_count?: number; liked?: boolean };


export async function searchTracks(q: string, limit = 20, offset = 0): Promise<SearchRow[]> {
  const { data, error } = await supabase.rpc("search_tracks", { q, lim: limit, off: offset });
  if (error) throw error;
  return (data ?? []) as SearchRow[];
}

// retrieve by singer
export async function listByArtist(artist: string, limit = 50, offset = 0): Promise<TrackRow[]> {
  const { data, error } = await supabase
    .from("tracks")
    .select("id,title,artist,duration_sec,object_path,artwork_url,instrumental,is_public,genre,language,tags,themes")
    .ilike("artist", like(artist, "contains")) // e.g. %name%
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw error;
  return (data ?? []) as TrackRow[];
}

// retrieve by style
export async function listByGenre(genre: string, limit = 50, offset = 0): Promise<TrackRow[]> {
  const { data, error } = await supabase
    .from("tracks")
    .select("id,title,artist,duration_sec,object_path,artwork_url,instrumental,is_public,genre,language,tags,themes")
    .ilike("genre", like(genre, "contains"))
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw error;
  return (data ?? []) as TrackRow[];
}

// retrieve by TAG
export async function listByTag(tag: string, limit = 50, offset = 0): Promise<TrackRow[]> {
  const { data, error } = await supabase
    .from("tracks")
    .select("id,title,artist,duration_sec,object_path,artwork_url,instrumental,is_public,genre,language,tags,themes")
    .contains("tags", [tag])
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw error;
  return (data ?? []) as TrackRow[];
}

// batch retrieve by ID
export async function getTracksByIds(ids: string[]): Promise<TrackRow[]> {
  if (!ids.length) return [];
  const { data, error } = await supabase
    .from("tracks")
    .select("id,title,artist,duration_sec,object_path,artwork_url,instrumental,is_public,genre,language,tags,themes")
    .in("id", ids);
  if (error) throw error;
  return (data ?? []) as TrackRow[];
}
