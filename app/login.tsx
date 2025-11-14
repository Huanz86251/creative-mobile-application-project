import React, { useEffect, useRef, useState, useCallback } from "react";
import { View, Text, TextInput, Alert, TouchableOpacity, BackHandler, Pressable, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";
import {signIn,signUp,signOut,resendSignUpEmail,sendResetCode,verifyResetCode,updatePassword} from "../cloudapi/auth";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
type BtnProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "link" | "danger";
  style?: any;
};
const palette = {
  primary: "#2563eb",         
  primaryPressed: "#1d4ed8",  
  fgOnPrimary: "#ffffff",
  text: "#111827",            
  textMuted: "#374151",      
  border: "#e5e7eb",          
  surface: "#f3f4f6",        
  danger: "#dc2626",
  dangerPressed: "#b91c1c",
};

const Btn = ({ title, onPress, disabled, variant = "primary", style }: BtnProps) => {
  const isPrimary = variant === "primary" || variant === "danger";
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btnBase,
        isPrimary ? { alignSelf: "stretch" } : { alignSelf: "flex-start" },
        variant === "primary" && { backgroundColor: pressed ? palette.primaryPressed : palette.primary },
        variant === "secondary" && {
          backgroundColor: pressed ? "#e9ecef" : "transparent",
          borderWidth: 1,
          borderColor: palette.border,
        },
        variant === "danger" && { backgroundColor: pressed ? palette.dangerPressed : palette.danger },
        variant === "link" && { backgroundColor: "transparent", paddingVertical: 6, paddingHorizontal: 4 },
        disabled && { opacity: 0.5 },
        style,
      ]}
    >
      <Text
        style={[
          styles.btnText,
          isPrimary ? { color: palette.fgOnPrimary } : { color: palette.text },
          variant === "link" && { fontWeight: "600" },
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  btnBase: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 999,           
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
export default function Login() {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const { mode: modeParam } = useLocalSearchParams<{ mode?: string }>();

  const [mode, setMode] = useState<"signin" | "signup" | "verify" | "forgot" | "reset">(
    modeParam === "signup" ? "signup" : "signin"
  );

  const [userId, setUserId] = useState<string | null>(null);
  const [needsVerify, setNeedsVerify] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string>("");


  const [code, setCode] = useState("");
  const [newPwd, setNewPwd] = useState("");

  const mountedRef = useRef(true);

  const goBack = useCallback(() => {
    if (navigation.canGoBack && navigation.canGoBack()) {
      (navigation as any).goBack();
    } else {
      router.replace("/(tabs)/library");
    }
  }, [navigation, router]);

  useEffect(() => {
    mountedRef.current = true;

    (async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) console.log("[LOGIN] getUser error:", error.message);
        if (mountedRef.current) setUserId(user?.id ?? null);
      } catch {
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
      try { subscription?.unsubscribe?.(); } catch {}
    };
  }, []);

  useEffect(() => {
    if (needsVerify) setMode("verify");
  }, [needsVerify]);

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      goBack();
      return true;
    });
    return () => sub.remove();
  }, [goBack]);

  useEffect(() => {
    if (userId) goBack();
  }, [userId, goBack]);

  async function onSignIn() {
    try {
      setBusy(true);
      await signIn(email.trim(), password);
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
      const { session } = await signUp(e, password);
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

  async function onSendResetCode() {
    try {
      setBusy(true);
      const e = email.trim();
      if (!e) throw new Error("Please enter your email");
      await sendResetCode(e);
      Alert.alert("Email sent", "Check your inbox for the 6-digit code.");
      setMode("reset");
    } catch (e: any) {
      Alert.alert("Failed", e.message ?? String(e));
    } finally {
      setBusy(false);
    }
  }


  async function onConfirmReset() {
    try {
      setBusy(true);
      const e = email.trim();
      if (!e || !code.trim() || !newPwd) throw new Error("Email / code / new password required");
      await verifyResetCode(e, code.trim());
      await updatePassword(newPwd);

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        Alert.alert("Password updated", "You're signed in.");

        goBack();
      } else {
        Alert.alert("Password updated", "Please sign in.");
        setMode("signin");
      }

      setCode("");
      setNewPwd("");
    } catch (e: any) {
      Alert.alert("Reset failed", e.message ?? String(e));
    } finally {
      setBusy(false);
    }
  }

  const authed = !!userId;
  if (authed) return null;

  return (
    <>
      <SafeAreaView style={{ flex: 1, backgroundColor: "transparent" }} edges={["top", "bottom"]}>
        <View style={{ flex: 1, padding: 16, gap: 12, backgroundColor: "transparent" }}>
          <TouchableOpacity
            onPress={goBack}
            style={{
              alignSelf: "flex-start",
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              paddingVertical: 4,
            }}
          >
            <Ionicons name="chevron-back" size={18} color="#1f2937" />
            <Text style={{ color: "#1f2937", fontWeight: "600" }}>Back</Text>
          </TouchableOpacity>

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
                <Btn title="I've verified" onPress={onIHaveVerified} disabled={busy} />
                <Btn title="Resend link" onPress={onResend} disabled={busy} variant="secondary"/>
                <Btn title="Back to Sign in" onPress={() => setMode("signin")} variant="link"/>
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


              {(mode === "signin" || mode === "signup") && (
                <TextInput
                  placeholder="Password"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  style={{ borderWidth: 1, borderRadius: 8, padding: 10 }}
                />
              )}

              {mode === "signin" && (
                <View style={{ gap: 8 }}>
                  <Btn
                    title={busy ? "Signing in..." : "Submit"}
                    onPress={onSignIn}
                    disabled={busy}
                  />
                  <Btn title="Forgot password?" onPress={() => setMode("forgot")} variant="link" />
                  <Btn title="Go to Sign up" onPress={() => setMode("signup")} variant="link" />
                </View>
              )}

              {mode === "signup" && (
                <View style={{ gap: 8 }}>
                  <Btn
                    title={busy ? "Signing up..." : "Submit"}
                    onPress={onSignUp}
                    disabled={busy}
                  />
                  <Btn title="Back to Sign in" onPress={() => setMode("signin")} variant="link"/>
                </View>
              )}

              {mode === "forgot" && (
                <>
                  <Text style={{ opacity: 0.8 }}>
                    Enter your email. We will send a 6-digit code to reset your password.
                  </Text>
                  <View style={{ gap: 8, marginTop: 8 }}>
                    <Btn title="Send code" onPress={onSendResetCode} disabled={busy} />
                    <Btn title="Back to Sign in" onPress={() => setMode("signin")} variant="link"/>
                  </View>
                </>
              )}

              {mode === "reset" && (
                <>
                  <TextInput
                    placeholder="Code"
                    value={code}
                    onChangeText={setCode}
                    style={{ borderWidth: 1, borderRadius: 8, padding: 10 }}
                  />
                  <TextInput
                    placeholder="New password"
                    secureTextEntry
                    value={newPwd}
                    onChangeText={setNewPwd}
                    style={{ borderWidth: 1, borderRadius: 8, padding: 10 }}
                  />
                  <View style={{ gap: 8 }}>
                    <Btn
                      title={busy ? "Resetting..." : "Reset password"}
                      onPress={onConfirmReset}
                      disabled={busy}
                    />
                    <Btn title="Back to Sign in" onPress={() => setMode("signin")} variant="link" />
                  </View>
                </>
              )}
            </>
          )}
        </View>
      </SafeAreaView>
    </>
  );
}
