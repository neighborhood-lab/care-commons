/**
 * Vitest setup file for mobile package
 * Mocks React Native dependencies for testing
 */

import { vi } from 'vitest';

// Mock @react-native-community/netinfo
vi.mock('@react-native-community/netinfo', () => ({
  default: {
    fetch: vi.fn().mockResolvedValue({
      isConnected: true,
      isInternetReachable: true,
    }),
    addEventListener: vi.fn(() => () => {}),
  },
}));

// Mock @nozbe/watermelondb/Query
vi.mock('@nozbe/watermelondb', () => ({
  Q: {
    where: vi.fn((...args) => ({ type: 'where', args })),
    sortBy: vi.fn((field, order) => ({ type: 'sortBy', field, order })),
    desc: 'desc',
    asc: 'asc',
    lt: vi.fn((value) => ({ type: 'lt', value })),
  },
}));

// Mock global fetch
global.fetch = vi.fn();
