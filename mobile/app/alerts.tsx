import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius, spacing } from "@/lib/theme";
import {
  getAllFavourites,
  getNotifyPrefs,
  setNotifyPrefs,
  type NotifyPrefs,
  DEFAULT_NOTIFY,
} from "@/lib/favourites";
import { registerNotifications, checkForAlerts } from "@/lib/notifications";
import BottomNav from "@/components/BottomNav";

export default function AlertsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [prefs, setPrefs] = useState<NotifyPrefs>(DEFAULT_NOTIFY);
  const [followCount, setFollowCount] = useState(0);
  const [granted, setGranted] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    getNotifyPrefs().then(setPrefs);
    getAllFavourites().then((f) => setFollowCount(f.teams.length + f.leagues.length));
  }, []);

  async function update(patch: Partial<NotifyPrefs>) {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    await setNotifyPrefs(next);

    // Turning alerts on is the moment to ask for the OS permission.
    if (patch.enabled === true) {
      const ok = await registerNotifications();
      setGranted(ok);
      if (!ok) {
        Alert.alert(
          "Notifications are blocked",
          "Enable notifications for ScoreDeck in your phone's Settings to get score alerts.",
        );
      }
    }
  }

  return (
    <View style={s.root}>
      <View style={[s.header, { paddingTop: insets.top + spacing.md }]}>
        <Text style={s.title}>Never Miss</Text>
        <Text style={s.sub}>Score alerts for the teams you follow.</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.md, gap: spacing.md, paddingBottom: 24 }}
      >
        <View style={s.card}>
          <Row
            title="Score alerts"
            subtitle={
              followCount > 0
                ? `Watching ${followCount} favourite${followCount === 1 ? "" : "s"}`
                : "You aren't following anything yet"
            }
            value={prefs.enabled}
            onChange={(v) => update({ enabled: v })}
          />
        </View>

        <View style={[s.card, !prefs.enabled && { opacity: 0.45 }]}>
          <Text style={s.cardTitle}>Alert me about</Text>
          <Row
            title="Kick-off"
            subtitle="When a match you follow gets under way"
            value={prefs.matchStart}
            disabled={!prefs.enabled}
            onChange={(v) => update({ matchStart: v })}
          />
          <Row
            title="Score changes"
            subtitle="Goals, wickets and lead changes while it's live"
            value={prefs.scoring}
            disabled={!prefs.enabled}
            onChange={(v) => update({ scoring: v })}
          />
          <Row
            title="Full time"
            subtitle="The final result as soon as it's confirmed"
            value={prefs.fullTime}
            disabled={!prefs.enabled}
            onChange={(v) => update({ fullTime: v })}
          />
        </View>

        <TouchableOpacity style={s.linkRow} onPress={() => router.push("/favourites")}>
          <Ionicons name="star-outline" size={18} color={colors.brand} />
          <Text style={s.linkText}>Manage favourites</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={s.linkRow}
          disabled={checking}
          onPress={async () => {
            setChecking(true);
            const ok = await registerNotifications();
            setGranted(ok);
            const fired = ok ? await checkForAlerts() : 0;
            setChecking(false);
            Alert.alert(
              ok ? "Alerts are working" : "Permission needed",
              ok
                ? fired > 0
                  ? `Sent ${fired} alert${fired === 1 ? "" : "s"} for your favourites.`
                  : "Nothing has changed since the last check — you're up to date."
                : "Enable notifications for ScoreDeck in your phone's Settings.",
            );
          }}
        >
          <Ionicons name="refresh" size={18} color={colors.brand} />
          <Text style={s.linkText}>{checking ? "Checking…" : "Check now"}</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </TouchableOpacity>

        <Text style={s.note}>
          ScoreDeck isn't on Google Play, so alerts are generated on your device rather
          than pushed from a server. Scores are checked while the app is open, and roughly
          every 15 minutes in the background — Android decides the exact timing.
          {granted === false ? "\n\nNotifications are currently blocked in system settings." : ""}
        </Text>
      </ScrollView>

      <BottomNav
        activeSport="Football"
        active="notifications"
        onPress={(k) => {
          if (k === "feed") router.replace("/");
          if (k === "favourites") router.replace("/favourites");
        }}
      />
    </View>
  );
}

function Row({
  title,
  subtitle,
  value,
  onChange,
  disabled,
}: {
  title: string;
  subtitle: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <View style={s.row}>
      <View style={{ flex: 1 }}>
        <Text style={s.rowTitle}>{title}</Text>
        <Text style={s.rowSub}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{ true: colors.brand, false: colors.borderStrong }}
        thumbColor="#fff"
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    backgroundColor: colors.brand,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: 3,
  },
  title: { color: "#fff", fontSize: 20, fontWeight: "800" },
  sub: { color: "rgba(255,255,255,0.8)", fontSize: 12 },

  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
  },
  cardTitle: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 2,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: 10,
  },
  rowTitle: { color: colors.text, fontSize: 14, fontWeight: "600" },
  rowSub: { color: colors.textMuted, fontSize: 11, marginTop: 2, lineHeight: 15 },

  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 15,
  },
  linkText: { flex: 1, color: colors.text, fontSize: 14, fontWeight: "600" },

  note: {
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 17,
    paddingHorizontal: spacing.sm,
  },
});
