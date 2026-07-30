import { useState, useEffect, useRef, useCallback } from 'react';
import { useSeoMeta } from '@unhead/react';
import { Trophy, Zap, Timer, Users, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentUser } from '@/hooks/useCurrentUser';
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
import { LoginArea } from '@/components/auth/LoginArea';
import { nip19 } from 'nostr-tools';
import QRCode from 'qrcode';

const GAME_ID = 'clownworld-moneyprinter';
const LIGHTNING_ADDRESS = 'bitpopart@rizful.com';

// ── Types ─────────────────────────────────────────────────────────────────────

interface GameMessage {
  type: 'score_update' | 'game_over' | 'game_start' | 'ready';
  score?: number;
}

// ── Jackpot strip (compact, sits above the game) ──────────────────────────────

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
      <div className="w-full bg-[#1A0040] text-[#FCE000] text-center py-1.5 text-sm font-bold"
        style={{ fontFamily: "'Bangers', Impact, sans-serif", letterSpacing: '2px' }}>
        <Skeleton className="h-4 w-48 mx-auto bg-yellow-900/40 inline-block" />
      </div>
    );
  }

  const resolved = resolveJackpot(jackpot);

  if (resolved.countdown_start) {
    const left = Math.max(0, resolved.countdown_start + 21 * 60 * 60 * 1000 - now);
    return (
      <div className="w-full bg-[#1A0040] text-[#FCE000] text-center py-1.5 px-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-0"
        style={{ fontFamily: "'Bangers', Impact, sans-serif", letterSpacing: '1.5px', fontSize: 'clamp(12px,2.5vw,16px)' }}>
        <span className="flex items-center gap-1">
          <Zap className="h-3.5 w-3.5 text-[#F7931A] fill-current inline" />
          JACKPOT LIVE: {resolved.total.toLocaleString()} SATS
        </span>
        <span className="text-[#00CFFF] flex items-center gap-1">
          <Timer className="h-3.5 w-3.5 inline" />
          {formatCountdown(left)}
          {resolved.round_high ? ` · ${resolved.round_high.name} ${resolved.round_high.score}` : ' — HIGH SCORE WINS'}
        </span>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#1A0040] text-[#FCE000] text-center py-1.5 px-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-0"
      style={{ fontFamily: "'Bangers', Impact, sans-serif", letterSpacing: '1.5px', fontSize: 'clamp(12px,2.5vw,16px)' }}>
      <span className="flex items-center gap-1">
        <Zap className="h-3.5 w-3.5 text-[#F7931A] fill-current inline" />
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

// ── Scoreboard overlay ────────────────────────────────────────────────────────

// Medal colours for top 3
const MEDALS = ['🥇', '🥈', '🥉'];
const ROW_COLORS = ['bg-[#FCE000]/30', 'bg-[#C0C0C0]/20', 'bg-[#CD7F32]/20'];

function Scoreboard({ game, myScore, onClose }: { game: string; myScore?: number; onClose: () => void }) {
  const { data: scores = [], isLoading } = useGameLeaderboard(game);
  const [visible, setVisible] = useState(false);

  // Trigger entrance animation after mount
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 30);
    return () => clearTimeout(t);
  }, []);

  return (
    // Fixed full-viewport overlay — not clipped by parent overflow-hidden
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: 'linear-gradient(160deg, #1A0040 0%, #3D0070 50%, #1A0040 100%)' }}
    >
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-5 pt-5 pb-3">
        <div
          className="flex items-center gap-3"
          style={{ fontFamily: "'Bangers', Impact, sans-serif" }}
        >
          <Trophy className="h-8 w-8 text-[#FCE000] drop-shadow-lg" />
          <h1
            className="text-[clamp(28px,7vw,48px)] text-[#FF0080] leading-none"
            style={{ letterSpacing: '3px', textShadow: '3px 3px 0 #FCE000, 5px 5px 0 #000' }}
          >
            HALL OF CLOWNS
          </h1>
        </div>
        <button
          onClick={onClose}
          className="text-white/60 hover:text-white transition-colors bg-white/10 hover:bg-white/20 rounded-full p-2"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* Subtitle */}
      <p
        className="shrink-0 text-center text-[#00CFFF] text-sm px-4 pb-4"
        style={{ fontFamily: "'Bangers', Impact, sans-serif", letterSpacing: '2px' }}
      >
        ALL-TIME HIGH SCORES · VERIFIED ON NOSTR ⚡
      </p>

      {/* Scores list — scrollable */}
      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {isLoading ? (
          <div className="space-y-3 max-w-lg mx-auto">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-2xl bg-white/10" />
            ))}
          </div>
        ) : scores.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <span className="text-6xl animate-bounce">🤡</span>
            <p
              className="text-[#FCE000] text-2xl"
              style={{ fontFamily: "'Bangers', Impact, sans-serif", letterSpacing: '2px' }}
            >
              NO CLOWNS YET<br />BE FIRST!
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
                  {/* Rank */}
                  <div
                    className="shrink-0 w-8 text-center text-xl"
                    style={{ fontFamily: "'Bangers', Impact, sans-serif" }}
                  >
                    {isTop3 ? MEDALS[i] : <span className="text-white/50 text-base">{i + 1}</span>}
                  </div>

                  {/* Name + sats */}
                  <div className="flex-1 min-w-0">
                    <p
                      className="truncate font-bold"
                      style={{
                        fontFamily: "'Bangers', Impact, sans-serif",
                        letterSpacing: '1.5px',
                        fontSize: 'clamp(16px,4vw,20px)',
                        color: isMe ? '#1A0040' : '#FFFFFF',
                      }}
                    >
                      {entry.name}
                      {isMe && <span className="ml-2 text-sm">← YOU</span>}
                    </p>
                    {entry.sats_deposited > 0 && (
                      <p className="text-xs" style={{ color: isMe ? '#6200EA' : '#F7931A' }}>
                        ⚡ {entry.sats_deposited.toLocaleString()} sats
                      </p>
                    )}
                  </div>

                  {/* Score */}
                  <div
                    className="shrink-0 text-right"
                    style={{
                      fontFamily: "'Bangers', Impact, sans-serif",
                      letterSpacing: '1px',
                      fontSize: 'clamp(18px,4.5vw,24px)',
                      color: isMe ? '#1A0040' : (isTop3 ? '#FCE000' : '#00CFFF'),
                      textShadow: isMe ? 'none' : '0 0 8px currentColor',
                    }}
                  >
                    {entry.score.toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="shrink-0 flex justify-center pb-6 pt-2">
        <button
          className="px-10 py-3 rounded-2xl border-4 border-[#FCE000] text-[#FCE000] font-bold text-xl shadow-[4px_4px_0_#FF0080] active:translate-y-1 active:shadow-none transition-all"
          style={{ fontFamily: "'Bangers', Impact, sans-serif", letterSpacing: '2px', background: 'rgba(255,255,255,0.05)' }}
          onClick={onClose}
        >
          CLOSE
        </button>
      </div>
    </div>
  );
}

// ── Pay-to-play overlay ───────────────────────────────────────────────────────

interface PayPanelProps {
  playerName: string;
  playerNpub: string;
  sats: number;
  onSetName: (v: string) => void;
  onSetNpub: (v: string) => void;
  onSetSats: (v: number) => void;
  onPaid: () => void;
  onBack: () => void;
}

function PayPanel({ playerName, playerNpub, sats, onSetName, onSetNpub, onSetSats, onPaid, onBack }: PayPanelProps) {
  const [invoice, setInvoice] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [nameErr, setNameErr] = useState('');
  const [npubErr, setNpubErr] = useState('');
  const [satsErr, setSatsErr] = useState('');
  const { user } = useCurrentUser();
  const { lnurlData, getZapInvoice, isLoading: lnLoading } = useLNURL(LIGHTNING_ADDRESS);

  // Auto-fill npub from logged-in user
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
      setInvoice(inv);
      const qr = await QRCode.toDataURL(inv, { width: 200, margin: 2, color: { dark: '#1a1a1a', light: '#ffffff' } });
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
    if (!playerName.trim() || !playerNpub.startsWith('npub1')) return;
    addDepositToJackpot(GAME_ID, sats);
    onPaid();
  };

  return (
    <div className="absolute inset-0 z-20 bg-white overflow-y-auto">
      <div className="max-w-sm mx-auto px-4 py-5 space-y-4"
        style={{ fontFamily: "'Bangers', Impact, sans-serif" }}>

        <div className="flex items-center justify-between">
          <h2 className="text-2xl text-[#FF0080]"
            style={{ letterSpacing: '3px', textShadow: '2px 2px 0 #FCE000, 3px 3px 0 #000' }}>
            PLAY FOR <span style={{ color: '#F7931A' }}>SATS</span> ⚡
          </h2>
          <button onClick={onBack} className="text-gray-400 hover:text-black transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="bg-[#1A0040] text-[#FCE000] rounded-xl p-3 text-sm space-y-0.5"
          style={{ fontFamily: 'sans-serif' }}>
          <p>Deposit min <strong className="text-[#F7931A]">21 sats</strong> (more = more jackpot).</p>
          <p><strong className="text-[#00CFFF]">21%</strong> fills the jackpot · at <strong className="text-[#F7931A]">2100 sats</strong> a <strong className="text-[#00CFFF]">21h</strong> countdown starts.</p>
          <p>Highest score wins the pot — zapped to your npub!</p>
        </div>

        {/* Name */}
        <div className="space-y-1">
          <label className="text-[#1A0040] text-lg">YOUR NAME</label>
          <input
            className="w-full text-center text-xl font-bold rounded-full px-4 py-2 uppercase outline-none transition-colors"
            style={{ fontFamily: "'Bangers', Impact, sans-serif", letterSpacing: '2px', border: '3px solid #1A0040' }}
            maxLength={12}
            placeholder="MAX BUCKS"
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
                className="flex-1 text-xs rounded-full px-4 py-2 outline-none transition-colors"
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
                className="w-full text-xs rounded-full px-4 py-2 outline-none transition-colors"
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

        {/* Invoice / QR */}
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

// ── Game Over overlay ─────────────────────────────────────────────────────────

interface GameOverPanelProps {
  score: number;
  paidMode: boolean;
  playerName: string;
  playerNpub: string;
  satsPaid: number;
  onAgain: () => void;
  onMenu: () => void;
}

function GameOverPanel({ score, paidMode, playerName, playerNpub, satsPaid, onAgain, onMenu }: GameOverPanelProps) {
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
      await publishScore(GAME_ID, playerName, score, satsPaid, npub);
      setPublished(true);
      updateRoundHighScore(GAME_ID, user.pubkey, npub, playerName, score);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to publish score';
      setPublishError(msg);
    }
  };

  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-sm space-y-4 text-center"
        style={{ fontFamily: "'Bangers', Impact, sans-serif" }}>

        <h2 className="text-5xl text-[#FF0080]"
          style={{ letterSpacing: '3px', textShadow: '3px 3px 0 #FCE000, 5px 5px 0 #000' }}>
          GAME OVER
        </h2>
        <div className="text-3xl text-[#6200EA]"
          style={{ textShadow: '2px 2px 0 #FCE000', letterSpacing: '2px' }}>
          {score.toLocaleString()} BUCKS
        </div>

        {paidMode && satsPaid > 0 && (
          <div className="bg-green-50 border-2 border-green-400 rounded-xl p-2 text-sm" style={{ fontFamily: 'sans-serif' }}>
            {published ? (
              <p className="text-green-700 font-bold">✓ Score on Nostr scoreboard!</p>
            ) : !user ? (
              <div className="space-y-2">
                <p className="text-green-700 font-bold text-xs">Log in to post your score to Nostr:</p>
                <LoginArea className="w-full" />
              </div>
            ) : (
              <div className="space-y-1">
                <button
                  className="w-full py-2 rounded-xl font-bold transition-all active:scale-95 text-base"
                  style={{ fontFamily: "'Bangers', Impact, sans-serif", letterSpacing: '1px', border: '2px solid #16a34a', background: '#22c55e', color: '#fff' }}
                  onClick={handlePublish}
                  disabled={isPending}
                >
                  {isPending ? 'POSTING…' : '📋 POST SCORE TO NOSTR'}
                </button>
                {publishError && (
                  <p className="text-red-600 text-xs">{publishError}</p>
                )}
              </div>
            )}
          </div>
        )}

        {(!paidMode || satsPaid === 0) && (
          <div className="bg-orange-50 border-2 border-orange-400 rounded-xl p-2 text-sm" style={{ fontFamily: 'sans-serif' }}>
            <p className="text-orange-700 font-bold">Deposit sats to enter the jackpot &amp; scoreboard!</p>
          </div>
        )}

        <div className="flex gap-3 justify-center flex-wrap">
          <button
            className="px-8 py-3 rounded-2xl border-4 border-black bg-[#FF0080] text-white font-bold text-xl shadow-[5px_5px_0_#FCE000] active:translate-y-1 active:shadow-none transition-all"
            style={{ letterSpacing: '2px' }}
            onClick={onAgain}
          >
            AGAIN ⚡
          </button>
          <button
            className="px-8 py-3 rounded-2xl border-4 border-black bg-[#00CFFF] text-[#000] font-bold text-xl shadow-[5px_5px_0_#FF0080] active:translate-y-1 active:shadow-none transition-all"
            style={{ letterSpacing: '2px' }}
            onClick={onMenu}
          >
            MENU
          </button>
        </div>

        <button
          className="flex items-center gap-2 mx-auto text-[#1A0040] text-lg hover:text-[#6200EA] transition-colors"
          style={{ letterSpacing: '1px' }}
          onClick={() => setShowBoard(true)}
        >
          <Users className="h-5 w-5" />
          SCOREBOARD
        </button>
      </div>

      {showBoard && (
        <Scoreboard game={GAME_ID} myScore={paidMode ? score : undefined} onClose={() => setShowBoard(false)} />
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

type Screen = 'menu' | 'game' | 'pay' | 'gameover' | 'scoreboard';

export default function GameMoneyPrinter() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [screen, setScreen] = useState<Screen>('menu');
  const [paidMode, setPaidMode] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [playerNpub, setPlayerNpub] = useState('');
  const [satsPaid, setSatsPaid] = useState(MIN_SATS);
  const [finalScore, setFinalScore] = useState(0);
  const [iframeReady, setIframeReady] = useState(false);

  useSeoMeta({
    title: 'Money Printer Mayhem · ClownWorld Edition — BitPopArt Games',
    description: 'Play MONEY PRINTER MAYHEM by BitPopArt! Catch fiat & shitcoins, dodge Bitcoin. Deposit sats to join the jackpot — 2100 sats jackpot paid to the highest score after 21 hours!',
    ogTitle: 'Money Printer Mayhem — BitPopArt Games ⚡',
    ogDescription: 'Catch fiat & shitcoins, dodge Bitcoin. Win the Lightning jackpot!',
    ogImage: 'https://bitpopart.com/bitpopart-logo.png',
  });

  // Listen for postMessage events from the game iframe
  const handleIframeMessage = useCallback((e: MessageEvent) => {
    if (!e.data || typeof e.data !== 'object') return;
    const msg = e.data as GameMessage;
    if (msg.type === 'ready') setIframeReady(true);
    else if (msg.type === 'game_over' && msg.score !== undefined) {
      setFinalScore(msg.score);
      setScreen('gameover');
    }
  }, []);

  useEffect(() => {
    window.addEventListener('message', handleIframeMessage);
    return () => window.removeEventListener('message', handleIframeMessage);
  }, [handleIframeMessage]);

  const sendToGame = useCallback((msg: object) => {
    iframeRef.current?.contentWindow?.postMessage(msg, '*');
  }, []);

  const startFreeGame = useCallback(() => {
    setPaidMode(false);
    setScreen('game');
    setTimeout(() => sendToGame({ type: 'start_game', paidMode: false }), 300);
  }, [sendToGame]);

  const startPaidGame = useCallback(() => {
    setPaidMode(true);
    setScreen('game');
    setTimeout(() => sendToGame({ type: 'start_game', paidMode: true, name: playerName }), 300);
  }, [sendToGame, playerName]);

  const handleAgain = useCallback(() => {
    if (paidMode) startPaidGame(); else startFreeGame();
  }, [paidMode, startFreeGame, startPaidGame]);

  // The iframe is always mounted so it stays loaded; overlays sit on top
  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white relative"
      style={{ fontFamily: "'Bangers', Impact, sans-serif" }}>

      {/* Jackpot strip — always visible, thin */}
      <JackpotStrip game={GAME_ID} />

      {/* Game iframe — fills all remaining space */}
      <div className="flex-1 relative overflow-hidden">
        {/* Loading state */}
        {!iframeReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
            <div className="text-center space-y-2">
              <div className="animate-bounce text-5xl">🤡</div>
              <p className="text-[#6200EA] font-bold text-xl" style={{ letterSpacing: '2px' }}>LOADING…</p>
            </div>
          </div>
        )}

        <iframe
          ref={iframeRef}
          src="/games/moneyprinter.html"
          title="Money Printer Mayhem"
          className="w-full h-full border-0 block"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          onLoad={() => setIframeReady(true)}
        />

        {/* ── Menu overlay ── */}
        {screen === 'menu' && iframeReady && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-white/90 backdrop-blur-[2px] px-4 py-6 overflow-y-auto">
            <div className="text-center">
              <h1 className="text-[clamp(36px,9vw,60px)] text-[#FF0080] leading-none"
                style={{ letterSpacing: '3px', textShadow: '3px 3px 0 #FCE000, 5px 5px 0 #000', transform: 'rotate(-2deg)', display: 'inline-block' }}>
                MONEY PRINTER<br /><span style={{ color: '#6200EA' }}>MAYHEM</span>
              </h1>
              <p className="text-[#6200EA] mt-2 text-xl" style={{ letterSpacing: '2px' }}>
                CLOWNWORLD EDITION
              </p>
            </div>

            <div className="bg-gray-50 border-2 border-[#1A0040] rounded-2xl p-4 text-left text-[#1A0040] max-w-xs w-full"
              style={{ fontSize: 'clamp(14px,3.5vw,18px)', lineHeight: '1.5', fontFamily: 'sans-serif' }}>
              The printer goes <strong className="text-[#FF0080]" style={{ fontFamily: "'Bangers', Impact, sans-serif" }}>BRRR</strong>.<br />
              <strong>💵 FIAT &amp; 💩 SHITCOINS</strong> = +21 bucks<br />
              Dodge the ₿ bitcoin — 3 lives. Trust us.
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs justify-center">
              <button
                className="flex-1 py-3 rounded-2xl border-4 border-black bg-[#FF0080] text-white font-bold shadow-[5px_5px_0_#FCE000] active:translate-y-1 active:shadow-none transition-all"
                style={{ fontSize: 'clamp(18px,4vw,24px)', transform: 'rotate(-2deg)', letterSpacing: '2px' }}
                onClick={startFreeGame}
              >
                PLAY FREE 🤡
              </button>
              <button
                className="flex-1 py-3 rounded-2xl border-4 border-black bg-[#F7931A] text-white font-bold shadow-[5px_5px_0_#FF0080] active:translate-y-1 active:shadow-none transition-all"
                style={{ fontSize: 'clamp(18px,4vw,24px)', letterSpacing: '2px' }}
                onClick={() => setScreen('pay')}
              >
                FOR SATS ⚡
              </button>
            </div>

            <button
              className="flex items-center gap-2 text-[#1A0040] text-lg hover:text-[#6200EA] transition-colors"
              style={{ letterSpacing: '1px' }}
              onClick={() => setScreen('scoreboard')}
            >
              <Users className="h-5 w-5" />
              SCOREBOARD
            </button>

            <p className="text-xs text-[#1A004055]" style={{ letterSpacing: '2px' }}>BITPOPART · CLOWNWORLD</p>
          </div>
        )}

        {/* ── Pay overlay ── */}
        {screen === 'pay' && (
          <PayPanel
            playerName={playerName}
            playerNpub={playerNpub}
            sats={satsPaid}
            onSetName={setPlayerName}
            onSetNpub={setPlayerNpub}
            onSetSats={setSatsPaid}
            onPaid={() => startPaidGame()}
            onBack={() => setScreen('menu')}
          />
        )}

        {/* ── Game over overlay ── */}
        {screen === 'gameover' && (
          <GameOverPanel
            score={finalScore}
            paidMode={paidMode}
            playerName={playerName}
            playerNpub={playerNpub}
            satsPaid={satsPaid}
            onAgain={handleAgain}
            onMenu={() => setScreen('menu')}
          />
        )}

        {/* ── Scoreboard overlay ── */}
        {screen === 'scoreboard' && (
          <Scoreboard
            game={GAME_ID}
            onClose={() => setScreen('menu')}
          />
        )}
      </div>
    </div>
  );
}
