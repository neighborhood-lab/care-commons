export type Role = 'ADMIN' | 'COORDINATOR' | 'CAREGIVER' | 'BILLING';

export interface User {
  id: string;
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
