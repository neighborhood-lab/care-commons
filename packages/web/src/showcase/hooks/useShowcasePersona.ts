import { useState, useEffect } from 'react';
import { PersonaRole } from '../types';

const CURRENT_ROLE_KEY = 'showcase-current-role';

const isValidRole = (role: string): role is PersonaRole => {
  return ['admin', 'coordinator', 'caregiver', 'patient'].includes(role);
};

/**
 * Hook to get the current showcase persona/role
 */
export const useShowcasePersona = (): PersonaRole | undefined => {
  const [currentRole, setCurrentRole] = useState<PersonaRole | undefined>(() => {
    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem(CURRENT_ROLE_KEY);
      if (stored && isValidRole(stored)) {
        return stored;
      }
    }
    return undefined;
  });

  useEffect(() => {
    const handleStorageChange = () => {
      const stored = window.localStorage.getItem(CURRENT_ROLE_KEY);
      if (stored && isValidRole(stored)) {
        setCurrentRole(stored);
      } else {
        setCurrentRole(undefined);
      }
    };

    // Listen for storage changes
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return currentRole;
};
