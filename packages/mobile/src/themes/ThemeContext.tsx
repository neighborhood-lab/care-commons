/**
 * Theme Context for Folk Care Mobile App
 *
 * Provides theme state management with system preference detection
 * and persistent user preference storage.
 */

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeColors, ThemeMode, getTheme, lightTheme } from './colors';

const THEME_STORAGE_KEY = '@folkcare_theme_mode';

interface ThemeContextValue {
  /** Current theme colors */
  colors: ThemeColors;
  /** Current theme mode setting */
  mode: ThemeMode;
  /** Whether dark mode is currently active */
  isDark: boolean;
  /** Set the theme mode */
  setMode: (mode: ThemeMode) => void;
  /** Toggle between light and dark (ignores system) */
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const systemColorScheme = useColorScheme() ?? 'light';
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved theme preference on mount
  useEffect(() => {
    async function loadThemePreference() {
      try {
        const savedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedMode && ['light', 'dark', 'system'].includes(savedMode)) {
          setModeState(savedMode as ThemeMode);
        }
      } catch (error) {
        console.warn('Failed to load theme preference:', error);
      } finally {
        setIsLoaded(true);
      }
    }
    loadThemePreference();
  }, []);

  // Save theme preference when it changes
  const setMode = useCallback(async (newMode: ThemeMode) => {
    setModeState(newMode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newMode);
    } catch (error) {
      console.warn('Failed to save theme preference:', error);
    }
  }, []);

  // Toggle between light and dark
  const toggleTheme = useCallback(() => {
    const currentIsDark = mode === 'dark' || (mode === 'system' && systemColorScheme === 'dark');
    setMode(currentIsDark ? 'light' : 'dark');
  }, [mode, systemColorScheme, setMode]);

  // Compute current theme colors
  const colors = useMemo(() => {
    return getTheme(mode, systemColorScheme);
  }, [mode, systemColorScheme]);

  const isDark = useMemo(() => {
    if (mode === 'system') {
      return systemColorScheme === 'dark';
    }
    return mode === 'dark';
  }, [mode, systemColorScheme]);

  const value = useMemo(
    () => ({
      colors,
      mode,
      isDark,
      setMode,
      toggleTheme,
    }),
    [colors, mode, isDark, setMode, toggleTheme]
  );

  // Show nothing until theme is loaded to prevent flash
  if (!isLoaded) {
    return null;
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/**
 * Hook to access theme context
 * @throws Error if used outside ThemeProvider
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

/**
 * Hook to access just theme colors (for components that don't need full context)
 */
export function useThemeColors(): ThemeColors {
  const context = useContext(ThemeContext);
  // Return light theme as fallback if used outside provider (e.g., in tests)
  if (context === undefined) {
    return lightTheme;
  }
  return context.colors;
}
