import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useGameIdentity, MIN_SATS } from '@/hooks/useGameJackpot';
import { useLNURL, pollVerifyPayment } from '@/hooks/useLNURL';
import { LoginArea } from '@/components/auth/LoginArea';
import QRCode from 'qrcode';

export interface GamePayPanelProps {
  /** Game id (used for localStorage name persistence) */
  gameId: string;
  /** Lightning address that receives the zap */
  lightningAddress: string;
  /** Called once payment is verified and the player taps PLAY */
  onPaid: (info: { name: string; npub: string; pubkey: string; satsPaid: number }) => void;
  onBack: () => void;
  /** Theme — default is the ClownWorld purple/gold palette */
  theme?: {
    bg?: string;          // panel background (default #1A0040)
    accent?: string;      // primary accent (default #FF0080)
    accent2?: string;     // secondary accent (default #FCE000)
    highlight?: string;   // highlight (default #00CFFF)
    cta?: string;         // zap button (default #F7931A)
  };
  title?: string;
  subtitle?: string;
  satsLabel?: string;
}

/**
 * Shared "zap · name · play" pay panel for ALL games.
 * The player only enters a NAME — their Nostr identity comes from the login
 * (if any) or an auto-generated per-browser guest key. Payment is verified via
 * WebLN or LNURL-verify before play unlocks; manual confirm is the last resort
 * when neither auto path exists.
 */
export function GamePayPanel({
  gameId,
  lightningAddress,
  onPaid,
  onBack,
  theme = {},
  title = 'PLAY FOR SATS ⚡',
  subtitle,
  satsLabel = 'SATS (MIN ' + String(MIN_SATS) + ')',
}: GamePayPanelProps) {
  const [playerName, setPlayerName] = useState('');
  const [sats, setSats] = useState(MIN_SATS);
  const [invoice, setInvoice] = useState<string | null>(null);
  const [invoiceVerify, setInvoiceVerify] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [verified, setVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [payError, setPayError] = useState('');
  const [nameErr, setNameErr] = useState('');
  const [satsErr, setSatsErr] = useState('');
  const { user } = useCurrentUser();
  const identity = useGameIdentity();
  const { lnurlData, getZapInvoice, isLoading: lnLoading } = useLNURL(lightningAddress);

  const hasWebln = typeof window !== 'undefined' && !!window.webln;

  const t = {
    bg: theme.bg ?? '#1A0040',
    accent: theme.accent ?? '#FF0080',
    accent2: theme.accent2 ?? '#FCE000',
    highlight: theme.highlight ?? '#00CFFF',
    cta: theme.cta ?? '#F7931A',
  };

  // Remember the name across games/sessions
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`bitpopart-games-name-${gameId}`);
      if (saved) setPlayerName(saved);
    } catch { /* ignore */ }
  }, [gameId]);

  useEffect(() => {
    try {
      if (playerName.trim()) localStorage.setItem(`bitpopart-games-name-${gameId}`, playerName.trim().toUpperCase());
    } catch { /* ignore */ }
  }, [playerName, gameId]);

  const generateInvoice = async () => {
    setNameErr(''); setSatsErr(''); setPayError(''); setVerified(false);
    if (!playerName.trim()) { setNameErr('Name required'); return; }
    if (sats < MIN_SATS) { setSatsErr(`Min ${MIN_SATS} sats`); return; }
    setIsGenerating(true);
    try {
      const inv = await getZapInvoice(sats);
      if (!inv) return;
      setInvoice(inv.pr);
      setInvoiceVerify(inv.verify ?? null);
      // Uppercase + no URI prefix = alphanumeric QR mode → smaller, denser, reads reliably
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

  // Pay directly in-browser with WebLN (real payment — the wallet confirms the tx)
  const payWithWebln = async () => {
    if (!window.webln || !invoice) return;
    setPayError(''); setVerifying(true);
    try {
      await window.webln.enable();
      await window.webln.sendPayment(invoice);
      setVerified(true);
    } catch (e) {
      setPayError(e instanceof Error ? `Payment failed or was cancelled: ${e.message}` : 'Payment failed or was cancelled.');
    } finally {
      setVerifying(false);
    }
  };

  // Poll the LNURL-verify endpoint when the provider supports it
  const verifyPayment = async () => {
    if (!invoiceVerify || !invoice) return;
    setPayError(''); setVerifying(true);
    const ok = await pollVerifyPayment(invoiceVerify, 180_000);
    setVerifying(false);
    if (ok) setVerified(true);
    else setPayError('Could not confirm the payment. If you paid, check your wallet — or try WebLN.');
  };

  const handlePaid = () => {
    if (!invoice || !playerName.trim()) return;
    if (!verified && hasWebln) {
      setPayError('Pay with WebLN above, or confirm manually below.');
      return;
    }
    onPaid({
      name: playerName.trim().toUpperCase(),
      npub: identity.npub,
      pubkey: identity.pubkey,
      satsPaid: sats,
    });
  };

  return (
    <div className="absolute inset-0 z-20 bg-white overflow-y-auto">
      <div className="max-w-sm mx-auto px-4 py-5 space-y-4"
        style={{ fontFamily: "'Bangers', Impact, sans-serif" }}>

        <div className="flex items-center justify-between">
          <h2 className="text-2xl" style={{ color: t.accent, letterSpacing: '3px', textShadow: `2px 2px 0 ${t.accent2}, 3px 3px 0 #000` }}>
            {title}
          </h2>
          <button onClick={onBack} className="text-gray-400 hover:text-black transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="rounded-xl p-3 text-sm space-y-0.5" style={{ background: t.bg, color: t.accent2, fontFamily: 'sans-serif' }}>
          {subtitle ? (
            <p>{subtitle}</p>
          ) : (
            <>
              <p>Deposit min <strong style={{ color: t.cta }}>{MIN_SATS} sats</strong> (more = more jackpot).</p>
              <p><strong style={{ color: t.highlight }}>21%</strong> fills the jackpot · at <strong style={{ color: t.cta }}>2100 sats</strong> a <strong style={{ color: t.highlight }}>21h</strong> countdown starts.</p>
              <p>Highest score wins the pot — zapped to your key!</p>
            </>
          )}
        </div>

        {/* Name — the ONLY thing the player must type */}
        <div className="space-y-1">
          <label className="text-lg" style={{ color: t.bg }}>YOUR NAME</label>
          <input
            className="w-full text-center text-xl font-bold rounded-full px-4 py-2 uppercase outline-none transition-colors"
            style={{ fontFamily: "'Bangers', Impact, sans-serif", letterSpacing: '2px', border: `3px solid ${t.bg}` }}
            maxLength={12}
            placeholder="MAX BUCKS"
            value={playerName}
            onChange={e => setPlayerName(e.target.value.toUpperCase())}
          />
          {nameErr && <p className="text-red-500 text-xs">{nameErr}</p>}
        </div>

        {/* Identity — auto, no typing needed */}
        <div className="space-y-1">
          <label className="text-lg" style={{ color: t.bg }}>YOUR IDENTITY</label>
          {user ? (
            <div className="flex items-center gap-2">
              <span className="flex-1 text-xs rounded-full px-4 py-2 truncate"
                style={{ fontFamily: 'monospace', border: `3px solid ${t.bg}` }}>
                {identity.npub}
              </span>
              <Badge variant="outline" className="text-green-600 border-green-400 whitespace-nowrap text-xs">✓ Logged in</Badge>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex-1 text-xs rounded-full px-4 py-2 truncate"
                  style={{ fontFamily: 'monospace', border: `3px solid ${t.bg}` }}>
                  {identity.npub}
                </span>
                <Badge variant="outline" className="text-orange-500 border-orange-300 whitespace-nowrap text-xs">⚡ Guest key</Badge>
              </div>
              <p className="text-xs text-muted-foreground">No login needed — scores go to the board with this auto key. Want your own? Log in:</p>
              <LoginArea className="w-full" />
            </div>
          )}
        </div>

        {/* Sats */}
        <div className="space-y-1">
          <label className="text-lg" style={{ color: t.bg }}>{satsLabel}</label>
          <div className="flex gap-2 flex-wrap">
            {[21, 100, 500, 1000].map(v => (
              <button key={v}
                className={`px-4 py-1.5 rounded-full border-2 font-bold transition-all text-base ${sats === v ? 'text-white border-black' : 'bg-white hover:bg-orange-50'}`}
                style={{ fontFamily: "'Bangers', Impact, sans-serif", background: sats === v ? t.cta : undefined, color: sats === v ? '#fff' : t.bg, borderColor: sats === v ? '#000' : t.bg }}
                onClick={() => setSats(v)}
              >
                {v}
              </button>
            ))}
            <input
              type="number"
              min={MIN_SATS}
              className="flex-1 min-w-[70px] text-center rounded-full px-3 py-1.5 font-bold text-base"
              style={{ fontFamily: "'Bangers', Impact, sans-serif", border: `2px solid ${t.bg}` }}
              value={sats}
              onChange={e => setSats(Math.max(MIN_SATS, parseInt(e.target.value) || MIN_SATS))}
            />
          </div>
          {satsErr && <p className="text-red-500 text-xs">{satsErr}</p>}
        </div>

        {/* Invoice / QR */}
        {!invoice ? (
          <button
            className="w-full py-3 rounded-2xl border-4 border-black text-white font-bold text-xl shadow-[5px_5px_0_#FCE000] active:translate-y-1 active:shadow-none transition-all"
            style={{ fontFamily: "'Bangers', Impact, sans-serif", letterSpacing: '2px', background: t.cta }}
            onClick={generateInvoice}
            disabled={isGenerating || lnLoading || !lnurlData}
          >
            {isGenerating || lnLoading ? 'GENERATING…' : `ZAP ${sats} SATS ⚡`}
          </button>
        ) : (
          <div className="space-y-3">
            {qrUrl && (
              <div className="flex flex-col items-center gap-2">
                <div className="rounded-2xl overflow-hidden border-4 shadow-lg" style={{ borderColor: t.cta }}>
                  <img src={qrUrl} alt="Lightning QR" className="w-[180px] h-[180px] block" />
                </div>
                <p className="text-xs text-center" style={{ color: `${t.bg}AA` }}>Scan to pay {sats.toLocaleString()} sats</p>
              </div>
            )}
            <div className="flex gap-2">
              {hasWebln && (
                <button
                  className="flex-1 py-2 rounded-xl font-bold transition-all active:scale-95 text-sm disabled:opacity-60"
                  style={{ fontFamily: "'Bangers', Impact, sans-serif", letterSpacing: '1px', border: `3px solid ${t.bg}`, background: verified ? '#22c55e' : t.accent2, color: t.bg }}
                  onClick={payWithWebln}
                  disabled={verifying || verified}
                >
                  {verified ? 'PAID ✓' : verifying ? 'PAYING…' : 'PAY WITH WEBLN ⚡'}
                </button>
              )}
              <button
                className="flex-1 py-2 rounded-xl font-bold transition-all active:scale-95 text-sm"
                style={{ fontFamily: "'Bangers', Impact, sans-serif", letterSpacing: '1px', border: `3px solid ${t.bg}`, background: t.accent2, color: t.bg }}
                onClick={() => window.open(`lightning:${invoice}`, '_blank')}
              >
                OPEN WALLET
              </button>
              <button
                className={`flex-1 py-2 rounded-xl font-bold transition-all active:scale-95 text-sm ${copied ? 'bg-green-400 text-white' : 'bg-white hover:bg-gray-50'}`}
                style={{ fontFamily: "'Bangers', Impact, sans-serif", letterSpacing: '1px', border: `3px solid ${t.bg}`, color: t.bg }}
                onClick={handleCopy}
              >
                {copied ? 'COPIED ✓' : 'COPY'}
              </button>
            </div>
            {invoiceVerify && !verified && (
              <button
                className="w-full py-2 rounded-xl font-bold transition-all active:scale-95 text-sm disabled:opacity-60"
                style={{ fontFamily: "'Bangers', Impact, sans-serif", letterSpacing: '1px', border: '3px solid #6200EA', background: '#fff', color: '#6200EA' }}
                onClick={verifyPayment}
                disabled={verifying}
              >
                {verifying ? 'CHECKING PAYMENT…' : 'VERIFY PAYMENT ✓'}
              </button>
            )}
            {payError && (
              <p className="text-xs text-red-500 text-center" style={{ fontFamily: 'sans-serif' }}>{payError}</p>
            )}
            {!hasWebln && !invoiceVerify && (
              <p className="text-xs text-center" style={{ fontFamily: 'sans-serif', color: `${t.bg}88` }}>
                No WebLN wallet detected — auto-verification isn't available here. Pay with any wallet, then confirm below.
              </p>
            )}
            <button
              className="w-full py-3 rounded-2xl border-4 border-black text-white font-bold text-xl shadow-[5px_5px_0_#FCE000] active:translate-y-1 active:shadow-none transition-all disabled:opacity-70"
              style={{ fontFamily: "'Bangers', Impact, sans-serif", letterSpacing: '2px', background: t.accent }}
              onClick={handlePaid}
              disabled={verifying}
            >
              {verified ? 'PAID ✓ · PLAY ⚡' : 'I PAID · PLAY ⚡'}
            </button>
            <button className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => { setInvoice(null); setQrUrl(null); setInvoiceVerify(null); setVerified(false); setPayError(''); }}>
              ← Change amount
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default GamePayPanel;
