import { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius, spacing, shadow, sportColor } from "@/lib/theme";
import LiveDot from "@/components/LiveDot";
import TeamBadge from "@/components/TeamBadge";
import { fetchMatchDetail, type MatchDetail } from "@/lib/api";

export default function MatchScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{
    id?: string;
    sport?: string;
    league?: string;
    team1?: string;
    team2?: string;
    score?: string;
    extra?: string;
    status?: string;
  }>();

  const sport = (params.sport as string) || "";
  const accent = sportColor(sport);
  const [detail, setDetail] = useState<MatchDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!params.id || !sport) {
        setLoading(false);
        return;
      }
      const d = await fetchMatchDetail(sport, params.id);
      if (mounted) {
        setDetail(d);
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [params.id, sport]);

  const team1 = detail?.team1 || (params.team1 as string) || "Team 1";
  const team2 = detail?.team2 || (params.team2 as string) || "Team 2";
  const score = detail?.score || (params.score as string) || "";
  const league = detail?.league || (params.league as string) || sport;
  const extra = detail?.extra || (params.extra as string) || "";
  const isLive = detail?.status === "live" || params.status === "live";

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={[styles.headerBar, { backgroundColor: accent }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerLeague} numberOfLines={1}>{league}</Text>
          <Text style={styles.headerSub}>
            {isLive ? "Live now" : detail?.status === "final" ? "Full time" : extra || "Match"}
          </Text>
        </View>
        <TouchableOpacity style={styles.back}>
          <Ionicons name="star-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={{ padding: spacing.md, gap: spacing.md, paddingBottom: 40 }}>
        {/* Scoreboard */}
        <View style={styles.scoreCard}>
          <View style={styles.scoreTeamCol}>
            <TeamBadge name={team1} color={accent} size={44} />
            <Text style={styles.teamName} numberOfLines={2}>{team1}</Text>
          </View>
          <View style={styles.scoreMiddle}>
            {isLive && <LiveDot size={7} />}
            <Text style={[styles.scoreBig, isLive && { color: accent }]}>
              {score || "—"}
            </Text>
            <Text style={styles.scoreExtra}>{extra}</Text>
          </View>
          <View style={styles.scoreTeamCol}>
            <TeamBadge name={team2} color={accent} size={44} />
            <Text style={styles.teamName} numberOfLines={2}>{team2}</Text>
          </View>
        </View>

        {/* Meta card */}
        {(detail?.venue || detail?.startTime) && (
          <View style={styles.card}>
            {detail?.startTime && (
              <MetaRow icon="calendar-outline" label="Start" value={fmtDate(detail.startTime)} />
            )}
            {detail?.venue && (
              <MetaRow icon="location-outline" label="Venue" value={detail.venue} />
            )}
          </View>
        )}

        {/* Timeline / Key events */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Key events</Text>
          {loading ? (
            <View style={{ paddingVertical: spacing.xl, alignItems: "center" }}>
              <ActivityIndicator color={accent} />
            </View>
          ) : detail?.timeline && detail.timeline.length > 0 ? (
            detail.timeline.map((t, i) => (
              <View key={i} style={styles.timelineRow}>
                <View style={[styles.timelineDot, { backgroundColor: accent }]} />
                {t.time && <Text style={styles.timelineTime}>{t.time}</Text>}
                <Text style={styles.timelineText}>{t.text}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.empty}>
              {sport === "Basketball" || sport === "F1"
                ? "Detailed events aren't available for this sport yet."
                : "No key events available."}
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function MetaRow({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={styles.metaRow}>
      <Ionicons name={icon} size={16} color={colors.textMuted} />
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function fmtDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.brand },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  back: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  headerLeague: { color: "#fff", fontSize: 15, fontWeight: "700" },
  headerSub: { color: "rgba(255,255,255,0.75)", fontSize: 11, marginTop: 2 },
  body: {
    flex: 1,
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  },

  scoreCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow.card,
  },
  scoreTeamCol: { flex: 1, alignItems: "center", gap: spacing.sm },
  scoreMiddle: { alignItems: "center", gap: 6, paddingHorizontal: spacing.md },
  scoreBig: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  scoreExtra: { color: colors.textMuted, fontSize: 11 },
  teamName: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },

  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...shadow.card,
  },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: spacing.sm,
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: 8,
  },
  metaLabel: { color: colors.textMuted, fontSize: 12, minWidth: 60 },
  metaValue: { color: colors.text, fontSize: 13, flex: 1 },

  timelineRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    paddingVertical: 8,
  },
  timelineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 8,
  },
  timelineTime: {
    color: colors.textMuted,
    fontSize: 11,
    minWidth: 36,
    fontFamily: "Courier",
  },
  timelineText: {
    color: colors.text,
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  empty: {
    color: colors.textMuted,
    fontSize: 12,
    paddingVertical: spacing.md,
    textAlign: "center",
  },
});
