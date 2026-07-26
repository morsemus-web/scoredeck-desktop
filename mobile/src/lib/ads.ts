import Constants from "expo-constants";

const API_BASE =
  (Constants.expoConfig?.extra as any)?.apiBase ?? "https://tryscoredeck.pro";

export interface AdCreative {
  campaignId: number;
  creativeUrl: string;
  headline: string;
  subline: string;
  short: string;
  landingUrl: string;
  house: boolean;
  ttl: number;
}

export interface AdContext {
  variant: "passive" | "interstitial";
  sport?: string;
  tier?: "free" | "pro";
}

export async function fetchAd(ctx: AdContext): Promise<AdCreative | null> {
  try {
    const qs = new URLSearchParams({ variant: ctx.variant });
    if (ctx.sport) qs.set("sport", ctx.sport);
    if (ctx.tier) qs.set("tier", ctx.tier);

    const res = await fetch(`${API_BASE}/api/ads/next?${qs.toString()}`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.status !== "ok") return null;

    return {
      campaignId: data.campaignId ?? 0,
      creativeUrl: data.creativeUrl ?? "",
      headline: data.headline ?? "",
      subline: data.subline ?? "",
      short: data.short ?? "",
      landingUrl: data.landingUrl ?? "",
      house: !!data.house,
      ttl: data.ttl ?? 60,
    };
  } catch {
    return null;
  }
}
