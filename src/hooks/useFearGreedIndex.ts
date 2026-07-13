import { useQuery } from '@tanstack/react-query';

const CORS_PROXY = 'https://proxy.shakespeare.diy/?url=';
const FEAR_GREED_API = 'https://api.alternative.me/fng/?limit=7&format=json';

export type FearGreedState =
  | 'extreme-fear'
  | 'fear'
  | 'neutral'
  | 'greed'
  | 'extreme-greed';

export interface FearGreedEntry {
  value: number;          // 0–100
  valueText: string;      // "Extreme Fear", "Fear", "Neutral", "Greed", "Extreme Greed"
  state: FearGreedState;
  timestamp: number;      // unix seconds
}

interface ApiEntry {
  value: string;
  value_classification: string;
  timestamp: string;
}

interface ApiResponse {
  data: ApiEntry[];
  metadata?: { error: string | null };
}

/** Map API classification string → our FearGreedState slug */
function classifyToState(classification: string): FearGreedState {
  const c = classification.toLowerCase();
  if (c.includes('extreme') && c.includes('fear')) return 'extreme-fear';
  if (c.includes('fear')) return 'fear';
  if (c.includes('extreme') && c.includes('greed')) return 'extreme-greed';
  if (c.includes('greed')) return 'greed';
  return 'neutral';
}

/** Human-readable label for each state */
export const STATE_LABELS: Record<FearGreedState, string> = {
  'extreme-fear': 'Extreme Fear',
  'fear': 'Fear',
  'neutral': 'Neutral',
  'greed': 'Greed',
  'extreme-greed': 'Extreme Greed',
};

/** Tailwind colour for each state */
export const STATE_COLORS: Record<FearGreedState, { bg: string; text: string; border: string; gradient: string }> = {
  'extreme-fear': {
    bg: 'bg-red-950/30',
    text: 'text-red-400',
    border: 'border-red-700',
    gradient: 'from-red-600 to-red-800',
  },
  'fear': {
    bg: 'bg-orange-950/30',
    text: 'text-orange-400',
    border: 'border-orange-700',
    gradient: 'from-orange-500 to-orange-700',
  },
  'neutral': {
    bg: 'bg-yellow-950/20',
    text: 'text-yellow-400',
    border: 'border-yellow-600',
    gradient: 'from-yellow-400 to-yellow-600',
  },
  'greed': {
    bg: 'bg-lime-950/20',
    text: 'text-lime-400',
    border: 'border-lime-600',
    gradient: 'from-lime-400 to-lime-600',
  },
  'extreme-greed': {
    bg: 'bg-green-950/20',
    text: 'text-green-400',
    border: 'border-green-600',
    gradient: 'from-green-400 to-green-600',
  },
};

/** Default emoji per state (used when admin hasn't uploaded a custom image) */
export const STATE_DEFAULT_EMOJI: Record<FearGreedState, string> = {
  'extreme-fear': '😱',
  'fear': '😨',
  'neutral': '😐',
  'greed': '🤑',
  'extreme-greed': '🚀',
};

export interface FearGreedData {
  current: FearGreedEntry;
  history: FearGreedEntry[];  // last 7 days including today
}

function parseEntry(entry: ApiEntry): FearGreedEntry {
  const value = parseInt(entry.value, 10);
  return {
    value,
    valueText: entry.value_classification,
    state: classifyToState(entry.value_classification),
    timestamp: parseInt(entry.timestamp, 10),
  };
}

/** Fetch the Bitcoin Fear & Greed Index — current + last 7 days */
export function useFearGreedIndex() {
  return useQuery<FearGreedData>({
    queryKey: ['fear-greed-index'],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(10000)]);
      const url = `${CORS_PROXY}${encodeURIComponent(FEAR_GREED_API)}`;
      const res = await fetch(url, { signal });
      if (!res.ok) throw new Error(`Fear & Greed API error: ${res.status}`);
      const json: ApiResponse = await res.json();
      if (!json.data || json.data.length === 0) throw new Error('No data from API');

      const entries = json.data.map(parseEntry);
      return {
        current: entries[0],
        history: entries,
      };
    },
    staleTime: 5 * 60_000,    // 5 min — API updates once a day but we refresh periodically
    refetchInterval: 10 * 60_000,
    retry: 2,
  });
}
