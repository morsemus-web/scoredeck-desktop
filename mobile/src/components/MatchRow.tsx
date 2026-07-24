import { View, Text, StyleSheet, TouchableOpacity, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, radius, sportColor } from "@/lib/theme";
import LiveDot from "./LiveDot";
import TeamBadge from "./TeamBadge";
import type { MobileMatch } from "@/lib/api";

export default function MatchRow({
  match,
  onPress,
}: {
  match: MobileMatch;
  onPress?: () => void;
}) {
  const accent = sportColor(match.sport);
  const winner1 =
    match.status === "final" &&
    match.team1Score !== undefined &&
    match.team2Score !== undefined &&
    parseInt(match.team1Score) > parseInt(match.team2Score);
  const winner2 =
    match.status === "final" &&
    match.team1Score !== undefined &&
    match.team2Score !== undefined &&
    parseInt(match.team2Score) > parseInt(match.team1Score);

  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: colors.border }}
      style={({ pressed }) => [styles.wrap, pressed && { backgroundColor: colors.cardMuted }]}
    >
      {/* Left: time / status stack */}
      <View style={styles.timeCol}>
        {match.isLive ? (
          <LiveDot size={7} />
        ) : (
          <Text style={styles.timeText}>
            {shortStatus(match.status, match.extra)}
          </Text>
        )}
        {match.isLive && (
          <Text style={styles.liveMin}>{match.extra || "LIVE"}</Text>
        )}
      </View>

      {/* Middle: two team rows */}
      <View style={styles.teamsCol}>
        <TeamLine
          name={match.team1}
          logo={match.team1Logo}
          accent={accent}
          score={match.team1Score ?? scoreLeft(match.score)}
          faded={match.status === "final" && !winner1}
          bold={winner1 || match.isLive}
        />
        <TeamLine
          name={match.team2}
          logo={match.team2Logo}
          accent={accent}
          score={match.team2Score ?? scoreRight(match.score)}
          faded={match.status === "final" && !winner2}
          bold={winner2 || match.isLive}
        />
      </View>

      {/* Right: bell */}
      <TouchableOpacity style={styles.bell}>
        <Ionicons name="notifications-outline" size={18} color={colors.textMuted} />
      </TouchableOpacity>
    </Pressable>
  );
}

function TeamLine({
  name,
  logo,
  accent,
  score,
  faded,
  bold,
}: {
  name: string;
  logo?: string;
  accent: string;
  score?: string;
  faded?: boolean;
  bold?: boolean;
}) {
  return (
    <View style={styles.teamLine}>
      <TeamBadge name={name} logo={logo} color={accent} size={22} />
      <Text
        style={[
          styles.teamName,
          faded && { color: colors.textMuted },
          bold && { fontWeight: "700" },
        ]}
        numberOfLines={1}
      >
        {name}
      </Text>
      {score !== undefined && score !== "" && (
        <Text
          style={[
            styles.score,
            faded && { color: colors.textMuted },
            bold && { fontWeight: "700" },
          ]}
        >
          {score}
        </Text>
      )}
    </View>
  );
}

function shortStatus(status: MobileMatch["status"], extra: string): string {
  if (status === "final") return "FT";
  if (status === "upcoming") return extra || "—";
  return extra || "LIVE";
}

function scoreLeft(s: string): string {
  const m = /^(\S+)/.exec(s ?? "");
  return m ? m[1] : "";
}
function scoreRight(s: string): string {
  const parts = (s ?? "").split(/[-:]/);
  return parts.length >= 2 ? parts[1].trim() : "";
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  timeCol: {
    width: 52,
    alignItems: "flex-start",
    gap: 2,
  },
  timeText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "500",
  },
  liveMin: {
    color: colors.live,
    fontSize: 10,
    fontWeight: "700",
  },
  teamsCol: {
    flex: 1,
    gap: 6,
  },
  teamLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  teamName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  score: {
    color: colors.text,
    fontSize: 14,
    fontVariant: ["tabular-nums"],
    minWidth: 28,
    textAlign: "right",
  },
  bell: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
