import { useState } from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { colors, radius } from "@/lib/theme";

// Team logo with graceful fallback:
//   1. Try the provided logo URL
//   2. If missing OR the image fails to load, render a colored circle
//      with 2-letter initials taken from the team name.
export default function TeamBadge({
  name,
  logo,
  color,
  size = 22,
}: {
  name: string;
  logo?: string;
  color: string;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);

  if (logo && !failed) {
    return (
      <Image
        source={{ uri: logo }}
        style={{ width: size, height: size, borderRadius: radius.xs }}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <View
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color + "22",
          borderColor: color + "55",
        },
      ]}
    >
      <Text
        style={[
          styles.initials,
          {
            color,
            fontSize: size <= 22 ? 9 : 11,
          },
        ]}
      >
        {initials(name)}
      </Text>
    </View>
  );
}

function initials(name: string): string {
  const t = (name ?? "").trim();
  if (!t) return "?";
  // If it's already an abbreviation like "IND" or "LAL", use as-is
  if (t.length <= 3 && t === t.toUpperCase()) return t;
  const words = t.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  }
  return t.substring(0, 2).toUpperCase();
}

const styles = StyleSheet.create({
  circle: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  initials: {
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
