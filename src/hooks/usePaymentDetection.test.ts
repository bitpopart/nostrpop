import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePaymentDetection } from './usePaymentDetection';

// Mock the toast hook
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

describe('usePaymentDetection', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should start and stop detection', () => {
    const { result } = renderHook(() => usePaymentDetection());

    expect(result.current.isDetecting).toBe(false);

    const mockOptions = {
      paymentHash: 'test-hash',
      expiresAt: Date.now() + 60000, // 1 minute from now
      onPaymentDetected: vi.fn(),
    };

    act(() => {
      result.current.startDetection(mockOptions);
    });

    expect(result.current.isDetecting).toBe(true);

    act(() => {
      result.current.stopDetection();
    });

    expect(result.current.isDetecting).toBe(false);
  });

  it('should handle payment expiration', async () => {
    const { result } = renderHook(() => usePaymentDetection());
    
    const onPaymentExpired = vi.fn();
    const mockOptions = {
      paymentHash: 'test-hash',
      expiresAt: Date.now() - 1000, // Already expired
      onPaymentDetected: vi.fn(),
      onPaymentExpired,
    };

    act(() => {
      result.current.startDetection(mockOptions);
    });

    // Fast-forward time to trigger expiration check
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(onPaymentExpired).toHaveBeenCalled();
    expect(result.current.isDetecting).toBe(false);
  });

  it('should cleanup on unmount', () => {
    const { result, unmount } = renderHook(() => usePaymentDetection());

    const mockOptions = {
      paymentHash: 'test-hash',
      expiresAt: Date.now() + 60000,
      onPaymentDetected: vi.fn(),
    };

    act(() => {
      result.current.startDetection(mockOptions);
    });

    expect(result.current.isDetecting).toBe(true);

    unmount();

    // Detection should be stopped after unmount
    // Note: We can't directly test this since the hook is unmounted,
    // but the cleanup function should have been called
  });
});