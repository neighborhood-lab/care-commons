"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApiClient = void 0;
class ApiClientImpl {
    constructor(baseUrl, getAuthToken) {
        this.baseUrl = baseUrl;
        this.getAuthToken = getAuthToken;
    }
    async request(url, options = {}) {
        const { config, ...fetchOptions } = options;
        const token = this.getAuthToken();
        const headers = {
            'Content-Type': 'application/json',
            ...config?.headers,
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        try {
            const response = await fetch(`${this.baseUrl}${url}`, {
                ...fetchOptions,
                headers,
                signal: config?.signal,
            });
            if (!response.ok) {
                const error = await response.json().catch(() => ({
                    message: response.statusText,
                    code: response.status.toString(),
                }));
                throw error;
            }
            return response.json();
        }
        catch (error) {
            if (error instanceof Error) {
                throw {
                    message: error.message,
                    code: 'NETWORK_ERROR',
                };
            }
            throw error;
        }
    }
    async get(url, config) {
        return this.request(url, { method: 'GET', config });
    }
    async post(url, data, config) {
        return this.request(url, {
            method: 'POST',
            body: JSON.stringify(data),
            config,
        });
    }
    async patch(url, data, config) {
        return this.request(url, {
            method: 'PATCH',
            body: JSON.stringify(data),
            config,
        });
    }
    async put(url, data, config) {
        return this.request(url, {
            method: 'PUT',
            body: JSON.stringify(data),
            config,
        });
    }
    async delete(url, config) {
        return this.request(url, { method: 'DELETE', config });
    }
}
const createApiClient = (baseUrl, getAuthToken) => {
    return new ApiClientImpl(baseUrl, getAuthToken);
};
exports.createApiClient = createApiClient;
//# sourceMappingURL=api-client.js.map