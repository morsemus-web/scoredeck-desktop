import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Linking, Image } from "react-native";
import { colors, radius, spacing } from "@/lib/theme";
import { fetchAd, type AdCreative } from "@/lib/ads";

// Mobile ad slot, served from /api/ads/next. With no paid campaigns booked the
// route returns the house ad, so the slot is never blank.
export default function AdBanner({ sport }: { sport?: string }) {
  const [ad, setAd] = useState<AdCreative | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const next = await fetchAd({ variant: "interstitial", sport });
      if (mounted) setAd(next);
    })();
    return () => {
      mounted = false;
    };
  }, [sport]);

  if (!ad) return null;

  function open() {
    if (ad?.landingUrl) Linking.openURL(ad.landingUrl).catch(() => {});
  }

  return (
    <View style={styles.wrap}>
      <TouchableOpacity style={styles.card} onPress={open} activeOpacity={0.9}>
        <View style={styles.tag}>
          <Text style={styles.tagText}>AD</Text>
        </View>

        {ad.creativeUrl ? (
          <Image source={{ uri: ad.creativeUrl }} style={styles.creative} resizeMode="cover" />
        ) : (
          <View style={{ flex: 1, paddingRight: spacing.xl }}>
            <Text style={styles.title}>{ad.headline}</Text>
            {!!ad.subline && <Text style={styles.sub}>{ad.subline}</Text>}
          </View>
        )}
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
    minHeight: 64,
  },
  creative: {
    flex: 1,
    height: 60,
    borderRadius: radius.sm,
  },
  tag: {
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    position: "absolute",
    top: 6,
    right: 8,
    zIndex: 1,
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
    marginBottom: 3,
  },
  sub: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    fontWeight: "600",
  },
});
