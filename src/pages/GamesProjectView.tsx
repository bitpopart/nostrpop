/**
 * GamesProjectView
 *
 * Renders a Nostr-stored HTML-upload game inside an iframe, wrapped with the
 * GameMechanismOverlay (jackpot strip, scoreboard, pay-to-play, free-play).
 *
 * Communication bridge:
 *  A tiny JS snippet is injected into the srcDoc that lets the game HTML post
 *  score events back to the parent via window.parent.postMessage():
 *
 *    window.gamestr.scoreUpdate(score)  // continuous score updates
 *    window.gamestr.gameOver(score)     // final score when game ends
 *    window.gamestr.gameStart()         // optional: game has started
 *
 *  The parent listens and feeds the state into GameMechanismOverlay.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { useSeoMeta } from '@unhead/react';
import { Skeleton } from '@/components/ui/skeleton';
import { nip19 } from 'nostr-tools';
import {
  GameMechanismOverlay,
  JackpotStrip,
  type GameState,
} from '@/components/games/GameMechanismOverlay';

const ADMIN_NPUB = 'npub1gwa27rpgum8mr9d30msg8cv7kwj2lhav2nvmdwh3wqnsa5vnudxqlta2sz';
const ADMIN_PUBKEY = nip19.decode(ADMIN_NPUB).data as string;

const htmlCache = new Map<string, string>();

/**
 * Injects the Gamestr bridge script into the game HTML.
 * The bridge exposes `window.gamestr` to the game so it can post score events
 * back to the parent react app without knowing about React at all.
 */
function injectGamestrBridge(html: string): string {
  const bridgeScript = `
<script>
(function(){
  var _score = 0;
  window.gamestr = {
    scoreUpdate: function(s) {
      _score = s;
      window.parent.postMessage({ type: 'score_update', score: s }, '*');
    },
    gameOver: function(s) {
      _score = (s !== undefined ? s : _score);
      window.parent.postMessage({ type: 'game_over', score: _score }, '*');
    },
    gameStart: function() {
      window.parent.postMessage({ type: 'game_start' }, '*');
    },
    ready: function() {
      window.parent.postMessage({ type: 'ready' }, '*');
    }
  };
  // Also listen for commands from parent (e.g. start/reset)
  window.addEventListener('message', function(e) {
    if (e.data && e.data.type === 'gamestr_command') {
      var cmd = e.data.command;
      if (cmd === 'start' && typeof window.gamestrOnStart === 'function') window.gamestrOnStart();
      if (cmd === 'reset' && typeof window.gamestrOnReset === 'function') window.gamestrOnReset();
    }
  });
})();
</script>`;

  // Inject right after <head> or at very start of <body>
  if (/<head[^>]*>/i.test(html)) {
    return html.replace(/<head([^>]*)>/i, `<head$1>${bridgeScript}`);
  }
  if (/<body[^>]*>/i.test(html)) {
    return html.replace(/<body([^>]*)>/i, `<body$1>${bridgeScript}`);
  }
  // Fallback: prepend
  return bridgeScript + html;
}

export default function GamesProjectView() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { nostr } = useNostr();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // ── Score state (updated via postMessage from the iframe) ─────────────────
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  // Track whether the overlay is in "playing" state so we can reset it
  const [gameStateKey, setGameStateKey] = useState(0); // increment = full remount of overlay

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
  const fetchingUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!brandSiteUrl) return;
    if (htmlCache.has(brandSiteUrl)) { setFetchedHtml(htmlCache.get(brandSiteUrl)!); return; }
    if (fetchingUrlRef.current === brandSiteUrl) return;
    fetchingUrlRef.current = brandSiteUrl;
    setFetchingHtml(true);
    fetch(brandSiteUrl)
      .then(r => r.text())
      .then(html => { htmlCache.set(brandSiteUrl, html); setFetchedHtml(html); setFetchingHtml(false); })
      .catch(() => setFetchingHtml(false));
  }, [brandSiteUrl]);

  // ── Inject bridge into the HTML ───────────────────────────────────────────
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
        setIsGameOver(true);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  // ── Send commands to the iframe ───────────────────────────────────────────
  const sendCommand = useCallback((command: 'start' | 'reset') => {
    iframeRef.current?.contentWindow?.postMessage({ type: 'gamestr_command', command }, '*');
  }, []);

  const handleStartGame = useCallback(() => {
    setScore(0);
    setIsGameOver(false);
    sendCommand('start');
  }, [sendCommand]);

  const handleResetGame = useCallback(() => {
    setScore(0);
    setIsGameOver(false);
    setGameStateKey(k => k + 1); // remount overlay → back to menu
    sendCommand('reset');
  }, [sendCommand]);

  // ── SEO ───────────────────────────────────────────────────────────────────
  useSeoMeta({
    title: project ? `${gameName} — BitPopArt Games` : 'BitPopArt Games',
  });

  // ── Loading state ─────────────────────────────────────────────────────────
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

  if (!project || !brandSiteUrl) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Game not found.</p>
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
      {/* Jackpot strip — always visible while playing */}
      <JackpotStrip game={gameId} />

      {/* Game area: iframe + overlay stack */}
      <div className="relative flex-1 flex flex-col" style={{ minHeight: 0 }}>
        {/* The game iframe — rendered behind the overlay */}
        {srcDocHtml ? (
          <iframe
            ref={iframeRef}
            key={`srcdoc-${gameStateKey}`}
            srcDoc={srcDocHtml}
            title={gameName}
            className="w-full flex-1 border-0"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
          />
        ) : (
          <iframe
            ref={iframeRef}
            key={`src-${gameStateKey}`}
            src={brandSiteUrl}
            title={gameName}
            className="w-full flex-1 border-0"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
          />
        )}

        {/* Game mechanism overlay — sits on top of the iframe */}
        <GameMechanismOverlay
          key={`overlay-${gameStateKey}`}
          gameId={gameId}
          gameName={gameName}
          onStartGame={handleStartGame}
          onResetGame={handleResetGame}
          score={score}
          isGameOver={isGameOver}
        />
      </div>
    </div>
  );
}
