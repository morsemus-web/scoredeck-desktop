import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius, spacing, sportColor } from "@/lib/theme";

interface Props {
  activeSport: string;
  onPress: (key: "feed" | "favourites" | "notifications") => void;
  active?: "feed" | "favourites" | "notifications";
}

export default function BottomNav({ activeSport, onPress, active = "feed" }: Props) {
  const insets = useSafeAreaInsets();
  const accent = sportColor(activeSport);

  return (
    <View style={[styles.wrap, { paddingBottom: (insets.bottom || spacing.sm) + spacing.xs }]}>
      <NavItem
        icon={
          <MaterialCommunityIcons
            name={
              activeSport === "Cricket"
                ? "cricket"
                : activeSport === "Football"
                ? "soccer"
                : activeSport === "Basketball"
                ? "basketball"
                : "flag-checkered"
            }
            size={22}
            color={active === "feed" ? "#fff" : accent}
          />
        }
        label={activeSport}
        isActive={active === "feed"}
        activeColor={accent}
        onPress={() => onPress("feed")}
      />
      <NavItem
        icon={<Ionicons name="star-outline" size={20} color={colors.textDim} />}
        label="Favourites"
        onPress={() => onPress("favourites")}
      />
      <NavItem
        icon={<Ionicons name="notifications-outline" size={20} color={colors.textDim} />}
        label="Never Miss"
        onPress={() => onPress("notifications")}
      />
    </View>
  );
}

function NavItem({
  icon,
  label,
  isActive,
  activeColor,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  activeColor?: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.item} activeOpacity={0.7}>
      <View
        style={[
          styles.iconWrap,
          isActive && activeColor
            ? { backgroundColor: activeColor }
            : null,
        ]}
      >
        {icon}
      </View>
      <Text
        style={[
          styles.label,
          isActive ? { color: colors.text, fontWeight: "700" } : null,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  item: {
    flex: 1,
    alignItems: "center",
    gap: 3,
    paddingVertical: 4,
  },
  iconWrap: {
    minWidth: 42,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 10,
    color: colors.textDim,
    fontWeight: "500",
  },
});
