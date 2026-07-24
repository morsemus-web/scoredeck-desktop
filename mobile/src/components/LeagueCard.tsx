import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing, shadow, sportColor } from "@/lib/theme";
import MatchRow from "./MatchRow";
import type { MobileMatch } from "@/lib/api";

interface Props {
  sport: string;
  league: string;
  region?: string;
  matches: MobileMatch[];
  onMatchPress?: (m: MobileMatch, index: number) => void;
}

export default function LeagueCard({ sport, league, region, matches, onMatchPress }: Props) {
  const accent = sportColor(sport);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.leagueBadge, { backgroundColor: accent + "22" }]}>
          <MaterialCommunityIcons
            name={
              sport === "Cricket"
                ? "cricket"
                : sport === "Football"
                ? "soccer"
                : sport === "Basketball"
                ? "basketball"
                : "flag-checkered"
            }
            size={16}
            color={accent}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={1}>
            {league}
          </Text>
          {region && (
            <View style={styles.regionRow}>
              <Ionicons name="earth" size={11} color={colors.textMuted} />
              <Text style={styles.region}>{region}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity style={styles.starBtn}>
          <Ionicons name="star-outline" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {matches.map((m, i) => (
        <View key={i}>
          {i > 0 && <View style={styles.divider} />}
          <MatchRow match={m} onPress={onMatchPress ? () => onMatchPress(m, i) : undefined} />
          {m.note && (
            <Text style={styles.note}>{m.note}</Text>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    overflow: "hidden",
    ...shadow.card,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  leagueBadge: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
  },
  regionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  region: {
    color: colors.textMuted,
    fontSize: 11,
  },
  starBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: spacing.md + 52,
    marginRight: spacing.md,
  },
  note: {
    color: colors.textMuted,
    fontSize: 11,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    paddingLeft: spacing.md + 52,
  },
});
