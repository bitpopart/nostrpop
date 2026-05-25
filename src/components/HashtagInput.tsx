/**
 * HashtagInput — interactive tag editor with auto-suggestions.
 *
 * Features:
 * - Shows auto-generated tag suggestions from title + description
 * - User can click suggestions to add them
 * - User can type a custom tag and press Enter / comma / space to add it
 * - Existing tags shown as removable badges
 */

import { useState, useRef, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Hash, X, Sparkles } from 'lucide-react';
import { generateHashtagsFromText, parseUserTags, normaliseTag } from '@/lib/hashtags';

interface HashtagInputProps {
  /** Currently selected tags (no # prefix) */
  tags: string[];
  /** Called whenever the tag list changes */
  onChange: (tags: string[]) => void;
  /** Title text used for auto-suggestion */
  title?: string;
  /** Description text used for auto-suggestion */
  description?: string;
  /** Optional class for the wrapper */
  className?: string;
}

export function HashtagInput({
  tags,
  onChange,
  title = '',
  description = '',
  className = '',
}: HashtagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-generate suggestions whenever title / description change
  const suggestions = generateHashtagsFromText(title, description).filter(
    t => !tags.includes(t),
  );

  const addTag = (raw: string) => {
    const parsed = parseUserTags(raw);
    const newTags = [...new Set([...tags, ...parsed.filter(t => t && !tags.includes(t))])];
    onChange(newTags);
    setInputValue('');
  };

  const removeTag = (tag: string) => {
    onChange(tags.filter(t => t !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (['Enter', ',', ' '].includes(e.key)) {
      e.preventDefault();
      if (inputValue.trim()) addTag(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  // Debounce auto-apply suggestions when title/description change
  useEffect(() => {
    // If there are no tags yet and we have suggestions, do nothing automatically —
    // the user controls what gets added via the UI.
  }, [title, description]);

  return (
    <div className={`space-y-2 ${className}`}>
      <Label className="flex items-center gap-1.5 text-sm font-medium">
        <Hash className="h-3.5 w-3.5" />
        Hashtags
      </Label>

      {/* Tag chips + text input */}
      <div
        className="flex flex-wrap gap-1.5 min-h-[2.5rem] p-2 border rounded-lg bg-background cursor-text focus-within:ring-1 focus-within:ring-ring"
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map(tag => (
          <Badge
            key={tag}
            variant="secondary"
            className="gap-1 pr-1 text-xs font-normal"
          >
            #{tag}
            <button
              type="button"
              className="ml-0.5 rounded-full hover:bg-muted-foreground/20 p-0.5"
              onClick={(e) => { e.stopPropagation(); removeTag(tag); }}
              aria-label={`Remove #${tag}`}
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </Badge>
        ))}

        <Input
          ref={inputRef}
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => { if (inputValue.trim()) addTag(inputValue); }}
          placeholder={tags.length === 0 ? 'Type a tag and press Enter…' : ''}
          className="border-0 shadow-none p-0 h-6 min-w-[120px] flex-1 focus-visible:ring-0 text-xs"
        />
      </div>

      <p className="text-[11px] text-muted-foreground">
        Press <kbd className="px-1 py-0.5 rounded border text-[10px]">Enter</kbd>,{' '}
        <kbd className="px-1 py-0.5 rounded border text-[10px]">comma</kbd> or{' '}
        <kbd className="px-1 py-0.5 rounded border text-[10px]">space</kbd> to add a tag.
      </p>

      {/* Auto-generated suggestions */}
      {suggestions.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-amber-500" />
            Suggested from title &amp; description — click to add:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map(s => (
              <button
                key={s}
                type="button"
                onClick={() => addTag(s)}
                className="text-[11px] px-2 py-0.5 rounded-full border border-dashed border-amber-400 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
              >
                #{s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
