import type { RequestConfig } from '../types/api';
export interface ApiClient {
    get<T>(url: string, config?: RequestConfig): Promise<T>;
    post<T>(url: string, data?: unknown, config?: RequestConfig): Promise<T>;
    patch<T>(url: string, data?: unknown, config?: RequestConfig): Promise<T>;
    delete<T>(url: string, config?: RequestConfig): Promise<T>;
    put<T>(url: string, data?: unknown, config?: RequestConfig): Promise<T>;
}
export declare const createApiClient: (baseUrl: string, getAuthToken: () => string | null) => ApiClient;
//# sourceMappingURL=api-client.d.ts.map