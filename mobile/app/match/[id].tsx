import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius, spacing, shadow, sportColor } from "@/lib/theme";
import LiveDot from "@/components/LiveDot";
import TeamBadge from "@/components/TeamBadge";
import CricketPanel from "@/components/detail/CricketPanel";
import FootballPanel from "@/components/detail/FootballPanel";
import BasketballPanel from "@/components/detail/BasketballPanel";
import F1Panel from "@/components/detail/F1Panel";
import { Card, Empty, KeyValue } from "@/components/detail/Shared";
import {
  fetchCricketDetail,
  fetchFootballDetail,
  fetchBasketballDetail,
  fetchF1Detail,
  type CricketDetail,
  type FootballDetail,
  type BasketballDetail,
  type F1Detail,
} from "@/lib/api";
import { isFavourite, toggleFavourite } from "@/lib/favourites";

type Detail =
  | { sport: "Cricket"; data: CricketDetail }
  | { sport: "Football"; data: FootballDetail }
  | { sport: "Basketball"; data: BasketballDetail }
  | { sport: "F1"; data: F1Detail };

// Live pages should keep moving without the user pulling to refresh.
const REFRESH_MS = 20000;

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
    team1Logo?: string;
    team2Logo?: string;
  }>();

  const sport = (params.sport as string) || "";
  const accent = sportColor(sport);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [starred, setStarred] = useState(false);

  const team1 = (params.team1 as string) || "Team 1";
  const team2 = (params.team2 as string) || "Team 2";
  const league = (params.league as string) || sport;
  const isLive = params.status === "live";

  useEffect(() => {
    isFavourite("team", team1).then(setStarred);
  }, [team1]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const id = params.id;
      if (!id || !sport) {
        if (mounted) setLoading(false);
        return;
      }

      let next: Detail | null = null;
      if (sport === "Cricket") {
        const d = await fetchCricketDetail(id);
        if (d) next = { sport: "Cricket", data: d };
      } else if (sport === "Football") {
        const d = await fetchFootballDetail(id);
        if (d) next = { sport: "Football", data: d };
      } else if (sport === "Basketball") {
        const d = await fetchBasketballDetail(id);
        if (d) next = { sport: "Basketball", data: d };
      } else if (sport === "F1") {
        const d = await fetchF1Detail(id);
        if (d) next = { sport: "F1", data: d };
      }

      if (mounted) {
        setDetail(next);
        setLoading(false);
      }
    }

    load();
    const timer = isLive ? setInterval(load, REFRESH_MS) : null;
    return () => {
      mounted = false;
      if (timer) clearInterval(timer);
    };
  }, [params.id, sport, isLive]);

  const headerScore = resolveScore(detail, params.score as string);

  return (
    <View style={styles.root}>
      <View style={[styles.headerBar, { backgroundColor: accent, paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerLeague} numberOfLines={1}>
            {league}
          </Text>
          <Text style={styles.headerSub} numberOfLines={1}>
            {isLive
              ? "Live now"
              : params.status === "final"
                ? "Full time"
                : (params.extra as string) || "Match"}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={async () => setStarred(await toggleFavourite("team", team1, sport))}
        >
          <Ionicons name={starred ? "star" : "star-outline"} size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Scoreboard stays pinned above the tabs */}
      <View style={[styles.scoreCard, { backgroundColor: accent }]}>
        <View style={styles.scoreTeamCol}>
          <TeamBadge
            name={team1}
            logo={logoFor(detail, "team1") || (params.team1Logo as string)}
            color="#ffffff"
            size={44}
          />
          <Text style={styles.teamName} numberOfLines={2}>
            {team1}
          </Text>
        </View>
        <View style={styles.scoreMiddle}>
          {isLive && <LiveDot size={7} />}
          <Text style={styles.scoreBig}>{headerScore || "vs"}</Text>
          <Text style={styles.scoreExtra} numberOfLines={1}>
            {(params.extra as string) || ""}
          </Text>
        </View>
        <View style={styles.scoreTeamCol}>
          <TeamBadge
            name={team2}
            logo={logoFor(detail, "team2") || (params.team2Logo as string)}
            color="#ffffff"
            size={44}
          />
          <Text style={styles.teamName} numberOfLines={2}>
            {team2}
          </Text>
        </View>
      </View>

      <View style={styles.body}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={accent} />
          </View>
        ) : detail?.sport === "Cricket" ? (
          <CricketPanel detail={detail.data} accent={accent} isLive={isLive} />
        ) : detail?.sport === "Football" ? (
          <FootballPanel detail={detail.data} accent={accent} home={team1} away={team2} />
        ) : detail?.sport === "Basketball" ? (
          <BasketballPanel detail={detail.data} accent={accent} />
        ) : detail?.sport === "F1" ? (
          <F1Panel detail={detail.data} accent={accent} raceId={params.id as string} />
        ) : (
          <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}>
            <Card title="Match">
              <KeyValue label="Competition" value={league} />
              <KeyValue label="Status" value={(params.extra as string) || ""} />
              <KeyValue label="Score" value={(params.score as string) || ""} />
            </Card>
            <Card>
              <Empty text="Detailed metrics aren't available for this fixture." />
            </Card>
          </ScrollView>
        )}
      </View>
    </View>
  );
}

// ESPN ships proper crests in the detail payload; the list route only has them
// for football and basketball, so prefer the detail when it arrives.
function logoFor(detail: Detail | null, side: "team1" | "team2"): string {
  if (detail?.sport === "Basketball") {
    const t = side === "team1" ? detail.data.teams?.away : detail.data.teams?.home;
    return t?.logo ?? "";
  }
  return "";
}

function resolveScore(detail: Detail | null, fallback: string): string {
  if (detail?.sport === "Basketball") {
    const { away, home } = detail.data.teams ?? {};
    if (away?.score || home?.score) return `${away?.score ?? 0} - ${home?.score ?? 0}`;
  }
  if (detail?.sport === "Cricket") {
    const innings = detail.data.innings ?? [];
    if (innings.length) return innings.map((i) => i.total || i.score).filter(Boolean).join(" · ");
  }
  return fallback ?? "";
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  iconBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  headerLeague: { color: "#fff", fontSize: 15, fontWeight: "700" },
  headerSub: { color: "rgba(255,255,255,0.75)", fontSize: 11, marginTop: 2 },

  scoreCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  scoreTeamCol: { flex: 1, alignItems: "center", gap: spacing.sm },
  scoreMiddle: { alignItems: "center", gap: 5, paddingHorizontal: spacing.md, maxWidth: 150 },
  scoreBig: {
    color: "#fff",
    fontSize: 19,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
    textAlign: "center",
  },
  scoreExtra: { color: "rgba(255,255,255,0.8)", fontSize: 10 },
  teamName: { color: "#fff", fontSize: 12, fontWeight: "600", textAlign: "center" },

  body: {
    flex: 1,
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    overflow: "hidden",
    ...shadow.card,
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: spacing.xxl },
});
