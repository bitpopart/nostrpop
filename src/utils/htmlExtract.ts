// Small, dependency-free HTML string extractors used by the product importers.
//
// The importers previously parsed page HTML with `new DOMParser()`. DOMParser
// is a global that jsdom happens to expose in the vitest environment, but it is
// NOT a real browser global, so the tests passed while the live shop threw
// `ReferenceError: DOMParser is not defined` on any import that had to actually
// parse the fetched page (any non-Shopify store - e.g. Printify and Redbubble).
// The fields these importers read are few and stable, so we extract them
// straight from the raw markup instead of depending on a DOM API.

interface MetaAttributes {
  [name: string]: string | undefined;
}

export function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

// Read every attribute of one <meta> tag into a map of name -> decoded value.
function metaAttributes(tag: string): MetaAttributes {
  const attrs: MetaAttributes = {};
  const re = /([a-zA-Z_:][-\w:]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(tag)) !== null) {
    const value = m[2] ?? m[3] ?? m[4] ?? '';
    attrs[m[1].toLowerCase()] = decodeHtmlEntities(value);
  }
  return attrs;
}

// Returns the content of the first <meta> whose property OR name equals `key`
// (attribute order-insensitive), or null when no such tag exists.
export function getMetaContent(html: string, key: string): string | null {
  const target = key.toLowerCase();
  const metaRe = /<meta\b[^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = metaRe.exec(html)) !== null) {
    const attrs = metaAttributes(m[0]);
    const kind = attrs.property ?? attrs.name;
    if (kind?.toLowerCase() === target) {
      return attrs.content ?? null;
    }
  }
  return null;
}

export function getTitleText(html: string): string {
  const m = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return m ? decodeHtmlEntities(m[1]).trim() : '';
}

// Returns the trimmed text of the first element carrying
// data-testid="<id>" (e.g. Printify's variantPrice span), or null.
export function getDataTestIdText(html: string, id: string): string | null {
  const escapedId = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`data-testid\\s*=\\s*["']${escapedId}["'][^>]*>([^<]*)`);
  const m = html.match(re);
  return m ? decodeHtmlEntities(m[1]).trim() : null;
}
