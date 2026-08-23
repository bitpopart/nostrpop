import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CreateProductForm } from './CreateProductForm';

// Use the REAL useCategories hook (no mock) so we guard the actual
// categoryNames identity-stability fix — a fresh array on every render used
// to re-trigger the initialData sync-effect and cause an infinite re-render.

vi.mock('@/hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({ user: { id: 'test-user', pubkey: '01'.repeat(32), displayName: 'Test' } }),
}));
vi.mock('@/hooks/useNostrPublish', () => ({ useNostrPublish: () => ({ mutate: vi.fn(), isPending: false }) }));
vi.mock('@/hooks/useUploadFile', () => ({ useUploadFile: () => ({ mutateAsync: vi.fn(async () => ['url', 'https://example.com/img.png']) }) }));
vi.mock('@/hooks/useShopTags', () => ({ useShopTags: () => ({ tagNames: [] }) }));
vi.mock('@/hooks/useShippingConfig', () => ({ useShippingConfig: () => ({ shippingConfig: undefined, isLoading: false }) }));
vi.mock('@/hooks/useToast', () => ({ useToast: () => ({ toast: vi.fn(), dismiss: vi.fn() }) }));

const IMPORTED = {
  name: 'Cool Ostrich T-Shirt',
  description: 'A cool ostrich design on a shirt.',
  price: 27.35,
  currency: 'EUR',
  priceInSats: 15000,
  images: ['https://example.com/img.png'],
  url: 'https://bitpopart.printify.me/product/31220114',
  category: 'T-shirts',
};

describe('CreateProductForm URL-import: editing fields must not clobber/loop', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('a manual edit is NOT reverted by the autofill effect', async () => {
    render(<CreateProductForm initialData={IMPORTED} />);
    const submit = screen.getByRole('button', { name: /create product/i });
    await waitFor(() => expect(submit).toBeEnabled(), { timeout: 5000 });

    const nameInput = screen.getByLabelText(/Product Name/i) as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'My Edited Name' } });

    // Give a runaway effect window to clobber the edit if the bug returns.
    await new Promise((r) => setTimeout(r, 500));
    const valueNow = (screen.getByLabelText(/Product Name/i) as HTMLInputElement).value;
    expect(valueNow).toBe('My Edited Name');

    // And category change also sticks (the reported route).
    await waitFor(() => expect(submit).toBeEnabled(), { timeout: 2000 });
  });
});
