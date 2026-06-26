/**
 * AnimatedChatSplash — group-chat-style animated splash below the category buttons on /app.
 *
 * Picks one enabled scene at random per page load, then reveals each message
 * one by one with a typing-bubble effect before the bubble fades in.
 *
 * Each message can optionally contain:
 *  - An image shown inside the bubble
 *  - A CTA link button shown below the bubble
 *  - Inline URLs in text are auto-linked
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useChatSplashScenes } from '@/hooks/useChatSplash';
import type { ChatMessage, ChatScene } from '@/hooks/useChatSplash';
import { ExternalLink, ArrowRight } from 'lucide-react';

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

function isExternal(url: string) {
  try {
    return new URL(url).hostname !== window.location.hostname;
  } catch {
    return false;
  }
}

function shortUrl(url: string) {
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '').split('/').slice(0, 2).join('/');
}

// ── Typing dots indicator ──────────────────────────────────

function TypingDots({ side }: { side: 'left' | 'right' }) {
  return (
    <div className={`flex items-end gap-2 ${side === 'right' ? 'flex-row-reverse' : ''}`}>
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
  const hasImage = !!msg.imageUrl;
  const hasLink = !!msg.linkUrl;
  const hasText = msg.text.trim().length > 0;

  const linkLabel = msg.linkLabel?.trim() || shortUrl(msg.linkUrl || '');
  const linkIsExternal = msg.linkUrl ? isExternal(msg.linkUrl) : false;

  return (
    <div
      className={`flex items-end gap-2 transition-all duration-500 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
      } ${isRight ? 'flex-row-reverse' : ''}`}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        {msg.avatar ? (
          <img
            src={msg.avatar}
            alt={msg.name}
            className="w-8 h-8 rounded-full object-cover border-2 border-white dark:border-gray-700 shadow-sm"
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
            {msg.name ? msg.name.charAt(0).toUpperCase() : '?'}
          </div>
        )}
      </div>

      {/* Bubble + name + optional link button */}
      <div className={`max-w-[78%] flex flex-col gap-1 ${isRight ? 'items-end' : 'items-start'}`}>
        <span className="text-[10px] font-semibold text-muted-foreground px-1">{msg.name}</span>

        {/* Bubble — only render if there's text or image */}
        {(hasText || hasImage) && (
          <div
            className={`rounded-2xl shadow-sm overflow-hidden ${
              isRight
                ? 'rounded-br-sm bg-gradient-to-br from-orange-400 to-pink-500 text-white'
                : 'rounded-bl-sm bg-white dark:bg-gray-700 border border-gray-100 dark:border-gray-600 text-gray-900 dark:text-gray-100'
            }`}
          >
            {/* Text part */}
            {hasText && (
              <div className="px-3.5 py-2.5 text-sm leading-relaxed">
                {segments.map((seg, i) =>
                  seg.type === 'link' ? (
                    <a
                      key={i}
                      href={seg.value}
                      target={isExternal(seg.value) ? '_blank' : undefined}
                      rel="noopener noreferrer"
                      className={`underline underline-offset-2 font-medium ${
                        isRight
                          ? 'text-white/90 hover:text-white'
                          : 'text-orange-600 dark:text-orange-400 hover:text-orange-700'
                      }`}
                      onClick={e => e.stopPropagation()}
                    >
                      {shortUrl(seg.value)}
                    </a>
                  ) : (
                    <span key={i}>{seg.value}</span>
                  )
                )}
              </div>
            )}

            {/* Image part */}
            {hasImage && (
              <div className={`${hasText ? '' : 'pt-0'}`}>
                <img
                  src={msg.imageUrl}
                  alt=""
                  className="w-full max-w-[220px] object-cover rounded-b-2xl"
                  style={{ display: 'block' }}
                  onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
            )}
          </div>
        )}

        {/* CTA link button — sits outside the bubble */}
        {hasLink && (
          <a
            href={msg.linkUrl}
            target={linkIsExternal ? '_blank' : undefined}
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm transition-all hover:scale-105 active:scale-95 ${
              isRight
                ? 'bg-white/20 text-white border border-white/30 hover:bg-white/30'
                : 'bg-gradient-to-r from-orange-400 to-pink-500 text-white hover:from-orange-500 hover:to-pink-600'
            }`}
          >
            {linkLabel}
            {linkIsExternal
              ? <ExternalLink className="h-3 w-3 opacity-80" />
              : <ArrowRight className="h-3 w-3 opacity-80" />
            }
          </a>
        )}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────

interface AnimatedChatSplashProps {
  replayKey?: number;
  _overrideScene?: ChatScene;
}

export function AnimatedChatSplash({ replayKey = 0, _overrideScene }: AnimatedChatSplashProps) {
  const { data: scenes = [], isLoading } = useChatSplashScenes();

  const scene = useMemo<ChatScene | null>(() => {
    if (_overrideScene) return _overrideScene;
    const enabled = scenes.filter(s => s.enabled);
    if (enabled.length === 0) return null;
    return enabled[Math.floor(Math.random() * enabled.length)];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_overrideScene, scenes.length, replayKey]);

  const [visibleCount, setVisibleCount] = useState(0);
  const [typingIndex, setTypingIndex] = useState(-1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setVisibleCount(0);
    setTypingIndex(-1);
    if (!scene || scene.messages.length === 0) return;

    let currentIndex = 0;

    const scheduleNext = () => {
      const msg = scene.messages[currentIndex];
      if (!msg) return;

      // Longer typing time for messages with images
      const textLen = msg.text?.length || 0;
      const typingDuration = msg.imageUrl
        ? 900 + Math.min(textLen * 15, 800)
        : 650 + Math.min(textLen * 18, 1200);

      setTypingIndex(currentIndex);
      timerRef.current = setTimeout(() => {
        setTypingIndex(-1);
        setVisibleCount(c => c + 1);
        currentIndex++;

        if (currentIndex < scene.messages.length) {
          timerRef.current = setTimeout(scheduleNext, 350);
        }
      }, typingDuration);
    };

    timerRef.current = setTimeout(scheduleNext, 400);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [scene]);

  if (isLoading && !_overrideScene) {
    return (
      <div className="space-y-3 px-1">
        <Skeleton className="h-12 w-3/4 rounded-2xl" />
        <Skeleton className="h-12 w-2/3 rounded-2xl ml-auto" />
        <Skeleton className="h-10 w-1/2 rounded-2xl" />
      </div>
    );
  }

  if (!scene) return null;

  return (
    <div className="space-y-2.5 px-1 py-1">
      {scene.messages.map((msg, i) => (
        <div key={msg.id}>
          {typingIndex === i && <TypingDots side={msg.side} />}
          {i < visibleCount && <ChatBubble msg={msg} visible />}
        </div>
      ))}
    </div>
  );
}
