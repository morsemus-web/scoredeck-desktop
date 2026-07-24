import { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { colors, radius, spacing, shadow } from "@/lib/theme";

export default function SkeletonCard() {
  const opacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.9, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  const Bar = ({ w, h = 10 }: { w: number | string; h?: number }) => (
    <Animated.View style={[styles.bar, { width: w as any, height: h, opacity }]} />
  );

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Bar w={36} h={36} />
        <View style={{ flex: 1, gap: 6 }}>
          <Bar w={140} h={11} />
          <Bar w={60} h={9} />
        </View>
      </View>
      <View style={styles.row}>
        <Bar w={40} h={10} />
        <View style={{ flex: 1, gap: 8 }}>
          <Bar w="80%" h={11} />
          <Bar w="70%" h={11} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.md,
    gap: spacing.md,
    ...shadow.card,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  bar: {
    backgroundColor: colors.border,
    borderRadius: 4,
  },
});
