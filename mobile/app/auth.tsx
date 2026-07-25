import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, Alert, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Linking from "expo-linking";
import { supabase } from "@/lib/supabase";
import { colors, radius, spacing } from "@/lib/theme";

export default function Auth() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function sendMagicLink() {
    if (!email.trim()) return;
    setLoading(true);
    // createURL resolves to scoredeck:// in a standalone build and exp://…
    // in Expo Go, so the same code works in dev and production.
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: Linking.createURL("/") },
    });
    setLoading(false);
    if (error) {
      Alert.alert("Sign-in failed", error.message);
      return;
    }
    setSent(true);
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sign in</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.body}>
        {!sent ? (
          <>
            <View style={styles.card}>
              <Text style={styles.title}>Welcome</Text>
              <Text style={styles.sub}>
                ScoreDeck is free with your email. Your first month is ad-free
                as a trial.
              </Text>
              <View style={styles.inputWrap}>
                <Ionicons name="mail-outline" size={18} color={colors.textMuted} />
                <TextInput
                  placeholder="you@email.com"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={setEmail}
                  style={styles.input}
                />
              </View>
              <Pressable
                onPress={sendMagicLink}
                disabled={loading}
                style={[styles.btn, loading && { opacity: 0.5 }]}
              >
                <Text style={styles.btnText}>
                  {loading ? "Sending…" : "Send magic link"}
                </Text>
              </Pressable>
            </View>
            <Text style={styles.legal}>
              By continuing you agree to our Terms and Privacy Policy.
            </Text>
          </>
        ) : (
          <View style={styles.card}>
            <View style={styles.checkCircle}>
              <Ionicons name="mail" size={30} color={colors.brand} />
            </View>
            <Text style={styles.title}>Check your email</Text>
            <Text style={styles.sub}>
              We sent a sign-in link to{" "}
              <Text style={{ color: colors.text, fontWeight: "600" }}>{email}</Text>.
              Tap it on this device to sign in.
            </Text>
            <Pressable onPress={() => router.replace("/")} style={styles.btnGhost}>
              <Text style={styles.btnGhostText}>Back to feed</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.brand },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  back: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, textAlign: "center", color: "#fff", fontSize: 15, fontWeight: "600" },
  body: {
    flex: 1,
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.card,
    padding: spacing.xl,
    borderRadius: radius.lg,
    gap: spacing.md,
    alignItems: "center",
  },
  title: { color: colors.text, fontSize: 22, fontWeight: "700", marginTop: spacing.md, textAlign: "center" },
  sub: { color: colors.textDim, fontSize: 13, lineHeight: 19, textAlign: "center" },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.cardMuted,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    width: "100%",
  },
  input: { flex: 1, paddingVertical: 12, color: colors.text, fontSize: 15 },
  btn: {
    backgroundColor: colors.brand,
    padding: 14,
    borderRadius: radius.md,
    alignItems: "center",
    width: "100%",
    marginTop: spacing.xs,
  },
  btnText: { color: "#fff", fontWeight: "700", letterSpacing: 0.6, fontSize: 13, textTransform: "uppercase" },
  btnGhost: {
    padding: 14,
    borderRadius: radius.md,
    alignItems: "center",
    width: "100%",
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.md,
  },
  btnGhostText: { color: colors.textDim, fontWeight: "600", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.6 },
  legal: { textAlign: "center", color: colors.textMuted, fontSize: 11, paddingHorizontal: spacing.lg },
  checkCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.brand + "18",
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.md,
  },
});
