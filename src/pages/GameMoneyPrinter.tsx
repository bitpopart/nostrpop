import { useState, useEffect, useRef, useCallback } from 'react';
import { useSeoMeta } from '@unhead/react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, Zap, Timer, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  setLocalJackpot,
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

// ── Types ────────────────────────────────────────────────────────────────────

interface GameMessage {
  type: 'score_update' | 'game_over' | 'game_start' | 'ready';
  score?: number;
  final?: boolean;
}

// ── Jackpot Display ───────────────────────────────────────────────────────────

function JackpotBar({ game }: { game: string }) {
  const { data: jackpot, refetch } = useJackpotState(game);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Sync local jackpot changes
  useEffect(() => {
    const t = setInterval(() => refetch(), 5000);
    return () => clearInterval(t);
  }, [refetch]);

  if (!jackpot) {
    return (
      <div className="bg-[#1A0040] text-[#FCE000] border-4 border-black rounded-2xl px-6 py-3 text-center font-bold shadow-[4px_4px_0_#F7931A]">
        <Skeleton className="h-6 w-48 mx-auto bg-yellow-900/40" />
      </div>
    );
  }

  const resolved = resolveJackpot(jackpot);

  if (resolved.countdown_start) {
    const left = Math.max(0, resolved.countdown_start + 21 * 60 * 60 * 1000 - now);
    return (
      <div className="bg-[#1A0040] text-[#FCE000] border-4 border-black rounded-2xl px-6 py-3 text-center font-bold shadow-[4px_4px_0_#F7931A]">
        <div className="flex items-center justify-center gap-2 text-xl">
          <Zap className="h-5 w-5 text-[#F7931A] fill-current" />
          JACKPOT LIVE: {resolved.total.toLocaleString()} SATS
        </div>
        <div className="text-[#00CFFF] text-sm mt-1 flex items-center justify-center gap-2">
          <Timer className="h-4 w-4" />
          {formatCountdown(left)} — HIGH SCORE WINS{resolved.round_high ? ` · ${resolved.round_high.name} ${resolved.round_high.score}` : ''}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#1A0040] text-[#FCE000] border-4 border-black rounded-2xl px-6 py-3 text-center font-bold shadow-[4px_4px_0_#F7931A]">
      <div className="flex items-center justify-center gap-2 text-xl">
        <Zap className="h-5 w-5 text-[#F7931A] fill-current" />
        JACKPOT: {resolved.total.toLocaleString()} / {JACKPOT_GOAL.toLocaleString()} SATS
      </div>
      <div className="text-[#00CFFF] text-sm mt-1">
        {resolved.last_winner
          ? `LAST WINNER: ${resolved.last_winner.name} · ${resolved.last_winner.sats.toLocaleString()} SATS`
          : '21% OF EVERY DEPOSIT · CONNECTED VIA NOSTR'}
      </div>
    </div>
  );
}

// ── Scoreboard ───────────────────────────────────────────────────────────────

function Scoreboard({ game, myScore }: { game: string; myScore?: number }) {
  const { data: scores = [], isLoading } = useGameLeaderboard(game);

  return (
    <Card className="border-4 border-black bg-white shadow-[6px_6px_0_#6200EA]">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-[#FF0080] font-black text-xl"
          style={{ fontFamily: "'Bangers', Impact, sans-serif", letterSpacing: '2px', textShadow: '2px 2px 0 #FCE000' }}>
          <Trophy className="h-5 w-5 text-[#FCE000]" />
          HALL OF CLOWNS
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
          </div>
        ) : scores.length === 0 ? (
          <p className="text-center text-[#1A0040AA] py-4 font-bold"
            style={{ fontFamily: "'Bangers', Impact, sans-serif", letterSpacing: '1px' }}>
            NO CLOWNS YET — BE FIRST! 🤡
          </p>
        ) : (
          <table className="w-full border-collapse text-[#1A0040]"
            style={{ fontFamily: "'Bangers', Impact, sans-serif", fontSize: '18px', letterSpacing: '1px' }}>
            <tbody>
              {scores.map((entry, i) => (
                <tr
                  key={entry.event_id ?? entry.pubkey}
                  className={myScore !== undefined && entry.score === myScore ? 'bg-[#FCE000]' : ''}
                >
                  <td className="py-1 px-2 border-b-2 border-dashed border-[#FF008033]">
                    {i + 1}. {entry.name}
                    {entry.sats_deposited > 0 && (
                      <Badge variant="outline" className="ml-2 text-xs text-[#F7931A] border-[#F7931A]">
                        ⚡ {entry.sats_deposited}
                      </Badge>
                    )}
                  </td>
                  <td className="py-1 px-2 border-b-2 border-dashed border-[#FF008033] text-right text-[#6200EA]">
                    {entry.score.toLocaleString()} BUCKS
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="text-xs text-center text-muted-foreground mt-3">
          Scores published on Nostr · All-time high scores
        </p>
      </CardContent>
    </Card>
  );
}

// ── Pay-to-play panel ─────────────────────────────────────────────────────────

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

function PayPanel({
  playerName, playerNpub, sats,
  onSetName, onSetNpub, onSetSats,
  onPaid, onBack,
}: PayPanelProps) {
  const [invoice, setInvoice] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [nameErr, setNameErr] = useState('');
  const [npubErr, setNpubErr] = useState('');
  const [satsErr, setSatsErr] = useState('');
  const { user } = useCurrentUser();

  const { lnurlData, getZapInvoice, isLoading: lnLoading } = useLNURL(LIGHTNING_ADDRESS);

  const generateInvoice = async () => {
    setNameErr(''); setNpubErr(''); setSatsErr('');
    if (!playerName.trim()) { setNameErr('Name is required'); return; }
    if (!playerNpub.trim() || !playerNpub.startsWith('npub1')) { setNpubErr('Valid npub required (npub1...)'); return; }
    if (sats < MIN_SATS) { setSatsErr(`Minimum ${MIN_SATS} sats`); return; }

    setIsGenerating(true);
    try {
      const inv = await getZapInvoice(sats);
      if (!inv) return;
      setInvoice(inv);
      const qr = await QRCode.toDataURL(`lightning:${inv}`, {
        width: 220, margin: 2,
        color: { dark: '#1a1a1a', light: '#ffffff' },
      });
      setQrUrl(qr);
    } catch (e) {
      console.error('Invoice generation failed', e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!invoice) return;
    await navigator.clipboard.writeText(invoice);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePaid = () => {
    if (!playerName.trim() || !playerNpub.trim() || !playerNpub.startsWith('npub1')) return;
    addDepositToJackpot(GAME_ID, sats);
    onPaid();
  };

  // Auto-fill npub from logged-in user
  useEffect(() => {
    if (user && !playerNpub) {
      onSetNpub(nip19.npubEncode(user.pubkey));
    }
  }, [user, playerNpub, onSetNpub]);

  return (
    <div className="max-w-md mx-auto space-y-5 p-4"
      style={{ fontFamily: "'Bangers', Impact, sans-serif" }}>

      <h2 className="text-3xl text-[#FF0080] text-center"
        style={{ letterSpacing: '3px', textShadow: '2px 2px 0 #FCE000, 4px 4px 0 #000' }}>
        PLAY FOR <span style={{ color: '#F7931A' }}>SATS</span> ⚡
      </h2>

      <div className="bg-[#1A0040] text-[#FCE000] border-3 border-black rounded-xl p-4 text-sm space-y-1"
        style={{ border: '3px solid black' }}>
        <p>Deposit min <strong className="text-[#F7931A]">21 sats</strong> (more = more jackpot).</p>
        <p><strong className="text-[#00CFFF]">21%</strong> of every deposit fills the jackpot.</p>
        <p>At <strong className="text-[#F7931A]">2100 sats</strong> a <strong className="text-[#00CFFF]">21 hour</strong> countdown starts.</p>
        <p>Highest score wins the pot — zapped to your npub!</p>
      </div>

      {/* Name */}
      <div className="space-y-1">
        <label className="text-[#1A0040] font-bold">YOUR NAME</label>
        <input
          className="w-full text-center text-xl font-bold border-3 border-[#1A0040] rounded-full px-4 py-2 uppercase outline-none focus:border-[#FF0080] transition-colors"
          style={{ fontFamily: "'Bangers', Impact, sans-serif", letterSpacing: '2px', border: '3px solid #1A0040' }}
          maxLength={12}
          placeholder="MAX BUCKS"
          value={playerName}
          onChange={e => onSetName(e.target.value.toUpperCase())}
        />
        {nameErr && <p className="text-red-500 text-sm">{nameErr}</p>}
      </div>

      {/* Npub */}
      <div className="space-y-1">
        <label className="text-[#1A0040] font-bold">YOUR NOSTR NPUB</label>
        {user ? (
          <div className="flex items-center gap-2">
            <input
              className="flex-1 text-xs border-3 border-[#1A0040] rounded-full px-4 py-2 outline-none focus:border-[#6200EA] transition-colors"
              style={{ fontFamily: 'monospace', border: '3px solid #1A0040' }}
              placeholder="npub1..."
              value={playerNpub}
              onChange={e => onSetNpub(e.target.value)}
            />
            <Badge variant="outline" className="text-green-600 border-green-400 whitespace-nowrap">
              Logged in ✓
            </Badge>
          </div>
        ) : (
          <div className="space-y-2">
            <input
              className="w-full text-xs border-3 border-[#1A0040] rounded-full px-4 py-2 outline-none focus:border-[#6200EA] transition-colors"
              style={{ fontFamily: 'monospace', border: '3px solid #1A0040' }}
              placeholder="npub1..."
              value={playerNpub}
              onChange={e => onSetNpub(e.target.value)}
            />
            <div className="text-xs text-muted-foreground">Or log in with Nostr to auto-fill:</div>
            <LoginArea className="w-full" />
          </div>
        )}
        {npubErr && <p className="text-red-500 text-sm">{npubErr}</p>}
      </div>

      {/* Sats */}
      <div className="space-y-1">
        <label className="text-[#1A0040] font-bold">SATS TO DEPOSIT (MIN {MIN_SATS})</label>
        <div className="flex gap-2 flex-wrap">
          {[21, 100, 500, 1000].map(v => (
            <button key={v}
              className={`px-4 py-2 rounded-full border-2 font-bold transition-all ${sats === v ? 'bg-[#F7931A] text-white border-black' : 'bg-white text-[#1A0040] border-[#1A0040] hover:bg-orange-50'}`}
              style={{ fontFamily: "'Bangers', Impact, sans-serif", fontSize: '16px' }}
              onClick={() => onSetSats(v)}
            >
              {v}
            </button>
          ))}
          <input
            type="number"
            min={MIN_SATS}
            className="flex-1 min-w-[80px] text-center border-2 border-[#1A0040] rounded-full px-3 py-2 font-bold"
            style={{ fontFamily: "'Bangers', Impact, sans-serif", fontSize: '16px' }}
            value={sats}
            onChange={e => onSetSats(Math.max(MIN_SATS, parseInt(e.target.value) || MIN_SATS))}
          />
        </div>
        {satsErr && <p className="text-red-500 text-sm">{satsErr}</p>}
      </div>

      {/* Lightning invoice */}
      {!invoice ? (
        <button
          className="w-full py-3 rounded-2xl border-4 border-black bg-[#F7931A] text-white font-bold text-xl shadow-[6px_6px_0_#FCE000] active:translate-y-1 active:shadow-none transition-all"
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
                <img src={qrUrl} alt="Lightning invoice QR" className="w-[200px] h-[200px] block" />
              </div>
              <p className="text-sm text-[#1A0040AA] text-center">
                Scan to pay {sats.toLocaleString()} sats — or use your Lightning wallet
              </p>
            </div>
          )}
          <div className="flex gap-2">
            <button
              className="flex-1 py-2 rounded-xl border-3 border-[#1A0040] bg-[#FCE000] text-[#1A0040] font-bold transition-all hover:bg-yellow-300 active:scale-95"
              style={{ fontFamily: "'Bangers', Impact, sans-serif", letterSpacing: '1px', border: '3px solid #1A0040' }}
              onClick={() => window.open(`lightning:${invoice}`, '_blank')}
            >
              OPEN WALLET
            </button>
            <button
              className={`flex-1 py-2 rounded-xl border-3 border-[#1A0040] font-bold transition-all active:scale-95 ${copied ? 'bg-green-400 text-white' : 'bg-white text-[#1A0040] hover:bg-gray-50'}`}
              style={{ fontFamily: "'Bangers', Impact, sans-serif", letterSpacing: '1px', border: '3px solid #1A0040' }}
              onClick={handleCopy}
            >
              {copied ? 'COPIED ✓' : 'COPY INVOICE'}
            </button>
          </div>
          <button
            className="w-full py-3 rounded-2xl border-4 border-black bg-[#FF0080] text-white font-bold text-xl shadow-[6px_6px_0_#FCE000] active:translate-y-1 active:shadow-none transition-all"
            style={{ fontFamily: "'Bangers', Impact, sans-serif", letterSpacing: '2px' }}
            onClick={handlePaid}
          >
            I ZAPPED IT · PLAY ⚡
          </button>
          <button
            className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => { setInvoice(null); setQrUrl(null); }}
          >
            ← Change amount
          </button>
        </div>
      )}

      <button
        className="w-full py-2 rounded-2xl border-3 border-[#1A0040] bg-[#00CFFF] text-[#1A0040] font-bold text-lg transition-all hover:bg-cyan-300 active:scale-95"
        style={{ fontFamily: "'Bangers', Impact, sans-serif", letterSpacing: '2px', border: '3px solid #1A0040' }}
        onClick={onBack}
      >
        BACK
      </button>
    </div>
  );
}

// ── Game Over Panel ───────────────────────────────────────────────────────────

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

  useEffect(() => {
    // Auto-publish if paid mode and logged in
    if (paidMode && playerName && user && !published) {
      const npub = playerNpub || nip19.npubEncode(user.pubkey);
      publishScore(GAME_ID, playerName, score, satsPaid, npub, () => {
        setPublished(true);
        updateRoundHighScore(GAME_ID, user.pubkey, npub, playerName, score);
      });
    }
  }, [paidMode, playerName, user, score, satsPaid, playerNpub, published, publishScore]);

  return (
    <div className="space-y-4 p-4 max-w-md mx-auto text-center"
      style={{ fontFamily: "'Bangers', Impact, sans-serif" }}>
      <h2 className="text-4xl text-[#FF0080]"
        style={{ letterSpacing: '3px', textShadow: '3px 3px 0 #FCE000, 6px 6px 0 #000' }}>
        GAME OVER
      </h2>
      <div className="text-3xl text-[#6200EA]"
        style={{ textShadow: '2px 2px 0 #FCE000', letterSpacing: '2px' }}>
        {score.toLocaleString()} BUCKS
      </div>

      {paidMode && (
        <div className="bg-green-50 border-2 border-green-400 rounded-xl p-3 text-sm space-y-1">
          {published ? (
            <p className="text-green-700 font-bold">✓ Score published to Nostr scoreboard!</p>
          ) : isPending ? (
            <p className="text-green-600">Publishing score to Nostr…</p>
          ) : (
            <p className="text-green-700">Score will be published to the global scoreboard.</p>
          )}
        </div>
      )}

      {!paidMode && (
        <div className="bg-orange-50 border-2 border-orange-400 rounded-xl p-3 text-sm">
          <p className="text-orange-700 font-bold">Playing free? Deposit sats to enter the jackpot & scoreboard!</p>
        </div>
      )}

      <Scoreboard game={GAME_ID} myScore={paidMode ? score : undefined} />

      <div className="flex gap-3 justify-center">
        <button
          className="px-8 py-3 rounded-2xl border-4 border-black bg-[#FF0080] text-white font-bold text-xl shadow-[6px_6px_0_#FCE000] active:translate-y-1 active:shadow-none transition-all"
          style={{ fontFamily: "'Bangers', Impact, sans-serif", letterSpacing: '2px' }}
          onClick={onAgain}
        >
          AGAIN ⚡
        </button>
        <button
          className="px-8 py-3 rounded-2xl border-4 border-black bg-[#00CFFF] text-[#000] font-bold text-xl shadow-[6px_6px_0_#FF0080] active:translate-y-1 active:shadow-none transition-all"
          style={{ fontFamily: "'Bangers', Impact, sans-serif", letterSpacing: '2px' }}
          onClick={onMenu}
        >
          MENU
        </button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

type Screen = 'menu' | 'game' | 'pay' | 'gameover' | 'scoreboard';

export default function GameMoneyPrinter() {
  const navigate = useNavigate();
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

  // The game iframe posts messages to tell us about game state
  const handleIframeMessage = useCallback((e: MessageEvent) => {
    if (!e.data || typeof e.data !== 'object') return;
    const msg = e.data as GameMessage;

    if (msg.type === 'ready') {
      setIframeReady(true);
    } else if (msg.type === 'game_over' && msg.score !== undefined) {
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
    // Give iframe time to load
    setTimeout(() => sendToGame({ type: 'start_game', paidMode: false }), 500);
  }, [sendToGame]);

  const startPaidGame = useCallback(() => {
    setPaidMode(true);
    setScreen('game');
    setTimeout(() => sendToGame({ type: 'start_game', paidMode: true, name: playerName }), 500);
  }, [sendToGame, playerName]);

  const handlePayDone = useCallback(() => {
    startPaidGame();
  }, [startPaidGame]);

  const handleAgain = useCallback(() => {
    if (paidMode) {
      startPaidGame();
    } else {
      startFreeGame();
    }
  }, [paidMode, startFreeGame, startPaidGame]);

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Bangers', Impact, sans-serif" }}>
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/games')} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Games
        </Button>
        <span className="text-[#FF0080] font-bold text-lg" style={{ letterSpacing: '2px' }}>
          MONEY PRINTER MAYHEM
        </span>
        <Badge className="bg-[#6200EA] text-white border-0 ml-auto">ClownWorld Edition</Badge>
      </div>

      {/* Jackpot bar */}
      <div className="px-4 py-3 max-w-2xl mx-auto">
        <JackpotBar game={GAME_ID} />
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 pb-12">

        {/* Menu */}
        {screen === 'menu' && (
          <div className="space-y-4 py-4 text-center">
            <div>
              <h1 className="text-5xl text-[#FF0080]"
                style={{ letterSpacing: '3px', textShadow: '3px 3px 0 #FCE000, 6px 6px 0 #000', transform: 'rotate(-2deg)', display: 'inline-block' }}>
                MONEY PRINTER<br /><span style={{ color: '#6200EA' }}>MAYHEM</span>
              </h1>
              <p className="text-[#6200EA] mt-2 text-2xl" style={{ letterSpacing: '2px' }}>
                CLOWNWORLD EDITION
              </p>
            </div>
            <div className="bg-gray-50 border-2 border-[#1A0040] rounded-2xl p-4 text-left text-[#1A0040] max-w-sm mx-auto"
              style={{ fontSize: '18px', lineHeight: '1.5' }}>
              The printer goes <strong className="text-[#FF0080]">BRRR</strong>.<br />
              <strong>💵 FIAT &amp; 💩 SHITCOINS</strong> = +21 bucks<br />
              Dodge the ₿ bitcoin — 3 lives. Trust us.
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                className="px-8 py-3 rounded-2xl border-4 border-black bg-[#FF0080] text-white font-bold text-xl shadow-[6px_6px_0_#FCE000] active:translate-y-1 active:shadow-none transition-all"
                style={{ transform: 'rotate(-2deg)', letterSpacing: '2px' }}
                onClick={startFreeGame}
              >
                PLAY FREE 🤡
              </button>
              <button
                className="px-8 py-3 rounded-2xl border-4 border-black bg-[#F7931A] text-white font-bold text-xl shadow-[6px_6px_0_#FF0080] active:translate-y-1 active:shadow-none transition-all"
                style={{ letterSpacing: '2px' }}
                onClick={() => setScreen('pay')}
              >
                PLAY FOR SATS ⚡
              </button>
            </div>
            <button
              className="px-6 py-2 rounded-2xl border-3 border-[#1A0040] bg-[#00CFFF] text-[#000] font-bold text-lg shadow-[4px_4px_0_#FF0080] active:translate-y-0.5 active:shadow-none transition-all"
              style={{ transform: 'rotate(2deg)', letterSpacing: '2px', border: '3px solid #1A0040' }}
              onClick={() => setScreen('scoreboard')}
            >
              <Users className="inline h-5 w-5 mr-2" />
              SCOREBOARD
            </button>
            <p className="text-xs text-[#1A004077] mt-4">BITPOPART · CLOWNWORLD</p>
          </div>
        )}

        {/* Pay screen */}
        {screen === 'pay' && (
          <PayPanel
            playerName={playerName}
            playerNpub={playerNpub}
            sats={satsPaid}
            onSetName={setPlayerName}
            onSetNpub={setPlayerNpub}
            onSetSats={setSatsPaid}
            onPaid={handlePayDone}
            onBack={() => setScreen('menu')}
          />
        )}

        {/* Game screen */}
        {screen === 'game' && (
          <div className="space-y-3">
            <div className="relative w-full rounded-2xl overflow-hidden border-4 border-black shadow-[8px_8px_0_#6200EA]"
              style={{ aspectRatio: '2/3', maxHeight: '70vh' }}>
              {!iframeReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
                  <div className="text-center space-y-2">
                    <div className="animate-spin text-4xl">🤡</div>
                    <p className="text-[#6200EA] font-bold" style={{ letterSpacing: '2px' }}>LOADING…</p>
                  </div>
                </div>
              )}
              <iframe
                ref={iframeRef}
                src="/games/moneyprinter.html"
                title="Money Printer Mayhem"
                className="w-full h-full border-0"
                style={{ display: 'block', minHeight: '400px', height: '100%' }}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                onLoad={() => setIframeReady(true)}
              />
            </div>
            <button
              className="w-full py-2 rounded-xl border-2 border-[#1A0040] bg-[#00CFFF] text-[#000] font-bold text-base transition-all hover:bg-cyan-300"
              style={{ fontFamily: "'Bangers', Impact, sans-serif", letterSpacing: '2px' }}
              onClick={() => setScreen('menu')}
            >
              ← MENU
            </button>
            <p className="text-xs text-center text-muted-foreground">
              Note: The game runs in full-screen mode. Your score will be recorded when the game ends.
            </p>
          </div>
        )}

        {/* Game over */}
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

        {/* Scoreboard only */}
        {screen === 'scoreboard' && (
          <div className="space-y-4 py-4">
            <Scoreboard game={GAME_ID} />
            <button
              className="w-full py-2 rounded-xl border-3 border-[#1A0040] bg-[#00CFFF] text-[#000] font-bold text-lg transition-all hover:bg-cyan-300"
              style={{ fontFamily: "'Bangers', Impact, sans-serif", letterSpacing: '2px', border: '3px solid #1A0040' }}
              onClick={() => setScreen('menu')}
            >
              ← BACK
            </button>
          </div>
        )}

      </div>

      {/* Footer */}
      <div className="text-center py-4 text-xs text-[#1A004077]" style={{ letterSpacing: '2px' }}>
        <a href="https://shakespeare.diy" target="_blank" rel="noopener noreferrer" className="hover:text-[#FF0080] transition-colors">
          Vibed with Shakespeare
        </a>
        {' · '}BITPOPART · CLOWNWORLD
      </div>
    </div>
  );
}
