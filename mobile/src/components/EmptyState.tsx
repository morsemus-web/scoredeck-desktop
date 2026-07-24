import { View, Text, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, spacing, sportColor } from "@/lib/theme";

export default function EmptyState({ sport, onlyLive }: { sport: string; onlyLive: boolean }) {
  const accent = sportColor(sport);
  const icon = sport === "Cricket" ? "cricket" : sport === "Football" ? "soccer" : sport === "Basketball" ? "basketball" : "flag-checkered";

  return (
    <View style={styles.wrap}>
      <View style={[styles.circle, { backgroundColor: accent + "18" }]}>
        <MaterialCommunityIcons name={icon as any} size={36} color={accent} />
      </View>
      <Text style={styles.title}>
        {onlyLive ? `No live ${sport} right now` : `No ${sport} matches today`}
      </Text>
      <Text style={styles.sub}>
        {onlyLive
          ? "Turn off the Live filter to see all fixtures."
          : "Check back at match time to follow the action live."}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingTop: 80,
    gap: spacing.md,
  },
  circle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  sub: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
    maxWidth: 260,
  },
});
