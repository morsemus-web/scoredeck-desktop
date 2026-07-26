import { useMemo, useState } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { colors, radius, spacing } from "@/lib/theme";
import type { FootballDetail, FootballEvent, FootballLineup } from "@/lib/api";
import {
  Card,
  TabBar,
  StatTable,
  CompareRow,
  KeyValue,
  Empty,
  Avatar,
  FormChips,
} from "./Shared";

// BBC's stat keys are camelCase; these are the ones worth a row, in the order a
// match report would list them. Anything else present still gets shown, with a
// label derived from the key.
const STAT_ORDER = [
  "possessionPercentage",
  "shotsTotal",
  "shotsOnTarget",
  "shotsOffTarget",
  "shotsBlocked",
  "cornersWon",
  "offsides",
  "foulsCommitted",
  "yellowCards",
  "redCards",
  "passesTotal",
  "passesAccurate",
  "tacklesTotal",
  "saves",
];

const STAT_LABELS: Record<string, string> = {
  possessionPercentage: "Possession (%)",
  shotsTotal: "Total Shots",
  shotsOnTarget: "Shots On Target",
  shotsOffTarget: "Shots Off Target",
  shotsBlocked: "Blocked Shots",
  cornersWon: "Corners",
  offsides: "Offsides",
  foulsCommitted: "Fouls",
  yellowCards: "Yellow Cards",
  redCards: "Red Cards",
  passesTotal: "Passes",
  passesAccurate: "Accurate Passes",
  tacklesTotal: "Tackles",
  saves: "Saves",
};

function labelFor(key: string): string {
  return (
    STAT_LABELS[key] ??
    key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase())
  );
}

const EVENT_ICON: Record<string, string> = {
  Goal: "⚽",
  "Yellow Card": "🟨",
  "Red Card": "🟥",
  Substitution: "🔁",
  "Penalty Goal": "⚽",
  "Own Goal": "⚽",
};

export default function FootballPanel({
  detail,
  accent,
  home,
  away,
}: {
  detail: FootballDetail;
  accent: string;
  home: string;
  away: string;
}) {
  const tabs = [
    { key: "timeline", label: "Timeline" },
    { key: "stats", label: "Stats" },
    { key: "lineups", label: "Lineups" },
    { key: "h2h", label: "H2H & Form" },
    { key: "standings", label: "Standings" },
  ];
  const [tab, setTab] = useState("timeline");

  const statKeys = useMemo(() => {
    const present = new Set([
      ...Object.keys(detail.stats?.home ?? {}),
      ...Object.keys(detail.stats?.away ?? {}),
    ]);
    const ordered = STAT_ORDER.filter((k) => present.has(k));
    const rest = [...present].filter((k) => !STAT_ORDER.includes(k)).sort();
    return [...ordered, ...rest];
  }, [detail.stats]);

  // One chronological list, tagged with which side it belongs to.
  const timeline = useMemo(() => {
    const tag = (arr: FootballEvent[], side: "home" | "away") =>
      (arr ?? []).map((e) => ({ ...e, side }));
    return [...tag(detail.events?.home, "home"), ...tag(detail.events?.away, "away")].sort(
      (a, b) => minute(a.time) - minute(b.time),
    );
  }, [detail.events]);

  return (
    <>
      <TabBar tabs={tabs} active={tab} onChange={setTab} accent={accent} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.md, gap: spacing.md, paddingBottom: 48 }}
      >
        {/* ---------- TIMELINE ---------- */}
        {tab === "timeline" && (
          <Card title="Match Timeline" padded={false}>
            {timeline.length ? (
              timeline.map((e, i) => (
                <View key={i} style={s.evRow}>
                  <Text style={s.evMin}>{e.time || "—"}</Text>
                  <Text style={s.evIcon}>{EVENT_ICON[e.type] ?? "•"}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={s.evPlayer} numberOfLines={1}>
                      {e.player}
                    </Text>
                    <Text style={s.evType}>
                      {e.type} · {e.side === "home" ? home : away}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <Empty text="No events recorded for this fixture yet." />
            )}
          </Card>
        )}

        {/* ---------- STATS ---------- */}
        {tab === "stats" && (
          <Card title={`${home}  vs  ${away}`}>
            {statKeys.length ? (
              statKeys.map((k) => {
                const h = detail.stats.home?.[k] ?? 0;
                const a = detail.stats.away?.[k] ?? 0;
                const total = h + a || 1;
                return (
                  <CompareRow
                    key={k}
                    label={labelFor(k)}
                    left={String(h)}
                    right={String(a)}
                    leftPct={(h / total) * 100}
                    accentLeft={accent}
                    accentRight={colors.brand}
                  />
                );
              })
            ) : (
              <Empty text="Statistics are not available for this fixture." />
            )}
          </Card>
        )}

        {/* ---------- LINEUPS ---------- */}
        {tab === "lineups" && (
          <>
            <LineupCard title={home} lineup={detail.lineups?.home} accent={accent} />
            <LineupCard title={away} lineup={detail.lineups?.away} accent={colors.brand} />
            {!detail.lineups?.home && !detail.lineups?.away && (
              <Card>
                <Empty text="Lineups haven't been announced." />
              </Card>
            )}
          </>
        )}

        {/* ---------- H2H & FORM ---------- */}
        {tab === "h2h" && (
          <>
            <Card title="Recent Form">
              <View style={s.formRow}>
                <Text style={s.formTeam} numberOfLines={1}>
                  {home}
                </Text>
                <FormChips form={(detail.forms?.home ?? []).map((f) => f.result)} />
              </View>
              <View style={s.formRow}>
                <Text style={s.formTeam} numberOfLines={1}>
                  {away}
                </Text>
                <FormChips form={(detail.forms?.away ?? []).map((f) => f.result)} />
              </View>
            </Card>

            <Card title="Head to Head">
              <CompareRow
                label={`${detail.h2h?.summary?.total ?? 0} meetings`}
                left={`${home} ${detail.h2h?.summary?.home_wins ?? 0}`}
                right={`${detail.h2h?.summary?.away_wins ?? 0} ${away}`}
                leftPct={
                  ((detail.h2h?.summary?.home_wins ?? 0) /
                    ((detail.h2h?.summary?.home_wins ?? 0) +
                      (detail.h2h?.summary?.away_wins ?? 0) || 1)) *
                  100
                }
                accentLeft={accent}
                accentRight={colors.brand}
              />
              <KeyValue label="Draws" value={String(detail.h2h?.summary?.draws ?? 0)} />
              <KeyValue label="First played" value={detail.h2h?.summary?.first_played ?? ""} />
            </Card>

            <Card title="Last Five Meetings" padded={false}>
              {detail.h2h?.last_five?.length ? (
                detail.h2h.last_five.map((m, i) => (
                  <View key={i} style={s.h2hRow}>
                    <Text style={s.h2hDate}>{m.date}</Text>
                    <Text style={s.h2hTeams} numberOfLines={1}>
                      {m.home_team} {m.home_score}–{m.away_score} {m.away_team}
                    </Text>
                    <Text style={s.h2hComp} numberOfLines={1}>
                      {m.tournament}
                    </Text>
                  </View>
                ))
              ) : (
                <Empty text="No previous meetings on record." />
              )}
            </Card>
          </>
        )}

        {/* ---------- STANDINGS ---------- */}
        {tab === "standings" &&
          (detail.standings?.length ? (
            detail.standings.map((stage, i) => (
              <Card key={i} title={stage.stage_name}>
                <StatTable
                  columns={["#", "Team", "P", "W", "D", "L", "GD", "Pts"]}
                  widths={[26, 140, 30, 30, 30, 30, 38, 38]}
                  accentColumn={7}
                  accent={accent}
                  rows={stage.teams.map((t) => ({
                    key: `${t.rank}-${t.name}`,
                    cells: [
                      String(t.rank),
                      <Text key="n" style={s.standTeam} numberOfLines={1}>
                        {t.name}
                      </Text>,
                      String(t.played),
                      String(t.wins),
                      String(t.draws),
                      String(t.losses),
                      (t.goal_diff > 0 ? "+" : "") + t.goal_diff,
                      String(t.points),
                    ],
                  }))}
                />
              </Card>
            ))
          ) : (
            <Card>
              <Empty text="No league table for this competition." />
            </Card>
          ))}
      </ScrollView>
    </>
  );
}

function LineupCard({
  title,
  lineup,
  accent,
}: {
  title: string;
  lineup?: FootballLineup | null;
  accent: string;
}) {
  if (!lineup) return null;
  const starters = (lineup.pitch ?? []).flat();

  return (
    <Card title={`${title} — ${lineup.formation}`} padded={false}>
      {starters.map((p, i) => (
        <View key={`${p.name}-${i}`} style={s.lineupRow}>
          <Text style={[s.shirt, { color: accent }]}>{p.shirt_number || "–"}</Text>
          <Avatar fallback={p.name || "?"} accent={accent} size={24} />
          <View style={{ flex: 1 }}>
            <Text style={s.lineupName} numberOfLines={1}>
              {p.name}
            </Text>
            {p.position ? <Text style={s.lineupPos}>{p.position}</Text> : null}
          </View>
        </View>
      ))}
      {lineup.substitutes?.length ? (
        <>
          <Text style={s.subsHead}>Substitutes</Text>
          {lineup.substitutes.map((p, i) => (
            <View key={`sub-${p.name}-${i}`} style={s.lineupRow}>
              <Text style={[s.shirt, { color: colors.textMuted }]}>
                {p.shirt_number || "–"}
              </Text>
              <Avatar fallback={p.name || "?"} accent={colors.textMuted} size={24} />
              <Text style={[s.lineupName, { flex: 1 }]} numberOfLines={1}>
                {p.name}
              </Text>
            </View>
          ))}
        </>
      ) : null}
    </Card>
  );
}

function minute(t: string): number {
  return parseInt((t ?? "").replace(/[^\d]/g, ""), 10) || 0;
}

const s = StyleSheet.create({
  evRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + "80",
  },
  evMin: {
    width: 34,
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  evIcon: { fontSize: 13, width: 20, textAlign: "center" },
  evPlayer: { color: colors.text, fontSize: 13, fontWeight: "600" },
  evType: { color: colors.textMuted, fontSize: 10, marginTop: 1 },

  formRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingVertical: 8,
  },
  formTeam: { color: colors.text, fontSize: 13, fontWeight: "600", flexShrink: 1 },

  h2hRow: {
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + "80",
    gap: 2,
  },
  h2hDate: { color: colors.textMuted, fontSize: 10 },
  h2hTeams: { color: colors.text, fontSize: 13, fontWeight: "600" },
  h2hComp: { color: colors.textMuted, fontSize: 10 },

  lineupRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + "70",
  },
  shirt: {
    width: 24,
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
    fontVariant: ["tabular-nums"],
  },
  lineupName: { color: colors.text, fontSize: 13, fontWeight: "600" },
  lineupPos: { color: colors.textMuted, fontSize: 10, marginTop: 1 },
  subsHead: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: 6,
    backgroundColor: colors.cardMuted,
  },

  standTeam: { color: colors.text, fontSize: 12, fontWeight: "600" },
});
