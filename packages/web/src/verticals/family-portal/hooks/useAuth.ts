import { create } from 'zustand';
import { familyPortalApi } from '../services/api-client';

interface FamilyMember {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  relationship: string;
  clientId: string;
  permissions: string[];
  accessLevel: string;
}

interface AuthState {
  familyMember: FamilyMember | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loadProfile: () => Promise<void>;
  updateProfile: (updates: any) => Promise<void>;
  hasPermission: (permission: string) => boolean;
}

export const useAuth = create<AuthState>((set, get) => ({
  familyMember: null,
  token: familyPortalApi.getToken(),
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await familyPortalApi.login(email, password);
      if (response.success && response.data) {
        const { familyMember, token } = response.data as any;
        familyPortalApi.setToken(token);
        set({ familyMember, token, isLoading: false });
      }
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  logout: () => {
    familyPortalApi.setToken(null);
    set({ familyMember: null, token: null });
  },

  loadProfile: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await familyPortalApi.getProfile();
      if (response.success && response.data) {
        set({ familyMember: response.data as any, isLoading: false });
      }
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  updateProfile: async (updates: any) => {
    set({ isLoading: true, error: null });
    try {
      const response = await familyPortalApi.updateProfile(updates);
      if (response.success && response.data) {
        set({ familyMember: response.data as any, isLoading: false });
      }
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  hasPermission: (permission: string) => {
    const { familyMember } = get();
    return familyMember?.permissions.includes(permission) || false;
  },
}));
