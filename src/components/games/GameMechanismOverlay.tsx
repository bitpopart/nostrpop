/**
 * GameMechanismOverlay
 *
 * Sits on top of HTML-uploaded games at /games/:id.
 *
 * What it does:
 *  1. Shows the jackpot strip at the top (always visible)
 *  2. When the iframe posts { type: 'game_over', score: N } it shows the
 *     Nostr game-over panel so the player can publish their score.
 *
 * What it does NOT do:
 *  - Show its own pre-game menu / payment screen.
 *    The game HTML already has its own splash + pay-to-play UI.
 *    Showing a second payment screen on top of that is confusing.
 *
 * The game communicates via postMessage:
 *   window.gamestr.scoreUpdate(n)  // live score (optional)
 *   window.gamestr.gameOver(n)     // final score → show Nostr overlay
 *   window.gamestr.gameStart()     // optional hint
 */

import { useState, useEffect } from 'react';
import { Trophy, Zap, Timer, X, Users, Loader2, CheckCircle2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useGameLeaderboard,
  usePublishGameScore,
  useJackpotState,
  resolveJackpot,
  formatCountdown,
  JACKPOT_GOAL,
} from '@/hooks/useGameJackpot';

const MEDALS = ['🥇', '🥈', '🥉'];

// ─── Jackpot Strip ─────────────────────────────────────────────────────────

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
      <div className="w-full bg-[#1A0040] text-[#FCE000] text-center py-1.5 flex-shrink-0"
        style={{ fontFamily: "'Bangers', Impact, sans-serif", letterSpacing: '2px' }}>
        <Skeleton className="h-4 w-48 mx-auto bg-yellow-900/40 inline-block" />
      </div>
    );
  }

  const resolved = resolveJackpot(jackpot);

  if (resolved.countdown_start) {
    const left = Math.max(0, resolved.countdown_start + 21 * 60 * 60 * 1000 - now);
    return (
      <div className="w-full bg-[#1A0040] text-[#FCE000] text-center py-1.5 px-3 flex flex-wrap items-center justify-center gap-x-3 flex-shrink-0"
        style={{ fontFamily: "'Bangers', Impact, sans-serif", letterSpacing: '1.5px', fontSize: 'clamp(11px,2.2vw,15px)' }}>
        <span className="flex items-center gap-1">
          <Zap className="h-3 w-3 text-[#F7931A] fill-current" />
          JACKPOT LIVE: {resolved.total.toLocaleString()} SATS
        </span>
        <span className="text-[#00CFFF] flex items-center gap-1">
          <Timer className="h-3 w-3" />
          {formatCountdown(left)}
          {resolved.round_high ? ` · ${resolved.round_high.name} LEADS` : ' — HIGH SCORE WINS'}
        </span>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#1A0040] text-[#FCE000] text-center py-1.5 px-3 flex flex-wrap items-center justify-center gap-x-3 flex-shrink-0"
      style={{ fontFamily: "'Bangers', Impact, sans-serif", letterSpacing: '1.5px', fontSize: 'clamp(11px,2.2vw,15px)' }}>
      <span className="flex items-center gap-1">
        <Zap className="h-3 w-3 text-[#F7931A] fill-current" />
        JACKPOT: {resolved.total.toLocaleString()} / {JACKPOT_GOAL.toLocaleString()} SATS
      </span>
      <span className="text-[#00CFFF] text-xs">
        {resolved.last_winner
          ? `LAST WINNER: ${resolved.last_winner.name} · ${resolved.last_winner.sats.toLocaleString()} SATS`
          : '21% OF EVERY DEPOSIT · NOSTR REWARDS'}
      </span>
    </div>
  );
}

// ─── Scoreboard ────────────────────────────────────────────────────────────

function Scoreboard({ game, myScore, onClose }: { game: string; myScore?: number; onClose: () => void }) {
  const { data: scores = [], isLoading } = useGameLeaderboard(game);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 30);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col"
      style={{ background: 'linear-gradient(160deg, #1A0040 0%, #3D0070 50%, #1A0040 100%)' }}>
      <div className="shrink-0 flex items-center justify-between px-5 pt-5 pb-3">
        <div className="flex items-center gap-3" style={{ fontFamily: "'Bangers', Impact, sans-serif" }}>
          <Trophy className="h-7 w-7 text-[#FCE000]" />
          <h1 className="text-[clamp(24px,6vw,42px)] text-[#FF0080] leading-none"
            style={{ letterSpacing: '3px', textShadow: '3px 3px 0 #FCE000, 5px 5px 0 #000' }}>
            LEADERBOARD
          </h1>
        </div>
        <button onClick={onClose}
          className="text-white/60 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors">
          <X className="h-5 w-5" />
        </button>
      </div>

      <p className="shrink-0 text-center text-[#00CFFF] text-sm px-4 pb-4"
        style={{ fontFamily: "'Bangers', Impact, sans-serif", letterSpacing: '2px' }}>
        ALL-TIME HIGH SCORES · VERIFIED ON NOSTR ⚡
      </p>

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {isLoading ? (
          <div className="space-y-3 max-w-lg mx-auto">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-2xl bg-white/10" />)}
          </div>
        ) : scores.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <span className="text-5xl animate-bounce">🎮</span>
            <p className="text-[#FCE000] text-xl"
              style={{ fontFamily: "'Bangers', Impact, sans-serif", letterSpacing: '2px' }}>
              NO SCORES YET<br />BE FIRST!
            </p>
          </div>
        ) : (
          <div className="max-w-lg mx-auto space-y-2">
            {scores.map((entry, i) => {
              const isMe = myScore !== undefined && entry.score === myScore;
              const isTop3 = i < 3;
              return (
                <div key={entry.event_id ?? entry.pubkey}
                  className="flex items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-300"
                  style={{
                    background: isMe ? 'linear-gradient(90deg,#FCE000,#F7931A)' : isTop3 ? `rgba(255,255,255,${0.12 - i * 0.03})` : 'rgba(255,255,255,0.06)',
                    border: isMe ? '2px solid #F7931A' : '2px solid rgba(255,255,255,0.1)',
                    transform: visible ? 'translateX(0)' : 'translateX(-60px)',
                    opacity: visible ? 1 : 0,
                    transitionDelay: `${i * 80}ms`,
                  }}>
                  <div className="shrink-0 w-8 text-center text-xl" style={{ fontFamily: "'Bangers', Impact, sans-serif" }}>
                    {isTop3 ? MEDALS[i] : <span className="text-white/50 text-base">{i + 1}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-bold"
                      style={{ fontFamily: "'Bangers', Impact, sans-serif", letterSpacing: '1.5px', fontSize: 'clamp(14px,3.5vw,18px)', color: isMe ? '#1A0040' : '#FFF' }}>
                      {entry.name}{isMe && <span className="ml-2 text-xs">← YOU</span>}
                    </p>
                    {entry.sats_deposited > 0 ? (
                      <p className="text-xs" style={{ color: isMe ? '#6200EA' : '#F7931A' }}>
                        ⚡ {entry.sats_deposited.toLocaleString()} sats
                      </p>
                    ) : (
                      <p className="text-xs text-white/40">FREE PLAY</p>
                    )}
                  </div>
                  <div className="shrink-0 text-right"
                    style={{ fontFamily: "'Bangers', Impact, sans-serif", letterSpacing: '1px', fontSize: 'clamp(16px,4vw,22px)', color: isMe ? '#1A0040' : (isTop3 ? '#FCE000' : '#00CFFF'), textShadow: isMe ? 'none' : '0 0 8px currentColor' }}>
                    {entry.score.toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="shrink-0 flex justify-center pb-5 pt-2">
        <button
          className="px-8 py-2.5 rounded-2xl border-4 border-[#FCE000] text-[#FCE000] font-bold text-lg shadow-[4px_4px_0_#FF0080] active:translate-y-1 active:shadow-none transition-all"
          style={{ fontFamily: "'Bangers', Impact, sans-serif", letterSpacing: '2px', background: 'rgba(255,255,255,0.05)' }}
          onClick={onClose}>
          CLOSE
        </button>
      </div>
    </div>
  );
}

// ─── Game Over Panel ────────────────────────────────────────────────────────

interface GameOverPanelProps {
  gameId: string;
  /** Score from the game (via postMessage) */
  score: number;
  /** Name the player entered in the game's own UI (via postMessage), if available */
  playerName: string;
  /** Npub from game's own UI (via postMessage) or logged-in user */
  playerNpub: string;
  /** Sats the player deposited (via postMessage from game), 0 = free play */
  satsPaid: number;
  onPlayAgain: () => void;
}

function GameOverPanel({ gameId, score, playerName, playerNpub, satsPaid, onPlayAgain }: GameOverPanelProps) {
  const { publishScore, isPending } = usePublishGameScore();
  const [published, setPublished] = useState(false);
  const [publishError, setPublishError] = useState('');
  const [showBoard, setShowBoard] = useState(false);

  // Auto-publish paid scores — no login needed (guest key fallback).
  useEffect(() => {
    if (satsPaid > 0 && score > 0 && !published && !isPending) {
      publishScore(gameId, playerName || 'PLAYER', score, satsPaid, playerNpub || undefined)
        .then(() => setPublished(true))
        .catch((err) => {
          setPublishError(err instanceof Error ? err.message : 'Failed to publish — try again.');
        });
    }
  }, [gameId, satsPaid, score, playerName, playerNpub, published, isPending, publishScore]);

  const displayName = playerName || 'PLAYER';

  const handlePublish = async () => {
    if (published || isPending) return;
    setPublishError('');
    try {
      await publishScore(gameId, displayName, score, satsPaid, playerNpub || undefined);
      setPublished(true);
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : 'Failed to publish — try again.');
    }
  };

  if (showBoard) {
    return <Scoreboard game={gameId} myScore={score} onClose={() => setShowBoard(false)} />;
  }

  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 px-6 py-8"
      style={{ background: 'linear-gradient(160deg,#1A0040,#3D0070)', fontFamily: "'Bangers', Impact, sans-serif" }}>

      <div className="text-[clamp(28px,8vw,52px)] text-white leading-none text-center"
        style={{ letterSpacing: '3px', textShadow: '3px 3px 0 #FF0080, 6px 6px 0 #000' }}>
        GAME OVER
      </div>
      <div className="text-[clamp(18px,5vw,32px)] text-[#FCE000]"
        style={{ letterSpacing: '2px', textShadow: '2px 2px 0 #F7931A' }}>
        SCORE: {score.toLocaleString()}
      </div>

      {/* Nostr score publishing — works with or without login (guest key fallback) */}
      {score > 0 && (
        <div className="w-full max-w-xs space-y-2">
          {!published ? (
            <>
              <button
                className="w-full py-2.5 rounded-2xl border-4 border-[#FCE000] text-[#1A0040] font-bold text-lg bg-[#FCE000] shadow-[4px_4px_0_#F7931A] active:translate-y-1 active:shadow-none transition-all disabled:opacity-60"
                style={{ letterSpacing: '2px' }}
                onClick={handlePublish}
                disabled={isPending}>
                {isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />PUBLISHING…
                  </span>
                ) : 'POST TO NOSTR LEADERBOARD ⚡'}
              </button>
              {satsPaid > 0 && !published && !isPending && (
                <p className="text-[#FCE000] text-xs text-center" style={{ fontFamily: 'sans-serif' }}>
                  {playerNpub ? 'Your paid score posts automatically…' : 'No login needed — your paid score posts with your guest key.'}
                </p>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center gap-2 text-[#00CFFF] text-lg" style={{ letterSpacing: '1px' }}>
              <CheckCircle2 className="h-5 w-5" />SCORE ON NOSTR!
            </div>
          )}
          {publishError && (
            <p className="text-red-400 text-xs text-center" style={{ fontFamily: 'sans-serif' }}>{publishError}</p>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2 w-full max-w-xs">
        <button
          className="w-full py-2.5 rounded-2xl border-4 border-black bg-[#FF0080] text-white font-bold text-lg shadow-[4px_4px_0_#FCE000] active:translate-y-1 active:shadow-none transition-all"
          style={{ letterSpacing: '2px' }}
          onClick={onPlayAgain}>
          PLAY AGAIN ↺
        </button>
        <button
          className="w-full py-2 rounded-2xl border-2 border-white/20 text-white/70 hover:text-white hover:border-white/50 transition-all text-base"
          style={{ letterSpacing: '1px' }}
          onClick={() => setShowBoard(true)}>
          <Users className="h-4 w-4 inline mr-1" />VIEW LEADERBOARD
        </button>
      </div>

      <div className="text-[#FFFFFF44] text-xs text-center" style={{ letterSpacing: '1px' }}>
        Scores stored on Nostr · Rewards via Lightning
      </div>
    </div>
  );
}

// ─── Main overlay ───────────────────────────────────────────────────────────

export interface GameMechanismOverlayProps {
  gameId: string;
  gameName: string;
  /** Called when user taps "Play Again" on the game-over screen */
  onPlayAgain: () => void;
  /** Current score from the iframe (via postMessage) */
  score: number;
  /** Whether game_over message was received */
  isGameOver: boolean;
  /** Player name sent from game's own UI (via postMessage) */
  playerName: string;
  /** Player npub sent from game's own UI (via postMessage) */
  playerNpub: string;
  /** Sats the player deposited (reported from game's own UI via postMessage) */
  satsPaid: number;
}

export function GameMechanismOverlay({
  gameId,
  gameName: _gameName,
  onPlayAgain,
  score,
  isGameOver,
  playerName,
  playerNpub,
  satsPaid,
}: GameMechanismOverlayProps) {
  // When game_over arrives, show our Nostr publishing overlay
  if (isGameOver) {
    return (
      <GameOverPanel
        gameId={gameId}
        score={score}
        playerName={playerName}
        playerNpub={playerNpub}
        satsPaid={satsPaid}
        onPlayAgain={onPlayAgain}
      />
    );
  }

  // Game is running (or showing its own splash) — show nothing, let the iframe be
  return null;
}

// ─── Jackpot strip export ───────────────────────────────────────────────────
export { JackpotStrip };
