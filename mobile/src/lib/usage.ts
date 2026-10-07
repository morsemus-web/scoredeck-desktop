import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { AppState } from "react-native";

// Anonymous usage tracking for the Android app (see the website repo's
// docs/REPORTING.md). A random install ID in AsyncStorage identifies the
// install; no account, email or IP is sent. The user can turn this off in
// Account → "Share anonymous usage statistics".

const API_BASE =
  (Constants.expoConfig?.extra as any)?.apiBase ?? "https://tryscoredeck.pro";
const APP_VERSION = Constants.expoConfig?.version ?? null;
const KEY = "sd_install_id";
const HEARTBEAT_MS = 5 * 60 * 1000;

type UsageEvent = "app_open" | "heartbeat" | "match_view";

let cachedId: string | null = null;

function randomId(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

async function installId(): Promise<string> {
  if (cachedId) return cachedId;
  let id = await AsyncStorage.getItem(KEY);
  if (!id) {
    id = randomId();
    await AsyncStorage.setItem(KEY, id);
  }
  cachedId = id;
  return id;
}

const OPT_KEY = "sd_usage_optin";
let regionDefault: Promise<boolean> | null = null;

/** Region default: on, except where consent is required (EU/UK/CH) or unknown. */
async function defaultSharing(): Promise<boolean> {
  try {
    const r = await (await fetch(`${API_BASE}/api/region`)).json();
    return r.consentRequired === false;
  } catch {
    return false;
  }
}

/** Current setting: the user's choice if made, else the regional default. */
export async function usageSharing(): Promise<boolean> {
  const saved = await AsyncStorage.getItem(OPT_KEY);
  if (saved === "1") return true;
  if (saved === "0") return false;
  regionDefault ??= defaultSharing();
  return regionDefault;
}

export async function setUsageSharing(on: boolean) {
  await AsyncStorage.setItem(OPT_KEY, on ? "1" : "0");
}

export async function track(event: UsageEvent, extra: { sport?: string; league?: string } = {}) {
  if (!(await usageSharing())) return;
  try {
    await fetch(`${API_BASE}/api/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        installId: await installId(),
        platform: "android",
        appVersion: APP_VERSION,
        event,
        ...extra,
      }),
    });
  } catch {
    // Offline or blocked: usage stats are best-effort.
  }
}

let started = false;

/** Call once from the root layout: an app_open each time the app comes to
 *  the foreground, and a heartbeat every 5 minutes while it stays there. */
export function startUsageTracking() {
  if (started) return;
  started = true;
  let timer: ReturnType<typeof setInterval> | null = null;

  const foreground = () => {
    track("app_open");
    if (!timer) timer = setInterval(() => track("heartbeat"), HEARTBEAT_MS);
  };
  const background = () => {
    if (timer) clearInterval(timer);
    timer = null;
  };

  if (AppState.currentState === "active") foreground();
  AppState.addEventListener("change", (state) => {
    if (state === "active") foreground();
    else background();
  });
}
