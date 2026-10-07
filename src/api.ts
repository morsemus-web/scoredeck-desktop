import type { TrackConfig } from './types';

const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ||
  'https://tryscoredeck.pro';

export const SPORT_COLOR: Record<string, string> = {
  Cricket: '#4b9fae',
  Football: '#10b981',
  Basketball: '#b89849',
  F1: '#cc3333',
};

export interface WidgetData {
  sport: string;
  color: string;
  team1: string;
  team2: string;
  score: string;
  extra: string;
  progress: string;
  analysis: string[];
  isLive: boolean;
  homeBadge?: string;
  awayBadge?: string;
}

function empty(sport: string, msg: string): WidgetData {
  return {
    sport,
    color: SPORT_COLOR[sport] ?? '#ffffff',
    team1: 'SCOREDECK',
    team2: 'LIVE',
    score: msg,
    extra: 'STANDBY',
    progress: '0%',
    analysis: ['Waiting for next live game to start.'],
    isLive: false,
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
  if (!name) return '';
  const t = name.trim();
  return t.length <= 4 ? t.toUpperCase() : t.substring(0, 3).toUpperCase();
}

function parseTeams(title: string): [string, string] {
  const before = title.split(',')[0] ?? title;
  const parts = before.split(/\s+vs?\s+/i);
  if (parts.length >= 2) return [parts[0].trim(), parts[1].trim()];
  return [title.trim(), ''];
}

// ---------- Live Fetchers ----------

export async function fetchLiveCricket(): Promise<WidgetData[]> {
  try {
    const data = await getJson('/api/cricket');
    const matches: any[] = Array.isArray(data)
      ? data
      : Array.isArray(data?.matches)
      ? data.matches
      : Array.isArray(data?.data)
      ? data.data
      : [];

    const live = matches.filter((m) => {
      const st = (m.status_text || '').toLowerCase();
      const isCompleted = st.includes('won') || st.includes('beat') || st.includes('draw') || st.includes('tied') || st.includes('completed') || st.includes('abandoned');
      const isUpcoming = st.includes('starts at') || st.includes('starts in') || st.includes('preview') || st.includes('yet to begin');
      if (isCompleted || isUpcoming) return false;
      return (m.status ?? '').toLowerCase() === 'live' || /live|in\s*progress|need|trail|lead|innings/i.test(st);
    });

    return live.map((m) => {
      const [t1, t2] = parseTeams(m.title ?? '');
      return {
        sport: 'Cricket',
        color: SPORT_COLOR.Cricket,
        team1: short(t1) || 'T1',
        team2: short(t2) || 'T2',
        score: m.score || 'LIVE',
        extra: m.status_text || 'Live',
        progress: '65%',
        analysis: [
          m.title ?? '',
          m.status_text ?? '',
          m.current_batsmen?.map((b: any) => `${b.name} ${b.score}`).join(', ') ?? '',
        ].filter(Boolean),
        isLive: true,
      };
    });
  } catch {
    return [];
  }
}

export async function fetchLiveSoccer(): Promise<WidgetData[]> {
  try {
    const data = await getJson('/api/soccer');
    if (data?.status !== 'success') return [];
    const leagues: any[] = Array.isArray(data?.leagues) ? data.leagues : [];
    const flat = leagues.flatMap((l) =>
      (l.matches || []).map((m: any) => ({ league: l.league, match: m }))
    );

    // 1. In-play live matches (active minutes, HT, ET, etc.)
    const inPlay = flat.filter(
      (x) =>
        x.match.status === 'Live' ||
        /^\d+['’]/.test(x.match.time) ||
        x.match.time === 'HT' ||
        x.match.time === 'ET'
    );

    if (inPlay.length > 0) {
      return inPlay.map(({ league, match }) => {
        const minMatch = /^(\d+)['’]/.exec(match.time);
        const minute = minMatch ? parseInt(minMatch[1], 10) : 45;
        const progressPct = Math.min(100, Math.round((minute / 90) * 100));

        return {
          sport: 'Football',
          color: SPORT_COLOR.Football,
          team1: short(match.home_team),
          team2: short(match.away_team),
          score: `${match.home_score || '0'}-${match.away_score || '0'}`,
          extra: match.time || 'LIVE',
          progress: `${progressPct}%`,
          analysis: [
            `${match.home_team} vs ${match.away_team}`,
            `League: ${league}`,
            `Status: Live (${match.time})`,
          ],
          homeBadge: match.home_badge || '',
          awayBadge: match.away_badge || '',
          isLive: true,
        };
      });
    }

    // 2. If no match is currently mid-minute, display today's premier fixtures & live kickoff schedule
    const upcomingOrRecent = flat.filter(
      (x) => x.match.home_team && x.match.away_team
    );

    if (upcomingOrRecent.length > 0) {
      return upcomingOrRecent.slice(0, 12).map(({ league, match }) => {
        const isFin = match.status === 'Finished' || match.time === 'FT';
        return {
          sport: 'Football',
          color: SPORT_COLOR.Football,
          team1: short(match.home_team),
          team2: short(match.away_team),
          score: isFin ? `${match.home_score || '0'}-${match.away_score || '0'}` : 'VS',
          extra: isFin ? 'FT' : match.time || 'TODAY',
          progress: isFin ? '100%' : '15%',
          analysis: [
            `${match.home_team} vs ${match.away_team}`,
            `League: ${league}`,
            isFin ? `Full-Time: ${match.home_score}-${match.away_score}` : `Kickoff: ${match.time} Today`,
          ],
          homeBadge: match.home_badge || '',
          awayBadge: match.away_badge || '',
          isLive: !isFin,
        };
      });
    }

    return [];
  } catch {
    return [];
  }
}

export async function fetchLiveBasketball(): Promise<WidgetData[]> {
  try {
    const data = await getJson('/api/basketball');
    if (data?.status !== 'success') return [];
    const matches: any[] = Array.isArray(data?.matches) ? data.matches : [];
    const live = matches.filter((m) => m.isLive || m.status === 'in');

    return live.map((m) => ({
      sport: 'Basketball',
      color: SPORT_COLOR.Basketball,
      team1: short(m.team1),
      team2: short(m.team2),
      score: m.score || 'LIVE',
      extra: m.extra || 'IN GAME',
      progress: '50%',
      analysis: [`${m.team1Full ?? m.team1} vs ${m.team2Full ?? m.team2}`, m.extra],
      isLive: true,
    }));
  } catch {
    return [];
  }
}

// Return active live matches across all sports with seamless soccer support
export async function fetchAllActiveLiveMatches(): Promise<WidgetData[]> {
  const [soccer, cricket, basketball] = await Promise.all([
    fetchLiveSoccer(),
    fetchLiveCricket(),
    fetchLiveBasketball(),
  ]);

  const combined: WidgetData[] = [];

  // Prioritize active in-play matches
  const activeInPlay = [...soccer.filter((m) => m.isLive), ...cricket, ...basketball];
  if (activeInPlay.length > 0) {
    combined.push(...activeInPlay);
  }

  // Include soccer fixtures
  if (soccer.length > 0) {
    for (const m of soccer) {
      if (!combined.some((c) => c.team1 === m.team1 && c.team2 === m.team2)) {
        combined.push(m);
      }
    }
  }

  // Offline or nothing on: return nothing rather than an invented match.
  return combined;
}

export async function fetchSportData(
  sport: string,
  _config: TrackConfig,
): Promise<WidgetData> {
  if (sport === 'Football') {
    const s = await fetchLiveSoccer();
    return s[0] || empty('Football', 'No Live Match');
  }
  if (sport === 'Cricket') {
    const c = await fetchLiveCricket();
    return c[0] || empty('Cricket', 'No Live Match');
  }
  if (sport === 'Basketball') {
    const b = await fetchLiveBasketball();
    return b[0] || empty('Basketball', 'No Live Game');
  }
  const all = await fetchAllActiveLiveMatches();
  return all[0] || empty('Football', 'No Live Match');
}
