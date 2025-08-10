import { describe, it, expect } from 'vitest';
import { extractImagesFromContent, getFirstImage, stripImagesFromContent } from './extractImages';

describe('extractImages', () => {
  describe('extractImagesFromContent', () => {
    it('should extract direct image URLs', () => {
      const content = 'Check out this image: https://example.com/image.jpg and this one https://test.com/photo.png';
      const images = extractImagesFromContent(content);

      expect(images).toHaveLength(2);
      expect(images[0]).toEqual({
        url: 'https://example.com/image.jpg',
        source: 'url'
      });
      expect(images[1]).toEqual({
        url: 'https://test.com/photo.png',
        source: 'url'
      });
    });

    it('should extract markdown images', () => {
      const content = 'Here is an image: ![Alt text](https://example.com/image.jpg) and another ![](https://test.com/photo.png)';
      const images = extractImagesFromContent(content);

      expect(images).toHaveLength(2);
      expect(images[0]).toEqual({
        url: 'https://example.com/image.jpg',
        alt: 'Alt text',
        source: 'markdown'
      });
      expect(images[1]).toEqual({
        url: 'https://test.com/photo.png',
        source: 'markdown'
      });
    });

    it('should extract imeta tags', () => {
      const content = 'Some text content';
      const tags: string[][] = [
        ['imeta', 'url https://example.com/image.jpg', 'alt Beautiful sunset'],
        ['imeta', 'url https://test.com/photo.png'],
        ['p', 'somepubkey']
      ];

      const images = extractImagesFromContent(content, tags);

      expect(images).toHaveLength(2);
      expect(images[0]).toEqual({
        url: 'https://example.com/image.jpg',
        alt: 'Beautiful sunset',
        source: 'imeta'
      });
      expect(images[1]).toEqual({
        url: 'https://test.com/photo.png',
        source: 'imeta'
      });
    });

    it('should handle Nostr image hosting domains without extensions', () => {
      const content = 'Image from nostr.build: https://nostr.build/i/abc123 and from void.cat: https://void.cat/d/xyz789';
      const images = extractImagesFromContent(content);

      expect(images).toHaveLength(2);
      expect(images[0].url).toBe('https://nostr.build/i/abc123');
      expect(images[1].url).toBe('https://void.cat/d/xyz789');
    });

    it('should deduplicate identical URLs', () => {
      const content = 'Same image twice: https://example.com/image.jpg and https://example.com/image.jpg';
      const images = extractImagesFromContent(content);

      expect(images).toHaveLength(1);
      expect(images[0].url).toBe('https://example.com/image.jpg');
    });

    it('should ignore non-image URLs', () => {
      const content = 'Visit https://example.com and download https://test.com/file.pdf';
      const images = extractImagesFromContent(content);

      expect(images).toHaveLength(0);
    });
  });

  describe('getFirstImage', () => {
    it('should prioritize imeta tags over other sources', () => {
      const content = 'Markdown image: ![Alt](https://example.com/markdown.jpg) and direct URL: https://example.com/direct.png';
      const tags: string[][] = [
        ['imeta', 'url https://example.com/imeta.jpg', 'alt From imeta']
      ];

      const firstImage = getFirstImage(content, tags);

      expect(firstImage).toEqual({
        url: 'https://example.com/imeta.jpg',
        alt: 'From imeta',
        source: 'imeta'
      });
    });

    it('should return markdown image if no imeta tags', () => {
      const content = 'Markdown image: ![Alt](https://example.com/markdown.jpg) and direct URL: https://example.com/direct.png';

      const firstImage = getFirstImage(content);

      expect(firstImage).toEqual({
        url: 'https://example.com/markdown.jpg',
        alt: 'Alt',
        source: 'markdown'
      });
    });

    it('should return null if no images found', () => {
      const content = 'Just some text with no images';

      const firstImage = getFirstImage(content);

      expect(firstImage).toBeNull();
    });
  });

  describe('stripImagesFromContent', () => {
    it('should remove markdown images', () => {
      const content = 'Text before ![Alt text](https://example.com/image.jpg) text after';
      const stripped = stripImagesFromContent(content);

      expect(stripped).toBe('Text before text after');
    });

    it('should remove direct image URLs', () => {
      const content = 'Text before https://example.com/image.jpg text after';
      const stripped = stripImagesFromContent(content);

      expect(stripped).toBe('Text before text after');
    });

    it('should preserve non-image URLs', () => {
      const content = 'Visit https://example.com for more info';
      const stripped = stripImagesFromContent(content);

      expect(stripped).toBe('Visit https://example.com for more info');
    });

    it('should clean up extra whitespace', () => {
      const content = 'Text   before    ![Alt](https://example.com/image.jpg)   text    after';
      const stripped = stripImagesFromContent(content);

      expect(stripped).toBe('Text before text after');
    });

    it('should handle mixed content', () => {
      const content = 'Check this out: ![Cool image](https://example.com/cool.jpg) and also https://test.com/photo.png but visit https://example.com too!';
      const stripped = stripImagesFromContent(content);

      expect(stripped).toBe('Check this out: and also but visit https://example.com too!');
    });
  });
});