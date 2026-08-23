import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CreateProductForm } from './CreateProductForm';

vi.mock('@/hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({ user: { id: 'test-user', pubkey: '01'.repeat(32), displayName: 'Test' } }),
}));
const publishMock = {
  mutate: vi.fn(),
  isPending: false,
};
vi.mock('@/hooks/useNostrPublish', () => ({
  useNostrPublish: () => publishMock,
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
  url: 'https://bitpopart.printify.me/product/31220114',
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


describe('CreateProductForm URL-import: on-demand print is unlimited stock', () => {
  it('leaves quantity empty (unlimited) and publishes NO stock tag', async () => {
    render(<CreateProductForm initialData={IMPORTED} />);
    const submit = screen.getByRole('button', { name: /create product/i });
    await waitFor(() => expect(submit).toBeEnabled(), { timeout: 5000 });

    // Quantity field should be empty = unlimited, not defaulted to 1
    const qtyInput = screen.getByLabelText(/Quantity Available/i) as HTMLInputElement;
    expect(qtyInput.value).toBe('');

    // Submitting must not emit a "stock" tag (unlimited on demand print)
    fireEvent.click(submit);
    await waitFor(() => expect(publishMock.mutate).toHaveBeenCalled(), { timeout: 5000 });
    const { tags } = publishMock.mutate.mock.calls[0][0];
    expect(tags.some((tag: string[]) => (tag[0] ?? '') === 'stock')).toBe(false);
  });

  it('leaves quantity empty even when the user clears it back to empty', async () => {
    render(<CreateProductForm initialData={IMPORTED} />);
    const submit = screen.getByRole('button', { name: /create product/i });
    await waitFor(() => expect(submit).toBeEnabled(), { timeout: 5000 });

    const qtyInput = screen.getByLabelText(/Quantity Available/i) as HTMLInputElement;
    fireEvent.change(qtyInput, { target: { value: '7' } });
    await waitFor(() => expect((screen.getByLabelText(/Quantity Available/i) as HTMLInputElement).value).toBe('7'), { timeout: 2000 });
    fireEvent.change(qtyInput, { target: { value: '' } });
    await waitFor(() => expect((screen.getByLabelText(/Quantity Available/i) as HTMLInputElement).value).toBe(''), { timeout: 2000 });
  });
});

describe('CreateProductForm visibility guard: URL-imported products are NOT published as on-sale', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('publishes a hidden (unlisted) visibility tag after a URL import, not on-sale', async () => {
    render(<CreateProductForm initialData={IMPORTED} />);
    const submit = screen.getByRole('button', { name: /create product/i });
    await waitFor(() => expect(submit).toBeEnabled(), { timeout: 5000 });

    fireEvent.click(submit);
    await waitFor(() => expect(publishMock.mutate).toHaveBeenCalled(), { timeout: 5000 });
    const { tags } = publishMock.mutate.mock.calls[0][0];
    const visibility = tags.find((tag: string[]) => tag[0] === 'visibility');
    expect(visibility).toBeDefined();
    expect(visibility![1]).toBe('hidden');
  });

  it('still keeps the product in the shop (does not default quantity to a finite count)', async () => {
    render(<CreateProductForm initialData={IMPORTED} />);
    const qtyInput = screen.getByLabelText(/Quantity Available/i) as HTMLInputElement;
    expect(qtyInput.value).toBe('');
  });
});

describe('CreateProductForm manual creation still defaults to on-sale visibility', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('publishes visibility on-sale when NO import data is present (manual create)', async () => {
    render(<CreateProductForm />);
    const submit = screen.getByRole('button', { name: /create product/i });

    // Fill required fields by hand (no import data present)
    fireEvent.change(screen.getByLabelText(/Product Name/i), { target: { value: 'Handmade Neon Mug' } });
    fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: 'A one-of-a-kind handmade mug, laser-glazed.' } });
    fireEvent.change(screen.getByLabelText(/Price/i), { target: { value: '42' } });

    await waitFor(() => expect(submit).toBeEnabled(), { timeout: 5000 });
    fireEvent.click(submit);
    await waitFor(() => expect(publishMock.mutate).toHaveBeenCalled(), { timeout: 5000 });
    const { tags } = publishMock.mutate.mock.calls[0][0];
    const visibility = tags.find((tag: string[]) => tag[0] === 'visibility');
    expect(visibility).toBeDefined();
    expect(visibility![1]).toBe('on-sale');
  });
});
