import { useEffect, useState, useCallback, useMemo } from "react";
import { View, ScrollView, RefreshControl, StyleSheet, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { fetchSport, fetchMe, type MobileMatch } from "@/lib/api";
import type { Session } from "@supabase/supabase-js";
import { colors, spacing } from "@/lib/theme";
import BrandHeader from "@/components/BrandHeader";
import SubTabs from "@/components/SubTabs";
import FilterBar from "@/components/FilterBar";
import LeagueCard from "@/components/LeagueCard";
import EmptyState from "@/components/EmptyState";
import SkeletonCard from "@/components/SkeletonCard";
import AdBanner from "@/components/AdBanner";
import BottomNav from "@/components/BottomNav";

const SPORTS = ["Cricket", "Football", "Basketball", "F1"] as const;
const SUB_TABS = ["Matches", "Leagues"] as const;

// Turn a day offset into a YYYY-MM-DD date string for the API
function dateForOffset(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().split("T")[0];
}

export default function Home() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [sport, setSport] = useState<string>("Football");
  const [subTab, setSubTab] = useState<string>("Matches");
  const [dayOffset, setDayOffset] = useState<number>(0);
  const [matches, setMatches] = useState<MobileMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [adsFree, setAdsFree] = useState(false);
  const [onlyLive, setOnlyLive] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) fetchMe().then((me) => setAdsFree(!!me?.adsFree));
    else setAdsFree(false);
  }, [session]);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchSport(sport, dateForOffset(dayOffset));
    setMatches(data);
    setLoading(false);
  }, [sport, dayOffset]);

  useEffect(() => {
    load();
    // Only auto-poll for today (live data). Yesterday/tomorrow are static.
    if (dayOffset !== 0) return;
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [load, dayOffset]);

  const filtered = useMemo(() => {
    let out = matches;
    if (onlyLive) out = out.filter((m) => m.isLive);
    if (query.trim()) {
      const q = query.toLowerCase();
      out = out.filter(
        (m) =>
          m.team1.toLowerCase().includes(q) ||
          m.team2.toLowerCase().includes(q) ||
          m.league.toLowerCase().includes(q),
      );
    }
    return out;
  }, [matches, onlyLive, query]);

  const grouped = useMemo(() => {
    const map = new Map<string, MobileMatch[]>();
    for (const m of filtered) {
      const bucket = map.get(m.league) ?? [];
      bucket.push(m);
      map.set(m.league, bucket);
    }
    return Array.from(map.entries()).map(([league, list]) => ({
      league,
      region: list[0]?.region,
      list,
    }));
  }, [filtered]);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  function openMatch(m: MobileMatch) {
    router.push({
      pathname: "/match/[id]",
      params: {
        id: (m as any).id ?? `${m.league}-${m.team1}-${m.team2}`,
        sport: m.sport,
        league: m.league,
        team1: m.team1,
        team2: m.team2,
        score: m.score,
        extra: m.extra,
        status: m.status,
      },
    });
  }

  if (!session) return <Gate onSignIn={() => router.push("/auth")} />;

  return (
    <View style={styles.root}>
      <BrandHeader
        sports={SPORTS}
        active={sport}
        onSelectSport={setSport}
        onAccountPress={() => router.push("/account")}
        onSearchChange={setQuery}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />
        }
      >
        <SubTabs tabs={SUB_TABS} active={subTab} onSelect={setSubTab} />

        {subTab === "Matches" ? (
          <>
            <FilterBar
              onlyLive={onlyLive}
              onToggleLive={() => setOnlyLive((v) => !v)}
              dayOffset={dayOffset}
              onOffsetChange={setDayOffset}
            />

            {!adsFree && <AdBanner />}

            {loading && matches.length === 0 ? (
              <>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </>
            ) : grouped.length === 0 ? (
              <EmptyState sport={sport} onlyLive={onlyLive} />
            ) : (
              grouped.map((g) => (
                <LeagueCard
                  key={g.league}
                  sport={sport}
                  league={g.league}
                  region={g.region}
                  matches={g.list}
                  onMatchPress={openMatch}
                />
              ))
            )}
          </>
        ) : (
          <LeaguesView sport={sport} matches={matches} />
        )}
      </ScrollView>

      <BottomNav activeSport={sport} active="feed" onPress={() => {}} />
    </View>
  );
}

// Simple leagues view: unique league names with match count, tap to filter
function LeaguesView({ sport, matches }: { sport: string; matches: MobileMatch[] }) {
  const leagues = useMemo(() => {
    const counts = new Map<string, { region?: string; count: number; live: number }>();
    for (const m of matches) {
      const cur = counts.get(m.league) ?? { region: m.region, count: 0, live: 0 };
      cur.count += 1;
      if (m.isLive) cur.live += 1;
      counts.set(m.league, cur);
    }
    return Array.from(counts.entries()).map(([league, meta]) => ({ league, ...meta }));
  }, [matches]);

  if (!leagues.length) {
    return (
      <View style={{ padding: 40, alignItems: "center" }}>
        <Text style={{ color: colors.textMuted, fontSize: 13, textAlign: "center" }}>
          No {sport} leagues have data today.
        </Text>
      </View>
    );
  }

  return (
    <View style={{ marginTop: spacing.md }}>
      {leagues.map((l) => (
        <View key={l.league} style={leaguesStyles.row}>
          <View style={{ flex: 1 }}>
            <Text style={leaguesStyles.name}>{l.league}</Text>
            {l.region && <Text style={leaguesStyles.region}>{l.region}</Text>}
          </View>
          <View style={leaguesStyles.badge}>
            {l.live > 0 && (
              <Text style={leaguesStyles.liveBadge}>{l.live} LIVE</Text>
            )}
            <Text style={leaguesStyles.count}>{l.count}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const leaguesStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.card,
    marginHorizontal: spacing.md,
    marginBottom: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  name: { color: colors.text, fontSize: 14, fontWeight: "600" },
  region: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  badge: { flexDirection: "row", alignItems: "center", gap: 8 },
  liveBadge: {
    color: colors.live,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  count: {
    color: colors.textDim,
    fontSize: 12,
    fontVariant: ["tabular-nums"],
    fontWeight: "600",
    minWidth: 20,
    textAlign: "right",
  },
});

function Gate({ onSignIn }: { onSignIn: () => void }) {
  return (
    <View style={gate.wrap}>
      <View style={gate.brand}>
        <Text style={gate.brandText}>ScoreDeck</Text>
      </View>
      <Text style={gate.title}>Live sport in one place</Text>
      <Text style={gate.sub}>
        Cricket, football, basketball and F1 — free with a ScoreDeck account.
        Your first month is ad-free as a trial.
      </Text>
      <Pressable onPress={onSignIn} style={gate.btn}>
        <Text style={gate.btnText}>Sign in with email</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
});

const gate = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    gap: spacing.md,
  },
  brand: { marginBottom: spacing.xl },
  brandText: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 2,
  },
  title: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  sub: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 320,
    marginBottom: spacing.lg,
  },
  btn: {
    backgroundColor: "#fff",
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 999,
  },
  btnText: {
    color: colors.brand,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
});
