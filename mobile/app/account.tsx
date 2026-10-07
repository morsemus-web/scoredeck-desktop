import { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, TouchableOpacity, ScrollView, Switch } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as WebBrowser from "expo-web-browser";
import { supabase } from "@/lib/supabase";
import { fetchMe } from "@/lib/api";
import { setUsageSharing, usageSharing } from "@/lib/usage";
import { colors, radius, spacing, shadow } from "@/lib/theme";

export default function Account() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [adsFree, setAdsFree] = useState(false);
  const [expires, setExpires] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [shareUsage, setShareUsage] = useState(false);

  useEffect(() => {
    (async () => {
      const [me, sharing] = await Promise.all([fetchMe(), usageSharing()]);
      if (me) {
        setEmail(me.email ?? "");
        setAdsFree(me.adsFree);
        setExpires(me.adsFreeUntil ?? null);
      }
      setShareUsage(sharing);
      setLoading(false);
    })();
  }, []);

  function toggleSharing(on: boolean) {
    setShareUsage(on);
    setUsageSharing(on);
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/");
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Account</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView style={styles.body} contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: 40 }}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={26} color={colors.brand} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.email}>{email || "—"}</Text>
            <Text style={styles.plan}>Free plan</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ad-free subscription</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.label}>Status</Text>
              <View
                style={[
                  styles.pill,
                  adsFree ? styles.pillActive : styles.pillInactive,
                ]}
              >
                <View
                  style={[
                    styles.pillDot,
                    { backgroundColor: adsFree ? colors.brand : colors.textMuted },
                  ]}
                />
                <Text
                  style={[
                    styles.pillText,
                    adsFree ? { color: colors.brand } : { color: colors.textDim },
                  ]}
                >
                  {loading ? "…" : adsFree ? "Active" : "Inactive"}
                </Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.row}>
              <Text style={styles.label}>Renews / expires</Text>
              <Text style={styles.value}>
                {expires
                  ? new Date(expires).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })
                  : "—"}
              </Text>
            </View>
          </View>

          {!adsFree && (
            // Google Play doesn't allow buying ad removal through another
            // payment provider inside the app, so the app only explains it.
            <Text style={styles.note}>
              Ad-free comes with a ScoreDeck Pro subscription. If you already have one, sign in with the same email and ads switch off automatically.
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={[styles.label, { flex: 1, paddingRight: spacing.md }]}>Share anonymous usage statistics</Text>
              <Switch value={shareUsage} onValueChange={toggleSharing} trackColor={{ true: colors.brand }} />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App</Text>
          <View style={styles.card}>
            <Link icon="download-outline" label="Download desktop app" onPress={() => WebBrowser.openBrowserAsync("https://tryscoredeck.pro/download")} />
            <View style={styles.divider} />
            <Link icon="help-circle-outline" label="Support" onPress={() => WebBrowser.openBrowserAsync("https://tryscoredeck.pro/contact")} />
            <View style={styles.divider} />
            <Link icon="document-text-outline" label="Terms & privacy" onPress={() => WebBrowser.openBrowserAsync("https://tryscoredeck.pro/terms")} />
          </View>
        </View>

        <Pressable onPress={signOut} style={styles.signOut}>
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function Link({ icon, label, onPress }: { icon: any; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.linkRow}>
      <Ionicons name={icon} size={18} color={colors.textDim} />
      <Text style={styles.linkLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  note: {
    color: colors.textDim,
    fontSize: 12,
    lineHeight: 18,
    paddingHorizontal: spacing.xs,
  },
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
  },

  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    ...shadow.card,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.brand + "18",
    alignItems: "center",
    justifyContent: "center",
  },
  email: { color: colors.text, fontSize: 15, fontWeight: "700" },
  plan: { color: colors.textMuted, fontSize: 12, marginTop: 2 },

  section: { gap: spacing.sm },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    paddingHorizontal: spacing.xs,
  },

  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    ...shadow.card,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.lg,
  },
  divider: { height: 1, backgroundColor: colors.border, marginHorizontal: spacing.lg },
  label: { color: colors.textDim, fontSize: 13, fontWeight: "500" },
  value: { color: colors.text, fontSize: 13, fontVariant: ["tabular-nums"] },

  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  pillActive: { backgroundColor: colors.brand + "18" },
  pillInactive: { backgroundColor: colors.cardMuted },
  pillDot: { width: 6, height: 6, borderRadius: 3 },
  pillText: { fontSize: 11, fontWeight: "700" },


  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
  },
  linkLabel: { flex: 1, color: colors.text, fontSize: 14 },

  signOut: {
    marginTop: spacing.xl,
    padding: spacing.md,
    alignItems: "center",
  },
  signOutText: { color: colors.textDim, fontSize: 12, letterSpacing: 0.8, textTransform: "uppercase", fontWeight: "700" },
});
