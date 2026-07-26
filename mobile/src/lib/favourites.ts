import AsyncStorage from "@react-native-async-storage/async-storage";

// Favourites live on-device rather than in Supabase: they drive local
// notification scheduling, which has to work before the network does.

const KEY_TEAMS = "sd.fav.teams";
const KEY_LEAGUES = "sd.fav.leagues";
const KEY_ONBOARDED = "sd.onboarded";
const KEY_NOTIFY = "sd.notify";

export type FavKind = "team" | "league";

export interface Favourite {
  name: string;
  sport: string;
}

export interface NotifyPrefs {
  enabled: boolean;
  matchStart: boolean;
  scoring: boolean;   // goals, wickets, big baskets
  fullTime: boolean;
}

export const DEFAULT_NOTIFY: NotifyPrefs = {
  enabled: true,
  matchStart: true,
  scoring: true,
  fullTime: true,
};

function keyFor(kind: FavKind): string {
  return kind === "team" ? KEY_TEAMS : KEY_LEAGUES;
}

async function read(kind: FavKind): Promise<Favourite[]> {
  try {
    const raw = await AsyncStorage.getItem(keyFor(kind));
    return raw ? (JSON.parse(raw) as Favourite[]) : [];
  } catch {
    return [];
  }
}

async function write(kind: FavKind, list: Favourite[]): Promise<void> {
  await AsyncStorage.setItem(keyFor(kind), JSON.stringify(list));
}

export const getFavouriteTeams = () => read("team");
export const getFavouriteLeagues = () => read("league");

export async function getAllFavourites(): Promise<{
  teams: Favourite[];
  leagues: Favourite[];
}> {
  const [teams, leagues] = await Promise.all([read("team"), read("league")]);
  return { teams, leagues };
}

// Names come from different upstreams with different casing and padding, so
// compare loosely — "Man City" from BBC and "Man City " from a card are one team.
function same(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

export async function isFavourite(kind: FavKind, name: string): Promise<boolean> {
  if (!name) return false;
  const list = await read(kind);
  return list.some((f) => same(f.name, name));
}

/** Returns the new state: true if it is now a favourite. */
export async function toggleFavourite(
  kind: FavKind,
  name: string,
  sport: string,
): Promise<boolean> {
  if (!name) return false;
  const list = await read(kind);
  const idx = list.findIndex((f) => same(f.name, name));
  if (idx >= 0) {
    list.splice(idx, 1);
    await write(kind, list);
    return false;
  }
  list.push({ name: name.trim(), sport });
  await write(kind, list);
  return true;
}

export async function setFavourites(
  kind: FavKind,
  list: Favourite[],
): Promise<void> {
  await write(kind, list);
}

export async function hasOnboarded(): Promise<boolean> {
  return (await AsyncStorage.getItem(KEY_ONBOARDED)) === "1";
}

export async function markOnboarded(): Promise<void> {
  await AsyncStorage.setItem(KEY_ONBOARDED, "1");
}

export async function getNotifyPrefs(): Promise<NotifyPrefs> {
  try {
    const raw = await AsyncStorage.getItem(KEY_NOTIFY);
    return raw ? { ...DEFAULT_NOTIFY, ...JSON.parse(raw) } : DEFAULT_NOTIFY;
  } catch {
    return DEFAULT_NOTIFY;
  }
}

export async function setNotifyPrefs(prefs: NotifyPrefs): Promise<void> {
  await AsyncStorage.setItem(KEY_NOTIFY, JSON.stringify(prefs));
}

/** True when either side of the fixture, or its competition, is favourited. */
export function matchIsFavourite(
  match: { team1: string; team2: string; league: string },
  favs: { teams: Favourite[]; leagues: Favourite[] },
): boolean {
  const teamHit = favs.teams.some(
    (f) => same(f.name, match.team1) || same(f.name, match.team2),
  );
  if (teamHit) return true;
  return favs.leagues.some((f) => same(f.name, match.league));
}
