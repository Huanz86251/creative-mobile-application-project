// cloudapi/auth.ts
import { supabase } from "../lib/supabase";

const EMAIL_REDIRECT = "https://www.google.com"; 
export async function signIn(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: EMAIL_REDIRECT },
  });
  if (error) throw error;
  return data; 
}

export async function resendSignUpEmail(email: string) {
  const { data, error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: EMAIL_REDIRECT },
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  await supabase.auth.signOut({ scope: "local" });
  try { await supabase.auth.signOut(); } catch {}
}

export async function currentUserId(): Promise<string | null> {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user?.id ?? null;
}
