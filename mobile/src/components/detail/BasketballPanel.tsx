import { useState } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { colors, spacing } from "@/lib/theme";
import type { BasketballDetail } from "@/lib/api";
import {
  Card,
  TabBar,
  StatTable,
  CompareRow,
  KeyValue,
  Empty,
  Avatar,
} from "./Shared";

// ESPN gives most team stats as "made-attempted" or a plain count. Only the
// numeric ones can drive a comparison bar; the rest render as a plain pair.
function numeric(v: string): number | null {
  const n = parseFloat(String(v).replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

export default function BasketballPanel({
  detail,
  accent,
}: {
  detail: BasketballDetail;
  accent: string;
}) {
  const tabs = [
    { key: "summary", label: "Summary" },
    { key: "box", label: "Box Score" },
    { key: "stats", label: "Team Stats" },
    { key: "plays", label: "Play by Play" },
    { key: "standings", label: "Standings" },
  ];
  const [tab, setTab] = useState("summary");
  const [teamIdx, setTeamIdx] = useState(0);

  const away = detail.teams?.away;
  const home = detail.teams?.home;

  return (
    <>
      <TabBar tabs={tabs} active={tab} onChange={setTab} accent={accent} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.md, gap: spacing.md, paddingBottom: 48 }}
      >
        {/* ---------- SUMMARY ---------- */}
        {tab === "summary" && (
          <>
            {detail.linescoreLabels?.length ? (
              <Card title="Scoring by Period">
                <StatTable
                  columns={["Team", ...detail.linescoreLabels, "T"]}
                  widths={[86, ...detail.linescoreLabels.map(() => 36), 42]}
                  accentColumn={detail.linescoreLabels.length + 1}
                  accent={accent}
                  rows={[away, home]
                    .filter(Boolean)
                    .map((t) => ({
                      key: t!.abbreviation,
                      cells: [
                        t!.abbreviation,
                        ...detail.linescoreLabels.map((_, i) => t!.linescores?.[i] ?? "–"),
                        t!.score,
                      ],
                    }))}
                />
              </Card>
            ) : null}

            <Card title="Game Info">
              <KeyValue label="Status" value={detail.statusText} />
              <KeyValue label="Tip-off" value={fmt(detail.startDate)} />
              <KeyValue
                label="Venue"
                value={[detail.venue, detail.venueCity].filter(Boolean).join(", ")}
              />
              <KeyValue label="Broadcast" value={(detail.broadcasts ?? []).join(", ")} />
              <KeyValue
                label="Attendance"
                value={detail.attendance ? detail.attendance.toLocaleString() : ""}
              />
              <KeyValue label="Officials" value={(detail.officials ?? []).join(", ")} />
              <KeyValue label={away?.abbreviation ?? "Away"} value={away?.record ?? ""} />
              <KeyValue label={home?.abbreviation ?? "Home"} value={home?.record ?? ""} />
            </Card>

            {detail.leaders?.length ? (
              <Card title="Game Leaders" padded={false}>
                {detail.leaders.map((t) =>
                  t.categories.map((cat) =>
                    cat.leaders.slice(0, 1).map((l, i) => (
                      <View key={`${t.team}-${cat.label}-${i}`} style={s.leaderRow}>
                        <Avatar uri={l.headshot} fallback={l.name} accent={accent} size={32} />
                        <View style={{ flex: 1 }}>
                          <Text style={s.leaderName} numberOfLines={1}>
                            {l.name}
                          </Text>
                          <Text style={s.leaderMeta}>
                            {t.team} · {cat.label}
                          </Text>
                        </View>
                        <Text style={[s.leaderVal, { color: accent }]} numberOfLines={1}>
                          {l.value}
                        </Text>
                      </View>
                    )),
                  ),
                )}
              </Card>
            ) : null}

            {detail.injuries?.some((t) => t.players.length) ? (
              <Card title="Injury Report" padded={false}>
                {detail.injuries.flatMap((t) =>
                  t.players.map((p, i) => (
                    <View key={`${t.team}-${p.name}-${i}`} style={s.injuryRow}>
                      <Text style={s.injuryTeam}>{t.team}</Text>
                      <Text style={s.injuryName} numberOfLines={1}>
                        {p.name}
                      </Text>
                      <Text style={s.injuryStatus}>{p.status}</Text>
                    </View>
                  )),
                )}
              </Card>
            ) : null}
          </>
        )}

        {/* ---------- BOX SCORE ---------- */}
        {tab === "box" &&
          (detail.boxscore?.length ? (
            <>
              <View style={s.pills}>
                {detail.boxscore.map((t, i) => (
                  <Text
                    key={t.team}
                    onPress={() => setTeamIdx(i)}
                    style={[
                      s.pill,
                      i === teamIdx
                        ? { backgroundColor: accent, color: "#fff" }
                        : { color: colors.textDim },
                    ]}
                  >
                    {t.team}
                  </Text>
                ))}
              </View>
              {(() => {
                const t = detail.boxscore[teamIdx];
                if (!t) return null;
                return (
                  <Card title={t.teamFull}>
                    <StatTable
                      columns={["Player", ...t.labels.slice(1)]}
                      widths={[150, ...t.labels.slice(1).map(() => 44)]}
                      accentColumn={1}
                      accent={accent}
                      rows={t.players
                        .filter((p) => !p.didNotPlay)
                        .map((p, i) => ({
                          key: `${p.name}-${i}`,
                          cells: [
                            <View key="n" style={s.nameCell}>
                              <Avatar
                                uri={p.headshot}
                                fallback={p.name}
                                accent={accent}
                                size={24}
                              />
                              <View style={{ flex: 1 }}>
                                <Text style={s.playerName} numberOfLines={1}>
                                  {p.name}
                                </Text>
                                <Text style={s.playerPos}>
                                  {p.position}
                                  {p.starter ? " · ST" : ""}
                                </Text>
                              </View>
                            </View>,
                            ...p.stats.slice(1),
                          ],
                        }))}
                    />
                  </Card>
                );
              })()}
            </>
          ) : (
            <Card>
              <Empty text="Box score isn't available until tip-off." />
            </Card>
          ))}

        {/* ---------- TEAM STATS ---------- */}
        {tab === "stats" && (
          <Card title={`${away?.abbreviation ?? "Away"}  vs  ${home?.abbreviation ?? "Home"}`}>
            {detail.teamStats?.length ? (
              detail.teamStats.map((st) => {
                const a = numeric(st.away);
                const h = numeric(st.home);
                if (a === null || h === null) {
                  return (
                    <View key={st.label} style={s.plainStat}>
                      <Text style={s.plainVal}>{st.away}</Text>
                      <Text style={s.plainLabel}>{st.label}</Text>
                      <Text style={s.plainVal}>{st.home}</Text>
                    </View>
                  );
                }
                return (
                  <CompareRow
                    key={st.label}
                    label={st.label}
                    left={st.away}
                    right={st.home}
                    leftPct={(a / (a + h || 1)) * 100}
                    accentLeft={accent}
                    accentRight={colors.brand}
                  />
                );
              })
            ) : (
              <Empty text="Team statistics aren't available yet." />
            )}
          </Card>
        )}

        {/* ---------- PLAY BY PLAY ---------- */}
        {tab === "plays" && (
          <Card title="Play by Play" padded={false}>
            {detail.plays?.length ? (
              detail.plays.map((p, i) => (
                <View
                  key={i}
                  style={[s.playRow, p.scoringPlay && { backgroundColor: accent + "0d" }]}
                >
                  <View style={s.playClock}>
                    <Text style={s.playPeriod}>Q{p.period}</Text>
                    <Text style={s.playTime}>{p.clock}</Text>
                  </View>
                  <Text style={s.playText}>{p.text}</Text>
                  <Text style={[s.playScore, p.scoringPlay && { color: accent }]}>
                    {p.awayScore}-{p.homeScore}
                  </Text>
                </View>
              ))
            ) : (
              <Empty text="No plays recorded yet." />
            )}
          </Card>
        )}

        {/* ---------- STANDINGS ---------- */}
        {tab === "standings" &&
          (detail.standings?.length ? (
            detail.standings.map((g, i) => (
              <Card key={i} title={g.name}>
                <StatTable
                  columns={["Team", "W", "L", "PCT", "GB", "STRK"]}
                  widths={[130, 34, 34, 52, 40, 48]}
                  accentColumn={3}
                  accent={accent}
                  rows={g.entries.map((e, idx) => ({
                    key: `${e.team}-${idx}`,
                    cells: [e.team, e.wins, e.losses, e.winPercent, e.gamesBehind, e.streak],
                  }))}
                />
              </Card>
            ))
          ) : (
            <Card>
              <Empty text="Standings aren't available." />
            </Card>
          ))}
      </ScrollView>
    </>
  );
}

function fmt(iso: string): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString(undefined, {
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

const s = StyleSheet.create({
  pills: { flexDirection: "row", gap: spacing.sm },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: colors.card,
    fontSize: 11,
    fontWeight: "700",
    overflow: "hidden",
  },

  nameCell: { flexDirection: "row", alignItems: "center", gap: 8, paddingRight: 8 },
  playerName: { color: colors.text, fontSize: 12, fontWeight: "600" },
  playerPos: { color: colors.textMuted, fontSize: 9, marginTop: 1 },

  leaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + "80",
  },
  leaderName: { color: colors.text, fontSize: 13, fontWeight: "600" },
  leaderMeta: { color: colors.textMuted, fontSize: 10, marginTop: 1 },
  leaderVal: { fontSize: 11, fontWeight: "700", maxWidth: 120, textAlign: "right" },

  injuryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + "80",
  },
  injuryTeam: { color: colors.textMuted, fontSize: 10, width: 36, fontWeight: "700" },
  injuryName: { flex: 1, color: colors.text, fontSize: 12, fontWeight: "600" },
  injuryStatus: { color: "#d64545", fontSize: 10, fontWeight: "700" },

  plainStat: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + "70",
  },
  plainVal: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
    width: 64,
  },
  plainLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    flex: 1,
    textAlign: "center",
  },

  playRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + "80",
  },
  playClock: { width: 40 },
  playPeriod: { color: colors.textMuted, fontSize: 9, fontWeight: "700" },
  playTime: { color: colors.textDim, fontSize: 10, fontVariant: ["tabular-nums"] },
  playText: { flex: 1, color: colors.textDim, fontSize: 12, lineHeight: 17 },
  playScore: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
});
