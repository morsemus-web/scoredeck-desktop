import type { TrackConfig } from './types';

const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ||
  'https://tryscoredeck.pro';

const SPORT_COLOR: Record<string, string> = {
  Cricket: '#4b9fae',
  Football: '#b37340',
  Basketball: '#b89849',
  F1: '#cc3333',
};

export interface WidgetData {
  color: string;
  team1: string;
  team2: string;
  score: string;
  extra: string;
  progress: string;
  analysis: string[];
}

function empty(sport: string, msg: string): WidgetData {
  return {
    color: SPORT_COLOR[sport] ?? '#ffffff',
    team1: '—',
    team2: '—',
    score: msg,
    extra: '',
    progress: '0%',
    analysis: [],
  };
}

async function getJson(path: string): Promise<any> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function short(name: string): string {
  const t = name.trim();
  return t.length <= 3 ? t.toUpperCase() : t.substring(0, 3).toUpperCase();
}

// ---------- Cricket ----------
// /api/cricket proxies live-cricket-score-api-production.up.railway.app/all_matches
// Upstream returns an array (or object) of matches:
//   { id, status, title, score, status_text, current_batsmen[], current_bowler{} }

interface CricketMatch {
  id?: string;
  status?: string;
  title?: string;
  score?: string;
  status_text?: string;
  current_batsmen?: { name: string; score: string }[];
  current_bowler?: { name: string };
}

function parseTeams(title: string): [string, string] {
  const before = title.split(',')[0] ?? title;
  const parts = before.split(/\s+vs?\s+/i);
  if (parts.length >= 2) return [parts[0].trim(), parts[1].trim()];
  return [title.trim(), ''];
}

function pickCricket(matches: CricketMatch[], config: TrackConfig): CricketMatch | null {
  if (!matches?.length) return null;
  const live = matches.filter(
    (m) =>
      (m.status ?? '').toLowerCase() === 'live' ||
      /live|in\s*progress|inn/i.test(m.status_text ?? ''),
  );
  const pool = live.length ? live : matches;
  if (config.type === 'team' && config.selection) {
    const needle = config.selection.toLowerCase();
    const hit = pool.find((m) => (m.title ?? '').toLowerCase().includes(needle));
    if (hit) return hit;
  }
  return pool[0];
}

async function fetchCricket(config: TrackConfig): Promise<WidgetData> {
  try {
    const data = await getJson('/api/cricket');
    const matches: CricketMatch[] = Array.isArray(data)
      ? data
      : Array.isArray(data?.matches)
      ? data.matches
      : Array.isArray(data?.data)
      ? data.data
      : [];
    const match = pickCricket(matches, config);
    if (!match) return empty('Cricket', 'No live match');

    const [t1, t2] = parseTeams(match.title ?? '');
    const overMatch = /([\d.]+)\s*ov/i.exec(match.status_text ?? '');
    const overs = overMatch ? parseFloat(overMatch[1]) : 0;
    const progressPct = Math.min(100, Math.round((overs / 50) * 100));

    const analysis: string[] = [];
    if (match.title) analysis.push(match.title);
    if (match.current_batsmen?.length) {
      analysis.push(
        `Batsmen: ${match.current_batsmen.map((b) => `${b.name} ${b.score}`).join(', ')}`,
      );
    }
    if (match.current_bowler?.name) analysis.push(`Bowler: ${match.current_bowler.name}`);
    if (match.status_text) analysis.push(match.status_text);

    return {
      color: SPORT_COLOR.Cricket,
      team1: short(t1) || 'T1',
      team2: short(t2) || 'T2',
      score: match.score || 'LIVE',
      extra: overMatch ? `${overMatch[1]} ov` : (match.status ?? ''),
      progress: `${progressPct}%`,
      analysis,
    };
  } catch {
    return empty('Cricket', 'Offline');
  }
}

// ---------- Football (soccer) ----------
// /api/soccer returns { status:"success", leagues:[{league, matches:[{home_team,
// away_team, home_score, away_score, status:"Live"|"Finished"|"Upcoming"|"Postponed",
// time, home_badge, away_badge}]}]}

interface SoccerMatch {
  home_team: string;
  away_team: string;
  home_score: string;
  away_score: string;
  status: string;
  time: string;
}

interface SoccerLeague {
  league: string;
  matches: SoccerMatch[];
}

function pickSoccer(
  leagues: SoccerLeague[],
  config: TrackConfig,
): { league: string; match: SoccerMatch } | null {
  if (!leagues?.length) return null;
  const flat = leagues.flatMap((l) => l.matches.map((m) => ({ league: l.league, match: m })));
  const live = flat.filter((x) => x.match.status === 'Live');
  const pool = live.length ? live : flat;

  if (config.type === 'league' && config.selection) {
    const needle = config.selection.toLowerCase();
    const found = pool.find((x) => x.league.toLowerCase().includes(needle));
    if (found) return found;
  }
  if (config.type === 'team' && config.selection) {
    const needle = config.selection.toLowerCase();
    const found = pool.find(
      (x) =>
        x.match.home_team.toLowerCase().includes(needle) ||
        x.match.away_team.toLowerCase().includes(needle),
    );
    if (found) return found;
  }
  return pool[0];
}

async function fetchFootball(config: TrackConfig): Promise<WidgetData> {
  try {
    const data = await getJson('/api/soccer');
    if (data?.status !== 'success') throw new Error('bad status');
    const leagues: SoccerLeague[] = Array.isArray(data?.leagues) ? data.leagues : [];
    const picked = pickSoccer(leagues, config);
    if (!picked) return empty('Football', 'No live match');

    const { league, match } = picked;
    const minMatch = /^(\d+)['’]/.exec(match.time);
    const minute = minMatch ? parseInt(minMatch[1], 10) : 0;
    const progressPct =
      match.status === 'Finished'
        ? 100
        : match.status === 'Live'
        ? Math.min(100, Math.round((minute / 90) * 100))
        : 0;

    return {
      color: SPORT_COLOR.Football,
      team1: short(match.home_team),
      team2: short(match.away_team),
      score: `${match.home_score || '0'}-${match.away_score || '0'}`,
      extra: match.time || match.status,
      progress: `${progressPct}%`,
      analysis: [
        `${match.home_team} vs ${match.away_team}`,
        `League: ${league}`,
        `Status: ${match.status}`,
      ],
    };
  } catch {
    return empty('Football', 'Offline');
  }
}

// ---------- Basketball (NBA) ----------
// Live /api/basketball returns:
//   { status:"success", matches:[{id, title, team1, team2, team1Full, team2Full,
//     team1Logo, team2Logo, venue, broadcasts, score, extra, status:"pre"|"in"|"post", isLive}] }

interface NbaMatch {
  id: string;
  title?: string;
  team1: string;
  team2: string;
  team1Full?: string;
  team2Full?: string;
  score: string;
  extra: string;
  status: string;
  isLive?: boolean;
}

async function fetchBasketball(config: TrackConfig): Promise<WidgetData> {
  try {
    const data = await getJson('/api/basketball');
    if (data?.status !== 'success') throw new Error('bad status');
    const matches: NbaMatch[] = Array.isArray(data?.matches) ? data.matches : [];
    if (!matches.length) return empty('Basketball', 'No games');

    const live = matches.filter((m) => m.isLive || m.status === 'in');
    const pool = live.length ? live : matches;

    let match = pool[0];
    if (config.type === 'team' && config.selection) {
      const needle = config.selection.toLowerCase();
      const hit = pool.find(
        (m) =>
          m.team1.toLowerCase().includes(needle) ||
          m.team2.toLowerCase().includes(needle) ||
          (m.team1Full ?? '').toLowerCase().includes(needle) ||
          (m.team2Full ?? '').toLowerCase().includes(needle),
      );
      if (hit) match = hit;
    }

    const progressPct =
      match.status === 'post' ? 100 : match.status === 'in' ? 60 : 0;

    return {
      color: SPORT_COLOR.Basketball,
      team1: match.team1,
      team2: match.team2,
      score: match.score,
      extra: match.extra,
      progress: `${progressPct}%`,
      analysis: [
        match.title ?? `${match.team1Full ?? match.team1} vs ${match.team2Full ?? match.team2}`,
        `Status: ${match.extra}`,
      ],
    };
  } catch {
    return empty('Basketball', 'Offline');
  }
}

// ---------- F1 ----------
// Live /api/f1 returns:
//   { status:"success", matches:[{id, title, team1, team2, team1Full, score:"P1",
//     extra, status, isLive, analysis:[...], standings:[...], nextRace, pastWinners:[...]}] }

interface F1Match {
  id: string;
  title?: string;
  team1: string;
  team2: string;
  team1Full?: string;
  score: string;
  extra: string;
  status: string;
  isLive?: boolean;
  analysis?: string[];
  nextRace?: string;
}

async function fetchF1(config: TrackConfig): Promise<WidgetData> {
  try {
    const data = await getJson('/api/f1');
    if (data?.status !== 'success') throw new Error('bad status');
    const matches: F1Match[] = Array.isArray(data?.matches) ? data.matches : [];
    if (!matches.length) return empty('F1', 'No data');

    let match = matches[0];
    if (config.type === 'driver' && config.selection) {
      const needle = config.selection.toLowerCase();
      const hit = matches.find(
        (m) =>
          m.team1.toLowerCase() === needle ||
          (m.team1Full ?? '').toLowerCase().includes(needle),
      );
      if (hit) match = hit;
    }

    return {
      color: SPORT_COLOR.F1,
      team1: match.team1,
      team2: match.team2 || 'WIN',
      score: match.score,
      extra: match.extra,
      progress: match.status === 'post' ? '100%' : match.status === 'in' ? '60%' : '0%',
      analysis: [
        match.title ?? '',
        ...(match.analysis ?? []),
        match.nextRace ? `Next: ${match.nextRace}` : '',
      ].filter(Boolean),
    };
  } catch {
    return empty('F1', 'Offline');
  }
}

// ---------- Router ----------

export async function fetchSportData(
  sport: string,
  config: TrackConfig,
): Promise<WidgetData> {
  switch (sport) {
    case 'Cricket':
      return fetchCricket(config);
    case 'Football':
      return fetchFootball(config);
    case 'Basketball':
      return fetchBasketball(config);
    case 'F1':
      return fetchF1(config);
    default:
      return empty(sport, 'Unknown sport');
  }
}
