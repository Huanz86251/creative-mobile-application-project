
import { supabase } from "../lib/supabase";

export async function getSignedDownloadUrl(objectPath: string, expiresInSec = 86400) {

  const key = objectPath.replace(/^\/+/, "");

  const { data, error } = await supabase.storage
    .from("music")
    .createSignedUrl(key, expiresInSec);

  if (error) {
    throw new Error(`Signed URL failed for "${key}" (from "${objectPath}"): ${error.message}`);
  }
  return data!.signedUrl!;
}
