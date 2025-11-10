
import { useEffect, useRef, useState, useCallback } from "react";
import { View, Text, TextInput, Button, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { supabase } from "../lib/supabase";
import { signIn, signUp, signOut, resendSignUpEmail } from "../cloudapi/auth";

export default function Login() {
  const router = useRouter();


  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  // signin / signup / verify
  const { mode: modeParam } = useLocalSearchParams<{ mode?: string }>();
  const [mode, setMode] = useState<"signin" | "signup" | "verify">(
    modeParam === "signup" ? "signup" : "signin"
  );


  const [userId, setUserId] = useState<string | null>(null);
  const [needsVerify, setNeedsVerify] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string>("");

  const mountedRef = useRef(true);

 
  useEffect(() => {
    mountedRef.current = true;

    (async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) console.log("[LOGIN] getUser error:", error.message);
        if (mountedRef.current) setUserId(user?.id ?? null);
      } catch (e: any) {
        if (mountedRef.current) setUserId(null);
      }
    })();

    const sub = supabase.auth.onAuthStateChange((_evt, session) => {
      if (!mountedRef.current) return;
      setUserId(session?.user?.id ?? null);
    });
    const subscription = sub?.data?.subscription;

    return () => {
      mountedRef.current = false;
      try {
        subscription?.unsubscribe?.();
      } catch {}
    };
  }, []);


  useEffect(() => {
    if (needsVerify) setMode("verify");
  }, [needsVerify]);


  async function onSignIn() {
    try {
      setBusy(true);
      await signIn(email.trim(), password);
      Alert.alert("Signed in");

    } catch (e: any) {
      const msg = (e.message ?? String(e)).toLowerCase();
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
      const { user, session } = await signUp(e, password);
      if (!session) {
        setNeedsVerify(true);
        setPendingEmail(e);
        Alert.alert(
          "Sign up success",
          "We sent you a verification link. After clicking it in your email, tap “I've verified”."
        );
      } else {
        Alert.alert("Sign up success", "You can sign in now.");
        setMode("signin");
      }
    } catch (e: any) {
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
      setUserId(null);
      setNeedsVerify(false);
      setPendingEmail("");
      Alert.alert("Signed out");
    }
  }


  const authed = !!userId;
  if (authed) return null;

  // ---- UI ----
  return (
    <View style={{ flex: 1, padding: 16, gap: 12, backgroundColor: "transparent" }}>
      <Text style={{ fontSize: 22, fontWeight: "700" }}>Welcome</Text>

      {mode === "verify" ? (
        <>
          <Text style={{ opacity: 0.8 }}>
            We sent a verification email to{" "}
            <Text style={{ fontWeight: "600" }}>{pendingEmail || email}</Text>.
          </Text>
          <Text style={{ opacity: 0.7 }}>
            After clicking the link in your email, tap “I've verified”.
          </Text>
          <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
            <Button title="I've verified" onPress={onIHaveVerified} disabled={busy} />
            <Button title="Resend link" onPress={onResend} disabled={busy} />
            <Button title="Back to Sign in" onPress={() => setMode("signin")} />
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

          {mode === "signin" ? (
            <View style={{ gap: 8 }}>
              <Button title={busy ? "Signing in..." : "Submit"} onPress={onSignIn} disabled={busy} />
              <Button title="Go to Sign up" onPress={() => setMode("signup")} />
            </View>
          ) : (
            <View style={{ gap: 8 }}>
              <Button title={busy ? "Signing up..." : "Submit"} onPress={onSignUp} disabled={busy} />
              <Button title="Back to Sign in" onPress={() => setMode("signin")} />
            </View>
          )}

        </>
      )}
    </View>
  );
}
