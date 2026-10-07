// Anonymous usage tracking for the desktop widget (see the website repo's
// docs/REPORTING.md). A random install ID in localStorage identifies the
// install; no account, email or IP is sent. Only runs when the user allows
// it in Setup ("Share anonymous usage statistics").

const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ||
  'https://tryscoredeck.pro';

const KEY = 'sd_install_id';
const HEARTBEAT_MS = 5 * 60 * 1000;

type UsageEvent = 'app_open' | 'heartbeat' | 'match_view';

function installId(): string | null {
  try {
    let id = localStorage.getItem(KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

/** Region default: on, except where consent is required (EU/UK/CH) or unknown. */
export async function defaultShareUsage(): Promise<boolean> {
  try {
    const r = await (await fetch(`${API_BASE}/api/region`)).json();
    return r.consentRequired === false;
  } catch {
    return false;
  }
}

let regionDefault: Promise<boolean> | null = null;

// The user's choice in Setup wins; without one, the regional default applies.
async function sharingAllowed(): Promise<boolean> {
  try {
    const config = JSON.parse(localStorage.getItem('scoredeck-config') || 'null');
    if (typeof config?.shareUsage === 'boolean') return config.shareUsage;
  } catch {
    // No saved config yet.
  }
  regionDefault ??= defaultShareUsage();
  return regionDefault;
}

export async function track(event: UsageEvent, extra: { sport?: string; league?: string } = {}) {
  if (!(await sharingAllowed())) return;
  const id = installId();
  if (!id) return;
  fetch(`${API_BASE}/api/track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      installId: id,
      platform: 'desktop',
      appVersion: __APP_VERSION__,
      event,
      ...extra,
    }),
  }).catch(() => {});
}

let started = false;

/** Call once at startup: records the open, then a heartbeat every 5 minutes. */
export function startUsageTracking() {
  if (started) return;
  started = true;
  track('app_open');
  setInterval(() => track('heartbeat'), HEARTBEAT_MS);
}
