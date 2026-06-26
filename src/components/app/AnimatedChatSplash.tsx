/**
 * AnimatedChatSplash — group-chat-style animated splash below the carousel on /app.
 *
 * Picks one enabled scene at random per page load, then reveals each message
 * one by one with a typing-bubble effect before the bubble fades in.
 *
 * Links inside message text are parsed and rendered as tappable anchor tags.
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useChatSplashScenes } from '@/hooks/useChatSplash';
import type { ChatMessage, ChatScene } from '@/hooks/useChatSplash';

// ── Helpers ────────────────────────────────────────────────

/** Parse text into segments of plain text and URLs */
function parseTextWithLinks(text: string): Array<{ type: 'text' | 'link'; value: string }> {
  const urlPattern = /(https?:\/\/[^\s]+)/g;
  const parts: Array<{ type: 'text' | 'link'; value: string }> = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = urlPattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    }
    parts.push({ type: 'link', value: match[0] });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push({ type: 'text', value: text.slice(lastIndex) });
  }
  return parts;
}

// ── Typing dots indicator ──────────────────────────────────

function TypingDots({ side }: { side: 'left' | 'right' }) {
  return (
    <div className={`flex items-end gap-2 ${side === 'right' ? 'flex-row-reverse' : ''}`}>
      {/* Spacer avatar */}
      <div className="w-8 h-8 rounded-full bg-transparent flex-shrink-0" />
      <div className={`px-4 py-3 rounded-2xl ${
        side === 'right'
          ? 'rounded-br-sm bg-gradient-to-br from-orange-400 to-pink-500'
          : 'rounded-bl-sm bg-white dark:bg-gray-700 border border-gray-100 dark:border-gray-600'
      } shadow-sm`}>
        <div className="flex gap-1 items-center h-4">
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className={`w-1.5 h-1.5 rounded-full animate-bounce ${
                side === 'right' ? 'bg-white/80' : 'bg-gray-400 dark:bg-gray-400'
              }`}
              style={{ animationDelay: `${i * 150}ms`, animationDuration: '0.8s' }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Single chat bubble ─────────────────────────────────────

function ChatBubble({ msg, visible }: { msg: ChatMessage; visible: boolean }) {
  const segments = useMemo(() => parseTextWithLinks(msg.text), [msg.text]);
  const isRight = msg.side === 'right';

  return (
    <div
      className={`flex items-end gap-2 transition-all duration-500 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
      } ${isRight ? 'flex-row-reverse' : ''}`}
    >
      {/* Avatar */}
      <div className="flex-shrink-0 relative">
        {msg.avatar ? (
          <img
            src={msg.avatar}
            alt={msg.name}
            className="w-8 h-8 rounded-full object-cover border-2 border-white dark:border-gray-700 shadow-sm"
            onError={e => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
            {msg.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Bubble + name */}
      <div className={`max-w-[75%] flex flex-col gap-0.5 ${isRight ? 'items-end' : 'items-start'}`}>
        <span className="text-[10px] font-semibold text-muted-foreground px-1">{msg.name}</span>
        <div
          className={`px-3.5 py-2.5 rounded-2xl shadow-sm text-sm leading-relaxed ${
            isRight
              ? 'rounded-br-sm bg-gradient-to-br from-orange-400 to-pink-500 text-white'
              : 'rounded-bl-sm bg-white dark:bg-gray-700 border border-gray-100 dark:border-gray-600 text-gray-900 dark:text-gray-100'
          }`}
        >
          {segments.map((seg, i) =>
            seg.type === 'link' ? (
              <a
                key={i}
                href={seg.value}
                target={seg.value.startsWith('http') && !seg.value.includes(window.location.hostname) ? '_blank' : undefined}
                rel="noopener noreferrer"
                className={`underline underline-offset-2 font-medium ${
                  isRight ? 'text-white/90 hover:text-white' : 'text-orange-600 dark:text-orange-400 hover:text-orange-700'
                }`}
                onClick={e => e.stopPropagation()}
              >
                {seg.value.replace(/^https?:\/\//, '').replace(/\/$/, '')}
              </a>
            ) : (
              <span key={i}>{seg.value}</span>
            )
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────

interface AnimatedChatSplashProps {
  /** Replay key — increment to restart the animation with a new random scene */
  replayKey?: number;
  /** Admin preview: override the scene instead of picking from Nostr */
  _overrideScene?: ChatScene;
}

export function AnimatedChatSplash({ replayKey = 0, _overrideScene }: AnimatedChatSplashProps) {
  const { data: scenes = [], isLoading } = useChatSplashScenes();

  // Pick a random enabled scene (stable per replayKey), unless overridden by admin preview
  const scene = useMemo<ChatScene | null>(() => {
    if (_overrideScene) return _overrideScene;
    const enabled = scenes.filter(s => s.enabled);
    if (enabled.length === 0) return null;
    return enabled[Math.floor(Math.random() * enabled.length)];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_overrideScene, scenes.length, replayKey]);

  // visibleCount drives the sequential reveal
  const [visibleCount, setVisibleCount] = useState(0);
  // typing = index of message currently "typing" (-1 = none)
  const [typingIndex, setTypingIndex] = useState(-1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset + start animation when scene changes
  useEffect(() => {
    setVisibleCount(0);
    setTypingIndex(-1);
    if (!scene || scene.messages.length === 0) return;

    let currentIndex = 0;

    const scheduleNext = () => {
      const msg = scene.messages[currentIndex];
      if (!msg) return;

      // Show typing indicator for ~800ms then reveal bubble
      const typingDuration = 700 + Math.min(msg.text.length * 18, 1200);

      setTypingIndex(currentIndex);
      timerRef.current = setTimeout(() => {
        setTypingIndex(-1);
        setVisibleCount(c => c + 1);
        currentIndex++;

        if (currentIndex < scene.messages.length) {
          // Gap between messages
          timerRef.current = setTimeout(scheduleNext, 400);
        }
      }, typingDuration);
    };

    // Start first message after initial delay
    timerRef.current = setTimeout(scheduleNext, 500);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [scene]);

  // ── Loading state (only on the live /app page, not in admin preview) ──
  if (isLoading && !_overrideScene) {
    return (
      <div className="space-y-3 px-1">
        <Skeleton className="h-12 w-3/4 rounded-2xl" />
        <Skeleton className="h-12 w-2/3 rounded-2xl ml-auto" />
        <Skeleton className="h-10 w-1/2 rounded-2xl" />
      </div>
    );
  }

  // ── No scenes configured ───────────────────────────────
  if (!scene) return null;

  return (
    <div className="space-y-2.5 px-1 py-1">
      {scene.messages.map((msg, i) => (
        <div key={msg.id}>
          {/* Typing dots while this message is "being typed" */}
          {typingIndex === i && <TypingDots side={msg.side} />}
          {/* Bubble — shown once revealed */}
          {i < visibleCount && <ChatBubble msg={msg} visible />}
        </div>
      ))}
    </div>
  );
}
