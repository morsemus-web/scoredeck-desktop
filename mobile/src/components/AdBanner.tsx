import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { colors, radius, spacing } from "@/lib/theme";

// Mobile ad slot. Right now it's a house upsell to the ad-free tier — the
// same slot will fetch real creatives from /api/ads/next once mobile ad
// serving is wired.
export default function AdBanner() {
  const router = useRouter();
  return (
    <View style={styles.wrap}>
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push("/account")}
        activeOpacity={0.9}
      >
        <View style={styles.tag}>
          <Text style={styles.tagText}>AD</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Go ad-free — $20/year</Text>
          <Text style={styles.sub}>All sports, no interruptions. Trial active.</Text>
        </View>
        <View style={styles.cta}>
          <Text style={styles.ctaText}>Upgrade</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.ad,
    padding: spacing.md,
    borderRadius: radius.md,
    position: "relative",
  },
  tag: {
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    position: "absolute",
    top: 6,
    right: 8,
  },
  tagText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.6,
  },
  title: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 2,
  },
  sub: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
  },
  cta: {
    backgroundColor: colors.brandLight,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.sm,
  },
  ctaText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
});
