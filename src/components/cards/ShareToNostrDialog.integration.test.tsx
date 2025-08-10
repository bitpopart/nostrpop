import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TestApp } from '@/test/TestApp';
import { ShareToNostrDialog } from './ShareToNostrDialog';
import type { NostrEvent } from '@nostrify/nostrify';

// Mock the hooks
const mockCreateEvent = vi.fn();
vi.mock('@/hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({
    user: {
      pubkey: 'b'.repeat(64),
      signer: {}
    }
  })
}));

vi.mock('@/hooks/useNostrPublish', () => ({
  useNostrPublish: () => ({
    mutate: mockCreateEvent,
    isPending: false
  })
}));

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

describe('ShareToNostrDialog Integration', () => {
  const mockCardEvent: NostrEvent = {
    id: 'a'.repeat(64),
    pubkey: 'b'.repeat(64),
    created_at: 1234567890,
    kind: 30402,
    tags: [
      ['d', 'test-card-id']
    ],
    content: '{}',
    sig: 'c'.repeat(128)
  };

  const mockCardData = {
    title: 'Test Card',
    description: 'A test card description',
    category: 'Birthday',
    pricing: 'free',
    images: ['https://example.com/image1.jpg'],
    created_at: '2025-01-01T00:00:00.000Z'
  };

  beforeEach(() => {
    mockCreateEvent.mockClear();
  });

  it('creates correct Nostr event when posting', async () => {
    render(
      <TestApp>
        <ShareToNostrDialog cardEvent={mockCardEvent} cardData={mockCardData}>
          <button>Share</button>
        </ShareToNostrDialog>
      </TestApp>
    );

    // Open dialog
    fireEvent.click(screen.getByText('Share'));

    // Wait for dialog to open and click Post to Nostr
    await waitFor(() => {
      expect(screen.getByText('Post to Nostr')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Post to Nostr'));

    // Verify the event was created with correct structure
    expect(mockCreateEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 1,
        content: expect.stringContaining('Test Card'),
        tags: expect.arrayContaining([
          ['t', 'ecard'],
          ['t', 'birthday'],
          ['e', mockCardEvent.id, '', 'mention'],
          expect.arrayContaining(['imeta', expect.stringContaining('url https://example.com/image1.jpg')])
        ])
      }),
      expect.any(Object)
    );

    // Verify content includes card title, URL, image URL, and hashtags in correct order
    const callArgs = mockCreateEvent.mock.calls[0][0];
    expect(callArgs.content).toContain('Test Card');
    expect(callArgs.content).toContain('/card/');
    expect(callArgs.content).toContain('https://example.com/image1.jpg');
    expect(callArgs.content).toContain('#ecard');
    expect(callArgs.content).toContain('#birthday');

    // Verify correct order: title, then card URL, then image URL, then hashtags
    const titleIndex = callArgs.content.indexOf('Test Card');
    const cardUrlIndex = callArgs.content.indexOf('/card/');
    const imageUrlIndex = callArgs.content.indexOf('https://example.com/image1.jpg');
    const hashtagIndex = callArgs.content.indexOf('#ecard');

    expect(titleIndex).toBeLessThan(cardUrlIndex);
    expect(cardUrlIndex).toBeLessThan(imageUrlIndex);
    expect(imageUrlIndex).toBeLessThan(hashtagIndex);
  });

  it('includes multiple tag approaches for maximum compatibility', async () => {
    render(
      <TestApp>
        <ShareToNostrDialog cardEvent={mockCardEvent} cardData={mockCardData}>
          <button>Share</button>
        </ShareToNostrDialog>
      </TestApp>
    );

    fireEvent.click(screen.getByText('Share'));

    await waitFor(() => {
      expect(screen.getByText('Post to Nostr')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Post to Nostr'));

    const callArgs = mockCreateEvent.mock.calls[0][0];

    // Check for image tag (simple approach)
    const imageTag = callArgs.tags.find((tag: string[]) => tag[0] === 'image');
    expect(imageTag).toBeDefined();
    expect(imageTag[1]).toBe('https://example.com/image1.jpg');

    // Check for imeta tag (NIP-92)
    const imetaTag = callArgs.tags.find((tag: string[]) => tag[0] === 'imeta');
    expect(imetaTag).toBeDefined();
    expect(imetaTag[1]).toContain('url https://example.com/image1.jpg');
    expect(imetaTag[2]).toContain('m image/jpeg');

    // Check for r tag (reference)
    const rTag = callArgs.tags.find((tag: string[]) => tag[0] === 'r');
    expect(rTag).toBeDefined();
    expect(rTag[1]).toBe('https://example.com/image1.jpg');

    // Check for url tag
    const urlTag = callArgs.tags.find((tag: string[]) => tag[0] === 'url');
    expect(urlTag).toBeDefined();
    expect(urlTag[1]).toBe('https://example.com/image1.jpg');
  });
});