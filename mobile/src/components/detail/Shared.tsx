import { ReactNode } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
} from "react-native";
import { colors, radius, spacing, shadow } from "@/lib/theme";

// Small building blocks shared by every sport's detail tabs, so a cricket
// scorecard and an NBA boxscore look like the same app.

export function Card({
  title,
  children,
  padded = true,
}: {
  title?: string;
  children: ReactNode;
  padded?: boolean;
}) {
  return (
    <View style={styles.card}>
      {title ? (
        <View style={styles.cardHead}>
          <Text style={styles.cardHeadText}>{title}</Text>
        </View>
      ) : null}
      <View style={padded ? styles.cardBody : undefined}>{children}</View>
    </View>
  );
}

export function TabBar({
  tabs,
  active,
  onChange,
  accent,
}: {
  tabs: { key: string; label: string }[];
  active: string;
  onChange: (key: string) => void;
  accent: string;
}) {
  return (
    <View style={styles.tabBarWrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabBar}
      >
        {tabs.map((t) => {
          const on = t.key === active;
          return (
            <TouchableOpacity
              key={t.key}
              onPress={() => onChange(t.key)}
              style={[styles.tab, on && { borderBottomColor: accent }]}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, on && { color: accent }]}>{t.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

// A horizontally scrollable table — boxscores and scorecards are wider than a
// phone, and squeezing them makes every number unreadable.
export function StatTable({
  columns,
  widths,
  rows,
  accentColumn,
  accent,
}: {
  columns: string[];
  widths?: number[];
  rows: { key: string; cells: (string | ReactNode)[] }[];
  accentColumn?: number;
  accent?: string;
}) {
  const w = (i: number) => widths?.[i] ?? (i === 0 ? 150 : 44);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View>
        <View style={styles.thead}>
          {columns.map((c, i) => (
            <Text
              key={i}
              style={[
                styles.th,
                { width: w(i), textAlign: i === 0 ? "left" : "right" },
              ]}
              numberOfLines={1}
            >
              {c}
            </Text>
          ))}
        </View>
        {rows.map((r) => (
          <View key={r.key} style={styles.tr}>
            {r.cells.map((cell, i) => (
              <View key={i} style={{ width: w(i) }}>
                {typeof cell === "string" ? (
                  <Text
                    style={[
                      i === 0 ? styles.tdFirst : styles.td,
                      { textAlign: i === 0 ? "left" : "right" },
                      accentColumn === i && accent ? { color: accent, fontWeight: "700" } : null,
                    ]}
                    numberOfLines={1}
                  >
                    {cell}
                  </Text>
                ) : (
                  cell
                )}
              </View>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

// Two values facing off around a shared label — football possession, NBA
// rebounds, cricket win probability all use this shape.
export function CompareRow({
  label,
  left,
  right,
  leftPct,
  accentLeft,
  accentRight,
}: {
  label: string;
  left: string;
  right: string;
  leftPct: number;
  accentLeft: string;
  accentRight: string;
}) {
  const pct = Math.max(0, Math.min(100, leftPct));
  return (
    <View style={styles.compareRow}>
      <View style={styles.compareTop}>
        <Text style={[styles.compareVal, { color: accentLeft }]}>{left}</Text>
        <Text style={styles.compareLabel}>{label}</Text>
        <Text style={[styles.compareVal, { color: accentRight }]}>{right}</Text>
      </View>
      <View style={[styles.compareTrack, { backgroundColor: accentRight + "33" }]}>
        <View
          style={[styles.compareFill, { width: `${pct}%`, backgroundColor: accentLeft }]}
        />
      </View>
    </View>
  );
}

export function KeyValue({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <View style={styles.kv}>
      <Text style={styles.kvLabel}>{label}</Text>
      <Text style={styles.kvValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

export function Empty({ text }: { text: string }) {
  return <Text style={styles.empty}>{text}</Text>;
}

export function Avatar({
  uri,
  fallback,
  size = 26,
  accent,
}: {
  uri?: string;
  fallback: string;
  size?: number;
  accent: string;
}) {
  const initials = fallback
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.cardMuted,
        }}
      />
    );
  }
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: accent + "22",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ color: accent, fontSize: size * 0.38, fontWeight: "700" }}>
        {initials}
      </Text>
    </View>
  );
}

// Form guide chips: W / D / L
export function FormChips({ form }: { form: string[] }) {
  return (
    <View style={{ flexDirection: "row", gap: 4 }}>
      {form.map((f, i) => {
        const c = f === "W" ? "#1f9d55" : f === "L" ? "#d64545" : colors.textMuted;
        return (
          <View key={i} style={[styles.formChip, { backgroundColor: c }]}>
            <Text style={styles.formChipText}>{f}</Text>
          </View>
        );
      })}
    </View>
  );
}

export const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    overflow: "hidden",
    ...shadow.card,
  },
  cardHead: {
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    backgroundColor: colors.cardMuted,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cardHeadText: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.9,
    textTransform: "uppercase",
  },
  cardBody: { padding: spacing.md },

  tabBarWrap: {
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabBar: { paddingHorizontal: spacing.sm },
  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabText: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },

  thead: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 6,
  },
  th: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  tr: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + "80",
  },
  tdFirst: { color: colors.text, fontSize: 12, fontWeight: "600" },
  td: {
    color: colors.textDim,
    fontSize: 12,
    fontVariant: ["tabular-nums"],
  },

  compareRow: { gap: 6, paddingVertical: 8 },
  compareTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  compareVal: { fontSize: 12, fontWeight: "700", fontVariant: ["tabular-nums"] },
  compareLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  compareTrack: { height: 6, borderRadius: 3, overflow: "hidden", flexDirection: "row" },
  compareFill: { height: "100%" },

  kv: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
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

  empty: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: "center",
    paddingVertical: spacing.lg,
  },

  formChip: {
    width: 18,
    height: 18,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  formChipText: { color: "#fff", fontSize: 9, fontWeight: "800" },
});
