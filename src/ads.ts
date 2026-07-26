const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ||
  'https://tryscoredeck.pro';

const HOUSE = {
  headline: 'The sanctuary in the dunes of Ras Al Khaimah',
  subline: 'Powered by RakOasis',
  short: 'RakOasis',
  landingUrl: 'https://rakoasis.com',
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

export async function fetchAd(ctx: AdContext): Promise<AdCreative | null> {
  const cacheKey = `${ctx.variant}:${ctx.sport ?? ''}:${ctx.tier ?? ''}`;
  const cached = cache[cacheKey];
  if (cached && Date.now() - cached.fetchedAt < cached.ad.ttl * 1000) {
    return cached.ad;
  }

  try {
    const params = new URLSearchParams({ variant: ctx.variant });
    if (ctx.sport) params.set('sport', ctx.sport);
    if (ctx.locale) params.set('locale', ctx.locale);
    if (ctx.country) params.set('country', ctx.country);
    if (ctx.tier) params.set('tier', ctx.tier);

    const res = await fetch(`${API_BASE}/api/ads/next?${params.toString()}`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data?.status !== 'ok') {
      return houseAd(ctx);
    }
    // If the server sent no copy of its own — an older build, or a campaign
    // row with only an image — we render the house text, and the click has to
    // follow that text to rakoasis.com rather than the row's own landing URL.
    const usingHouseCopy = !data.subline;
    if (usingHouseCopy) return houseAd(ctx);

    const ad: AdCreative = {
      campaignId: data.campaignId,
      creativeUrl: data.creativeUrl ?? '',
      headline: data.headline ?? '',
      subline: data.subline,
      short: data.short ?? '',
      landingUrl: data.landingUrl,
      variant: data.variant,
      house: !!data.house,
      ttl: data.ttl ?? 60,
    };
    cache[cacheKey] = { ad, fetchedAt: Date.now() };
    return ad;
  } catch {
    // Offline or the ad server is down — still show the sponsor line.
    return houseAd(ctx);
  }
}

export async function reportAdEvent(
  campaignId: number,
  type: 'impression' | 'click',
  ctx: AdContext,
): Promise<void> {
  // The house ad is campaign 0 — it has no row to attribute events to.
  if (!campaignId) return;
  try {
    await fetch(`${API_BASE}/api/ads/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        campaignId,
        type,
        sport: ctx.sport,
        locale: ctx.locale,
        country: ctx.country,
        tier: ctx.tier,
        sessionId: sessionId(),
      }),
      keepalive: true,
    });
  } catch {
    // Best-effort beacon — swallow errors.
  }
}
