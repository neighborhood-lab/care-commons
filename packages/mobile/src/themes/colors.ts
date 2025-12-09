/**
 * Theme Colors for Folk Care Mobile App
 *
 * Provides light and dark color palettes with semantic naming
 * for consistent theming across the application.
 */

export interface ThemeColors {
  // Primary colors
  primary: string;
  primaryDark: string;
  primaryLight: string;

  // Background colors
  background: string;
  backgroundSecondary: string;
  surface: string;
  surfaceSecondary: string;

  // Text colors
  text: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;

  // Status colors
  success: string;
  successLight: string;
  warning: string;
  warningLight: string;
  error: string;
  errorLight: string;
  info: string;
  infoLight: string;

  // Border colors
  border: string;
  borderLight: string;

  // Specific UI elements
  cardBackground: string;
  inputBackground: string;
  tabBarBackground: string;
  headerBackground: string;

  // Overlay
  overlay: string;

  // Status indicators
  online: string;
  offline: string;
}

export const lightTheme: ThemeColors = {
  // Primary colors
  primary: '#2196F3',
  primaryDark: '#1565C0',
  primaryLight: '#E3F2FD',

  // Background colors
  background: '#f5f5f5',
  backgroundSecondary: '#ffffff',
  surface: '#ffffff',
  surfaceSecondary: '#f5f5f5',

  // Text colors
  text: '#333333',
  textSecondary: '#666666',
  textTertiary: '#999999',
  textInverse: '#ffffff',

  // Status colors
  success: '#4CAF50',
  successLight: '#E8F5E9',
  warning: '#FF9800',
  warningLight: '#FFF3E0',
  error: '#FF5252',
  errorLight: '#FFE0E0',
  info: '#2196F3',
  infoLight: '#E3F2FD',

  // Border colors
  border: '#e0e0e0',
  borderLight: '#f0f0f0',

  // Specific UI elements
  cardBackground: '#ffffff',
  inputBackground: '#f5f5f5',
  tabBarBackground: '#ffffff',
  headerBackground: '#ffffff',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',

  // Status indicators
  online: '#4CAF50',
  offline: '#FF5252',
};

export const darkTheme: ThemeColors = {
  // Primary colors
  primary: '#64B5F6',
  primaryDark: '#1976D2',
  primaryLight: '#1E3A5F',

  // Background colors
  background: '#121212',
  backgroundSecondary: '#1E1E1E',
  surface: '#1E1E1E',
  surfaceSecondary: '#2C2C2C',

  // Text colors
  text: '#E0E0E0',
  textSecondary: '#B0B0B0',
  textTertiary: '#808080',
  textInverse: '#121212',

  // Status colors
  success: '#66BB6A',
  successLight: '#1B3D1B',
  warning: '#FFA726',
  warningLight: '#3D2E1B',
  error: '#EF5350',
  errorLight: '#3D1B1B',
  info: '#42A5F5',
  infoLight: '#1B2D3D',

  // Border colors
  border: '#333333',
  borderLight: '#2C2C2C',

  // Specific UI elements
  cardBackground: '#1E1E1E',
  inputBackground: '#2C2C2C',
  tabBarBackground: '#1E1E1E',
  headerBackground: '#1E1E1E',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.7)',

  // Status indicators
  online: '#66BB6A',
  offline: '#EF5350',
};

export type ThemeMode = 'light' | 'dark' | 'system';

export function getTheme(mode: ThemeMode, systemColorScheme: 'light' | 'dark'): ThemeColors {
  if (mode === 'system') {
    return systemColorScheme === 'dark' ? darkTheme : lightTheme;
  }
  return mode === 'dark' ? darkTheme : lightTheme;
}
