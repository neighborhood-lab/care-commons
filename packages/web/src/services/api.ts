/**
 * Simple API service for family portal
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

interface ApiRequestConfig {
  params?: Record<string, string | number>;
}

class ApiService {
  private async request<T>(url: string, options: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem('authToken');

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  }

  async get<T>(url: string, config?: ApiRequestConfig): Promise<T> {
    let finalUrl = url;
    if (config?.params) {
      const queryString = new URLSearchParams(
        Object.entries(config.params).map(([key, value]) => [key, String(value)])
      ).toString();
      finalUrl = `${url}?${queryString}`;
    }
    return this.request<T>(finalUrl, { method: 'GET' });
  }

  async post<T>(url: string, data?: unknown): Promise<T> {
    return this.request<T>(url, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async patch<T>(url: string, data?: unknown): Promise<T> {
    return this.request<T>(url, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async put<T>(url: string, data?: unknown): Promise<T> {
    return this.request<T>(url, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(url: string): Promise<T> {
    return this.request<T>(url, { method: 'DELETE' });
  }
}

export const api = new ApiService();
