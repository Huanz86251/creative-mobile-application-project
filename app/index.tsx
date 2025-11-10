
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Gate() {
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setAuthed(!!data.session);
      setReady(true);
    });
  }, []);

  if (!ready) return null; 
  return <Redirect href={authed ? "/(tabs)/library" : "/login"} />;
}
