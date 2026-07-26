import Constants from "expo-constants";
import { supabase } from "./supabase";

const API_BASE =
  (Constants.expoConfig?.extra as any)?.apiBase ?? "https://tryscoredeck.pro";

export interface MobileMatch {
  id: string;              // real upstream id — cricbuzz id, BBC path, ESPN id, season-round
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
  startTime?: string;     // ISO, used by the notification scheduler
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
    // "Series | Live | Team 1 vs Team 2, Description"
    const afterPipes = title.split("|").pop() ?? title;
    const [teamsPart, seriesPart] = afterPipes.split(",").map((x: string) => x?.trim());
    const [t1, t2] = (teamsPart ?? "").split(/\s+vs?\s+/i);
    const league = title.split("|")[0]?.trim() || seriesPart || "Cricket";
    const isLive = /live/i.test(m.status ?? "") || /live/i.test(m.status_text ?? "");
    const isFinal = /complete|won|beat|drew/i.test(m.status_text ?? "");

    return {
      id: String(m.id ?? ""),
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
        // The details route keys off the BBC path, not a numeric id.
        id: m.detail_path ?? "",
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

  return out.slice(0, 60);
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
      id: String(m.id ?? ""),
      sport: "Basketball",
      color,
      league: m.league ?? "NBA",
      region: "United States",
      team1: m.team1Full ?? m.team1,
      team2: m.team2Full ?? m.team2,
      team1Logo: m.team1Logo,
      team2Logo: m.team2Logo,
      team1Score: m.team1Score || s1,
      team2Score: m.team2Score || s2,
      score: m.score ?? "",
      extra: m.extra ?? "",
      status: isLive ? "live" : isFinal ? "final" : "upcoming",
      isLive,
      startTime: m.startTime,
    };
  });
}

// ---------- F1 ----------
async function fetchF1(): Promise<MobileMatch[]> {
  const data = await j("/api/f1");
  const color = SPORT_COLOR.F1;

  return (data?.matches ?? []).slice(0, 12).map((m: any): MobileMatch => ({
    id: String(m.id ?? ""),
    sport: "F1",
    color,
    league: `Formula 1 ${m.season ?? ""}`.trim(),
    region: m.country || "World",
    // A race weekend has no two sides — show the event and where it is.
    team1: m.title ?? "Grand Prix",
    team2: [m.locality, m.country].filter(Boolean).join(", ") || m.circuit || "",
    score: m.team1Full ? `${m.team1Full}` : "",
    extra: m.extra ?? "",
    status: m.status === "in" ? "live" : m.status === "post" ? "final" : "upcoming",
    isLive: !!m.isLive,
    note: m.team1Full ? `Winner: ${m.team1Full}` : undefined,
    startTime: m.startTime,
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
// Each sport's detail payload is returned raw (typed) rather than flattened into
// one shape — the screens render sport-specific tabs, so squashing them into a
// common interface was throwing away every metric the website shows.

export interface CricketBatter {
  name: string; dismissal: string; runs: string; balls: string;
  fours: string; sixes: string; sr: string;
}
export interface CricketBowler {
  name: string; overs: string; maidens: string; runs: string;
  wickets: string; nb: string; wd: string; econ: string;
}
export interface CricketInnings {
  team: string; score: string; batters: CricketBatter[]; bowlers: CricketBowler[];
  extras: string; total: string; yetToBat: string[];
}
export interface CricketDetail {
  status: string;
  title: string;
  statusText: string;
  startDate: string;
  locationName: string;
  playerOfTheMatch: string;
  timeline: { ball: string; text: string; type: string; score: string }[];
  innings: CricketInnings[];
  teams: Record<string, string[]>;
  pointsTable: {
    pos: number; team: string; short: string;
    p: number; w: number; l: number; pts: number; nrr: string;
  }[];
  probability: { team1: number; team2: number; label1: string; label2: string };
}

export interface FootballEvent { player: string; type: string; time: string }
export interface FootballLineupPlayer {
  name: string; shirt_number: string; position: string; accessible_text: string;
}
export interface FootballLineup {
  formation: string;
  pitch: FootballLineupPlayer[][];
  substitutes: FootballLineupPlayer[];
}
export interface FootballDetail {
  status: string;
  tournament_name: string;
  events: { home: FootballEvent[]; away: FootballEvent[] };
  lineups: { home: FootballLineup | null; away: FootballLineup | null };
  stats: { home: Record<string, number>; away: Record<string, number> };
  h2h: {
    summary: {
      total: number; home_wins: number; away_wins: number;
      draws: number; first_played: string;
    };
    last_five: {
      date: string; tournament: string; home_team: string; away_team: string;
      home_score: string; away_score: string; summary: string;
    }[];
  };
  forms: { home: { result: string }[]; away: { result: string }[] };
  ranks: { home: any; away: any };
  standings: {
    stage_name: string;
    teams: {
      rank: number; name: string; short_name: string; points: number;
      played: number; wins: number; losses: number; draws: number;
      goals_for: number; goals_against: number; goal_diff: number;
      rank_status: string; form: string[];
    }[];
  }[];
}

export interface BasketballTeamSide {
  abbreviation: string; name: string; logo: string;
  score: string; record: string; linescores: string[];
}
export interface BasketballDetail {
  status: string;
  title: string;
  league: string;
  statusText: string;
  state: "pre" | "in" | "post";
  startDate: string;
  venue: string;
  venueCity: string;
  attendance: number | null;
  officials: string[];
  broadcasts: string[];
  teams: { away: BasketballTeamSide; home: BasketballTeamSide };
  linescoreLabels: string[];
  teamStats: { label: string; away: string; home: string }[];
  boxscore: {
    team: string; teamFull: string; logo: string; labels: string[];
    players: {
      name: string; shortName: string; position: string; headshot: string;
      starter: boolean; didNotPlay: boolean; stats: string[];
    }[];
  }[];
  leaders: {
    team: string;
    categories: { label: string; leaders: { name: string; headshot: string; value: string }[] }[];
  }[];
  plays: {
    clock: string; period: number; text: string;
    scoringPlay: boolean; homeScore: number; awayScore: number;
  }[];
  standings: {
    name: string;
    entries: {
      team: string; wins: string; losses: string;
      winPercent: string; gamesBehind: string; streak: string;
    }[];
  }[];
  injuries: { team: string; players: { name: string; status: string; detail: string }[] }[];
}

export interface F1Detail {
  status: string;
  title: string;
  season: string;
  round: string;
  circuit: string;
  locality: string;
  country: string;
  startDate: string;
  sessions: { name: string; date: string; state: string; detail: string }[];
  results: {
    position: string; name: string; code: string; constructor: string;
    grid: string; laps: string; status: string; time: string; points: string;
    fastestLap: string; avgSpeed: string; image: string;
  }[];
  qualifying: {
    position: string; name: string; code: string; constructor: string;
    q1: string; q2: string; q3: string; image: string;
  }[];
  sprint: {
    position: string; name: string; code: string;
    constructor: string; time: string; points: string;
  }[];
  pitstops: { driver: string; lap: string; stop: string; duration: string }[];
}

async function detail<T>(path: string): Promise<T | null> {
  try {
    const data = await j(path);
    if (!data || data.status === "error") return null;
    return data as T;
  } catch {
    return null;
  }
}

export const fetchCricketDetail = (id: string) =>
  detail<CricketDetail>(`/api/cricket/details?id=${encodeURIComponent(id)}`);

export const fetchFootballDetail = (path: string) =>
  detail<FootballDetail>(`/api/soccer/details?path=${encodeURIComponent(path)}`);

export const fetchBasketballDetail = (id: string) =>
  detail<BasketballDetail>(`/api/basketball/details?id=${encodeURIComponent(id)}`);

export const fetchF1Detail = (id: string) =>
  detail<F1Detail>(`/api/f1/details?id=${encodeURIComponent(id)}`);

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
