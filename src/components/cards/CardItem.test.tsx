import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TestApp } from '@/test/TestApp';
import { CardItem } from './CardItem';
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

vi.mock('@/hooks/useAuthor', () => ({
  useAuthor: () => ({
    data: {
      metadata: {
        name: 'Test Author',
        picture: 'https://example.com/avatar.jpg'
      }
    }
  })
}));

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

// Mock react-router-dom
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal() as Record<string, unknown>;
  return {
    ...actual,
    useNavigate: () => vi.fn()
  };
});

describe('CardItem', () => {
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

  const mockCard = {
    id: 'test-card-id',
    event: mockCardEvent,
    title: 'Test Card',
    description: 'A test card description',
    category: 'Birthday',
    pricing: 'free',
    images: ['https://example.com/image1.jpg'],
    created_at: '2025-01-01T00:00:00.000Z'
  };

  it('renders card with basic information', () => {
    render(
      <TestApp>
        <CardItem card={mockCard} />
      </TestApp>
    );

    expect(screen.getByText('Test Card')).toBeInTheDocument();
    expect(screen.getByText('A test card description')).toBeInTheDocument();
    expect(screen.getByText('Birthday')).toBeInTheDocument();
  });

  it('shows download button', () => {
    render(
      <TestApp>
        <CardItem card={mockCard} />
      </TestApp>
    );

    // Find download button by its icon (since it doesn't have accessible text)
    const buttons = screen.getAllByRole('button');
    const downloadButton = buttons.find(button =>
      button.querySelector('svg') &&
      button.getAttribute('class')?.includes('outline')
    );

    expect(downloadButton).toBeInTheDocument();
    expect(downloadButton).not.toBeDisabled();
  });

  it('can trigger download functionality', async () => {
    // Mock fetch to simulate download
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(new Blob(['test'], { type: 'image/jpeg' })),
      headers: new Map([['content-type', 'image/jpeg']])
    });

    // Mock URL.createObjectURL
    global.URL.createObjectURL = vi.fn().mockReturnValue('blob:test-url');
    global.URL.revokeObjectURL = vi.fn();

    render(
      <TestApp>
        <CardItem card={mockCard} />
      </TestApp>
    );

    // Find download button by looking for buttons with specific styling
    const buttons = screen.getAllByRole('button');
    const downloadButton = buttons.find(button =>
      button.querySelector('svg') &&
      button.getAttribute('class')?.includes('outline')
    );

    expect(downloadButton).toBeInTheDocument();

    if (downloadButton) {
      // Just verify the button can be clicked without errors
      expect(() => fireEvent.click(downloadButton)).not.toThrow();
    }
  });

  it('handles cards without images', () => {
    const cardWithoutImages = {
      ...mockCard,
      images: []
    };

    render(
      <TestApp>
        <CardItem card={cardWithoutImages} />
      </TestApp>
    );

    // Find download button by looking for buttons with specific styling
    const buttons = screen.getAllByRole('button');
    const downloadButton = buttons.find(button =>
      button.querySelector('svg') &&
      button.getAttribute('class')?.includes('outline')
    );

    expect(downloadButton).toBeInTheDocument();
  });

  it('shows author information when showAuthor is true', () => {
    render(
      <TestApp>
        <CardItem card={mockCard} showAuthor={true} />
      </TestApp>
    );

    expect(screen.getByText('Test Author')).toBeInTheDocument();
  });
});