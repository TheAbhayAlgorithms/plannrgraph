import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useToastStore, showToast } from './useToastStore';
import { NAV_ITEMS } from '../components/layout/navConfig';

describe('Toast Store', () => {
  beforeEach(() => {
    useToastStore.getState().clearToasts();
    vi.useRealTimers();
  });

  it('adds a toast message to the queue', () => {
    const id = showToast({
      type: 'success',
      title: 'Test Notification',
      message: 'This is a test notification',
    });

    const toasts = useToastStore.getState().toasts;
    expect(toasts.length).toBe(1);
    expect(toasts[0].id).toBe(id);
    expect(toasts[0].title).toBe('Test Notification');
    expect(toasts[0].type).toBe('success');
  });

  it('removes a specific toast by id', () => {
    const id1 = showToast({ type: 'info', title: 'Toast 1' });
    const id2 = showToast({ type: 'warning', title: 'Toast 2' });

    expect(useToastStore.getState().toasts.length).toBe(2);

    useToastStore.getState().removeToast(id1);
    const toasts = useToastStore.getState().toasts;
    expect(toasts.length).toBe(1);
    expect(toasts[0].id).toBe(id2);
  });

  it('clears all toasts', () => {
    showToast({ type: 'info', title: '1' });
    showToast({ type: 'info', title: '2' });
    showToast({ type: 'info', title: '3' });

    expect(useToastStore.getState().toasts.length).toBe(3);
    useToastStore.getState().clearToasts();
    expect(useToastStore.getState().toasts.length).toBe(0);
  });

  it('auto-dismisses toasts after duration', () => {
    vi.useFakeTimers();
    showToast({ type: 'error', title: 'Auto-dismiss', duration: 1000 });

    expect(useToastStore.getState().toasts.length).toBe(1);
    vi.advanceTimersByTime(1100);
    expect(useToastStore.getState().toasts.length).toBe(0);
  });
});

describe('Navigation Items Configuration', () => {
  it('contains unique paths for all routes', () => {
    const paths = NAV_ITEMS.map((item) => item.path);
    const uniquePaths = new Set(paths);
    expect(paths.length).toBe(uniquePaths.size);
  });

  it('includes all required core application routes', () => {
    const paths = NAV_ITEMS.map((item) => item.path);
    expect(paths).toContain('/');
    expect(paths).toContain('/routine');
    expect(paths).toContain('/tasks');
    expect(paths).toContain('/subjects');
    expect(paths).toContain('/study-plan');
    expect(paths).toContain('/projects');
    expect(paths).toContain('/research');
    expect(paths).toContain('/dashboard');
    expect(paths).toContain('/settings');
  });
});
