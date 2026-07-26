import { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
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
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const codeRef = useRef<TextInput>(null);

  async function sendCode() {
    const clean = email.trim().toLowerCase();
    if (!clean) return;
    setLoading(true);
    // The email carries BOTH a 6-digit code and a tappable link. The code is
    // the reliable path on Android — deep links can drop the token during the
    // browser handoff — but the link still works via useAuthDeepLink().
    const { error } = await supabase.auth.signInWithOtp({
      email: clean,
      options: { emailRedirectTo: Linking.createURL("/") },
    });
    setLoading(false);
    if (error) {
      Alert.alert("Sign-in failed", error.message);
      return;
    }
    setSent(true);
    setTimeout(() => codeRef.current?.focus(), 350);
  }

  async function verifyCode(token: string) {
    if (token.length !== 6) return;
    setVerifying(true);
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token,
      type: "email",
    });
    setVerifying(false);
    if (error) {
      Alert.alert("Incorrect code", error.message);
      setCode("");
      return;
    }
    // Session is set — the feed screen picks it up via onAuthStateChange.
    router.replace("/");
  }

  function onCodeChange(next: string) {
    const digits = next.replace(/\D/g, "").slice(0, 6);
    setCode(digits);
    if (digits.length === 6) verifyCode(digits);
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.headerBar}>
        <TouchableOpacity
          onPress={() => (sent ? setSent(false) : router.back())}
          style={styles.back}
        >
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
                  onSubmitEditing={sendCode}
                  returnKeyType="go"
                  style={styles.input}
                />
              </View>
              <Pressable
                onPress={sendCode}
                disabled={loading}
                style={[styles.btn, loading && { opacity: 0.5 }]}
              >
                <Text style={styles.btnText}>
                  {loading ? "Sending…" : "Send code"}
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
              <Ionicons name="mail-open-outline" size={30} color={colors.brand} />
            </View>
            <Text style={styles.title}>Enter your code</Text>
            <Text style={styles.sub}>
              We sent a 6-digit code to{" "}
              <Text style={{ color: colors.text, fontWeight: "600" }}>{email}</Text>.
            </Text>

            <TextInput
              ref={codeRef}
              value={code}
              onChangeText={onCodeChange}
              keyboardType="number-pad"
              maxLength={6}
              editable={!verifying}
              textContentType="oneTimeCode"
              autoComplete="sms-otp"
              style={styles.codeInput}
              placeholder="000000"
              placeholderTextColor={colors.border}
            />

            {verifying ? (
              <View style={styles.verifyRow}>
                <ActivityIndicator size="small" color={colors.brand} />
                <Text style={styles.verifyText}>Verifying…</Text>
              </View>
            ) : (
              <Text style={styles.hint}>
                Tapping the link in the email also works.
              </Text>
            )}

            <Pressable onPress={sendCode} style={styles.btnGhost}>
              <Text style={styles.btnGhostText}>Resend code</Text>
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
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "700",
    marginTop: spacing.md,
    textAlign: "center",
  },
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
  codeInput: {
    width: "100%",
    backgroundColor: colors.cardMuted,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 16,
    color: colors.text,
    fontSize: 30,
    fontWeight: "700",
    letterSpacing: 12,
    textAlign: "center",
  },
  btn: {
    backgroundColor: colors.brand,
    padding: 14,
    borderRadius: radius.md,
    alignItems: "center",
    width: "100%",
    marginTop: spacing.xs,
  },
  btnText: {
    color: "#fff",
    fontWeight: "700",
    letterSpacing: 0.6,
    fontSize: 13,
    textTransform: "uppercase",
  },
  btnGhost: {
    padding: 14,
    borderRadius: radius.md,
    alignItems: "center",
    width: "100%",
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnGhostText: {
    color: colors.textDim,
    fontWeight: "600",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  verifyRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  verifyText: { color: colors.textDim, fontSize: 12 },
  hint: { color: colors.textMuted, fontSize: 11, textAlign: "center" },
  legal: {
    textAlign: "center",
    color: colors.textMuted,
    fontSize: 11,
    paddingHorizontal: spacing.lg,
  },
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
