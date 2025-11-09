import { supabase } from "../lib/supabase";

export async function getSignedDownloadUrl(objectPath: string, expiresInSec = 600): Promise<string> {
  const pathInBucket = objectPath.replace(/^music\//, "");
  const { data, error } = await supabase.storage
    .from("music")
    .createSignedUrl(pathInBucket, expiresInSec);
  if (error) throw error;
  if (!data?.signedUrl) throw new Error("Empty signedUrl");
  return data.signedUrl;
}
