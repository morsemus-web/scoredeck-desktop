import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { colors, radius, spacing } from "@/lib/theme";

interface Props {
  tabs: readonly string[];
  active: string;
  onSelect: (t: string) => void;
}

// Segmented control that lives right below the sport tabs — MATCHES / LEAGUES
// switcher, matching the reference.
export default function SubTabs({ tabs, active, onSelect }: Props) {
  return (
    <View style={styles.wrap}>
      {tabs.map((t) => {
        const isActive = t === active;
        return (
          <TouchableOpacity
            key={t}
            onPress={() => onSelect(t)}
            style={[styles.tab, isActive && styles.tabActive]}
            activeOpacity={0.7}
          >
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {t.toUpperCase()}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: radius.pill,
  },
  tabActive: {
    backgroundColor: colors.text,
  },
  label: {
    color: colors.textDim,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.6,
  },
  labelActive: {
    color: "#fff",
  },
});
