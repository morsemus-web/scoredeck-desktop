import { useMemo, useState } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { colors, radius, spacing } from "@/lib/theme";
import type { CricketDetail } from "@/lib/api";
import {
  Card,
  TabBar,
  StatTable,
  CompareRow,
  KeyValue,
  Empty,
  Avatar,
} from "./Shared";

const BALL_COLORS: Record<string, string> = {
  six: "#7c3aed",
  four: "#0d9488",
  wicket: "#dc2626",
  wide: "#0369a1",
  noball: "#0369a1",
};

export default function CricketPanel({
  detail,
  accent,
  isLive,
}: {
  detail: CricketDetail;
  accent: string;
  isLive: boolean;
}) {
  const completed = /won|beat|drew|abandon|tied|no result/i.test(detail.statusText ?? "");
  const tabs = useMemo(
    () => [
      ...(isLive && !completed ? [{ key: "live", label: "Live Center" }] : []),
      { key: "scorecard", label: "Scorecard" },
      { key: "commentary", label: "Commentary" },
      { key: "xi", label: "Playing XI" },
      { key: "table", label: "Table" },
      { key: "graphs", label: "Run Graph" },
    ],
    [isLive, completed],
  );
  const [tab, setTab] = useState(tabs[0].key);
  const [inningsIdx, setInningsIdx] = useState(0);

  // The innings currently being played is the last one with any batters in it.
  const liveIdx = Math.max(0, detail.innings.length - 1);
  const inn = detail.innings[inningsIdx];

  return (
    <>
      <TabBar tabs={tabs} active={tab} onChange={setTab} accent={accent} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.md, gap: spacing.md, paddingBottom: 48 }}
      >
        {detail.statusText ? (
          <View style={[s.banner, { backgroundColor: accent + "12", borderColor: accent + "33" }]}>
            <Text style={[s.bannerText, { color: accent }]}>{detail.statusText}</Text>
          </View>
        ) : null}

        {(detail.startDate || detail.locationName) && (
          <Card>
            <KeyValue label="Match Schedule" value={fmt(detail.startDate)} />
            <KeyValue label="Match Venue" value={detail.locationName} />
            <KeyValue label="Player of the Match" value={detail.playerOfTheMatch} />
          </Card>
        )}

        {/* ---------- LIVE CENTER ---------- */}
        {tab === "live" && (
          <>
            <Card>
              <CompareRow
                label="Win Probability"
                left={`${short(detail.probability.label1)} ${detail.probability.team1}%`}
                right={`${short(detail.probability.label2)} ${detail.probability.team2}%`}
                leftPct={detail.probability.team1}
                accentLeft={accent}
                accentRight={colors.sport.Football}
              />
            </Card>

            <Card title="Batting in Progress">
              {detail.innings[liveIdx]?.batters?.length ? (
                <StatTable
                  columns={["Batter", "R", "B", "4s", "6s", "SR"]}
                  widths={[150, 40, 40, 38, 38, 52]}
                  accentColumn={5}
                  accent={accent}
                  rows={detail.innings[liveIdx].batters.slice(0, 2).map((b, i) => ({
                    key: `${b.name}-${i}`,
                    cells: [
                      <NameCell key="n" name={b.name} accent={accent} star={i === 0} />,
                      b.runs,
                      b.balls,
                      b.fours,
                      b.sixes,
                      b.sr,
                    ],
                  }))}
                />
              ) : (
                <Empty text="No batters at the crease yet." />
              )}
            </Card>

            <Card title="Bowling Spell">
              {detail.innings[liveIdx]?.bowlers?.length ? (
                <StatTable
                  columns={["Bowler", "O", "M", "R", "W", "ECO"]}
                  widths={[150, 44, 36, 40, 36, 52]}
                  accentColumn={5}
                  accent={accent}
                  rows={detail.innings[liveIdx].bowlers.slice(0, 2).map((b, i) => ({
                    key: `${b.name}-${i}`,
                    cells: [
                      <NameCell key="n" name={b.name} accent={accent} />,
                      b.overs,
                      b.maidens,
                      b.runs,
                      b.wickets,
                      b.econ,
                    ],
                  }))}
                />
              ) : (
                <Empty text="No bowling figures yet." />
              )}
            </Card>

            <Card title="Last 6 Balls (with over break)">
              {detail.timeline.length ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={s.ballsRow}>
                    {detail.timeline.slice(0, 12).map((t, i) => {
                      const prev = detail.timeline[i - 1];
                      const overBreak =
                        i > 0 &&
                        Math.floor(parseFloat(prev.ball)) !== Math.floor(parseFloat(t.ball));
                      const bg = BALL_COLORS[t.type];
                      return (
                        <View key={i} style={s.ballGroup}>
                          {overBreak && (
                            <View style={[s.overChip, { borderColor: accent + "55", backgroundColor: accent + "14" }]}>
                              <Text style={[s.overChipText, { color: accent }]}>
                                {Math.floor(parseFloat(t.ball))} OV
                              </Text>
                            </View>
                          )}
                          <View
                            style={[
                              s.ball,
                              bg
                                ? { backgroundColor: bg, borderColor: bg }
                                : { backgroundColor: colors.cardMuted, borderColor: colors.border },
                            ]}
                          >
                            <Text style={[s.ballText, bg ? { color: "#fff" } : null]}>
                              {t.score}
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </ScrollView>
              ) : (
                <Empty text="Ball-by-ball data hasn't started." />
              )}
            </Card>
          </>
        )}

        {/* ---------- SCORECARD ---------- */}
        {tab === "scorecard" && (
          <>
            {detail.innings.length > 1 && (
              <View style={s.pills}>
                {detail.innings.map((i, idx) => (
                  <Pill
                    key={idx}
                    label={short(i.team)}
                    on={idx === inningsIdx}
                    accent={accent}
                    onPress={() => setInningsIdx(idx)}
                  />
                ))}
              </View>
            )}

            {inn ? (
              <>
                <Card title={`${inn.team} — Batting`}>
                  <StatTable
                    columns={["Batter", "R", "B", "4s", "6s", "SR"]}
                    widths={[168, 40, 40, 38, 38, 52]}
                    accentColumn={5}
                    accent={accent}
                    rows={inn.batters.map((b, i) => ({
                      key: `${b.name}-${i}`,
                      cells: [
                        <NameCell key="n" name={b.name} sub={b.dismissal} accent={accent} />,
                        b.runs,
                        b.balls,
                        b.fours,
                        b.sixes,
                        b.sr,
                      ],
                    }))}
                  />
                  <View style={s.totals}>
                    <KeyValue label="Extras" value={inn.extras} />
                    <KeyValue label="Total" value={inn.total} />
                    <KeyValue label="Yet to Bat" value={inn.yetToBat.join(", ")} />
                  </View>
                </Card>

                <Card title="Bowling">
                  <StatTable
                    columns={["Bowler", "O", "M", "R", "W", "NB", "WD", "ECO"]}
                    widths={[150, 44, 36, 40, 36, 36, 36, 52]}
                    accentColumn={4}
                    accent={accent}
                    rows={inn.bowlers.map((b, i) => ({
                      key: `${b.name}-${i}`,
                      cells: [
                        <NameCell key="n" name={b.name} accent={accent} />,
                        b.overs,
                        b.maidens,
                        b.runs,
                        b.wickets,
                        b.nb,
                        b.wd,
                        b.econ,
                      ],
                    }))}
                  />
                </Card>
              </>
            ) : (
              <Card>
                <Empty text="The scorecard isn't published yet." />
              </Card>
            )}
          </>
        )}

        {/* ---------- COMMENTARY ---------- */}
        {tab === "commentary" && (
          <Card title="Ball-by-Ball Commentary" padded={false}>
            {detail.timeline.length ? (
              detail.timeline.map((t, i) => (
                <View key={i} style={s.commRow}>
                  <Text style={[s.commBall, { color: accent }]}>{t.ball || "—"}</Text>
                  <Text style={s.commText}>{t.text}</Text>
                </View>
              ))
            ) : (
              <Empty text="No commentary available." />
            )}
          </Card>
        )}

        {/* ---------- PLAYING XI ---------- */}
        {tab === "xi" &&
          (Object.keys(detail.teams).length ? (
            Object.entries(detail.teams).map(([team, squad]) => (
              <Card key={team} title={`${team} XI`} padded={false}>
                {squad.map((p, i) => (
                  <View key={`${p}-${i}`} style={s.playerRow}>
                    <Text style={s.playerNum}>#{i + 1}</Text>
                    <Avatar fallback={p} accent={accent} />
                    <Text style={s.playerName}>{p}</Text>
                  </View>
                ))}
              </Card>
            ))
          ) : (
            <Card>
              <Empty text="Squads haven't been announced." />
            </Card>
          ))}

        {/* ---------- TABLE ---------- */}
        {tab === "table" && (
          <Card title="Standings & Points Table">
            <StatTable
              columns={["#", "Team", "P", "W", "L", "Pts", "NRR"]}
              widths={[26, 150, 32, 32, 32, 40, 58]}
              accentColumn={5}
              accent={accent}
              rows={detail.pointsTable.map((t) => ({
                key: String(t.pos),
                cells: [
                  String(t.pos),
                  <Text key="t" style={s.tableTeam} numberOfLines={1}>
                    {t.team}
                  </Text>,
                  String(t.p),
                  String(t.w),
                  String(t.l),
                  String(t.pts),
                  t.nrr,
                ],
              }))}
            />
          </Card>
        )}

        {/* ---------- RUN GRAPH ---------- */}
        {tab === "graphs" && <RunGraph detail={detail} accent={accent} />}
      </ScrollView>
    </>
  );
}

// Manhattan chart built from the real ball-by-ball feed: group deliveries by
// over and sum the runs. The website hardcoded a sample array here.
function RunGraph({ detail, accent }: { detail: CricketDetail; accent: string }) {
  const overs = useMemo(() => {
    const buckets = new Map<number, { runs: number; wickets: number }>();
    detail.timeline.forEach((t) => {
      const over = Math.floor(parseFloat(t.ball));
      if (!Number.isFinite(over)) return;
      const cur = buckets.get(over) ?? { runs: 0, wickets: 0 };
      const n = parseInt(t.score, 10);
      cur.runs += Number.isFinite(n) ? n : 0;
      if (t.type === "wicket") cur.wickets += 1;
      buckets.set(over, cur);
    });
    return [...buckets.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([over, v]) => ({ over, ...v }));
  }, [detail.timeline]);

  if (overs.length === 0) {
    return (
      <Card title="Over-by-Over Runs">
        <Empty text="Not enough ball-by-ball data to plot a run graph yet." />
      </Card>
    );
  }

  const max = Math.max(...overs.map((o) => o.runs), 6);

  return (
    <Card title="Over-by-Over Runs">
      <Text style={s.graphNote}>
        Runs scored in each over from the live commentary feed. Red bars include a wicket.
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={s.graph}>
          {overs.map((o) => (
            <View key={o.over} style={s.graphCol}>
              <Text style={s.graphVal}>{o.runs}</Text>
              <View
                style={[
                  s.graphBar,
                  {
                    height: Math.max(4, (o.runs / max) * 120),
                    backgroundColor: o.wickets > 0 ? "#dc2626" : accent,
                  },
                ]}
              />
              <Text style={s.graphLabel}>{o.over}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </Card>
  );
}

function NameCell({
  name,
  sub,
  accent,
  star,
}: {
  name: string;
  sub?: string;
  accent: string;
  star?: boolean;
}) {
  return (
    <View style={s.nameCell}>
      <Avatar fallback={name} accent={accent} size={24} />
      <View style={{ flex: 1 }}>
        <Text style={s.nameText} numberOfLines={1}>
          {name}
          {star ? <Text style={{ color: accent }}> *</Text> : null}
        </Text>
        {sub ? (
          <Text style={s.nameSub} numberOfLines={1}>
            {sub}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function Pill({
  label,
  on,
  accent,
  onPress,
}: {
  label: string;
  on: boolean;
  accent: string;
  onPress: () => void;
}) {
  return (
    <Text
      onPress={onPress}
      style={[
        s.pill,
        on ? { backgroundColor: accent, color: "#fff" } : { color: colors.textDim },
      ]}
    >
      {label}
    </Text>
  );
}

function short(name: string): string {
  if (!name) return "";
  if (name.length <= 4) return name;
  const words = name.split(/\s+/);
  if (words.length > 1) return words.map((w) => w[0]).join("").toUpperCase().slice(0, 4);
  return name.slice(0, 3).toUpperCase();
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
  banner: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
  },
  bannerText: {
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 0.4,
  },

  nameCell: { flexDirection: "row", alignItems: "center", gap: 8, paddingRight: 8 },
  nameText: { color: colors.text, fontSize: 12, fontWeight: "600" },
  nameSub: { color: colors.textMuted, fontSize: 9, marginTop: 1 },

  ballsRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  ballGroup: { flexDirection: "row", alignItems: "center", gap: 8 },
  ball: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  ballText: { fontSize: 11, fontWeight: "700", color: colors.textDim },
  overChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  overChipText: { fontSize: 8, fontWeight: "800", letterSpacing: 0.8 },

  pills: { flexDirection: "row", gap: spacing.sm },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    fontSize: 11,
    fontWeight: "700",
    overflow: "hidden",
  },

  totals: { marginTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 4 },

  commRow: {
    flexDirection: "row",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + "80",
  },
  commBall: { width: 34, fontSize: 11, fontWeight: "800", fontVariant: ["tabular-nums"] },
  commText: { flex: 1, color: colors.textDim, fontSize: 12, lineHeight: 18 },

  playerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + "70",
  },
  playerNum: { color: colors.textMuted, fontSize: 10, width: 22 },
  playerName: { color: colors.text, fontSize: 13, fontWeight: "600" },

  tableTeam: { color: colors.text, fontSize: 12, fontWeight: "600" },

  graphNote: { color: colors.textMuted, fontSize: 10, marginBottom: spacing.md, lineHeight: 15 },
  graph: { flexDirection: "row", alignItems: "flex-end", gap: 6, paddingTop: 8 },
  graphCol: { alignItems: "center", width: 26, gap: 3 },
  graphVal: { color: colors.textMuted, fontSize: 9, fontVariant: ["tabular-nums"] },
  graphBar: { width: 16, borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  graphLabel: { color: colors.textMuted, fontSize: 9 },
});
