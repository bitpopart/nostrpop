/**
 * GameMechanismOverlay
 *
 * A universal overlay that sits on top of any HTML-uploaded game iframe.
 * It provides:
 *  - Jackpot strip (top bar)
 *  - Pay-to-play flow (Lightning / Nostr)
 *  - Scoreboard (Nostr / Gamestr relay)
 *  - Free play mode (no name on leaderboard)
 *
 * Communication with the iframe:
 *  The iframe (game HTML) should postMessage events of the shape:
 *    { type: 'score_update', score: number }
 *    { type: 'game_over',    score: number }
 *    { type: 'game_start' }
 *
 * A small JS bridge snippet is injected by GamesProjectView into srcDoc games.
 */

import { useState, useEffect } from 'react';
import { Trophy, Zap, Timer, X, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { LoginArea } from '@/components/auth/LoginArea';
import {
  useGameLeaderboard,
  usePublishGameScore,
  useJackpotState,
  addDepositToJackpot,
  updateRoundHighScore,
  resolveJackpot,
  formatCountdown,
  JACKPOT_GOAL,
  MIN_SATS,
} from '@/hooks/useGameJackpot';
import { useLNURL } from '@/hooks/useLNURL';
import { nip19 } from 'nostr-tools';
import QRCode from 'qrcode';

const LIGHTNING_ADDRESS = 'bitpopart@rizful.com';
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
      <div className="w-full bg-[#1A0040] text-[#FCE000] text-center py-1.5 text-sm font-bold flex-shrink-0"
        style={{ fontFamily: "'Bangers', Impact, sans-serif", letterSpacing: '2px' }}>
        <Skeleton className="h-4 w-48 mx-auto bg-yellow-900/40 inline-block" />
      </div>
    );
  }

  const resolved = resolveJackpot(jackpot);

  if (resolved.countdown_start) {
    const left = Math.max(0, resolved.countdown_start + 21 * 60 * 60 * 1000 - now);
    return (
      <div className="w-full bg-[#1A0040] text-[#FCE000] text-center py-1.5 px-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-0 flex-shrink-0"
        style={{ fontFamily: "'Bangers', Impact, sans-serif", letterSpacing: '1.5px', fontSize: 'clamp(11px,2.2vw,15px)' }}>
        <span className="flex items-center gap-1">
          <Zap className="h-3 w-3 text-[#F7931A] fill-current inline" />
          JACKPOT LIVE: {resolved.total.toLocaleString()} SATS
        </span>
        <span className="text-[#00CFFF] flex items-center gap-1">
          <Timer className="h-3 w-3 inline" />
          {formatCountdown(left)}
          {resolved.round_high ? ` · ${resolved.round_high.name} LEADS` : ' — HIGH SCORE WINS'}
        </span>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#1A0040] text-[#FCE000] text-center py-1.5 px-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-0 flex-shrink-0"
      style={{ fontFamily: "'Bangers', Impact, sans-serif", letterSpacing: '1.5px', fontSize: 'clamp(11px,2.2vw,15px)' }}>
      <span className="flex items-center gap-1">
        <Zap className="h-3 w-3 text-[#F7931A] fill-current inline" />
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
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: 'linear-gradient(160deg, #1A0040 0%, #3D0070 50%, #1A0040 100%)' }}
    >
      <div className="shrink-0 flex items-center justify-between px-5 pt-5 pb-3">
        <div className="flex items-center gap-3" style={{ fontFamily: "'Bangers', Impact, sans-serif" }}>
          <Trophy className="h-7 w-7 text-[#FCE000] drop-shadow-lg" />
          <h1
            className="text-[clamp(24px,6vw,42px)] text-[#FF0080] leading-none"
            style={{ letterSpacing: '3px', textShadow: '3px 3px 0 #FCE000, 5px 5px 0 #000' }}
          >
            LEADERBOARD
          </h1>
        </div>
        <button
          onClick={onClose}
          className="text-white/60 hover:text-white transition-colors bg-white/10 hover:bg-white/20 rounded-full p-2"
        >
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
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-2xl bg-white/10" />
            ))}
          </div>
        ) : scores.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <span className="text-5xl animate-bounce">🎮</span>
            <p className="text-[#FCE000] text-xl" style={{ fontFamily: "'Bangers', Impact, sans-serif", letterSpacing: '2px' }}>
              NO SCORES YET<br />BE FIRST!
            </p>
          </div>
        ) : (
          <div className="max-w-lg mx-auto space-y-2">
            {scores.map((entry, i) => {
              const isMe = myScore !== undefined && entry.score === myScore;
              const isTop3 = i < 3;
              return (
                <div
                  key={entry.event_id ?? entry.pubkey}
                  className="flex items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-300"
                  style={{
                    background: isMe
                      ? 'linear-gradient(90deg, #FCE000 0%, #F7931A 100%)'
                      : isTop3
                      ? `rgba(255,255,255,${0.12 - i * 0.03})`
                      : 'rgba(255,255,255,0.06)',
                    border: isMe ? '2px solid #F7931A' : '2px solid rgba(255,255,255,0.1)',
                    transform: visible ? 'translateX(0)' : 'translateX(-60px)',
                    opacity: visible ? 1 : 0,
                    transitionDelay: `${i * 80}ms`,
                  }}
                >
                  <div className="shrink-0 w-8 text-center text-xl" style={{ fontFamily: "'Bangers', Impact, sans-serif" }}>
                    {isTop3 ? MEDALS[i] : <span className="text-white/50 text-base">{i + 1}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-bold"
                      style={{ fontFamily: "'Bangers', Impact, sans-serif", letterSpacing: '1.5px', fontSize: 'clamp(14px,3.5vw,18px)', color: isMe ? '#1A0040' : '#FFFFFF' }}>
                      {entry.name}{isMe && <span className="ml-2 text-xs">← YOU</span>}
                    </p>
                    {entry.sats_deposited > 0 && (
                      <p className="text-xs" style={{ color: isMe ? '#6200EA' : '#F7931A' }}>
                        ⚡ {entry.sats_deposited.toLocaleString()} sats
                      </p>
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
          onClick={onClose}
        >
          CLOSE
        </button>
      </div>
    </div>
  );
}

// ─── Pay Panel ─────────────────────────────────────────────────────────────

interface PayPanelProps {
  gameId: string;
  playerName: string;
  playerNpub: string;
  sats: number;
  onSetName: (v: string) => void;
  onSetNpub: (v: string) => void;
  onSetSats: (v: number) => void;
  onPaid: (paidSats: number) => void;
  onBack: () => void;
}

function PayPanel({ gameId, playerName, playerNpub, sats, onSetName, onSetNpub, onSetSats, onPaid, onBack }: PayPanelProps) {
  const [invoice, setInvoice] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [nameErr, setNameErr] = useState('');
  const [npubErr, setNpubErr] = useState('');
  const [satsErr, setSatsErr] = useState('');
  const { user } = useCurrentUser();
  const { lnurlData, getZapInvoice, isLoading: lnLoading } = useLNURL(LIGHTNING_ADDRESS);

  useEffect(() => {
    if (user && !playerNpub) onSetNpub(nip19.npubEncode(user.pubkey));
  }, [user, playerNpub, onSetNpub]);

  const generateInvoice = async () => {
    setNameErr(''); setNpubErr(''); setSatsErr('');
    if (!playerName.trim()) { setNameErr('Name required'); return; }
    if (!playerNpub.trim() || !playerNpub.startsWith('npub1')) { setNpubErr('Valid npub required (npub1...)'); return; }
    if (sats < MIN_SATS) { setSatsErr(`Min ${MIN_SATS} sats`); return; }
    setIsGenerating(true);
    try {
      const inv = await getZapInvoice(sats);
      if (!inv) return;
      setInvoice(inv.pr);
      const qr = await QRCode.toDataURL(inv.pr.toUpperCase(), { width: 256, margin: 2, errorCorrectionLevel: 'M', color: { dark: '#000000', light: '#ffffff' } });
      setQrUrl(qr);
    } catch (e) { console.error(e); }
    finally { setIsGenerating(false); }
  };

  const handleCopy = async () => {
    if (!invoice) return;
    await navigator.clipboard.writeText(invoice);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePaid = () => {
    if (!invoice || !playerName.trim() || !playerNpub.startsWith('npub1')) return;
    addDepositToJackpot(gameId, sats);
    onPaid(sats);
  };

  return (
    <div className="absolute inset-0 z-20 bg-white overflow-y-auto">
      <div className="max-w-sm mx-auto px-4 py-5 space-y-4" style={{ fontFamily: "'Bangers', Impact, sans-serif" }}>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl text-[#FF0080]"
            style={{ letterSpacing: '3px', textShadow: '2px 2px 0 #FCE000, 3px 3px 0 #000' }}>
            PLAY FOR <span style={{ color: '#F7931A' }}>SATS</span> ⚡
          </h2>
          <button onClick={onBack} className="text-gray-400 hover:text-black transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="bg-[#1A0040] text-[#FCE000] rounded-xl p-3 text-sm space-y-0.5" style={{ fontFamily: 'sans-serif' }}>
          <p>Deposit min <strong className="text-[#F7931A]">21 sats</strong> (more = bigger jackpot).</p>
          <p><strong className="text-[#00CFFF]">21%</strong> fills the jackpot · at <strong className="text-[#F7931A]">2100 sats</strong> a <strong className="text-[#00CFFF]">21h</strong> countdown starts.</p>
          <p>Highest score wins the pot — zapped to your npub! ⚡</p>
        </div>

        {/* Name */}
        <div className="space-y-1">
          <label className="text-[#1A0040] text-lg">YOUR NAME</label>
          <input
            className="w-full text-center text-xl font-bold rounded-full px-4 py-2 uppercase outline-none"
            style={{ fontFamily: "'Bangers', Impact, sans-serif", letterSpacing: '2px', border: '3px solid #1A0040' }}
            maxLength={12}
            placeholder="SATOSHI"
            value={playerName}
            onChange={e => onSetName(e.target.value.toUpperCase())}
          />
          {nameErr && <p className="text-red-500 text-xs">{nameErr}</p>}
        </div>

        {/* Npub */}
        <div className="space-y-1">
          <label className="text-[#1A0040] text-lg">YOUR NOSTR NPUB</label>
          {user ? (
            <div className="flex items-center gap-2">
              <input
                className="flex-1 text-xs rounded-full px-4 py-2 outline-none"
                style={{ fontFamily: 'monospace', border: '3px solid #1A0040' }}
                placeholder="npub1..."
                value={playerNpub}
                onChange={e => onSetNpub(e.target.value)}
              />
              <Badge variant="outline" className="text-green-600 border-green-400 whitespace-nowrap text-xs">✓ Logged in</Badge>
            </div>
          ) : (
            <div className="space-y-2">
              <input
                className="w-full text-xs rounded-full px-4 py-2 outline-none"
                style={{ fontFamily: 'monospace', border: '3px solid #1A0040' }}
                placeholder="npub1..."
                value={playerNpub}
                onChange={e => onSetNpub(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Or log in with Nostr to auto-fill:</p>
              <LoginArea className="w-full" />
            </div>
          )}
          {npubErr && <p className="text-red-500 text-xs">{npubErr}</p>}
        </div>

        {/* Sats */}
        <div className="space-y-1">
          <label className="text-[#1A0040] text-lg">SATS (MIN {MIN_SATS})</label>
          <div className="flex gap-2 flex-wrap">
            {[21, 100, 500, 1000].map(v => (
              <button key={v}
                className={`px-4 py-1.5 rounded-full border-2 font-bold transition-all text-base ${sats === v ? 'bg-[#F7931A] text-white border-black' : 'bg-white text-[#1A0040] border-[#1A0040] hover:bg-orange-50'}`}
                style={{ fontFamily: "'Bangers', Impact, sans-serif" }}
                onClick={() => onSetSats(v)}
              >
                {v}
              </button>
            ))}
            <input
              type="number"
              min={MIN_SATS}
              className="flex-1 min-w-[70px] text-center rounded-full px-3 py-1.5 font-bold text-base"
              style={{ fontFamily: "'Bangers', Impact, sans-serif", border: '2px solid #1A0040' }}
              value={sats}
              onChange={e => onSetSats(Math.max(MIN_SATS, parseInt(e.target.value) || MIN_SATS))}
            />
          </div>
          {satsErr && <p className="text-red-500 text-xs">{satsErr}</p>}
        </div>

        {!invoice ? (
          <button
            className="w-full py-3 rounded-2xl border-4 border-black bg-[#F7931A] text-white font-bold text-xl shadow-[5px_5px_0_#FCE000] active:translate-y-1 active:shadow-none transition-all"
            style={{ fontFamily: "'Bangers', Impact, sans-serif", letterSpacing: '2px' }}
            onClick={generateInvoice}
            disabled={isGenerating || lnLoading || !lnurlData}
          >
            {isGenerating || lnLoading ? 'GENERATING…' : `ZAP ${sats} SATS ⚡`}
          </button>
        ) : (
          <div className="space-y-3">
            {qrUrl && (
              <div className="flex flex-col items-center gap-2">
                <div className="rounded-2xl overflow-hidden border-4 border-[#F7931A] shadow-lg">
                  <img src={qrUrl} alt="Lightning QR" className="w-[180px] h-[180px] block" />
                </div>
                <p className="text-xs text-[#1A0040AA] text-center">Scan to pay {sats.toLocaleString()} sats</p>
              </div>
            )}
            <div className="flex gap-2">
              <button
                className="flex-1 py-2 rounded-xl font-bold transition-all hover:bg-yellow-300 active:scale-95 text-sm"
                style={{ fontFamily: "'Bangers', Impact, sans-serif", letterSpacing: '1px', border: '3px solid #1A0040', background: '#FCE000', color: '#1A0040' }}
                onClick={() => window.open(`lightning:${invoice}`, '_blank')}
              >
                OPEN WALLET
              </button>
              <button
                className={`flex-1 py-2 rounded-xl font-bold transition-all active:scale-95 text-sm ${copied ? 'bg-green-400 text-white' : 'bg-white text-[#1A0040] hover:bg-gray-50'}`}
                style={{ fontFamily: "'Bangers', Impact, sans-serif", letterSpacing: '1px', border: '3px solid #1A0040' }}
                onClick={handleCopy}
              >
                {copied ? 'COPIED ✓' : 'COPY'}
              </button>
            </div>
            <button
              className="w-full py-3 rounded-2xl border-4 border-black bg-[#FF0080] text-white font-bold text-xl shadow-[5px_5px_0_#FCE000] active:translate-y-1 active:shadow-none transition-all"
              style={{ fontFamily: "'Bangers', Impact, sans-serif", letterSpacing: '2px' }}
              onClick={handlePaid}
            >
              I ZAPPED IT · PLAY ⚡
            </button>
            <button className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => { setInvoice(null); setQrUrl(null); }}>
              ← Change amount
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Game Over Panel ────────────────────────────────────────────────────────

interface GameOverPanelProps {
  gameId: string;
  score: number;
  paidMode: boolean;
  playerName: string;
  playerNpub: string;
  satsPaid: number;
  onAgain: () => void;
  onMenu: () => void;
}

function GameOverPanel({ gameId, score, paidMode, playerName, playerNpub, satsPaid, onAgain, onMenu }: GameOverPanelProps) {
  const { publishScore, isPending } = usePublishGameScore();
  const { user } = useCurrentUser();
  const [published, setPublished] = useState(false);
  const [publishError, setPublishError] = useState('');
  const [showBoard, setShowBoard] = useState(false);

  const handlePublish = async () => {
    if (!user || published || isPending) return;
    setPublishError('');
    const npub = playerNpub || nip19.npubEncode(user.pubkey);
    try {
      await publishScore(gameId, playerName, score, satsPaid, npub);
      setPublished(true);
      updateRoundHighScore(gameId, user.pubkey, npub, playerName, score);
    } catch {
      setPublishError('Failed to publish — check your Nostr connection.');
    }
  };

  if (showBoard) {
    return <Scoreboard game={gameId} myScore={score} onClose={() => setShowBoard(false)} />;
  }

  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-gradient-to-b from-[#1A0040] to-[#3D0070] gap-4 px-6 py-8"
      style={{ fontFamily: "'Bangers', Impact, sans-serif" }}>
      <div className="text-[clamp(28px,8vw,52px)] text-white leading-none text-center"
        style={{ letterSpacing: '3px', textShadow: '3px 3px 0 #FF0080, 6px 6px 0 #000' }}>
        GAME OVER
      </div>
      <div className="text-[clamp(18px,5vw,32px)] text-[#FCE000]"
        style={{ letterSpacing: '2px', textShadow: '2px 2px 0 #F7931A' }}>
        SCORE: {score.toLocaleString()}
      </div>

      {paidMode && user && (
        <div className="w-full max-w-xs space-y-2">
          {!published ? (
            <button
              className="w-full py-2.5 rounded-2xl border-4 border-[#FCE000] text-[#1A0040] font-bold text-lg bg-[#FCE000] shadow-[4px_4px_0_#F7931A] active:translate-y-1 active:shadow-none transition-all"
              style={{ letterSpacing: '2px' }}
              onClick={handlePublish}
              disabled={isPending}
            >
              {isPending ? 'PUBLISHING…' : 'POST TO LEADERBOARD ⚡'}
            </button>
          ) : (
            <div className="text-center text-[#00CFFF] text-lg" style={{ letterSpacing: '1px' }}>✓ SCORE PUBLISHED ON NOSTR!</div>
          )}
          {publishError && <p className="text-red-400 text-xs text-center">{publishError}</p>}
        </div>
      )}

      {paidMode && !user && (
        <div className="w-full max-w-xs text-center text-[#FCE000] text-sm space-y-2">
          <p>Log in to post your score to the Nostr leaderboard:</p>
          <LoginArea className="w-full" />
        </div>
      )}

      <div className="flex flex-col gap-2 w-full max-w-xs">
        <button
          className="w-full py-2.5 rounded-2xl border-4 border-black bg-[#FF0080] text-white font-bold text-lg shadow-[4px_4px_0_#FCE000] active:translate-y-1 active:shadow-none transition-all"
          style={{ letterSpacing: '2px' }}
          onClick={onAgain}
        >
          PLAY AGAIN ↺
        </button>
        <button
          className="w-full py-2 rounded-2xl border-2 border-white/20 text-white/70 text-base hover:text-white hover:border-white/50 transition-all"
          style={{ letterSpacing: '1px' }}
          onClick={() => setShowBoard(true)}
        >
          <Users className="h-4 w-4 inline mr-1" />
          VIEW LEADERBOARD
        </button>
        <button
          className="w-full py-2 rounded-2xl border-2 border-white/20 text-white/60 text-sm hover:text-white hover:border-white/40 transition-all"
          style={{ letterSpacing: '1px' }}
          onClick={onMenu}
        >
          ← MAIN MENU
        </button>
      </div>
    </div>
  );
}

// ─── Pre-game Menu ─────────────────────────────────────────────────────────

interface PreGameMenuProps {
  gameName: string;
  gameId: string;
  onPlayFree: () => void;
  onPayToPlay: () => void;
  onShowBoard: () => void;
}

function PreGameMenu({ gameName, gameId, onPlayFree, onPayToPlay, onShowBoard }: PreGameMenuProps) {
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-5 px-6 py-8"
      style={{ background: 'linear-gradient(160deg, #1A0040 0%, #3D0070 60%, #1A0040 100%)', fontFamily: "'Bangers', Impact, sans-serif" }}>

      {/* Game title */}
      <div className="text-center">
        <div className="text-[clamp(28px,7vw,48px)] text-[#FF0080] leading-none"
          style={{ letterSpacing: '3px', textShadow: '3px 3px 0 #FCE000, 6px 6px 0 #000' }}>
          {gameName.toUpperCase()}
        </div>
        <div className="text-[#00CFFF] text-base mt-1" style={{ letterSpacing: '2px' }}>
          POWERED BY GAMESTR · NOSTR ⚡
        </div>
      </div>

      {/* Jackpot info */}
      <div className="bg-[#FCE000] rounded-2xl px-5 py-3 text-[#1A0040] text-sm text-center max-w-xs shadow-[4px_4px_0_#F7931A]"
        style={{ fontFamily: 'sans-serif' }}>
        <p className="font-bold text-base mb-1">🎮 GAME MECHANISM</p>
        <p>Play <strong>FREE</strong> anytime, no name on leaderboard.</p>
        <p>Deposit <strong className="text-[#6200EA]">min 21 sats</strong> → your name goes on the Nostr leaderboard.</p>
        <p className="mt-1"><strong className="text-[#F7931A]">21%</strong> of every deposit fills the jackpot.</p>
        <p>At <strong className="text-[#6200EA]">2100 sats</strong> → 21h countdown, highest score <strong>wins the pot!</strong></p>
      </div>

      <div className="flex flex-col gap-2.5 w-full max-w-xs">
        <button
          className="w-full py-3 rounded-2xl border-4 border-black bg-[#F7931A] text-white font-bold text-xl shadow-[5px_5px_0_#FCE000] active:translate-y-1 active:shadow-none transition-all"
          style={{ letterSpacing: '2px' }}
          onClick={onPayToPlay}
        >
          ZAP & PLAY ⚡
          <span className="block text-sm font-normal opacity-80">Add name to leaderboard</span>
        </button>
        <button
          className="w-full py-2.5 rounded-2xl border-4 border-[#FCE000] text-[#FCE000] font-bold text-lg shadow-[4px_4px_0_#FF0080] active:translate-y-1 active:shadow-none transition-all"
          style={{ letterSpacing: '2px', background: 'rgba(255,255,255,0.05)' }}
          onClick={onPlayFree}
        >
          PLAY FREE 🎮
          <span className="block text-sm font-normal opacity-70">No leaderboard entry</span>
        </button>
        <button
          className="w-full py-2 rounded-2xl border-2 border-white/20 text-white/70 text-base hover:text-white hover:border-white/50 transition-all"
          style={{ letterSpacing: '1px' }}
          onClick={onShowBoard}
        >
          <Users className="h-4 w-4 inline mr-1" />
          LEADERBOARD
        </button>
      </div>

      <div className="text-[#FFFFFF44] text-xs text-center" style={{ letterSpacing: '1px' }}>
        Scores published on Nostr · Rewards via Lightning
      </div>
    </div>
  );
}

// ─── Main overlay ───────────────────────────────────────────────────────────

export type GameState = 'menu' | 'free' | 'paying' | 'playing_paid' | 'game_over';

export interface GameMechanismOverlayProps {
  gameId: string;
  gameName: string;
  /** Called when user wants to (re)start the game. The overlay passes a "start" message to the iframe. */
  onStartGame: () => void;
  /** Called when the game should be reset/reloaded */
  onResetGame: () => void;
  /** Current score from the iframe (via postMessage) */
  score: number;
  /** Whether game_over message was received */
  isGameOver: boolean;
}

export function GameMechanismOverlay({
  gameId,
  gameName,
  onStartGame,
  onResetGame,
  score,
  isGameOver,
}: GameMechanismOverlayProps) {
  const [gameState, setGameState] = useState<GameState>('menu');
  const [playerName, setPlayerName] = useState('');
  const [playerNpub, setPlayerNpub] = useState('');
  const [sats, setSats] = useState(MIN_SATS);
  const [satsPaid, setSatsPaid] = useState(0);
  const [showBoard, setShowBoard] = useState(false);

  // When game_over arrives, show game-over panel if we were playing
  useEffect(() => {
    if (isGameOver && (gameState === 'free' || gameState === 'playing_paid')) {
      setGameState('game_over');
    }
  }, [isGameOver, gameState]);

  const handlePlayFree = () => {
    setGameState('free');
    onStartGame();
  };

  const handlePaid = (paidSats: number) => {
    setSatsPaid(paidSats);
    setGameState('playing_paid');
    onStartGame();
  };

  const handleAgain = () => {
    onResetGame();
    if (satsPaid > 0) {
      // Already paid — allow another paid round
      setGameState('playing_paid');
      onStartGame();
    } else {
      setGameState('menu');
    }
  };

  const handleMenu = () => {
    onResetGame();
    setGameState('menu');
    setSatsPaid(0);
  };

  if (showBoard) {
    return (
      <div className="absolute inset-0 z-50">
        <Scoreboard game={gameId} onClose={() => setShowBoard(false)} />
      </div>
    );
  }

  if (gameState === 'menu') {
    return (
      <PreGameMenu
        gameName={gameName}
        gameId={gameId}
        onPlayFree={handlePlayFree}
        onPayToPlay={() => setGameState('paying')}
        onShowBoard={() => setShowBoard(true)}
      />
    );
  }

  if (gameState === 'paying') {
    return (
      <PayPanel
        gameId={gameId}
        playerName={playerName}
        playerNpub={playerNpub}
        sats={sats}
        onSetName={setPlayerName}
        onSetNpub={setPlayerNpub}
        onSetSats={setSats}
        onPaid={handlePaid}
        onBack={() => setGameState('menu')}
      />
    );
  }

  if (gameState === 'game_over') {
    return (
      <GameOverPanel
        gameId={gameId}
        score={score}
        paidMode={satsPaid > 0}
        playerName={playerName}
        playerNpub={playerNpub}
        satsPaid={satsPaid}
        onAgain={handleAgain}
        onMenu={handleMenu}
      />
    );
  }

  // gameState === 'free' || 'playing_paid' → game is running, no overlay (only jackpot strip shown by parent)
  return null;
}

// ─── Jackpot strip export (for parent to render above iframe) ───────────────
export { JackpotStrip };
