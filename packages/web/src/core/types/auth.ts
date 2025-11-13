export type Role = 'ADMIN' | 'COORDINATOR' | 'CAREGIVER' | 'BILLING' | 'FAMILY';

export interface User {
  id: string;
  organizationId: string;
  email: string;
  name: string;
  roles: Role[];
  permissions: string[];
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}
