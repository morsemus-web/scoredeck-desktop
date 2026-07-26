import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius, spacing, sportColor } from "@/lib/theme";
import { fetchSport } from "@/lib/api";
import { markOnboarded, setFavourites, type Favourite } from "@/lib/favourites";
import { registerNotifications } from "@/lib/notifications";

const SPORTS = ["Football", "Cricket", "Basketball", "F1"];

// Seeded so the picker is useful in the off-season or on a quiet day, when the
// live feed has nothing to harvest names from.
const SEED_LEAGUES: Record<string, string[]> = {
  Football: [
    "Premier League",
    "La Liga",
    "Serie A",
    "Bundesliga",
    "Ligue 1",
    "UEFA Champions League",
  ],
  Cricket: ["Indian Premier League", "ICC World Cup", "The Ashes", "Big Bash League"],
  Basketball: ["NBA"],
  F1: ["Formula 1"],
};

const SEED_TEAMS: Record<string, string[]> = {
  Football: [
    "Arsenal", "Liverpool", "Man City", "Man Utd", "Chelsea", "Tottenham",
    "Real Madrid", "Barcelona", "Bayern Munich", "PSG", "Juventus", "Inter Milan",
  ],
  Cricket: [
    "India", "Australia", "England", "Pakistan", "South Africa",
    "New Zealand", "Sri Lanka", "Bangladesh", "West Indies",
  ],
  Basketball: [
    "Los Angeles Lakers", "Boston Celtics", "Golden State Warriors",
    "Denver Nuggets", "Miami Heat", "New York Knicks",
  ],
  F1: [
    "Red Bull", "Ferrari", "Mercedes", "McLaren", "Aston Martin", "Williams",
  ],
};

export default function Onboarding() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<"leagues" | "teams">("leagues");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [liveLeagues, setLiveLeagues] = useState<Favourite[]>([]);
  const [liveTeams, setLiveTeams] = useState<Favourite[]>([]);
  const [pickedLeagues, setPickedLeagues] = useState<Favourite[]>([]);
  const [pickedTeams, setPickedTeams] = useState<Favourite[]>([]);

  // Harvest real names from today's fixtures so the list reflects what the user
  // can actually follow right now, then merge the seeds in behind them.
  useEffect(() => {
    let mounted = true;
    (async () => {
      const results = await Promise.all(SPORTS.map((s) => fetchSport(s)));
      if (!mounted) return;

      const leagues = new Map<string, Favourite>();
      const teams = new Map<string, Favourite>();

      results.flat().forEach((m) => {
        if (m.league) leagues.set(m.league.toLowerCase(), { name: m.league, sport: m.sport });
        if (m.sport !== "F1") {
          [m.team1, m.team2].forEach((t) => {
            if (t && t.length > 1) teams.set(t.toLowerCase(), { name: t, sport: m.sport });
          });
        }
      });

      setLiveLeagues([...leagues.values()]);
      setLiveTeams([...teams.values()]);
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const leagueOptions = useMemo(
    () => merge(liveLeagues, SEED_LEAGUES),
    [liveLeagues],
  );
  const teamOptions = useMemo(() => merge(liveTeams, SEED_TEAMS), [liveTeams]);

  const options = step === "leagues" ? leagueOptions : teamOptions;
  const picked = step === "leagues" ? pickedLeagues : pickedTeams;
  const setPicked = step === "leagues" ? setPickedLeagues : setPickedTeams;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.name.toLowerCase().includes(q));
  }, [options, query]);

  const grouped = useMemo(() => {
    const out: Record<string, Favourite[]> = {};
    filtered.forEach((o) => {
      (out[o.sport] ??= []).push(o);
    });
    return out;
  }, [filtered]);

  function toggle(item: Favourite) {
    setPicked((cur) =>
      cur.some((c) => c.name === item.name)
        ? cur.filter((c) => c.name !== item.name)
        : [...cur, item],
    );
  }

  async function finish() {
    setSaving(true);
    await setFavourites("league", pickedLeagues);
    await setFavourites("team", pickedTeams);
    await markOnboarded();
    // Ask for the notification permission only after the user has told us what
    // they care about — the prompt makes sense at that point.
    if (pickedLeagues.length + pickedTeams.length > 0) {
      await registerNotifications();
    }
    router.replace("/");
  }

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <Text style={s.kicker}>Step {step === "leagues" ? "1" : "2"} of 2</Text>
        <Text style={s.title}>
          {step === "leagues" ? "Follow your competitions" : "Follow your teams"}
        </Text>
        <Text style={s.sub}>
          {step === "leagues"
            ? "Pick the leagues you want at the top of your feed."
            : "We'll alert you when these teams kick off, score, and finish."}
        </Text>
      </View>

      <View style={s.body}>
        <View style={s.searchWrap}>
          <Ionicons name="search" size={16} color={colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={step === "leagues" ? "Search leagues" : "Search teams"}
            placeholderTextColor={colors.textMuted}
            style={s.search}
            autoCorrect={false}
          />
          {query ? (
            <Ionicons
              name="close-circle"
              size={16}
              color={colors.textMuted}
              onPress={() => setQuery("")}
            />
          ) : null}
        </View>

        {loading ? (
          <View style={s.center}>
            <ActivityIndicator color={colors.brand} />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={{ paddingBottom: 24, gap: spacing.lg }}
            keyboardShouldPersistTaps="handled"
          >
            {Object.entries(grouped).map(([sport, items]) => (
              <View key={sport} style={{ gap: spacing.sm }}>
                <Text style={[s.groupTitle, { color: sportColor(sport) }]}>{sport}</Text>
                <View style={s.chips}>
                  {items.map((o) => {
                    const on = picked.some((p) => p.name === o.name);
                    const accent = sportColor(sport);
                    return (
                      <Pressable
                        key={`${sport}-${o.name}`}
                        onPress={() => toggle(o)}
                        style={[
                          s.chip,
                          on && { backgroundColor: accent, borderColor: accent },
                        ]}
                      >
                        {on && <Ionicons name="checkmark" size={13} color="#fff" />}
                        <Text style={[s.chipText, on && { color: "#fff" }]} numberOfLines={1}>
                          {o.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}
            {filtered.length === 0 && (
              <Text style={s.empty}>Nothing matches “{query}”.</Text>
            )}
          </ScrollView>
        )}
      </View>

      <View style={[s.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <Pressable
          onPress={step === "leagues" ? () => router.replace("/") : () => setStep("leagues")}
          style={s.skip}
        >
          <Text style={s.skipText}>{step === "leagues" ? "Skip" : "Back"}</Text>
        </Pressable>
        <Pressable
          onPress={step === "leagues" ? () => setStep("teams") : finish}
          disabled={saving}
          style={[s.next, saving && { opacity: 0.6 }]}
        >
          <Text style={s.nextText}>
            {step === "leagues"
              ? `Next${pickedLeagues.length ? ` (${pickedLeagues.length})` : ""}`
              : saving
                ? "Saving…"
                : `Done${pickedTeams.length ? ` (${pickedTeams.length})` : ""}`}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function merge(live: Favourite[], seeds: Record<string, string[]>): Favourite[] {
  const seen = new Set(live.map((l) => l.name.toLowerCase()));
  const out = [...live];
  Object.entries(seeds).forEach(([sport, names]) => {
    names.forEach((name) => {
      if (!seen.has(name.toLowerCase())) {
        seen.add(name.toLowerCase());
        out.push({ name, sport });
      }
    });
  });
  return out;
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.brand },
  header: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, gap: 4 },
  kicker: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  title: { color: "#fff", fontSize: 22, fontWeight: "800" },
  sub: { color: "rgba(255,255,255,0.8)", fontSize: 12, lineHeight: 18 },

  body: {
    flex: 1,
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  search: { flex: 1, paddingVertical: 10, color: colors.text, fontSize: 14 },

  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  groupTitle: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    maxWidth: "100%",
  },
  chipText: { color: colors.textDim, fontSize: 12, fontWeight: "600", flexShrink: 1 },
  empty: { color: colors.textMuted, fontSize: 12, textAlign: "center", paddingTop: spacing.xl },

  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  skip: { paddingVertical: 13, paddingHorizontal: spacing.lg },
  skipText: { color: colors.textMuted, fontSize: 12, fontWeight: "700" },
  next: {
    flex: 1,
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: "center",
  },
  nextText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 13,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
});
