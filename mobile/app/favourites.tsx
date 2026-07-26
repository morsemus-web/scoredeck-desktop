import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius, spacing, sportColor } from "@/lib/theme";
import { fetchSport, type MobileMatch } from "@/lib/api";
import {
  getAllFavourites,
  matchIsFavourite,
  toggleFavourite,
  type Favourite,
} from "@/lib/favourites";
import LeagueCard from "@/components/LeagueCard";
import BottomNav from "@/components/BottomNav";

const SPORTS = ["Football", "Cricket", "Basketball", "F1"];

export default function FavouritesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [favs, setFavs] = useState<{ teams: Favourite[]; leagues: Favourite[] }>({
    teams: [],
    leagues: [],
  });
  const [matches, setMatches] = useState<MobileMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const f = await getAllFavourites();
    setFavs(f);
    if (f.teams.length === 0 && f.leagues.length === 0) {
      setMatches([]);
      setLoading(false);
      return;
    }
    const all = (await Promise.all(SPORTS.map((s) => fetchSport(s)))).flat();
    setMatches(all.filter((m) => matchIsFavourite(m, f)));
    setLoading(false);
  }, []);

  // Re-read on focus so a star tapped on a match page shows up immediately.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  useEffect(() => {
    load();
  }, [load]);

  const empty = favs.teams.length === 0 && favs.leagues.length === 0;

  async function remove(kind: "team" | "league", f: Favourite) {
    await toggleFavourite(kind, f.name, f.sport);
    load();
  }

  return (
    <View style={s.root}>
      <View style={[s.header, { paddingTop: insets.top + spacing.md }]}>
        <Text style={s.title}>Favourites</Text>
        <TouchableOpacity onPress={() => router.push("/onboarding")} style={s.editBtn}>
          <Ionicons name="add" size={16} color="#fff" />
          <Text style={s.editText}>Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={s.body}
        contentContainerStyle={{ padding: spacing.md, gap: spacing.md, paddingBottom: 24 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={colors.brand}
            onRefresh={async () => {
              setRefreshing(true);
              await load();
              setRefreshing(false);
            }}
          />
        }
      >
        {empty ? (
          <View style={s.emptyWrap}>
            <Ionicons name="star-outline" size={40} color={colors.textMuted} />
            <Text style={s.emptyTitle}>Nothing followed yet</Text>
            <Text style={s.emptyText}>
              Star a team from any match page, or pick a few now — we'll put them at the
              top of your feed and alert you when they play.
            </Text>
            <TouchableOpacity onPress={() => router.push("/onboarding")} style={s.cta}>
              <Text style={s.ctaText}>Choose favourites</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {loading ? (
              <ActivityIndicator color={colors.brand} style={{ marginTop: spacing.xl }} />
            ) : matches.length > 0 ? (
              <LeagueCard
                sport={matches[0].sport}
                league="Today"
                region="Your favourites"
                matches={matches}
                onMatchPress={(m) =>
                  router.push({
                    pathname: "/match/[id]",
                    params: {
                      id: m.id || `${m.league}-${m.team1}-${m.team2}`,
                      sport: m.sport,
                      league: m.league,
                      team1: m.team1,
                      team2: m.team2,
                      score: m.score,
                      extra: m.extra,
                      status: m.status,
                    },
                  })
                }
              />
            ) : (
              <View style={s.card}>
                <Text style={s.noneToday}>
                  None of your favourites are playing today.
                </Text>
              </View>
            )}

            <ChipSection
              title="Teams"
              items={favs.teams}
              onRemove={(f) => remove("team", f)}
            />
            <ChipSection
              title="Competitions"
              items={favs.leagues}
              onRemove={(f) => remove("league", f)}
            />
          </>
        )}
      </ScrollView>

      <BottomNav
        activeSport="Football"
        active="favourites"
        onPress={(k) => {
          if (k === "feed") router.replace("/");
          if (k === "notifications") router.replace("/alerts");
        }}
      />
    </View>
  );
}

function ChipSection({
  title,
  items,
  onRemove,
}: {
  title: string;
  items: Favourite[];
  onRemove: (f: Favourite) => void;
}) {
  if (items.length === 0) return null;
  return (
    <View style={s.card}>
      <Text style={s.cardTitle}>{title}</Text>
      <View style={s.chips}>
        {items.map((f) => {
          const accent = sportColor(f.sport);
          return (
            <TouchableOpacity
              key={`${f.sport}-${f.name}`}
              onPress={() => onRemove(f)}
              style={[s.chip, { borderColor: accent + "55", backgroundColor: accent + "12" }]}
            >
              <Text style={[s.chipText, { color: accent }]} numberOfLines={1}>
                {f.name}
              </Text>
              <Ionicons name="close" size={13} color={accent} />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.brand,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: { color: "#fff", fontSize: 20, fontWeight: "800" },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radius.pill,
  },
  editText: { color: "#fff", fontSize: 12, fontWeight: "700" },

  body: { flex: 1 },

  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  cardTitle: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    maxWidth: "100%",
  },
  chipText: { fontSize: 12, fontWeight: "700", flexShrink: 1 },

  noneToday: { color: colors.textMuted, fontSize: 13, textAlign: "center", paddingVertical: 8 },

  emptyWrap: {
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  emptyTitle: { color: colors.text, fontSize: 17, fontWeight: "700" },
  emptyText: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
  cta: {
    backgroundColor: colors.brand,
    paddingHorizontal: spacing.xl,
    paddingVertical: 13,
    borderRadius: radius.md,
    marginTop: spacing.sm,
  },
  ctaText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
});
