/**
 * Theme Context
 *
 * Manages app theme (light/dark/system):
 * - Persists user theme preference
 * - Respects system color scheme
 * - Provides theme colors and utilities
 * - Smooth theme transitions
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface Theme {
  mode: ThemeMode;
  isDark: boolean;
  colors: {
    // Background colors
    background: string;
    surface: string;
    card: string;

    // Text colors
    text: string;
    textSecondary: string;
    textTertiary: string;

    // Primary brand colors
    primary: string;
    primaryLight: string;
    primaryDark: string;

    // Status colors
    success: string;
    warning: string;
    error: string;
    info: string;

    // Border and divider colors
    border: string;
    divider: string;

    // Interactive elements
    buttonPrimary: string;
    buttonSecondary: string;
    buttonDisabled: string;

    // Shadows
    shadow: string;
  };
}

const lightTheme: Theme['colors'] = {
  background: '#FFFFFF',
  surface: '#F5F5F5',
  card: '#FFFFFF',

  text: '#1A1A1A',
  textSecondary: '#666666',
  textTertiary: '#999999',

  primary: '#2563EB',
  primaryLight: '#60A5FA',
  primaryDark: '#1E40AF',

  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  border: '#E5E5E5',
  divider: '#F0F0F0',

  buttonPrimary: '#2563EB',
  buttonSecondary: '#F5F5F5',
  buttonDisabled: '#E5E5E5',

  shadow: 'rgba(0, 0, 0, 0.1)',
};

const darkTheme: Theme['colors'] = {
  background: '#1A1A1A',
  surface: '#2A2A2A',
  card: '#2A2A2A',

  text: '#FFFFFF',
  textSecondary: '#B3B3B3',
  textTertiary: '#808080',

  primary: '#60A5FA',
  primaryLight: '#93C5FD',
  primaryDark: '#3B82F6',

  success: '#34D399',
  warning: '#FBBF24',
  error: '#F87171',
  info: '#60A5FA',

  border: '#404040',
  divider: '#333333',

  buttonPrimary: '#60A5FA',
  buttonSecondary: '#2A2A2A',
  buttonDisabled: '#404040',

  shadow: 'rgba(0, 0, 0, 0.3)',
};

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@folkcare/theme_mode';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [isLoading, setIsLoading] = useState(true);

  // Load saved theme preference on mount
  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (saved && (saved === 'light' || saved === 'dark' || saved === 'system')) {
        setThemeModeState(saved as ThemeMode);
      }
    } catch (error) {
      console.error('Failed to load theme preference:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      setThemeModeState(mode);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  const toggleTheme = async () => {
    const newMode = themeMode === 'light' ? 'dark' : 'light';
    await setThemeMode(newMode);
  };

  // Determine if dark mode should be active
  const isDark = themeMode === 'system'
    ? systemColorScheme === 'dark'
    : themeMode === 'dark';

  const theme: Theme = {
    mode: themeMode,
    isDark,
    colors: isDark ? darkTheme : lightTheme,
  };

  const value: ThemeContextType = {
    theme,
    themeMode,
    setThemeMode,
    toggleTheme,
  };

  // Don't render children until theme is loaded to avoid flash
  if (isLoading) {
    return null;
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
