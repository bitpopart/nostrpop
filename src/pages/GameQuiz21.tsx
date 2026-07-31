import { useState, useEffect, useRef, useCallback } from 'react';
import { useSeoMeta } from '@unhead/react';
import { Trophy, Zap, Timer, X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import {
  useJackpotState,
  resolveJackpot,
  formatCountdown,
  JACKPOT_GOAL,
} from '@/hooks/useGameJackpot';
import { LoginArea } from '@/components/auth/LoginArea';
import { nip19 } from 'nostr-tools';

const GAME_ID = 'bitpopart-21-quiz';

// ── Types ─────────────────────────────────────────────────────────────────────

interface GameMessage {
  type: 'ready' | 'game_over' | 'score_update';
  score?: number;
  totalMs?: number;
  paid?: boolean;
  name?: string;
  npub?: string;
}

// ── Jackpot strip ─────────────────────────────────────────────────────────────

function JackpotStrip({ game }: { game: string }) {
  const { data: jackpot, refetch } = useJackpotState(game);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => refetch(), 5000);
    return () => clearInterval(t);
  }, [refetch]);

  if (!jackpot) {
    return (
      <div
        className="w-full text-center py-1.5 text-sm font-bold"
        style={{ background: '#0a0a0a', color: '#fce000', fontFamily: "'Bangers', Impact, sans-serif", letterSpacing: '2px' }}
      >
        <Skeleton className="h-4 w-48 mx-auto bg-yellow-900/40 inline-block" />
      </div>
    );
  }

  const resolved = resolveJackpot(jackpot);

  if (resolved.countdown_start) {
    const left = Math.max(0, resolved.countdown_start + 21 * 60 * 60 * 1000 - now);
    return (
      <div
        className="w-full text-center py-1.5 px-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-0"
        style={{ background: '#0a0a0a', color: '#fce000', fontFamily: "'Bangers', Impact, sans-serif", letterSpacing: '1.5px', fontSize: 'clamp(12px,2.5vw,16px)' }}
      >
        <span className="flex items-center gap-1">
          <Zap className="h-3.5 w-3.5 text-[#f97316] fill-current inline" />
          JACKPOT LIVE: {resolved.total.toLocaleString()} SATS
        </span>
        <span className="text-[#4cc1bb] flex items-center gap-1">
          <Timer className="h-3.5 w-3.5 inline" />
          {formatCountdown(left)}
          {resolved.round_high ? ` · ${resolved.round_high.name} leads` : ' — HIGH SCORE WINS'}
        </span>
      </div>
    );
  }

  return (
    <div
      className="w-full text-center py-1.5 px-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-0"
      style={{ background: '#0a0a0a', color: '#fce000', fontFamily: "'Bangers', Impact, sans-serif", letterSpacing: '1.5px', fontSize: 'clamp(12px,2.5vw,16px)' }}
    >
      <span className="flex items-center gap-1">
        <Zap className="h-3.5 w-3.5 text-[#f97316] fill-current inline" />
        JACKPOT: {resolved.total.toLocaleString()} / {JACKPOT_GOAL.toLocaleString()} SATS
      </span>
      <span className="text-[#4cc1bb] text-xs">
        {resolved.last_winner
          ? `LAST WINNER: ${resolved.last_winner.name} · ${resolved.last_winner.sats.toLocaleString()} SATS`
          : '21% OF EVERY DEPOSIT · NOSTR REWARDS'}
      </span>
    </div>
  );
}

// ── Scoreboard overlay ────────────────────────────────────────────────────────

const MEDALS = ['🥇', '🥈', '🥉'];

function Scoreboard({ onClose }: { onClose: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 30);
    return () => clearTimeout(t);
  }, []);

  // Load local board from localStorage
  const localBoard: Array<{ n: string; s: number; ms?: number }> = (() => {
    try {
      const raw = localStorage.getItem('bpa21_state');
      if (raw) {
        const parsed = JSON.parse(raw);
        return (parsed.board ?? []).slice(0, 10);
      }
    } catch { /* ignore */ }
    return [];
  })();

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #0a0a0a 0%, #1a0a00 50%, #0a0a0a 100%)' }}
    >
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-5 pt-5 pb-3">
        <div className="flex items-center gap-3">
          <Trophy className="h-8 w-8 text-[#fce000] drop-shadow-lg" />
          <h1
            className="text-[clamp(28px,7vw,48px)] text-[#f97316] leading-none"
            style={{ fontFamily: "'Bangers', Impact, sans-serif", letterSpacing: '3px', textShadow: '3px 3px 0 #ff042c, 5px 5px 0 #000' }}
          >
            21 QUIZ BOARD
          </h1>
        </div>
        <button
          onClick={onClose}
          className="text-white/60 hover:text-white transition-colors bg-white/10 hover:bg-white/20 rounded-full p-2"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      <p
        className="shrink-0 text-center text-[#4cc1bb] text-sm px-4 pb-4"
        style={{ fontFamily: "'Bangers', Impact, sans-serif", letterSpacing: '2px' }}
      >
        LOCAL HIGH SCORES · TOP 10 ⚡
      </p>

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {localBoard.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <span className="text-6xl animate-bounce">⚡</span>
            <p
              className="text-[#fce000] text-2xl"
              style={{ fontFamily: "'Bangers', Impact, sans-serif", letterSpacing: '2px' }}
            >
              NO SCORES YET<br />BE FIRST!
            </p>
          </div>
        ) : (
          <div className="max-w-lg mx-auto space-y-2">
            {localBoard.map((entry, i) => {
              const isTop3 = i < 3;
              return (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-300"
                  style={{
                    background: isTop3
                      ? `rgba(249,115,22,${0.18 - i * 0.04})`
                      : 'rgba(255,255,255,0.06)',
                    border: '2px solid rgba(249,115,22,0.2)',
                    transform: visible ? 'translateX(0)' : 'translateX(-60px)',
                    opacity: visible ? 1 : 0,
                    transitionDelay: `${i * 80}ms`,
                  }}
                >
                  <div
                    className="shrink-0 w-8 text-center text-xl"
                    style={{ fontFamily: "'Bangers', Impact, sans-serif" }}
                  >
                    {isTop3 ? MEDALS[i] : <span className="text-white/50 text-base">{i + 1}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="truncate font-bold text-white"
                      style={{ fontFamily: "'Bangers', Impact, sans-serif", letterSpacing: '1.5px', fontSize: 'clamp(16px,4vw,20px)' }}
                    >
                      {String(entry.n).replace(/[<>&]/g, '')}
                    </p>
                    {entry.ms && (
                      <p className="text-xs text-[#f97316]">
                        ⏱ {(entry.ms / 1000).toFixed(1)}s
                      </p>
                    )}
                  </div>
                  <div
                    className="shrink-0 text-right"
                    style={{
                      fontFamily: "'Bangers', Impact, sans-serif",
                      letterSpacing: '1px',
                      fontSize: 'clamp(18px,4.5vw,24px)',
                      color: isTop3 ? '#fce000' : '#4cc1bb',
                      textShadow: '0 0 8px currentColor',
                    }}
                  >
                    {entry.s}/21
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="shrink-0 flex justify-center pb-6 pt-2">
        <button
          className="px-10 py-3 rounded-2xl border-4 font-bold text-xl shadow-[4px_4px_0_#ff042c] active:translate-y-1 active:shadow-none transition-all"
          style={{
            fontFamily: "'Bangers', Impact, sans-serif",
            letterSpacing: '2px',
            borderColor: '#f97316',
            color: '#f97316',
            background: 'rgba(255,255,255,0.05)',
          }}
          onClick={onClose}
        >
          CLOSE
        </button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

type Screen = 'menu' | 'game' | 'scoreboard';

export default function GameQuiz21() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [screen, setScreen] = useState<Screen>('game');
  const [iframeReady, setIframeReady] = useState(false);
  const { user } = useCurrentUser();

  useSeoMeta({
    title: '21 QUIZ — Bitcoin & Nostr · BitPopArt Games',
    description: 'Test your Bitcoin & Nostr knowledge with 21 QUIZ by BitPopArt! 21 questions, timed rounds, Lightning jackpot. Deposit sats to compete on the scoreboard!',
    ogTitle: '21 QUIZ — Bitcoin & Nostr · BitPopArt ⚡',
    ogDescription: '21 questions. Bitcoin & Nostr. No googling, no excuses 🤘',
    ogImage: 'https://bitpopart.com/bitpopart-logo.png',
  });

  // Auto-fill npub when user is logged in — post to iframe
  const handleIframeLoad = useCallback(() => {
    setIframeReady(true);
    // Give the iframe a moment to initialize, then send the npub
    if (user) {
      setTimeout(() => {
        const npub = nip19.npubEncode(user.pubkey);
        iframeRef.current?.contentWindow?.postMessage({ type: 'set_npub', npub }, '*');
      }, 500);
    }
  }, [user]);

  // Listen for postMessage events from the game iframe
  const handleIframeMessage = useCallback((e: MessageEvent) => {
    if (!e.data || typeof e.data !== 'object') return;
    const msg = e.data as GameMessage;
    if (msg.type === 'ready') {
      setIframeReady(true);
      if (user) {
        const npub = nip19.npubEncode(user.pubkey);
        iframeRef.current?.contentWindow?.postMessage({ type: 'set_npub', npub }, '*');
      }
    }
  }, [user]);

  useEffect(() => {
    window.addEventListener('message', handleIframeMessage);
    return () => window.removeEventListener('message', handleIframeMessage);
  }, [handleIframeMessage]);

  return (
    <div
      className="flex-1 flex flex-col overflow-hidden relative"
      style={{ background: '#f5f5f0' }}
    >
      {/* Jackpot strip */}
      <JackpotStrip game={GAME_ID} />

      {/* Game iframe — fills remaining space */}
      <div className="flex-1 relative overflow-hidden">
        {/* Loading state */}
        {!iframeReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#f5f5f0] z-10">
            <div className="text-center space-y-2">
              <div className="animate-bounce text-5xl">⚡</div>
              <p
                className="font-bold text-xl"
                style={{
                  fontFamily: "'Bangers', Impact, sans-serif",
                  color: '#f97316',
                  letterSpacing: '2px',
                }}
              >
                LOADING QUIZ…
              </p>
            </div>
          </div>
        )}

        <iframe
          ref={iframeRef}
          src="/games/quiz21.html"
          title="21 Quiz — Bitcoin & Nostr"
          className="w-full h-full border-0 block"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          onLoad={handleIframeLoad}
        />

        {/* Scoreboard overlay */}
        {screen === 'scoreboard' && (
          <Scoreboard onClose={() => setScreen('game')} />
        )}
      </div>

      {/* Optional bottom bar when user is logged in — shows login hint if not */}
      {!user && iframeReady && (
        <div className="shrink-0 bg-[#0a0a0a]/90 px-4 py-2 flex items-center justify-between gap-3">
          <p className="text-xs text-white/70 flex-1">
            Log in with Nostr to auto-fill your npub &amp; publish scores ⚡
          </p>
          <LoginArea className="shrink-0" />
        </div>
      )}
    </div>
  );
}
