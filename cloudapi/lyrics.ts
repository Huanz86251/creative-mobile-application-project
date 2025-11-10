import { supabase } from "../lib/supabase";
export type LyricsRow = { track_id: string; format: "lrc"|"plain"; content: string };
//try to get lyrics for song with ID,"Irc" with time frame, "plain" pure text
export async function getLyrics(trackId: string, prefer: "lrc"|"plain"="lrc"): Promise<LyricsRow | null> {
  const { data, error } = await supabase
    .from("track_lyrics")
    .select("track_id,format,content")
    .eq("track_id", trackId);
  if (error) throw error;
  if (!data?.length) return null;
  const lrc = data.find(d => d.format === prefer);
  return lrc ?? data[0];
}
