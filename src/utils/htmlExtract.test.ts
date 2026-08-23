import { describe, it, expect } from 'vitest';
import { getMetaContent, getTitleText, getDataTestIdText, decodeHtmlEntities } from './htmlExtract';

describe('htmlExtract', () => {
  // Property-first meta (as the real Printify storefront renders it), with an
  // encoded &amp; in the image URL - jsdom's getAttribute decodes these and the
  // importers must do the same or the image URL is corrupted.
  const real = `<!doctype html><html><head>
<meta property="og:title" content="Colorful Chinese Dragon Tee | Mythical Asian Dragon T-Shirt"/>
<meta property="og:description" content="A lightweight, breathable tee featuring a bold, colorful dragon motif."/>
<meta property="og:image" content="https://images-api.printify.com/mockup/x/tee.jpg?camera_label=front-2&amp;revision=1787479710297"/>
</head><body><div><span class="text-2xl font-bold" data-testid="variantPrice">$24.99</span></div></body></html>`;

  it('reads content from a property meta tag', () => {
    expect(getMetaContent(real, 'og:title')).toBe('Colorful Chinese Dragon Tee | Mythical Asian Dragon T-Shirt');
  });

  it('is insensitive to attribute order (name before content, content before property)', () => {
    const html = '<meta content="fallback desc" name="description" />';
    expect(getMetaContent(html, 'description')).toBe('fallback desc');
  });

  it('decodes HTML entities in meta content (og:image &amp;)', () => {
    expect(getMetaContent(real, 'og:image')).toBe(
      'https://images-api.printify.com/mockup/x/tee.jpg?camera_label=front-2&revision=1787479710297'
    );
  });

  it('extracts the <title> element text', () => {
    expect(getTitleText('<html><head><title>Colorful Chinese Dragon Tee | BitPopArt</title>')).toBe(
      'Colorful Chinese Dragon Tee | BitPopArt'
    );
  });

  it('extracts data-testid element text (variantPrice)', () => {
    expect(getDataTestIdText(real, 'variantPrice')).toBe('$24.99');
  });

  it('returns null when the data-testid element is absent', () => {
    expect(getDataTestIdText('<html><body>no price</body></html>', 'variantPrice')).toBeNull();
  });
});

describe('decodeHtmlEntities', () => {
  it('decodes the common HTML entities', () => {
    expect(decodeHtmlEntities('A&amp;B &lt;x&gt; &quot;y&quot; &#39;z&#39;')).toBe('A&B <x> "y" \'z\'');
  });

  it('turns &nbsp; into a plain space', () => {
    expect(decodeHtmlEntities('a&nbsp;b')).toBe('a b');
  });
});
