/**
 * Hashtag utilities for BitPopArt content.
 *
 * - extractHashtagsFromText: finds existing #hashtags in a string
 * - generateHashtagsFromText: generates hashtags from plain title / description text
 * - mergeHashtags: combines manual + auto-generated hashtags, deduplicates, normalises
 */

/** Normalise a raw word / tag to a clean lowercase hashtag (no # prefix). */
export function normaliseTag(raw: string): string {
  return raw
    .replace(/^#+/, '')           // strip leading #
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');   // keep only alphanumeric chars
}

/** Extract explicit #hashtags already typed by the user inside a text blob. */
export function extractHashtagsFromText(text: string): string[] {
  const matches = text.match(/#([a-zA-Z0-9]+)/g) ?? [];
  return [...new Set(matches.map(m => normaliseTag(m)))].filter(Boolean);
}

/**
 * Generate hashtag suggestions from plain title / description text.
 *
 * Strategy:
 *   1. Collect any explicit #hashtags already in the text.
 *   2. Split remaining words, keep those ≥ 3 chars, skip stopwords.
 *   3. Return a unique, lowercase list (no # prefix).
 */
const STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'that', 'this', 'from', 'are', 'was',
  'has', 'have', 'not', 'but', 'you', 'your', 'our', 'its', 'all',
  'new', 'more', 'also', 'very', 'can', 'will', 'just', 'into',
  'than', 'then', 'when', 'what', 'who', 'how', 'they', 'them',
  'their', 'out', 'one', 'two', 'three', 'been', 'each', 'some',
  'via', 'pop', 'art', 'free', 'by',
]);

export function generateHashtagsFromText(title: string, description: string): string[] {
  const combined = `${title} ${description}`;

  // 1. Explicit hashtags already present
  const explicit = extractHashtagsFromText(combined);

  // 2. Word-based suggestions from title (prioritised)
  const titleWords = title
    .replace(/#[a-zA-Z0-9]+/g, '')   // remove already-handled hashtags
    .split(/[\s\-_/\\|,.:;!?()[\]{}'"]+/)
    .map(w => w.toLowerCase().replace(/[^a-z0-9]/g, ''))
    .filter(w => w.length >= 3 && !STOPWORDS.has(w));

  // 3. Word-based suggestions from description
  const descWords = description
    .replace(/#[a-zA-Z0-9]+/g, '')
    .split(/[\s\-_/\\|,.:;!?()[\]{}'"]+/)
    .map(w => w.toLowerCase().replace(/[^a-z0-9]/g, ''))
    .filter(w => w.length >= 3 && !STOPWORDS.has(w));

  // Combine, deduplicate, limit to 20
  const all = [...new Set([...explicit, ...titleWords, ...descWords])].filter(Boolean);
  return all.slice(0, 20);
}

/**
 * Parse a comma/space-separated string of hashtags typed by the user
 * into a clean, deduplicated array (no # prefix).
 */
export function parseUserTags(input: string): string[] {
  return [
    ...new Set(
      input
        .split(/[\s,]+/)
        .map(t => normaliseTag(t))
        .filter(t => t.length > 0),
    ),
  ];
}

/**
 * Merge manual user tags with auto-generated suggestions.
 * Always keeps manual tags; fills up to `maxTotal` with suggestions.
 */
export function mergeHashtags(
  manualTags: string[],
  suggestedTags: string[],
  maxTotal = 30,
): string[] {
  const manual = manualTags.map(normaliseTag).filter(Boolean);
  const manualSet = new Set(manual);
  const extras = suggestedTags
    .map(normaliseTag)
    .filter(t => t.length > 0 && !manualSet.has(t));
  return [...new Set([...manual, ...extras])].slice(0, maxTotal);
}
