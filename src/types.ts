export interface TrackConfig {
  sport: string;
  type: 'all' | 'league' | 'team' | 'driver';
  selection?: string;
}

export interface AppConfig {
  isPro: boolean;
  trackedSports: TrackConfig[];
  startupOnBoot: boolean;
  displayId: string;
  visibility: 'always' | 'live-only';
  /** Anonymous usage stats opt-in. Unset → regional default (off in EU/UK/CH). */
  shareUsage?: boolean;
}
