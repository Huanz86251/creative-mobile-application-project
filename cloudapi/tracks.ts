import { supabase } from "../lib/supabase";

export type Datarow = {
  id: string;
  title: string;
  artist: string | null;
  duration_sec: number | null;
  object_path: string;
  artwork_url: string | null;
};

export async function fetchTracks(): Promise<Datarow[]> {
  const { data, error } = await supabase
    .from("tracks")
    .select("id,title,artist,duration_sec,object_path,artwork_url")
    .order("title", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Datarow[];
}
