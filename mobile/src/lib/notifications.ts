import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import * as TaskManager from "expo-task-manager";
import * as BackgroundFetch from "expo-background-fetch";
import { fetchSport, type MobileMatch } from "./api";
import { getAllFavourites, getNotifyPrefs, matchIsFavourite } from "./favourites";

// ScoreDeck ships without Play Services push (no store listing, no FCM sender),
// so alerts are LOCAL notifications driven by polling. The same diff runs in two
// places: on every foreground feed refresh, and from a background fetch task the
// OS wakes roughly every 15 minutes.

export const SCORE_TASK = "scoredeck-score-poll";
const SNAPSHOT_KEY = "sd.notify.snapshot";
const SPORTS = ["Cricket", "Football", "Basketball", "F1"];

interface Snapshot {
  status: string;
  score: string;
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerNotifications(): Promise<boolean> {
  try {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("scores", {
        name: "Live scores",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 200, 100, 200],
        lightColor: "#0f7a89",
      });
    }

    const existing = await Notifications.getPermissionsAsync();
    let status = existing.status;
    if (status !== "granted") {
      const asked = await Notifications.requestPermissionsAsync();
      status = asked.status;
    }
    if (status !== "granted") return false;

    await registerBackgroundTask();
    return true;
  } catch {
    return false;
  }
}

async function registerBackgroundTask(): Promise<void> {
  try {
    const already = await TaskManager.isTaskRegisteredAsync(SCORE_TASK);
    if (already) return;
    await BackgroundFetch.registerTaskAsync(SCORE_TASK, {
      // Android treats this as a floor, not a promise — 15 min is the OS minimum.
      minimumInterval: 15 * 60,
      stopOnTerminate: false,
      startOnBoot: true,
    });
  } catch {
    // Background fetch is unavailable on web and in Expo Go; foreground polling
    // still works, so this is not fatal.
  }
}

export async function unregisterBackgroundTask(): Promise<void> {
  try {
    if (await TaskManager.isTaskRegisteredAsync(SCORE_TASK)) {
      await BackgroundFetch.unregisterTaskAsync(SCORE_TASK);
    }
  } catch {
    /* ignore */
  }
}

async function readSnapshot(): Promise<Record<string, Snapshot>> {
  try {
    const raw = await AsyncStorage.getItem(SNAPSHOT_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function writeSnapshot(snap: Record<string, Snapshot>): Promise<void> {
  await AsyncStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snap));
}

async function notify(title: string, body: string): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true },
    trigger: null, // fire immediately
  });
}

function fixtureLabel(m: MobileMatch): string {
  return m.sport === "F1" ? m.team1 : `${m.team1} vs ${m.team2}`;
}

/**
 * Compares the current favourites against the last seen state and fires an
 * alert for anything that changed. Safe to call often — it only notifies on
 * transitions, never on the steady state.
 */
export async function checkForAlerts(matches?: MobileMatch[]): Promise<number> {
  const prefs = await getNotifyPrefs();
  if (!prefs.enabled) return 0;

  const favs = await getAllFavourites();
  if (favs.teams.length === 0 && favs.leagues.length === 0) return 0;

  let all = matches;
  if (!all) {
    const results = await Promise.all(SPORTS.map((s) => fetchSport(s)));
    all = results.flat();
  }

  const watched = all.filter((m) => matchIsFavourite(m, favs));
  if (watched.length === 0) return 0;

  const snap = await readSnapshot();
  const next: Record<string, Snapshot> = { ...snap };
  let fired = 0;

  for (const m of watched) {
    const key = `${m.sport}:${m.id || fixtureLabel(m)}`;
    const prev = snap[key];
    next[key] = { status: m.status, score: m.score };

    // First time we've seen this fixture — record it, don't alert. Otherwise
    // adding a favourite would spam every in-progress match at once.
    if (!prev) continue;

    if (prefs.matchStart && prev.status === "upcoming" && m.status === "live") {
      await notify(`${fixtureLabel(m)} is under way`, m.league);
      fired++;
      continue;
    }

    if (prefs.fullTime && prev.status === "live" && m.status === "final") {
      await notify(`Full time — ${fixtureLabel(m)}`, m.note || m.score || m.league);
      fired++;
      continue;
    }

    if (prefs.scoring && m.status === "live" && prev.score !== m.score && m.score) {
      await notify(fixtureLabel(m), `${m.score}${m.extra ? `  ·  ${m.extra}` : ""}`);
      fired++;
    }
  }

  await writeSnapshot(next);
  return fired;
}

TaskManager.defineTask(SCORE_TASK, async () => {
  try {
    const fired = await checkForAlerts();
    return fired > 0
      ? BackgroundFetch.BackgroundFetchResult.NewData
      : BackgroundFetch.BackgroundFetchResult.NoData;
  } catch {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});
