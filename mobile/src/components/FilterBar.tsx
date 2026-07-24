import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing } from "@/lib/theme";
import LiveDot from "./LiveDot";

interface Props {
  onlyLive: boolean;
  onToggleLive: () => void;
  dayOffset: number;             // -1 yesterday, 0 today, +1 tomorrow, etc
  onOffsetChange: (delta: number) => void;
}

function labelForOffset(off: number): string {
  if (off === 0) return "Today";
  if (off === -1) return "Yesterday";
  if (off === 1) return "Tomorrow";
  const d = new Date();
  d.setDate(d.getDate() + off);
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export default function FilterBar({ onlyLive, onToggleLive, dayOffset, onOffsetChange }: Props) {
  return (
    <View style={styles.wrap}>
      <TouchableOpacity style={styles.filterChip}>
        <Ionicons name="options-outline" size={14} color={colors.textDim} />
        <Text style={styles.chipLabel}>Filter</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onToggleLive}
        style={[styles.liveChip, onlyLive && styles.liveChipActive]}
      >
        <Text style={[styles.liveLabel, onlyLive && { color: colors.live }]}>
          Live
        </Text>
        {onlyLive ? <LiveDot size={6} /> : (
          <View style={{ width: 6, height: 6, borderRadius: 3, borderWidth: 1, borderColor: colors.textMuted }} />
        )}
      </TouchableOpacity>

      <View style={styles.dateRow}>
        <TouchableOpacity onPress={() => onOffsetChange(dayOffset - 1)} style={styles.arrowBtn}>
          <Ionicons name="chevron-back" size={16} color={colors.brand} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onOffsetChange(0)} style={{ paddingHorizontal: 4 }}>
          <Text style={styles.date}>{labelForOffset(dayOffset)}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onOffsetChange(dayOffset + 1)} style={styles.arrowBtn}>
          <Ionicons name="chevron-forward" size={16} color={colors.brand} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipLabel: {
    color: colors.textDim,
    fontSize: 12,
    fontWeight: "600",
  },
  liveChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  liveChipActive: {
    borderColor: colors.live,
    backgroundColor: colors.liveDim,
  },
  liveLabel: {
    color: colors.textDim,
    fontSize: 12,
    fontWeight: "700",
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    justifyContent: "flex-end",
    gap: spacing.xs,
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  arrowBtn: {
    padding: 4,
  },
  date: {
    color: colors.brand,
    fontSize: 12,
    fontWeight: "700",
    minWidth: 60,
    textAlign: "center",
  },
});
