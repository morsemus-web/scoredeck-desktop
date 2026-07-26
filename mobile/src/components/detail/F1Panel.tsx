import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Image,
} from "react-native";
import { colors, radius, spacing } from "@/lib/theme";
import {
  fetchF1Detail,
  fetchF1Laps,
  fetchF1Standings,
  type F1Detail,
  type F1Row,
  type F1Laps,
  type F1Standing,
  type F1TeamStanding,
} from "@/lib/api";
import { Card, TabBar, Empty } from "./Shared";

// Sessions are grouped the way a race weekend is actually consumed: practice,
// then qualifying, then the race — each with its own sub-selection.
const GROUPS = [
  { key: "practice", label: "Free Practice", sessions: ["FP1", "FP2", "FP3"] },
  { key: "qualifying", label: "Qualifying", sessions: ["Qual"] },
  { key: "race", label: "Race", sessions: ["Race"] },
] as const;

type GroupKey = (typeof GROUPS)[number]["key"];

export default function F1Panel({
  detail,
  accent,
  raceId,
}: {
  detail: F1Detail;
  accent: string;
  raceId: string;
}) {
  const [tab, setTab] = useState("results");

  const tabs = [
    { key: "results", label: "Results" },
    { key: "flow", label: "Race flow" },
    { key: "standings", label: "Standings" },
    { key: "info", label: "Info" },
  ];

  return (
    <>
      <TabBar tabs={tabs} active={tab} onChange={setTab} accent={accent} />
      {tab === "results" && <ResultsTab detail={detail} accent={accent} raceId={raceId} />}
      {tab === "flow" && <RaceFlowTab raceId={raceId} accent={accent} />}
      {tab === "standings" && <StandingsTab accent={accent} />}
      {tab === "info" && <InfoTab detail={detail} accent={accent} />}
    </>
  );
}

/* ------------------------------- RESULTS ------------------------------- */

function ResultsTab({
  detail,
  accent,
  raceId,
}: {
  detail: F1Detail;
  accent: string;
  raceId: string;
}) {
  const groups = useMemo(
    () =>
      GROUPS.map((g) => ({
        ...g,
        sessions: g.sessions.filter((s) => detail.sessions.some((d) => d.name === s)),
      })).filter((g) => g.sessions.length > 0),
    [detail.sessions],
  );

  // Open on whatever is most interesting right now: a running session, else the
  // most recently completed one.
  const initial = useMemo(() => {
    const live = detail.sessions.find((s) => s.state === "in");
    const done = [...detail.sessions].reverse().find((s) => s.state === "post");
    const pick = live?.name ?? done?.name ?? detail.sessions[0]?.name ?? "FP1";
    const group = GROUPS.find((g) => (g.sessions as readonly string[]).includes(pick));
    return { group: (group?.key ?? "practice") as GroupKey, session: pick };
  }, [detail.sessions]);

  const [group, setGroup] = useState<GroupKey>(initial.group);
  const [session, setSession] = useState(initial.session);
  const [rows, setRows] = useState<F1Row[]>([]);
  const [meta, setMeta] = useState<{ date: string; state: string } | null>(null);
  const [loading, setLoading] = useState(true);

  // Qualifying splits into Q1/Q2/Q3/Total on the client — one fetch covers all.
  const [qualView, setQualView] = useState<"q1" | "q2" | "q3" | "total">("total");

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    (async () => {
      const d = await fetchF1Detail(raceId, session);
      if (!mounted) return;
      setRows(d?.results ?? []);
      setMeta({ date: d?.sessionDate ?? "", state: d?.sessionState ?? "" });
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [raceId, session]);

  const activeGroup = groups.find((g) => g.key === group) ?? groups[0];
  const isQual = session === "Qual";
  const isRace = session === "Race";
  const notRun = rows.length === 0 && meta?.state === "pre";

  function selectGroup(g: GroupKey) {
    setGroup(g);
    const first = GROUPS.find((x) => x.key === g)?.sessions[0];
    if (first) setSession(first);
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: spacing.md, gap: spacing.md, paddingBottom: 48 }}
    >
      {/* Segmented control */}
      <View style={s.segment}>
        {groups.map((g) => {
          const on = g.key === group;
          return (
            <Pressable
              key={g.key}
              onPress={() => selectGroup(g.key)}
              style={[s.segmentItem, on && s.segmentItemOn]}
            >
              <Text style={[s.segmentText, on && s.segmentTextOn]}>
                {g.label.toUpperCase()}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Sub-pills: FP1/2/3, or Q1/Q2/Q3/Total */}
      {activeGroup?.sessions.length > 1 && (
        <View style={s.pills}>
          {activeGroup.sessions.map((sn) => (
            <Pill key={sn} label={sn} on={sn === session} accent={accent} onPress={() => setSession(sn)} />
          ))}
        </View>
      )}
      {isQual && (
        <View style={s.pills}>
          {(["q1", "q2", "q3", "total"] as const).map((v) => (
            <Pill
              key={v}
              label={v === "total" ? "Total" : v.toUpperCase()}
              on={v === qualView}
              accent={accent}
              onPress={() => setQualView(v)}
            />
          ))}
        </View>
      )}

      {meta?.date ? <Text style={s.sessionDate}>{fmtSession(meta.date)}</Text> : null}

      {loading ? (
        <View style={{ paddingVertical: spacing.xxl }}>
          <ActivityIndicator color={accent} />
        </View>
      ) : notRun ? (
        <Card>
          <Empty text="This session hasn't run yet." />
        </Card>
      ) : rows.length === 0 ? (
        <Card>
          <Empty text="No classification published for this session." />
        </Card>
      ) : (
        <View style={s.table}>
          <View style={s.thead}>
            <Text style={[s.th, { width: 34 }]}>Pos</Text>
            <Text style={[s.th, { flex: 1 }]}>Driver</Text>
            {isRace ? (
              <Text style={[s.th, s.numCol]}>GR</Text>
            ) : (
              !isQual && <Text style={[s.th, s.numCol]}>LP</Text>
            )}
            {!isRace && <Text style={[s.th, s.timeCol]}>Gap</Text>}
            <Text style={[s.th, s.timeCol]}>{isRace ? "Time" : "Time"}</Text>
          </View>

          {rows.map((r, i) => (
            <View key={`${r.driver}-${i}`} style={s.row}>
              <View style={[s.teamBar, { backgroundColor: r.teamColor }]} />
              <Text style={[s.pos, { width: 30 }]}>{r.pos || "-"}</Text>

              <View style={s.driverCell}>
                <View style={s.driverLine}>
                  <Text style={s.driverName} numberOfLines={1}>
                    {r.driver}
                  </Text>
                  {r.flag ? <Image source={{ uri: r.flag }} style={s.flag} /> : null}
                </View>
                <Text style={s.teamName} numberOfLines={1}>
                  {r.team}
                </Text>
              </View>

              {isRace ? (
                <Text style={[s.cell, s.numCol]}>{r.grid || "-"}</Text>
              ) : (
                !isQual && <Text style={[s.cell, s.numCol]}>{r.laps || "-"}</Text>
              )}
              {!isRace && (
                <Text style={[s.cell, s.timeCol]}>
                  {isQual ? "" : i === 0 ? r.time || "-" : r.gap || "-"}
                </Text>
              )}
              <Text style={[s.cell, s.timeCol, s.timeStrong]}>
                {isQual ? qualTime(r, qualView) : r.time || r.status || "-"}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function qualTime(r: F1Row, view: "q1" | "q2" | "q3" | "total"): string {
  if (view === "q1") return r.q1 || "-";
  if (view === "q2") return r.q2 || "-";
  if (view === "q3") return r.q3 || "-";
  return r.time || r.q3 || r.q2 || r.q1 || "-";
}

/* ------------------------------ RACE FLOW ------------------------------ */

function RaceFlowTab({ raceId, accent }: { raceId: string; accent: string }) {
  const [data, setData] = useState<F1Laps | null>(null);
  const [loading, setLoading] = useState(true);
  const [focus, setFocus] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const d = await fetchF1Laps(raceId);
      if (!mounted) return;
      setData(d);
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [raceId]);

  if (loading) {
    return (
      <View style={{ paddingVertical: spacing.xxl }}>
        <ActivityIndicator color={accent} />
      </View>
    );
  }

  if (!data || data.laps.length === 0) {
    return (
      <ScrollView contentContainerStyle={{ padding: spacing.md }}>
        <Card>
          <Empty text="Lap-by-lap data appears once the race has run." />
        </Card>
      </ScrollView>
    );
  }

  const drivers = data.drivers;
  const gridSize = drivers.length || 20;
  const LAP_W = 11;
  const ROW_H = 15;
  const chartW = Math.max(300, (data.laps.length + 1) * LAP_W);
  const chartH = gridSize * ROW_H;

  // position -> y. Grid slot sits at lap 0 so the opening-lap shuffle is visible.
  const yFor = (pos: number) => (pos - 1) * ROW_H + ROW_H / 2;

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: spacing.md, gap: spacing.md, paddingBottom: 48 }}
    >
      <Card title={`Position by lap · ${data.laps.length} laps`}>
        <Text style={s.flowHint}>
          Tap a driver to highlight their race. Each line is one driver, top is P1.
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: "row" }}>
            {/* Position axis */}
            <View style={{ width: 22 }}>
              {Array.from({ length: gridSize }, (_, i) => (
                <Text key={i} style={[s.axisLabel, { height: ROW_H, lineHeight: ROW_H }]}>
                  {i + 1}
                </Text>
              ))}
            </View>

            <View style={{ width: chartW, height: chartH }}>
              {/* Gridlines */}
              {Array.from({ length: gridSize }, (_, i) => (
                <View key={i} style={[s.gridline, { top: yFor(i + 1) }]} />
              ))}

              {/* One dot per driver per lap. React Native has no SVG here, so
                  the "line" is a dense run of small squares — cheap and legible
                  at this scale. */}
              {drivers.map((d) => {
                const dim = focus !== null && focus !== d.driverId;
                const points: { x: number; y: number }[] = [];
                if (d.grid > 0) points.push({ x: 0, y: yFor(d.grid) });
                data.laps.forEach((lap, idx) => {
                  const p = lap.positions.find((x) => x.driverId === d.driverId);
                  if (p) points.push({ x: (idx + 1) * LAP_W, y: yFor(p.position) });
                });

                return points.map((pt, i) => (
                  <View
                    key={`${d.driverId}-${i}`}
                    style={{
                      position: "absolute",
                      left: pt.x,
                      top: pt.y - 1.5,
                      width: LAP_W,
                      height: 3,
                      borderRadius: 1.5,
                      backgroundColor: d.teamColor,
                      opacity: dim ? 0.12 : focus === d.driverId ? 1 : 0.85,
                    }}
                  />
                ));
              })}
            </View>
          </View>
        </ScrollView>

        <View style={s.lapAxis}>
          <Text style={s.axisLabel}>GR</Text>
          <Text style={s.axisLabel}>Lap {data.laps.length}</Text>
        </View>
      </Card>

      <Card title="Drivers" padded={false}>
        <View style={s.chipWrap}>
          {drivers.map((d) => {
            const on = focus === d.driverId;
            return (
              <Pressable
                key={d.driverId}
                onPress={() => setFocus(on ? null : d.driverId)}
                style={[
                  s.driverChip,
                  on && { backgroundColor: d.teamColor + "22", borderColor: d.teamColor },
                ]}
              >
                <View style={[s.numBadge, { backgroundColor: d.teamColor }]}>
                  <Text style={s.numBadgeText}>{d.number}</Text>
                </View>
                <Text style={s.chipCode}>{d.code}</Text>
              </Pressable>
            );
          })}
        </View>
      </Card>
    </ScrollView>
  );
}

/* ------------------------------ STANDINGS ------------------------------ */

function StandingsTab({ accent }: { accent: string }) {
  const [mode, setMode] = useState<"drivers" | "teams">("drivers");
  const [drivers, setDrivers] = useState<F1Standing[]>([]);
  const [teams, setTeams] = useState<F1TeamStanding[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const d = await fetchF1Standings();
      if (!mounted) return;
      setDrivers(d.drivers);
      setTeams(d.teams);
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <View style={{ paddingVertical: spacing.xxl }}>
        <ActivityIndicator color={accent} />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: spacing.md, gap: spacing.md, paddingBottom: 48 }}
    >
      <View style={s.pills}>
        <Pill label="Drivers" on={mode === "drivers"} accent={accent} onPress={() => setMode("drivers")} />
        <Pill label="Teams" on={mode === "teams"} accent={accent} onPress={() => setMode("teams")} />
      </View>

      <View style={s.table}>
        <View style={s.thead}>
          <Text style={[s.th, { width: 34 }]}>Pos</Text>
          <Text style={[s.th, { flex: 1 }]}>{mode === "drivers" ? "Driver" : "Team"}</Text>
          <Text style={[s.th, s.statCol]}>W</Text>
          <Text style={[s.th, s.statCol]}>PP</Text>
          <Text style={[s.th, s.statCol]}>PDS</Text>
          <Text style={[s.th, s.statCol]}>PTS</Text>
        </View>

        {mode === "drivers"
          ? drivers.map((d) => (
              <View key={d.position} style={s.row}>
                <View style={[s.teamBar, { backgroundColor: d.teamColor }]} />
                <Text style={[s.pos, { width: 30 }]}>{d.position}</Text>
                {d.image ? (
                  <Image source={{ uri: d.image }} style={s.headshot} />
                ) : (
                  <View style={[s.headshot, { backgroundColor: d.teamColor + "33" }]} />
                )}
                <View style={s.driverCell}>
                  <View style={s.driverLine}>
                    <Text style={s.driverName} numberOfLines={1}>
                      {d.name}
                    </Text>
                    {d.flag ? <Image source={{ uri: d.flag }} style={s.flag} /> : null}
                  </View>
                  <Text style={s.teamName} numberOfLines={1}>
                    {d.constructor}
                  </Text>
                </View>
                <Text style={[s.cell, s.statCol]}>{d.wins}</Text>
                <Text style={[s.cell, s.statCol]}>{d.poles}</Text>
                <Text style={[s.cell, s.statCol]}>{d.podiums}</Text>
                <Text style={[s.cell, s.statCol, s.timeStrong]}>{d.points}</Text>
              </View>
            ))
          : teams.map((t) => (
              <View key={t.position} style={s.row}>
                <View style={[s.teamBar, { backgroundColor: t.teamColor }]} />
                <Text style={[s.pos, { width: 30 }]}>{t.position}</Text>
                <View style={s.driverCell}>
                  <Text style={s.driverName} numberOfLines={1}>
                    {t.name}
                  </Text>
                </View>
                <Text style={[s.cell, s.statCol]}>{t.wins}</Text>
                <Text style={[s.cell, s.statCol]}>{t.poles}</Text>
                <Text style={[s.cell, s.statCol]}>{t.podiums}</Text>
                <Text style={[s.cell, s.statCol, s.timeStrong]}>{t.points}</Text>
              </View>
            ))}
      </View>
    </ScrollView>
  );
}

/* --------------------------------- INFO -------------------------------- */

function InfoTab({ detail, accent }: { detail: F1Detail; accent: string }) {
  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: spacing.md, gap: spacing.md, paddingBottom: 48 }}
    >
      <Card title="Circuit">
        <Row label="Grand Prix" value={detail.title} />
        <Row label="Circuit" value={detail.circuit} />
        <Row
          label="Location"
          value={[detail.locality, detail.country].filter(Boolean).join(", ")}
        />
        <Row label="Round" value={`${detail.round} of ${detail.season}`} />
      </Card>

      <Card title="Weekend Schedule" padded={false}>
        {detail.sessions.map((sn, i) => (
          <View key={i} style={s.sessionRow}>
            <View
              style={[
                s.sessionDot,
                {
                  backgroundColor:
                    sn.state === "in" ? colors.live : sn.state === "post" ? colors.textMuted : accent,
                },
              ]}
            />
            <View style={{ flex: 1 }}>
              <Text style={s.sessionName}>{sn.name}</Text>
              <Text style={s.sessionTime}>{fmtSession(sn.date)}</Text>
            </View>
            <Text
              style={[s.sessionState, sn.state === "in" && { color: colors.live, fontWeight: "800" }]}
            >
              {sn.detail || (sn.state === "post" ? "Finished" : sn.state === "in" ? "Live" : "Scheduled")}
            </Text>
          </View>
        ))}
      </Card>
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <View style={s.kv}>
      <Text style={s.kvLabel}>{label}</Text>
      <Text style={s.kvValue} numberOfLines={2}>
        {value}
      </Text>
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
    <Pressable onPress={onPress} style={[s.pill, on && { backgroundColor: accent }]}>
      <Text style={[s.pillText, on && { color: "#fff" }]}>{label}</Text>
    </Pressable>
  );
}

function fmtSession(iso: string): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const today = new Date();
    const sameDay = d.toDateString() === today.toDateString();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const time = d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
    if (sameDay) return `Today, ${time}`;
    if (d.toDateString() === yesterday.toDateString()) return `Yesterday, ${time}`;
    return `${d.toLocaleDateString(undefined, { day: "numeric", month: "short" })} at ${time}`;
  } catch {
    return iso;
  }
}

const s = StyleSheet.create({
  segment: {
    flexDirection: "row",
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    padding: 4,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: radius.pill,
    alignItems: "center",
  },
  segmentItemOn: { backgroundColor: colors.text },
  segmentText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
    color: colors.textDim,
  },
  segmentTextOn: { color: "#fff" },

  pills: { flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
  },
  pillText: { fontSize: 12, fontWeight: "700", color: colors.textDim },

  sessionDate: { color: colors.text, fontSize: 14, fontWeight: "700", paddingHorizontal: 2 },

  table: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  thead: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  th: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "600",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + "70",
  },
  teamBar: {
    position: "absolute",
    left: 0,
    top: 4,
    bottom: 4,
    width: 3,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },
  pos: { color: colors.text, fontSize: 14, fontWeight: "600", fontVariant: ["tabular-nums"] },

  headshot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: spacing.sm,
    backgroundColor: colors.cardMuted,
  },

  driverCell: { flex: 1, paddingRight: spacing.sm },
  driverLine: { flexDirection: "row", alignItems: "center", gap: 6 },
  driverName: { color: colors.text, fontSize: 14, fontWeight: "600", flexShrink: 1 },
  flag: { width: 15, height: 15, borderRadius: 7.5 },
  teamName: { color: colors.textMuted, fontSize: 11, marginTop: 1 },

  cell: {
    color: colors.textDim,
    fontSize: 13,
    textAlign: "right",
    fontVariant: ["tabular-nums"],
  },
  timeStrong: { color: colors.text, fontWeight: "600" },
  numCol: { width: 40, textAlign: "right" },
  timeCol: { width: 76, textAlign: "right" },
  statCol: { width: 38, textAlign: "right" },

  flowHint: { color: colors.textMuted, fontSize: 11, marginBottom: spacing.md, lineHeight: 16 },
  gridline: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.border,
    opacity: 0.6,
  },
  axisLabel: { color: colors.textMuted, fontSize: 9, textAlign: "center" },
  lapAxis: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: spacing.sm,
  },

  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    padding: spacing.md,
  },
  driverChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardMuted,
  },
  numBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  numBadgeText: { color: "#fff", fontSize: 10, fontWeight: "800" },
  chipCode: { color: colors.text, fontSize: 12, fontWeight: "700" },

  kv: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingVertical: 7,
  },
  kvLabel: { color: colors.textMuted, fontSize: 12 },
  kvValue: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "600",
    flexShrink: 1,
    textAlign: "right",
  },

  sessionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + "80",
  },
  sessionDot: { width: 8, height: 8, borderRadius: 4 },
  sessionName: { color: colors.text, fontSize: 13, fontWeight: "600" },
  sessionTime: { color: colors.textMuted, fontSize: 10, marginTop: 1 },
  sessionState: { color: colors.textDim, fontSize: 10, maxWidth: 120, textAlign: "right" },
});
