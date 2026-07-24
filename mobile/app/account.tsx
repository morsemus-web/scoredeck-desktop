import { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, Alert, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as WebBrowser from "expo-web-browser";
import Constants from "expo-constants";
import { supabase } from "@/lib/supabase";
import { fetchMe, fetchProducts } from "@/lib/api";
import { colors, radius, spacing, shadow } from "@/lib/theme";

const API_BASE = (Constants.expoConfig?.extra as any)?.apiBase ?? "https://tryscoredeck.pro";

export default function Account() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [adsFree, setAdsFree] = useState(false);
  const [expires, setExpires] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [productId, setProductId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [me, products] = await Promise.all([fetchMe(), fetchProducts()]);
      if (me) {
        setEmail(me.email ?? "");
        setAdsFree(me.adsFree);
        setExpires(me.adsFreeUntil ?? null);
      }
      setProductId(products.mobile ?? products.annual ?? null);
      setLoading(false);
    })();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/");
  }

  async function buyAdFree() {
    if (!productId) {
      Alert.alert(
        "Coming soon",
        "The subscription product isn't configured on the server yet. Set NEXT_PUBLIC_DODO_ANNUAL_ID in Vercel to enable checkout.",
      );
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, email }),
      });
      const { checkout_url, error } = await res.json();
      if (error || !checkout_url) throw new Error(error ?? "No URL");
      await WebBrowser.openBrowserAsync(checkout_url);
    } catch (e: any) {
      Alert.alert("Checkout failed", e.message ?? "Try again later");
    }
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
            <TouchableOpacity onPress={buyAdFree} style={styles.cta}>
              <MaterialCommunityIcons name="crown" size={20} color="#fff" />
              <View style={{ flex: 1 }}>
                <Text style={styles.ctaText}>Go ad-free · $20 / year</Text>
                <Text style={styles.ctaSub}>Billed via Dodo Payments</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          )}
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

  cta: {
    marginTop: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.brand,
    padding: spacing.lg,
    borderRadius: radius.lg,
    ...shadow.card,
  },
  ctaText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  ctaSub: { color: "rgba(255,255,255,0.75)", fontSize: 11, marginTop: 2 },

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
