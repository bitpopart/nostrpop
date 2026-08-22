import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CreateProductForm } from './CreateProductForm';

vi.mock('@/hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({ user: { id: 'test-user', pubkey: '01'.repeat(32), displayName: 'Test' } }),
}));
vi.mock('@/hooks/useNostrPublish', () => ({
  useNostrPublish: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock('@/hooks/useUploadFile', () => ({
  useUploadFile: () => ({ mutateAsync: vi.fn(async () => ['url', 'https://example.com/img.png']) }),
}));
const CATEGORY_NAMES = ['T-shirts', 'Art', 'Stickers'];
vi.mock('@/hooks/useCategories', () => ({
  useCategories: () => ({ categoryNames: CATEGORY_NAMES }),
}));
vi.mock('@/hooks/useShopTags', () => ({
  useShopTags: () => ({ tagNames: [] }),
}));
vi.mock('@/hooks/useShippingConfig', () => ({
  useShippingConfig: () => ({ shippingConfig: undefined, isLoading: false }),
}));

const IMPORTED = {
  name: 'Cool Ostrich T-Shirt',
  description: 'A cool ostrich design on a shirt.',
  price: 27.35,
  currency: 'EUR',
  priceInSats: 15000,
  images: ['https://example.com/img.png'],
  url: 'https://www.storeofvalue.eu/products/cool-ostrich-t-shirt',
  category: 'T-shirts',
};

describe('CreateProductForm URL-import flow (discount empty must not block)', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('submit is enabled with NO discount error when discount is left empty after URL import', async () => {
    render(<CreateProductForm initialData={IMPORTED} />);

    const submit = screen.getByRole('button', { name: /create product/i });
    await waitFor(() => expect(submit).toBeEnabled(), { timeout: 5000 });

    expect(screen.queryByText(/received nan/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Discount cannot be negative/i)).not.toBeInTheDocument();
  });

  it('setting discount to 0 keeps the form submittable', async () => {
    render(<CreateProductForm initialData={IMPORTED} />);

    const submit = screen.getByRole('button', { name: /create product/i });
    await waitFor(() => expect(submit).toBeEnabled(), { timeout: 5000 });

    const discountInput = screen.getByLabelText(/Discount Percentage/i);
    fireEvent.change(discountInput, { target: { value: '0' } });
    await waitFor(() => expect(submit).toBeEnabled(), { timeout: 500 });
    expect(screen.queryByText(/received nan/i)).not.toBeInTheDocument();
  });
});
