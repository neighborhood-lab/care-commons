/**
 * HHAeXchange API Client
 * 
 * Production OAuth2 client for HHAeXchange EVV aggregator.
 * Implements retry logic, rate limiting, and error handling per HHSC requirements.
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import type { UUID } from '@care-commons/core';

export interface HHAeXchangeConfig {
  clientId: string;
  clientSecret: string;
  baseURL: string;
  agencyId: string;
}

export interface HHAeXchangeVisitPayload {
  visitId: string;
  memberId: string; // Client Medicaid ID
  providerId: string; // Agency NPI
  caregiverId: string;
  serviceTypeCode: string;
  serviceStartDateTime: string; // ISO 8601
  serviceEndDateTime?: string; // ISO 8601
  location: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  programType: string;
}

export interface HHAeXchangeResponse {
  success: boolean;
  visitId?: string;
  aggregatorId?: string;
  errors?: Array<{ code: string; message: string }>;
}

export interface OAuth2Token {
  accessToken: string;
  expiresAt: number; // Unix timestamp
  tokenType: string;
}

export class HHAeXchangeClient {
  private httpClient: AxiosInstance;
  private config: HHAeXchangeConfig;
  private token: OAuth2Token | null = null;

  constructor(config: HHAeXchangeConfig) {
    this.config = config;
    this.httpClient = axios.create({
      baseURL: config.baseURL,
      timeout: 30000, // 30s timeout
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'CareCommons-EVV/1.0'
      }
    });

    // Add request interceptor for auth
    this.httpClient.interceptors.request.use(async (config) => {
      await this.ensureValidToken();
      if (this.token) {
        config.headers.Authorization = `${this.token.tokenType} ${this.token.accessToken}`;
      }
      return config;
    });
  }

  /**
   * Submit visit to HHAeXchange aggregator
   */
  async submitVisit(payload: HHAeXchangeVisitPayload, retries = 3): Promise<HHAeXchangeResponse> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await this.httpClient.post<HHAeXchangeResponse>(
          '/v1/evv/visits',
          payload
        );

        return {
          success: true,
          visitId: response.data.visitId,
          aggregatorId: response.data.aggregatorId
        };
      } catch (error) {
        lastError = error as Error;

        // Don't retry on client errors (4xx)
        if (axios.isAxiosError(error) && error.response?.status && error.response.status < 500) {
          throw this.handleAPIError(error);
        }

        // Exponential backoff for retries
        if (attempt < retries) {
          const backoffMs = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
          await this.sleep(backoffMs);
          console.warn(`[HHAeXchange] Retry ${attempt + 1}/${retries} after ${backoffMs}ms`);
        }
      }
    }

    throw new Error(`Failed to submit visit after ${retries} retries: ${lastError?.message}`);
  }

  /**
   * Submit visit correction (VMUR)
   */
  async submitCorrection(
    visitId: UUID,
    correctionPayload: Partial<HHAeXchangeVisitPayload>,
    reason: string
  ): Promise<HHAeXchangeResponse> {
    try {
      const response = await this.httpClient.post<HHAeXchangeResponse>(
        `/v1/evv/visits/${visitId}/corrections`,
        {
          ...correctionPayload,
          correctionReason: reason
        }
      );

      return {
        success: true,
        visitId: response.data.visitId,
        aggregatorId: response.data.aggregatorId
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw this.handleAPIError(error);
      }
      throw error;
    }
  }

  /**
   * Ensure OAuth2 token is valid, refresh if expired
   */
  private async ensureValidToken(): Promise<void> {
    const now = Date.now();

    // Token exists and not expired (with 5min buffer)
    if (this.token && this.token.expiresAt > now + 300000) {
      return;
    }

    // Fetch new token
    try {
      const response = await axios.post<{
        access_token: string;
        expires_in: number;
        token_type: string;
      }>(
        `${this.config.baseURL}/oauth/token`,
        {
          grant_type: 'client_credentials',
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          scope: 'evv:write'
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000
        }
      );

      this.token = {
        accessToken: response.data.access_token,
        expiresAt: now + response.data.expires_in * 1000,
        tokenType: response.data.token_type || 'Bearer'
      };

      console.log('[HHAeXchange] OAuth2 token acquired successfully');
    } catch (error) {
      console.error('[HHAeXchange] Failed to acquire OAuth2 token:', error);
      throw new Error('HHAeXchange authentication failed');
    }
  }

  /**
   * Handle API errors with structured error messages
   */
  private handleAPIError(error: AxiosError): Error {
    const status = error.response?.status;
    const data = error.response?.data as { errors?: Array<{ code: string; message: string }> };

    if (status === 401) {
      return new Error('HHAeXchange authentication failed - check credentials');
    }

    if (status === 403) {
      return new Error('HHAeXchange authorization failed - insufficient permissions');
    }

    if (status === 429) {
      return new Error('HHAeXchange rate limit exceeded - try again later');
    }

    if (data?.errors && data.errors.length > 0) {
      const errorMessages = data.errors.map(e => `${e.code}: ${e.message}`).join('; ');
      return new Error(`HHAeXchange API error: ${errorMessages}`);
    }

    return new Error(`HHAeXchange API error: ${error.message}`);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
