/**
 * Lightweight GA4 event helper for games — "most played" data.
 * GA4 tag is loaded globally in index.html (G-SDL5GYPPBT). Events are fired
 * through the global `gtag` function when present; silently skipped otherwise.
 */

interface GameEventParams {
  game_id: string;
  game_name?: string;
  mode?: 'free' | 'paid';
  sats?: number;
  score?: number;
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

function track(event: string, params: GameEventParams) {
  try {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', event, params);
    }
  } catch { /* analytics must never break the game */ }
}

export function trackGameStarted(gameId: string, gameName: string, mode: 'free' | 'paid', sats = 0) {
  track('game_started', { game_id: gameId, game_name: gameName, mode, sats });
}

export function trackGameFinished(gameId: string, gameName: string, mode: 'free' | 'paid', score: number, sats = 0) {
  track('game_finished', { game_id: gameId, game_name: gameName, mode, sats, score });
}
