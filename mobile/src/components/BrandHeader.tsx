import { View, Text, TextInput, StyleSheet, Pressable, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing, radius, shadow } from "@/lib/theme";

const SPORT_ICONS: Record<string, { name: any; family: "mci" | "ion" }> = {
  Cricket:    { name: "cricket",    family: "mci" },
  Football:   { name: "soccer",     family: "mci" },
  Basketball: { name: "basketball", family: "mci" },
  F1:         { name: "flag-checkered", family: "mci" },
};

interface Props {
  sports: readonly string[];
  active: string;
  onSelectSport: (s: string) => void;
  onAccountPress: () => void;
  onSearchChange?: (q: string) => void;
}

export default function BrandHeader({
  sports,
  active,
  onSelectSport,
  onAccountPress,
  onSearchChange,
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { paddingTop: insets.top || spacing.md }]}>
      {/* Search bar row */}
      <View style={styles.searchRow}>
        <View style={styles.searchPill}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            placeholder="Search teams, leagues"
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
            onChangeText={onSearchChange}
          />
        </View>
        <TouchableOpacity onPress={onAccountPress} style={styles.avatarBtn}>
          <Ionicons name="person-circle" size={30} color="rgba(255,255,255,0.9)" />
        </TouchableOpacity>
      </View>

      {/* Sport icons row */}
      <View style={styles.tabs}>
        {sports.map((s) => {
          const isActive = s === active;
          const iconMeta = SPORT_ICONS[s];
          return (
            <Pressable
              key={s}
              onPress={() => onSelectSport(s)}
              style={[styles.tab, isActive && styles.tabActive]}
            >
              {iconMeta && (
                <MaterialCommunityIcons
                  name={iconMeta.name}
                  size={20}
                  color={isActive ? colors.brand : "rgba(255,255,255,0.85)"}
                />
              )}
              <Text
                style={[
                  styles.tabLabel,
                  isActive && { color: colors.brand, fontWeight: "700" },
                ]}
              >
                {s}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.brand,
    paddingHorizontal: spacing.md,
    paddingBottom: 0,
    ...shadow.header,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  searchPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    padding: 0,
  },
  avatarBtn: {
    padding: 2,
  },
  tabs: {
    flexDirection: "row",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingVertical: spacing.sm,
    paddingHorizontal: 4,
    gap: 3,
    borderTopLeftRadius: radius.sm,
    borderTopRightRadius: radius.sm,
  },
  tabActive: {
    backgroundColor: colors.bg,
  },
  tabLabel: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
});
