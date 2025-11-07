/**
 * Vitest Setup File
 *
 * Mocks React Native dependencies that don't work in Node test environment.
 */

import { vi } from 'vitest';

// Mock @react-native-community/netinfo
vi.mock('@react-native-community/netinfo', () => {
  const mockNetState = {
    isConnected: true,
    isInternetReachable: true,
    type: 'wifi',
    details: null,
  };

  return {
    default: {
      fetch: vi.fn(() => Promise.resolve(mockNetState)),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    },
  };
});

// Mock @nozbe/watermelondb Query helper
vi.mock('@nozbe/watermelondb', async () => {
  const actual = await vi.importActual('@nozbe/watermelondb');
  return {
    ...actual as Record<string, unknown>,
    Q: {
      where: vi.fn((...args: unknown[]) => ({ type: 'where', args })),
      sortBy: vi.fn((...args: unknown[]) => ({ type: 'sortBy', args })),
      desc: 'desc',
      asc: 'asc',
      lt: vi.fn((value: unknown) => ({ type: 'lt', value })),
    },
  };
});
