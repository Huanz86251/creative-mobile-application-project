
import { useEffect, useState } from "react";
import { View, Text, Alert, Pressable, StyleSheet, Modal, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";
import { signOut } from "../../cloudapi/auth";
import { notifyRecommendationNow} from "../../lib/notifications";
import {pickAndSetBackgroundCover,clearBackground,setSolidBackgroundColor,} from "../../storage/background";
import { useBackground } from "../../context/Background";

export default function Account() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);




  const { refresh } = useBackground();
  const presetColors = [
    { label: "Sunset", value: "#f87171" },
    { label: "Golden", value: "#fbbf24" },
    { label: "Ocean", value: "#60a5fa" },
    { label: "Mint", value: "#34d399" },
    { label: "Lavender", value: "#a78bfa" },
    { label: "Blush", value: "#f472b6" },
  ];

  useEffect(() => {
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUserEmail(session?.user?.email ?? null);
    })();
  }, []);

  const runWithBusy = async (fn: () => Promise<void>, successMessage?: string) => {
    try {
      setBusy(true);
      await fn();
      if (successMessage) Alert.alert("Done", successMessage);
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? String(e));
    } finally {
      setBusy(false);
    }
  };

 
  const handleUploadBackground = () =>
    runWithBusy(async () => {
      const newUri = await pickAndSetBackgroundCover();
      console.log("[BG] set ->", newUri);
      await refresh();
    }, "Background set");

  const handleApplyColor = (color: string) => {
    setShowColorPicker(false);
    runWithBusy(async () => {
      await setSolidBackgroundColor(color);
      await refresh();
    }, "Background updated");
  };

  const handleClearBackground = () =>
    runWithBusy(async () => {
      await clearBackground();
      await refresh();
    }, "Background removed");

  const handleSignOut = () =>
    runWithBusy(async () => {
      await signOut();
      setUserEmail(null);
    }, "Signed out");


  const handleNotifyNow = () =>
    runWithBusy(async () => {
      await notifyRecommendationNow();
    }, "Notification sent");

 

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Account</Text>
              <Text style={styles.subtitle}>
                Manage your wallpaper, profile, and session from here.
              </Text>
            </View>
            <View style={styles.headerIcon}>
              <Ionicons name="person-circle-outline" size={28} color="#cfdcff" />
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Profile</Text>
          <Text style={styles.primaryText}>
            {userEmail ? userEmail : "Not signed in"}
          </Text>
          <Text style={styles.secondaryText}>
            {userEmail
              ? "You’re ready to sync downloads and favorites."
              : "Sign in to keep your library across devices."}
          </Text>
          {userEmail ? (
            <View style={styles.pillsRow}>
              <ActionChip
                icon="image"
                label={busy ? "Working..." : "Upload background"}
                onPress={handleUploadBackground}
                disabled={busy}
              />
              <ActionChip
                icon="color-palette"
                label="Color presets"
                onPress={() => setShowColorPicker(true)}
                disabled={busy}
              />
              <ActionChip
                icon="trash"
                label="Clear background"
                onPress={handleClearBackground}
                disabled={busy}
              />
            </View>
          ) : (
            <PrimaryButton
              label="Sign in / Account"
              icon="log-in"
              onPress={() => router.push("/login")}
            />
          )}
        </View>


        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Notifications</Text>
          <Text style={styles.secondaryText}>
          Send yourself a a notification of personalized music recommendation.
          </Text>

          <View style={styles.pillsRow}>
            <ActionChip
              icon="notifications"
              label={busy ? "Working..." : "Notify now"}
              onPress={handleNotifyNow}
              disabled={busy}
            />

          </View>


        </View>


        {userEmail ? (
          <Pressable
            style={[styles.fullButton, styles.dangerButton, busy && styles.disabled]}
            disabled={busy}
            onPress={handleSignOut}
          >
            <Ionicons name="log-out" size={16} color="#ffd6de" />
            <Text style={styles.fullButtonText}>Sign out</Text>
          </Pressable>
        ) : null}
      </View>


      <Modal
        transparent
        animationType="fade"
        visible={showColorPicker}
        onRequestClose={() => setShowColorPicker(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setShowColorPicker(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Choose a base color</Text>
            <View style={styles.colorGrid}>
              {presetColors.map(({ label, value }) => (
                <Pressable
                  key={value}
                  style={[styles.colorSwatch, { backgroundColor: value }]}
                  disabled={busy}
                  onPress={() => handleApplyColor(value)}
                >
                  <Text style={styles.colorLabel}>{label}</Text>
                </Pressable>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const PrimaryButton = ({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}) => (
  <Pressable style={styles.fullButton} onPress={onPress}>
    <Ionicons name={icon} size={18} color="#0c1d37" />
    <Text style={[styles.fullButtonText, { color: "#0c1d37" }]}>{label}</Text>
  </Pressable>
);

const ActionChip = ({
  icon,
  label,
  onPress,
  disabled,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) => (
  <Pressable
    onPress={onPress}
    disabled={disabled}
    style={[styles.actionChip, disabled && styles.disabled]}
  >
    <Ionicons name={icon} size={16} color="#cfe4ff" style={{ marginRight: 6 }} />
    <Text style={styles.actionChipText}>{label}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingHorizontal: 20,
  },
  container: {
    flex: 1,
    paddingTop: 8,
    paddingBottom: 24,
    gap: 16,
  },
  header: {
    paddingVertical: 8,
  },
  headerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(12, 29, 55, 0.74)",
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  headerIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#fff",
  },
  subtitle: {
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
  },
  card: {
    padding: 18,
    borderRadius: 22,
    backgroundColor: "rgba(12,18,32,0.92)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 10 },
    gap: 10,
  },
  sectionLabel: {
    color: "#9db5e8",
    fontSize: 13,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  primaryText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  secondaryText: {
    color: "#8aa0c7",
    fontSize: 14,
  },
  pillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 4,
  },
  actionChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(35, 54, 92, 0.8)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  actionChipText: {
    color: "#d9e8ff",
    fontWeight: "600",
  },
  fullButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: "#c5d6ff",
  },
  fullButtonText: {
    fontWeight: "700",
  },
  dangerButton: {
    backgroundColor: "rgba(197, 47, 86, 0.75)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  disabled: {
    opacity: 0.55,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  modalCard: {
    backgroundColor: "#181b22",
    borderRadius: 24,
    padding: 20,
    gap: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  colorSwatch: {
    flexBasis: "45%",
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  colorLabel: {
    color: "rgba(255,255,255,0.9)",
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
