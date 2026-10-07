const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ||
  'https://tryscoredeck.pro';

const HOUSE = {
  headline: 'Try ScoreDeck Pro · Live Sports Telemetry',
  subline: 'SCOREDECK PRO · FROM $5/MONTH · NO ADS',
  short: 'TRY SCOREDECK',
  landingUrl: 'https://tryscoredeck.pro/#pricing',
};

export interface AdCreative {
  campaignId: number;
  creativeUrl: string;
  // Text creative, used by the house ad when there's no hosted image.
  headline: string;
  subline: string;
  short: string;
  landingUrl: string;
  variant: 'passive' | 'interstitial';
  house: boolean;
  ttl: number; // seconds
}

interface CachedAd {
  ad: AdCreative;
  fetchedAt: number;
}

// Freq-cap: don't refetch same variant more than once per TTL window.
const cache: Record<string, CachedAd | null> = {};

function sessionId(): string {
  const key = 'scoredeck-session-id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

export interface AdContext {
  variant: 'passive' | 'interstitial';
  sport?: string;
  locale?: string;
  country?: string;
  tier?: 'free' | 'pro';
}

function houseAd(ctx: AdContext): AdCreative {
  return {
    campaignId: 0,
    creativeUrl: '',
    ...HOUSE,
    variant: ctx.variant,
    house: true,
    ttl: 120,
  };
}

export async function fetchAd(ctx: AdContext): Promise<AdCreative> {
  const key = `${ctx.variant}:${ctx.sport ?? 'all'}`;
  const now = Date.now();
  const hit = cache[key];
  if (hit && now - hit.fetchedAt < hit.ad.ttl * 1000) {
    return hit.ad;
  }

  try {
    const p = new URLSearchParams({ variant: ctx.variant });
    if (ctx.sport) p.set('sport', ctx.sport.toLowerCase());
    if (ctx.locale) p.set('locale', ctx.locale);
    if (ctx.country) p.set('country', ctx.country);
    if (ctx.tier) p.set('tier', ctx.tier);

    const res = await fetch(`${API_BASE}/api/ads/next?${p.toString()}`, {
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data?.status !== 'ok') throw new Error('bad response');

    const ad: AdCreative = {
      campaignId: data.campaignId ?? 0,
      creativeUrl: data.creativeUrl ?? '',
      headline: data.headline || HOUSE.headline,
      subline: data.subline || HOUSE.subline,
      short: data.short || HOUSE.short,
      landingUrl: data.landingUrl || HOUSE.landingUrl,
      variant: (data.variant as 'passive' | 'interstitial') || ctx.variant,
      house: !!data.house,
      ttl: typeof data.ttl === 'number' ? data.ttl : 120,
    };

    cache[key] = { ad, fetchedAt: now };
    return ad;
  } catch {
    // Silently fall back to house ad on error or offline
    const fallback = houseAd(ctx);
    cache[key] = { ad: fallback, fetchedAt: now };
    return fallback;
  }
}

export function reportAdEvent(
  campaignId: number,
  type: 'impression' | 'click',
  ctx: AdContext,
): void {
  // House ad has campaignId 0 — no need to report
  if (!campaignId) return;

  try {
    fetch(`${API_BASE}/api/ads/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        campaignId,
        type,
        sport: ctx.sport?.toLowerCase(),
        locale: ctx.locale,
        country: ctx.country,
        tier: ctx.tier,
        sessionId: sessionId(),
      }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Non-blocking telemetry
  }
}
