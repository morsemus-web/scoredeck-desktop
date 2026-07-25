import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import * as Updates from "expo-updates";
import { colors, radius, spacing } from "@/lib/theme";

// Over-the-air updates. expo-updates already downloads new JS bundles in the
// background on app launch (checkAutomatically: ON_LOAD). This banner tells the
// user an update is ready and lets them apply it without waiting for a cold
// restart. Only shows in production builds — no-ops in Expo Go / dev.
export default function UpdateBanner() {
  const [ready, setReady] = useState(false);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (__DEV__) return;

    let mounted = true;

    (async () => {
      try {
        const result = await Updates.checkForUpdateAsync();
        if (!result.isAvailable || !mounted) return;
        await Updates.fetchUpdateAsync();
        if (mounted) setReady(true);
      } catch {
        // Offline, or no update channel configured — stay silent.
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  if (!ready) return null;

  async function apply() {
    setApplying(true);
    try {
      await Updates.reloadAsync();
    } catch {
      setApplying(false);
    }
  }

  return (
    <View style={styles.wrap}>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>Update ready</Text>
        <Text style={styles.sub}>Restart to get the latest scores &amp; fixes.</Text>
      </View>
      <TouchableOpacity onPress={apply} style={styles.btn} disabled={applying}>
        {applying ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.btnText}>Restart</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.brand,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  title: { color: "#fff", fontSize: 13, fontWeight: "700" },
  sub: { color: "rgba(255,255,255,0.8)", fontSize: 11, marginTop: 2 },
  btn: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.sm,
    minWidth: 72,
    alignItems: "center",
  },
  btnText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
});
