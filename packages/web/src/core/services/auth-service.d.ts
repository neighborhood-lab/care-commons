import type { ApiClient } from './api-client';
import type { AuthResponse, LoginCredentials, User } from '../types/auth';
export interface AuthService {
    login(credentials: LoginCredentials): Promise<AuthResponse>;
    logout(): Promise<void>;
    getCurrentUser(): Promise<User>;
    refreshToken(): Promise<AuthResponse>;
}
export declare const createAuthService: (apiClient: ApiClient) => AuthService;
//# sourceMappingURL=auth-service.d.ts.map