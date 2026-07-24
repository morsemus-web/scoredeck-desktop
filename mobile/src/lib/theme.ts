// Brand-forward light theme, Sofascore-inspired.
// Colored branded header + white content area + sport-color accents.

export const colors = {
  brand: "#0f7a89",        // deep teal — header + primary actions
  brandDark: "#0a5966",
  brandLight: "#4b9fae",   // ScoreDeck accent for highlights
  bg: "#f3f4f6",           // page background — soft gray
  card: "#ffffff",
  cardMuted: "#f7f8fa",
  border: "#e6e8ec",
  borderStrong: "#d3d7dd",
  text: "#0f1216",         // near-black
  textDim: "#4a4f56",
  textMuted: "#8a9099",
  live: "#e53935",         // red for LIVE dot
  liveDim: "#f7d1d0",
  win: "#0a5966",          // completed match highlight (winner side)
  ad: "#1f2530",           // dark ad-slot bg for contrast
  sport: {
    Cricket: "#0f7a89",
    Football: "#c86e2e",
    Basketball: "#c89a3c",
    F1: "#d63838",
  } as const,
} as const;

export const radius = {
  xs: 4,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  pill: 999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const shadow = {
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  header: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
};

export function sportColor(sport: string): string {
  return (colors.sport as Record<string, string>)[sport] ?? colors.brand;
}
