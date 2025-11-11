import { supabase } from "../lib/supabase";

export type RecommendedTrack = {
    id: string; title: string;
    artist: string | null;
    object_path: string; genre: string | null; language: string | null;
    tags: string[] | null; themes: string[] | null;
    dist: number;
  };
  
  export async function recommendFromMyLikes(limit = 10): Promise<RecommendedTrack[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not signed in");
    const { data, error } = await supabase.rpc("recommend_from_last_likes", {
      p_user: user.id, p_limit: limit,
    });
    if (error) throw error;
    return data ?? [];
  }