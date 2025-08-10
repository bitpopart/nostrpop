import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TestApp } from '@/test/TestApp';
import { ShareToNostrDialog } from './ShareToNostrDialog';
import type { NostrEvent } from '@nostrify/nostrify';

// Mock the hooks
vi.mock('@/hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({
    user: {
      pubkey: 'test-pubkey',
      signer: {}
    }
  })
}));

vi.mock('@/hooks/useNostrPublish', () => ({
  useNostrPublish: () => ({
    mutate: vi.fn(),
    isPending: false
  })
}));

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

describe('ShareToNostrDialog', () => {
  const mockCardEvent: NostrEvent = {
    id: 'a'.repeat(64), // Valid 64-character hex string
    pubkey: 'b'.repeat(64), // Valid 64-character hex string
    created_at: 1234567890,
    kind: 30402,
    tags: [
      ['d', 'test-card-id']
    ],
    content: '{}',
    sig: 'c'.repeat(128) // Valid 128-character hex string
  };

  const mockCardData = {
    title: 'Test Card',
    description: 'A test card description',
    category: 'Birthday',
    pricing: 'free',
    images: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
    created_at: '2025-01-01T00:00:00.000Z'
  };

  it('renders the share dialog trigger', () => {
    render(
      <TestApp>
        <ShareToNostrDialog cardEvent={mockCardEvent} cardData={mockCardData}>
          <button>Share</button>
        </ShareToNostrDialog>
      </TestApp>
    );

    expect(screen.getByText('Share')).toBeInTheDocument();
  });

  it('opens dialog when trigger is clicked', async () => {
    render(
      <TestApp>
        <ShareToNostrDialog cardEvent={mockCardEvent} cardData={mockCardData}>
          <button>Share</button>
        </ShareToNostrDialog>
      </TestApp>
    );

    fireEvent.click(screen.getByText('Share'));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('displays card information in dialog', async () => {
    render(
      <TestApp>
        <ShareToNostrDialog cardEvent={mockCardEvent} cardData={mockCardData}>
          <button>Share</button>
        </ShareToNostrDialog>
      </TestApp>
    );

    fireEvent.click(screen.getByText('Share'));

    await waitFor(() => {
      expect(screen.getByText('Preview and share "Test Card" with the Nostr community.')).toBeInTheDocument();
    });
  });

  it('includes shareable link input', async () => {
    render(
      <TestApp>
        <ShareToNostrDialog cardEvent={mockCardEvent} cardData={mockCardData}>
          <button>Share</button>
        </ShareToNostrDialog>
      </TestApp>
    );

    fireEvent.click(screen.getByText('Share'));

    await waitFor(() => {
      expect(screen.getByText('Shareable Link')).toBeInTheDocument();
    });
  });
});