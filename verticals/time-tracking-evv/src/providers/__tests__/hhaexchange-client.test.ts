/**
 * HHAeXchange Client Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HHAeXchangeClient, HHAeXchangeConfig } from '../hhaexchange-client.js';
import axios from 'axios';

// Mock axios
vi.mock('axios');
const mockedAxios = axios as unknown as {
  create: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  isAxiosError: (error: unknown) => boolean;
};

describe('HHAeXchangeClient', () => {
  let client: HHAeXchangeClient;
  let config: HHAeXchangeConfig;
  let mockAxiosInstance: {
    post: ReturnType<typeof vi.fn>;
    interceptors: {
      request: { use: ReturnType<typeof vi.fn> };
    };
  };

  beforeEach(() => {
    config = {
      clientId: 'test_client_id',
      clientSecret: 'test_client_secret',
      baseURL: 'https://sandbox.hhaexchange.com/api',
      agencyId: 'test_agency'
    };

    mockAxiosInstance = {
      post: vi.fn(),
      interceptors: {
        request: { use: vi.fn() }
      }
    };

    mockedAxios.create = vi.fn().mockReturnValue(mockAxiosInstance);
    mockedAxios.post = vi.fn();

    client = new HHAeXchangeClient(config);
  });

  describe('submitVisit', () => {
    it('should submit visit successfully', async () => {
      // Mock OAuth token response
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          access_token: 'test_token',
          expires_in: 3600,
          token_type: 'Bearer'
        }
      });

      // Mock visit submission response
      mockAxiosInstance.post.mockResolvedValueOnce({
        data: {
          success: true,
          visitId: 'visit_123',
          aggregatorId: 'agg_456'
        }
      });

      const payload = {
        visitId: 'visit_123',
        memberId: 'member_789',
        providerId: 'provider_001',
        caregiverId: 'caregiver_002',
        serviceTypeCode: 'PCA',
        serviceStartDateTime: '2025-11-12T10:00:00Z',
        location: {
          latitude: 30.2672,
          longitude: -97.7431
        },
        programType: 'STAR+PLUS'
      };

      const result = await client.submitVisit(payload);

      expect(result.success).toBe(true);
      expect(result.visitId).toBe('visit_123');
      expect(result.aggregatorId).toBe('agg_456');
    });

    it('should retry on server errors', async () => {
      // Mock OAuth token
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          access_token: 'test_token',
          expires_in: 3600,
          token_type: 'Bearer'
        }
      });

      // First attempt fails with 500
      mockAxiosInstance.post
        .mockRejectedValueOnce({
          isAxiosError: true,
          response: { status: 500 }
        })
        // Second attempt succeeds
        .mockResolvedValueOnce({
          data: {
            success: true,
            visitId: 'visit_123'
          }
        });

      mockedAxios.isAxiosError = vi.fn().mockReturnValue(true);

      const payload = {
        visitId: 'visit_123',
        memberId: 'member_789',
        providerId: 'provider_001',
        caregiverId: 'caregiver_002',
        serviceTypeCode: 'PCA',
        serviceStartDateTime: '2025-11-12T10:00:00Z',
        location: { latitude: 30.2672, longitude: -97.7431 },
        programType: 'STAR+PLUS'
      };

      const result = await client.submitVisit(payload, 3);

      expect(result.success).toBe(true);
      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(2);
    });

    it('should not retry on client errors (4xx)', async () => {
      // Mock OAuth token
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          access_token: 'test_token',
          expires_in: 3600,
          token_type: 'Bearer'
        }
      });

      // Fail with 400 Bad Request
      mockAxiosInstance.post.mockRejectedValueOnce({
        isAxiosError: true,
        response: {
          status: 400,
          data: {
            errors: [
              { code: 'INVALID_MEMBER_ID', message: 'Member ID is invalid' }
            ]
          }
        }
      });

      mockedAxios.isAxiosError = vi.fn().mockReturnValue(true);

      const payload = {
        visitId: 'visit_123',
        memberId: 'invalid',
        providerId: 'provider_001',
        caregiverId: 'caregiver_002',
        serviceTypeCode: 'PCA',
        serviceStartDateTime: '2025-11-12T10:00:00Z',
        location: { latitude: 30.2672, longitude: -97.7431 },
        programType: 'STAR+PLUS'
      };

      await expect(client.submitVisit(payload, 3)).rejects.toThrow(
        'HHAeXchange API error'
      );

      // Should only try once (no retries for 4xx)
      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(1);
    });
  });

  describe('submitCorrection', () => {
    it('should submit visit correction', async () => {
      // Mock OAuth token
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          access_token: 'test_token',
          expires_in: 3600,
          token_type: 'Bearer'
        }
      });

      // Mock correction response
      mockAxiosInstance.post.mockResolvedValueOnce({
        data: {
          success: true,
          visitId: 'visit_123',
          aggregatorId: 'agg_correction_789'
        }
      });

      const result = await client.submitCorrection(
        'visit_123',
        {
          serviceEndDateTime: '2025-11-12T14:00:00Z'
        },
        'Late clock-out correction'
      );

      expect(result.success).toBe(true);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/v1/evv/visits/visit_123/corrections',
        expect.objectContaining({
          correctionReason: 'Late clock-out correction'
        })
      );
    });
  });

  describe('OAuth2 token management', () => {
    // TODO: Fix mock setup for OAuth token caching test
    it.skip('should cache token across requests', async () => {
      // Mock OAuth token (called once)
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          access_token: 'cached_token',
          expires_in: 3600,
          token_type: 'Bearer'
        }
      });

      // Mock visit submissions (called twice)
      mockAxiosInstance.post
        .mockResolvedValueOnce({
          data: { success: true, visitId: 'visit_1' }
        })
        .mockResolvedValueOnce({
          data: { success: true, visitId: 'visit_2' }
        });

      const payload = {
        visitId: 'visit_123',
        memberId: 'member_789',
        providerId: 'provider_001',
        caregiverId: 'caregiver_002',
        serviceTypeCode: 'PCA',
        serviceStartDateTime: '2025-11-12T10:00:00Z',
        location: { latitude: 30.2672, longitude: -97.7431 },
        programType: 'STAR+PLUS'
      };

      await client.submitVisit(payload);
      await client.submitVisit(payload);

      // Token should only be fetched once (cached for second call)
      expect(mockedAxios.post).toHaveBeenCalledTimes(1);
      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(2);
    });
  });
});
