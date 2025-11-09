
import { useEffect, useRef, useState, useCallback } from "react";
import { View, Text, TextInput, Button, Alert } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { supabase } from "../lib/supabase";
import { signIn, signUp, signOut, resendSignUpEmail } from "../cloudapi/auth";
import FloatingBack from "../components/Floatback";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [needsVerify, setNeedsVerify] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string>("");


  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;


    (async () => {
      try {
        console.log("[LOGIN] getUser() start");
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) console.log("[LOGIN] getUser error:", error.message);
        if (mountedRef.current) setUserId(user?.id ?? null);
        console.log("[LOGIN] getUser() done, user?", !!user);
      } catch (e: any) {
        console.log("[LOGIN] getUser threw:", e?.message ?? String(e));
        if (mountedRef.current) setUserId(null);
      }
    })();


    const subWrap = supabase.auth.onAuthStateChange((evt, session) => {
      console.log("[LOGIN] onAuthStateChange:", evt, "session?", !!session);
      if (!mountedRef.current) return;
      setUserId(session?.user?.id ?? null);
    });


    const subscription = subWrap?.data?.subscription;

    return () => {
      mountedRef.current = false;
      try {
        subscription?.unsubscribe?.();
        console.log("[LOGIN] unsubscribed auth listener");
      } catch (e: any) {
        console.log("[LOGIN] unsubscribe error:", e?.message ?? String(e));
      }
    };
  }, []);


  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          console.log("[LOGIN] focus check session?", !!session);
          if (alive && mountedRef.current) setUserId(session?.user?.id ?? null);
        } catch (e: any) {
          console.log("[LOGIN] focus check error:", e?.message ?? String(e));
        }
      })();
      return () => { alive = false; };
    }, [])
  );

  async function onSignIn() {
    try {
      setBusy(true);
      console.log("[LOGIN] signIn payload:", { email: !!email.trim(), pwdLen: password.length });
      await signIn(email.trim(), password);
      Alert.alert("Signed in");
 
      router.replace("/library");
    } catch (e: any) {
      const msg = (e.message ?? String(e)).toLowerCase();
      console.log("[LOGIN] signIn error:", msg);
      if (msg.includes("confirm") || msg.includes("verify")) {
        setNeedsVerify(true);
        setPendingEmail(email.trim());
        Alert.alert("Email not verified", "Please verify your email, then tap 'I've verified'.");
      } else {
        Alert.alert("Sign in failed", e.message ?? String(e));
      }
    } finally {
      setBusy(false);
    }
  }

  async function onSignUp() {
    try {
      setBusy(true);
      const e = email.trim();
      console.log("[LOGIN] signUp start:", { email: e });
      const { user, session } = await signUp(e, password);
      console.log("[LOGIN] signUp result:", { user: !!user, session: !!session });
      if (!session) {
        setNeedsVerify(true);
        setPendingEmail(e);
        Alert.alert(
          "Sign up success",
          "We sent you a verification link. If it opens Google or fails to return to the app, it's still verified after click. Then tap 'I've verified'."
        );
      } else {
        Alert.alert("Sign up success", "You can sign in now.");
      }
    } catch (e: any) {
      console.log("[LOGIN] signUp error:", e?.message ?? String(e));
      Alert.alert("Sign up failed", e.message ?? String(e));
    } finally {
      setBusy(false);
    }
  }

  async function onIHaveVerified() {
    await onSignIn();
  }

  async function onResend() {
    try {
      setBusy(true);
      await resendSignUpEmail(pendingEmail || email.trim());
      Alert.alert("Verification email resent", "Check your inbox again.");
    } catch (e: any) {
      Alert.alert("Resend failed", e.message ?? String(e));
    } finally {
      setBusy(false);
    }
  }

  async function onSignOutLocal() {
    try {
      await signOut();
    } finally {
      if (mountedRef.current) {
        setUserId(null);
        setNeedsVerify(false);
        setPendingEmail("");
      }
      Alert.alert("Signed out");
    }
  }

  const authed = !!userId;

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 ,backgroundColor: "transparent"}}>
      <Text style={{ fontSize: 22, fontWeight: "700" }}>Welcome</Text>

      {authed ? (
        <>
          <Text>Current user: {userId}</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Button title="Go to Library" onPress={() => router.replace("/library")} />
            <Button title="Sign out" onPress={onSignOutLocal} />
          </View>
        </>
      ) : needsVerify ? (
        <>
          <Text style={{ opacity: 0.8 }}>
            We sent a verification email to{" "}
            <Text style={{ fontWeight: "600" }}>{pendingEmail || email}</Text>.
          </Text>
          <Text style={{ opacity: 0.7 }}>
            If the link fails to open, the account is still verified once clicked.
            After verifying, tap “I've verified”.
          </Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Button title="I've verified" onPress={onIHaveVerified} disabled={busy} />
            <Button title="Resend link" onPress={onResend} disabled={busy} />
            <Button title="Back" onPress={() => setNeedsVerify(false)} />
          </View>
        </>
      ) : (
        <>
          <TextInput
            placeholder="Email"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            style={{ borderWidth: 1, borderRadius: 8, padding: 10 }}
          />
          <TextInput
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            style={{ borderWidth: 1, borderRadius: 8, padding: 10 }}
          />
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Button title={busy ? "Signing in..." : "Sign in"} onPress={onSignIn} disabled={busy} />
            <Button title="Sign up" onPress={onSignUp} disabled={busy} />
          </View>
        </>
      )}
      <FloatingBack />
    </View>
  );
}
