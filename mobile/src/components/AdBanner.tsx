import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Linking, Image } from "react-native";
import { BannerAd, BannerAdSize } from "react-native-google-mobile-ads";
import Constants from "expo-constants";
import { colors, radius, spacing } from "@/lib/theme";
import { fetchAd, type AdCreative } from "@/lib/ads";
import { ADMOB_BANNER_ID, admobReady } from "@/lib/admob";

const API_BASE = (Constants.expoConfig?.extra as any)?.apiBase ?? "https://tryscoredeck.pro";

// Mobile ad slot, filled in order: a direct sponsor campaign from
// /api/ads/next (logged to ad_events), then Google AdMob, then the
// ScoreDeck house ad. Paying users never mount this component.

type Fill = { kind: "loading" } | { kind: "sponsor"; ad: AdCreative } | { kind: "admob" } | { kind: "house"; ad: AdCreative | null };

function logEvent(campaignId: number, type: "impression" | "click", sport?: string) {
  fetch(`${API_BASE}/api/ads/event`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ campaignId, type, sport: sport || "general" }),
  }).catch(() => {});
}

export default function AdBanner({ sport }: { sport?: string }) {
  const [fill, setFill] = useState<Fill>({ kind: "loading" });

  useEffect(() => {
    let mounted = true;
    (async () => {
      const ad = await fetchAd({ variant: "interstitial", sport });
      if (!mounted) return;
      if (ad && !ad.house && ad.campaignId > 0) {
        setFill({ kind: "sponsor", ad });
        logEvent(ad.campaignId, "impression", sport);
        return;
      }
      const admob = await admobReady();
      if (mounted) setFill(admob ? { kind: "admob" } : { kind: "house", ad });
    })();
    return () => {
      mounted = false;
    };
  }, [sport]);

  if (fill.kind === "loading") return null;

  if (fill.kind === "admob") {
    return (
      <View style={styles.wrap}>
        <BannerAd
          unitId={ADMOB_BANNER_ID}
          size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
          onAdFailedToLoad={() => setFill({ kind: "house", ad: null })}
        />
      </View>
    );
  }

  const ad = fill.ad;
  if (!ad) return null;
  const sponsor = fill.kind === "sponsor";

  function open() {
    if (sponsor) logEvent(ad!.campaignId, "click", sport);
    if (ad?.landingUrl) Linking.openURL(ad.landingUrl).catch(() => {});
  }

  return (
    <View style={styles.wrap}>
      <TouchableOpacity style={styles.card} onPress={open} activeOpacity={0.9}>
        <View style={styles.tag}>
          <Text style={styles.tagText}>{sponsor ? "SPONSORED" : "AD"}</Text>
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
