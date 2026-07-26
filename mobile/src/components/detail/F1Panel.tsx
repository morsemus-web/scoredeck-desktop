import { useState } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { colors, spacing } from "@/lib/theme";
import type { F1Detail } from "@/lib/api";
import { Card, TabBar, StatTable, KeyValue, Empty, Avatar } from "./Shared";

const STATE_LABEL: Record<string, string> = {
  pre: "Scheduled",
  in: "Live",
  post: "Finished",
};

export default function F1Panel({
  detail,
  accent,
}: {
  detail: F1Detail;
  accent: string;
}) {
  const tabs = [
    { key: "weekend", label: "Weekend" },
    { key: "results", label: "Race Result" },
    { key: "quali", label: "Qualifying" },
    ...(detail.sprint?.length ? [{ key: "sprint", label: "Sprint" }] : []),
    ...(detail.pitstops?.length ? [{ key: "pits", label: "Pit Stops" }] : []),
  ];
  const [tab, setTab] = useState("weekend");

  return (
    <>
      <TabBar tabs={tabs} active={tab} onChange={setTab} accent={accent} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.md, gap: spacing.md, paddingBottom: 48 }}
      >
        {/* ---------- WEEKEND ---------- */}
        {tab === "weekend" && (
          <>
            <Card title="Circuit">
              <KeyValue label="Grand Prix" value={detail.title} />
              <KeyValue label="Circuit" value={detail.circuit} />
              <KeyValue
                label="Location"
                value={[detail.locality, detail.country].filter(Boolean).join(", ")}
              />
              <KeyValue label="Round" value={`${detail.round} of the ${detail.season} season`} />
              <KeyValue label="Race start" value={fmt(detail.startDate)} />
            </Card>

            <Card title="Session Schedule" padded={false}>
              {detail.sessions?.length ? (
                detail.sessions.map((s2, i) => (
                  <View key={i} style={s.sessionRow}>
                    <View
                      style={[
                        s.sessionDot,
                        {
                          backgroundColor:
                            s2.state === "in"
                              ? colors.live
                              : s2.state === "post"
                                ? colors.textMuted
                                : accent,
                        },
                      ]}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={s.sessionName}>{s2.name}</Text>
                      <Text style={s.sessionTime}>{fmt(s2.date)}</Text>
                    </View>
                    <Text
                      style={[
                        s.sessionState,
                        s2.state === "in" && { color: colors.live, fontWeight: "800" },
                      ]}
                    >
                      {s2.detail || STATE_LABEL[s2.state] || s2.state}
                    </Text>
                  </View>
                ))
              ) : (
                <Empty text="Session times aren't published yet." />
              )}
            </Card>
          </>
        )}

        {/* ---------- RACE RESULT ---------- */}
        {tab === "results" && (
          <Card title="Classification">
            {detail.results?.length ? (
              <StatTable
                columns={["Pos", "Driver", "Grid", "Laps", "Time / Status", "Pts"]}
                widths={[34, 156, 40, 42, 120, 36]}
                accentColumn={5}
                accent={accent}
                rows={detail.results.map((r) => ({
                  key: r.position + r.name,
                  cells: [
                    r.position,
                    <DriverCell key="d" name={r.name} team={r.constructor} image={r.image} accent={accent} />,
                    r.grid,
                    r.laps,
                    r.time || r.status,
                    r.points,
                  ],
                }))}
              />
            ) : (
              <Empty text="The race hasn't been classified yet." />
            )}
          </Card>
        )}

        {/* ---------- QUALIFYING ---------- */}
        {tab === "quali" && (
          <Card title="Qualifying">
            {detail.qualifying?.length ? (
              <StatTable
                columns={["Pos", "Driver", "Q1", "Q2", "Q3"]}
                widths={[34, 156, 78, 78, 78]}
                accentColumn={4}
                accent={accent}
                rows={detail.qualifying.map((q) => ({
                  key: q.position + q.name,
                  cells: [
                    q.position,
                    <DriverCell key="d" name={q.name} team={q.constructor} image={q.image} accent={accent} />,
                    q.q1 || "–",
                    q.q2 || "–",
                    q.q3 || "–",
                  ],
                }))}
              />
            ) : (
              <Empty text="Qualifying results aren't available." />
            )}
          </Card>
        )}

        {/* ---------- SPRINT ---------- */}
        {tab === "sprint" && (
          <Card title="Sprint">
            <StatTable
              columns={["Pos", "Driver", "Time / Status", "Pts"]}
              widths={[34, 156, 120, 36]}
              accentColumn={3}
              accent={accent}
              rows={detail.sprint.map((r) => ({
                key: r.position + r.name,
                cells: [
                  r.position,
                  <DriverCell key="d" name={r.name} team={r.constructor} accent={accent} />,
                  r.time || "—",
                  r.points,
                ],
              }))}
            />
          </Card>
        )}

        {/* ---------- PIT STOPS ---------- */}
        {tab === "pits" && (
          <Card title="Pit Stops">
            <StatTable
              columns={["Driver", "Lap", "Stop", "Duration"]}
              widths={[150, 42, 42, 80]}
              accentColumn={3}
              accent={accent}
              rows={detail.pitstops.map((p, i) => ({
                key: `${p.driver}-${i}`,
                cells: [p.driver, p.lap, p.stop, p.duration],
              }))}
            />
          </Card>
        )}
      </ScrollView>
    </>
  );
}

function DriverCell({
  name,
  team,
  image,
  accent,
}: {
  name: string;
  team: string;
  image?: string;
  accent: string;
}) {
  return (
    <View style={s.driverCell}>
      <Avatar uri={image} fallback={name} accent={accent} size={24} />
      <View style={{ flex: 1 }}>
        <Text style={s.driverName} numberOfLines={1}>
          {name}
        </Text>
        <Text style={s.driverTeam} numberOfLines={1}>
          {team}
        </Text>
      </View>
    </View>
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

  driverCell: { flexDirection: "row", alignItems: "center", gap: 8, paddingRight: 8 },
  driverName: { color: colors.text, fontSize: 12, fontWeight: "600" },
  driverTeam: { color: colors.textMuted, fontSize: 9, marginTop: 1 },
});
