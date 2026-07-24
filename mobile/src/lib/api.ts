import Constants from "expo-constants";
import { supabase } from "./supabase";

const API_BASE =
  (Constants.expoConfig?.extra as any)?.apiBase ?? "https://tryscoredeck.pro";

export interface MobileMatch {
  sport: string;
  color: string;
  league: string;         // grouping bucket in the UI
  region?: string;        // "Europe", "World", country name
  team1: string;
  team2: string;
  score: string;          // "2-1" or "287/4" or "P1"
  extra: string;          // "78'", "43.1 ov", or start-time string
  status: "live" | "final" | "upcoming";
  isLive: boolean;
  team1Logo?: string;
  team2Logo?: string;
  team1Score?: string;    // parsed home score (empty for upcoming)
  team2Score?: string;    // parsed away score
  note?: string;          // "India beat Zimbabwe by 7 wickets", etc.
}

const SPORT_COLOR: Record<string, string> = {
  Cricket: "#0f7a89",
  Football: "#c86e2e",
  Basketball: "#c89a3c",
  F1: "#d63838",
};

async function j(path: string): Promise<any> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function withDate(path: string, date?: string): string {
  if (!date) return path;
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}date=${encodeURIComponent(date)}`;
}

function splitScore(s: string): [string, string] {
  const m = /^(\d+)\s*[-:]\s*(\d+)/.exec(s ?? "");
  if (m) return [m[1], m[2]];
  return ["", ""];
}

// ---------- Cricket ----------
async function fetchCricket(date?: string): Promise<MobileMatch[]> {
  const data = await j(withDate("/api/cricket", date));
  const arr = Array.isArray(data) ? data : data?.matches ?? [];
  const color = SPORT_COLOR.Cricket;

  return arr.slice(0, 30).map((m: any): MobileMatch => {
    const title: string = m.title ?? "";
    const [teamsPart, seriesPart] = title.split(",").map((x: string) => x?.trim());
    const [t1, t2] = (teamsPart ?? "").split(/\s+vs?\s+/i);
    const league = seriesPart || teamsPart || "Cricket";
    const isLive = /live/i.test(m.status ?? "") || /live/i.test(m.status_text ?? "");
    const isFinal = /complete|won|beat|drew/i.test(m.status_text ?? "");

    return {
      sport: "Cricket",
      color,
      league,
      region: "World",
      team1: (t1 ?? "T1").trim(),
      team2: (t2 ?? "T2").trim(),
      score: m.score ?? "",
      extra: m.status_text ?? "",
      status: isLive ? "live" : isFinal ? "final" : "upcoming",
      isLive,
      note: isFinal ? m.status_text : undefined,
    };
  });
}

// ---------- Football ----------
async function fetchFootball(date?: string): Promise<MobileMatch[]> {
  const data = await j(withDate("/api/soccer", date));
  const color = SPORT_COLOR.Football;
  const out: MobileMatch[] = [];

  (data?.leagues ?? []).forEach((l: any) => {
    (l.matches ?? []).forEach((m: any) => {
      const isLive = m.status === "Live";
      const isFinal = m.status === "Finished";
      out.push({
        sport: "Football",
        color,
        league: l.league ?? "Football",
        region: "Europe",
        team1: m.home_team,
        team2: m.away_team,
        team1Logo: m.home_badge || undefined,
        team2Logo: m.away_badge || undefined,
        team1Score: (m.home_score ?? "") + "",
        team2Score: (m.away_score ?? "") + "",
        score: `${m.home_score || "0"}-${m.away_score || "0"}`,
        extra: m.time || m.status || "",
        status: isLive ? "live" : isFinal ? "final" : "upcoming",
        isLive,
      });
    });
  });

  return out.slice(0, 40);
}

// ---------- Basketball ----------
async function fetchBasketball(date?: string): Promise<MobileMatch[]> {
  const data = await j(withDate("/api/basketball", date));
  const color = SPORT_COLOR.Basketball;

  return (data?.matches ?? []).slice(0, 30).map((m: any): MobileMatch => {
    const [s1, s2] = splitScore(m.score ?? "");
    const isLive = !!m.isLive || m.status === "in";
    const isFinal = m.status === "post";

    return {
      sport: "Basketball",
      color,
      league: "NBA",
      region: "United States",
      team1: m.team1Full ?? m.team1,
      team2: m.team2Full ?? m.team2,
      team1Logo: m.team1Logo,
      team2Logo: m.team2Logo,
      team1Score: s1,
      team2Score: s2,
      score: m.score ?? "",
      extra: m.extra ?? "",
      status: isLive ? "live" : isFinal ? "final" : "upcoming",
      isLive,
    };
  });
}

// ---------- F1 ----------
async function fetchF1(): Promise<MobileMatch[]> {
  const data = await j("/api/f1");
  const color = SPORT_COLOR.F1;

  return (data?.matches ?? []).slice(0, 8).map((m: any): MobileMatch => ({
    sport: "F1",
    color,
    league: m.title ?? "Formula 1",
    region: "World",
    team1: m.team1Full ?? m.team1,
    team2: m.team2 || "WINNER",
    score: m.score ?? "",
    extra: m.extra ?? "",
    status: m.status === "in" ? "live" : m.status === "post" ? "final" : "upcoming",
    isLive: !!m.isLive,
    note: m.nextRace ? `Next: ${m.nextRace}` : undefined,
  }));
}

export async function fetchSport(sport: string, date?: string): Promise<MobileMatch[]> {
  try {
    switch (sport) {
      case "Cricket":    return await fetchCricket(date);
      case "Football":   return await fetchFootball(date);
      case "Basketball": return await fetchBasketball(date);
      case "F1":         return await fetchF1();
      default:           return [];
    }
  } catch {
    return [];
  }
}

// ---------- Match details ----------

export interface MatchDetail {
  id: string;
  sport: string;
  league: string;
  team1: string;
  team2: string;
  score: string;
  extra: string;
  status: "live" | "final" | "upcoming";
  venue?: string;
  startTime?: string;
  timeline?: { text: string; time?: string; type?: string }[];
  battersLive?: { name: string; runs: string }[];
  bowlerLive?: string;
  extras?: Record<string, string>;
}

export async function fetchMatchDetail(sport: string, id: string): Promise<MatchDetail | null> {
  try {
    if (sport === "Cricket") {
      const data = await j(`/api/cricket/details?id=${encodeURIComponent(id)}`);
      if (!data) return null;
      return {
        id,
        sport,
        league: data.title ?? "Cricket",
        team1: (data.innings?.[0]?.team ?? "").trim() || "Team 1",
        team2: (data.innings?.[1]?.team ?? "").trim() || "Team 2",
        score: (data.innings ?? []).map((i: any) => `${i.team} ${i.score}`).join(" · "),
        extra: data.statusText ?? data.status ?? "",
        status: /live|in\s*progress/i.test(data.status ?? "") ? "live" : "final",
        venue: data.locationName,
        startTime: data.startDate,
        timeline: (data.timeline ?? []).slice(0, 15).map((t: any) => ({
          text: t.text,
          time: t.ball,
          type: t.type,
        })),
      };
    }

    if (sport === "Football") {
      const data = await j(`/api/soccer/details?path=${encodeURIComponent(id)}`);
      if (!data) return null;
      return {
        id,
        sport,
        league: data.league ?? "Football",
        team1: data.home_team ?? "Home",
        team2: data.away_team ?? "Away",
        score: `${data.home_score ?? 0} - ${data.away_score ?? 0}`,
        extra: data.time ?? data.status ?? "",
        status: data.status === "Live" ? "live" : data.status === "Finished" ? "final" : "upcoming",
        venue: data.venue,
        startTime: data.kickoff,
        timeline: (data.events ?? []).slice(0, 20).map((e: any) => ({
          text: e.text ?? `${e.type} — ${e.player ?? ""}`,
          time: e.minute ?? "",
          type: e.type,
        })),
      };
    }

    return null;
  } catch {
    return null;
  }
}

// Public Dodo product IDs — mirrors what the website's Pricing.tsx uses.
export async function fetchProducts(): Promise<{
  monthly: string | null;
  annual: string | null;
  mobile: string | null;
}> {
  try {
    const res = await fetch(`${API_BASE}/api/config/products`);
    if (!res.ok) throw new Error(String(res.status));
    return await res.json();
  } catch {
    return { monthly: null, annual: null, mobile: null };
  }
}

// Ask Scoreweb whether the current user is ad-free.
export async function fetchMe(): Promise<{
  adsFree: boolean;
  adsFreeUntil: string | null;
  email?: string;
} | null> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return null;
  try {
    const res = await fetch(`${API_BASE}/api/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
