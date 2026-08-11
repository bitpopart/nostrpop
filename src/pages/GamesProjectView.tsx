/**
 * GamesProjectView
 *
 * Renders a Nostr-stored HTML-upload game inside an iframe.
 * Above the iframe sits the jackpot strip.
 * After game_over, a Nostr score-publishing overlay appears.
 *
 * The game HTML is its own entry point (splash + payment).
 * We do NOT show a second payment screen on top of it.
 *
 * Bridge API (injected into every game srcDoc):
 *   window.gamestr.scoreUpdate(score)            // continuous score
 *   window.gamestr.gameOver(score)               // final score → show overlay
 *   window.gamestr.gameOver(score, name, npub, sats) // with paid-play metadata
 *   window.gamestr.gameStart()                   // optional
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { useSeoMeta } from '@unhead/react';
import { nip19 } from 'nostr-tools';
import {
  GameMechanismOverlay,
  JackpotStrip,
} from '@/components/games/GameMechanismOverlay';

const ADMIN_NPUB = 'npub1gwa27rpgum8mr9d30msg8cv7kwj2lhav2nvmdwh3wqnsa5vnudxqlta2sz';
const ADMIN_PUBKEY = nip19.decode(ADMIN_NPUB).data as string;

const htmlCache = new Map<string, string>();

/**
 * Injects the Gamestr bridge script into the game HTML.
 * The bridge exposes `window.gamestr` so the game can communicate back
 * to the React parent without knowing about React at all.
 */
function injectGamestrBridge(html: string): string {
  const bridgeScript = `<script>
(function(){
  var _score = 0;
  window.gamestr = {
    scoreUpdate: function(s) {
      _score = s;
      window.parent.postMessage({ type: 'score_update', score: s }, '*');
    },
    /**
     * Call when the game ends.
     * @param {number} score  - final score
     * @param {string} [name] - player name (from game's own UI)
     * @param {string} [npub] - player npub (from game's own UI)
     * @param {number} [sats] - sats paid (0 = free play)
     */
    gameOver: function(s, name, npub, sats) {
      _score = (s !== undefined ? s : _score);
      window.parent.postMessage({
        type: 'game_over',
        score: _score,
        playerName: name || '',
        playerNpub: npub || '',
        satsPaid: sats || 0
      }, '*');
    },
    gameStart: function() {
      window.parent.postMessage({ type: 'game_start' }, '*');
    },
    ready: function() {
      window.parent.postMessage({ type: 'ready' }, '*');
    }
  };
  // Listen for commands from parent
  window.addEventListener('message', function(e) {
    if (e.data && e.data.type === 'gamestr_command') {
      var cmd = e.data.command;
      if (cmd === 'reset' && typeof window.gamestrOnReset === 'function') window.gamestrOnReset();
      if (cmd === 'start' && typeof window.gamestrOnStart === 'function') window.gamestrOnStart();
    }
  });
})();
</script>`;

  if (/<head[^>]*>/i.test(html)) {
    return html.replace(/<head([^>]*)>/i, `<head$1>${bridgeScript}`);
  }
  if (/<body[^>]*>/i.test(html)) {
    return html.replace(/<body([^>]*)>/i, `<body$1>${bridgeScript}`);
  }
  return bridgeScript + html;
}

export default function GamesProjectView() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { nostr } = useNostr();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // ── Score / game-over state ───────────────────────────────────────────────
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [playerNpub, setPlayerNpub] = useState('');
  const [satsPaid, setSatsPaid] = useState(0);
  // Incrementing this key reloads the iframe (Play Again)
  const [iframeKey, setIframeKey] = useState(0);

  // ── Nostr: fetch game project ─────────────────────────────────────────────
  const { data: project, isLoading } = useQuery({
    queryKey: ['games-project', projectId],
    queryFn: async (c) => {
      if (!projectId) return null;
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(5000)]);
      const events = await nostr.query(
        [{
          kinds: [36171],
          authors: [ADMIN_PUBKEY],
          '#d': [projectId],
          '#t': ['bitpopart-project'],
          limit: 1,
        }],
        { signal }
      );
      return events[0] ?? null;
    },
    enabled: !!projectId,
  });

  const brandSiteUrl = project?.tags.find(t => t[0] === 'brand-site')?.[1];
  const gameName = project?.tags.find(t => t[0] === 'name')?.[1] ?? 'Game';
  const gameId = projectId ?? 'unknown-game';

  // ── Fetch HTML ────────────────────────────────────────────────────────────
  const [fetchedHtml, setFetchedHtml] = useState<string | null>(
    () => (brandSiteUrl ? htmlCache.get(brandSiteUrl) ?? null : null)
  );
  const [fetchingHtml, setFetchingHtml] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const fetchingUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!brandSiteUrl) return;
    if (htmlCache.has(brandSiteUrl)) { setFetchedHtml(htmlCache.get(brandSiteUrl)!); return; }
    if (fetchingUrlRef.current === brandSiteUrl) return;
    fetchingUrlRef.current = brandSiteUrl;
    setFetchingHtml(true);
    setFetchError('');
    fetch(brandSiteUrl)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.text();
      })
      .then(html => {
        if (html.trim().length === 0) throw new Error('Empty response');
        htmlCache.set(brandSiteUrl, html);
        setFetchedHtml(html);
        setFetchingHtml(false);
      })
      .catch((err) => {
        console.error('Game HTML fetch failed:', err);
        setFetchedHtml(null);
        setFetchError('The game file could not be loaded from its host.');
        setFetchingHtml(false);
      });
  }, [brandSiteUrl]);

  const srcDocHtml = fetchedHtml ? injectGamestrBridge(fetchedHtml) : null;

  // ── Listen to postMessage from game iframe ────────────────────────────────
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      const msg = e.data;
      if (!msg || typeof msg !== 'object') return;

      if (msg.type === 'score_update' && typeof msg.score === 'number') {
        setScore(msg.score);
      }
      if (msg.type === 'game_over' && typeof msg.score === 'number') {
        setScore(msg.score);
        setPlayerName(typeof msg.playerName === 'string' ? msg.playerName : '');
        setPlayerNpub(typeof msg.playerNpub === 'string' ? msg.playerNpub : '');
        setSatsPaid(typeof msg.satsPaid === 'number' ? msg.satsPaid : 0);
        setIsGameOver(true);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  // ── Play Again: reload the iframe, clear overlay ──────────────────────────
  const handlePlayAgain = useCallback(() => {
    setScore(0);
    setIsGameOver(false);
    setPlayerName('');
    setPlayerNpub('');
    setSatsPaid(0);
    setIframeKey(k => k + 1);
  }, []);

  // ── SEO ───────────────────────────────────────────────────────────────────
  useSeoMeta({
    title: project ? `${gameName} — BitPopArt Games` : 'BitPopArt Games',
  });

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading || (fetchingHtml && !fetchedHtml)) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="text-center space-y-2">
          <div className="animate-bounce text-5xl">🎮</div>
          <p className="font-bold text-xl text-violet-600" style={{ letterSpacing: '2px' }}>LOADING…</p>
        </div>
      </div>
    );
  }

  if (!project || !brandSiteUrl || fetchError) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">{fetchError || 'Game not found.'}</p>
          {fetchError && (
            <p className="text-xs text-muted-foreground">The game published from {brandSiteUrl} isn't reachable right now.</p>
          )}
          <button
            className="text-sm underline text-orange-600"
            onClick={() => navigate('/games')}
          >
            ← Back to Games
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col w-full" style={{ minHeight: 0 }}>
      {/* Jackpot strip — always visible */}
      <JackpotStrip game={gameId} />

      {/* Game area: iframe + overlay stack */}
      <div className="relative flex-1 flex flex-col" style={{ minHeight: 0 }}>
        {/* The game iframe — always rendered; has its own splash/payment UI */}
        {srcDocHtml ? (
          <iframe
            ref={iframeRef}
            key={`srcdoc-${iframeKey}`}
            srcDoc={srcDocHtml}
            title={gameName}
            className="w-full flex-1 border-0"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
          />
        ) : (
          <iframe
            ref={iframeRef}
            key={`src-${iframeKey}`}
            src={brandSiteUrl}
            title={gameName}
            className="w-full flex-1 border-0"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
          />
        )}

        {/* Overlay — only visible after game_over; otherwise transparent */}
        <GameMechanismOverlay
          gameId={gameId}
          gameName={gameName}
          onPlayAgain={handlePlayAgain}
          score={score}
          isGameOver={isGameOver}
          playerName={playerName}
          playerNpub={playerNpub}
          satsPaid={satsPaid}
        />
      </div>
    </div>
  );
}
