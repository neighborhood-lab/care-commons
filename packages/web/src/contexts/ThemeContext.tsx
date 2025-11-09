/**
 * Theme Context Provider for White-Label Branding
 *
 * Loads organization-specific branding and applies dynamic theming
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface BrandColors {
  primary: string;
  secondary?: string;
  accent?: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

interface CompiledTheme {
  colors: BrandColors;
  fontFamily: string;
  headingFontFamily?: string;
  customCss?: string;
  logoUrl?: string;
  logoDarkUrl?: string;
  faviconUrl?: string;
  brandName?: string;
  tagline?: string;
}

interface ThemeContextValue {
  theme: CompiledTheme;
  isLoading: boolean;
  error: Error | null;
  refreshTheme: () => Promise<void>;
}

const defaultTheme: CompiledTheme = {
  colors: {
    primary: '#0ea5e9',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
  fontFamily: 'Inter, system-ui, sans-serif',
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<CompiledTheme>(defaultTheme);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadTheme = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/white-label/theme', {
        credentials: 'include',
      });

      if (response.ok) {
        const loadedTheme = await response.json();
        setTheme(loadedTheme);
        applyThemeToDocument(loadedTheme);
      } else {
        // Use default theme if not authenticated or theme not found
        setTheme(defaultTheme);
        applyThemeToDocument(defaultTheme);
      }
    } catch (err) {
      console.error('Failed to load theme:', err);
      setError(err instanceof Error ? err : new Error('Failed to load theme'));
      // Fallback to default theme
      setTheme(defaultTheme);
      applyThemeToDocument(defaultTheme);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTheme();
  }, []);

  const value: ThemeContextValue = {
    theme,
    isLoading,
    error,
    refreshTheme: loadTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

/**
 * Apply theme to document by updating CSS variables
 */
function applyThemeToDocument(theme: CompiledTheme): void {
  const root = document.documentElement;

  // Apply color CSS variables
  root.style.setProperty('--color-primary', theme.colors.primary);
  root.style.setProperty('--color-success', theme.colors.success);
  root.style.setProperty('--color-warning', theme.colors.warning);
  root.style.setProperty('--color-error', theme.colors.error);
  root.style.setProperty('--color-info', theme.colors.info);

  if (theme.colors.secondary) {
    root.style.setProperty('--color-secondary', theme.colors.secondary);
  }

  if (theme.colors.accent) {
    root.style.setProperty('--color-accent', theme.colors.accent);
  }

  // Apply font family
  root.style.setProperty('--font-family', theme.fontFamily);

  if (theme.headingFontFamily) {
    root.style.setProperty('--font-family-heading', theme.headingFontFamily);
  }

  // Apply custom CSS if provided
  if (theme.customCss) {
    let styleElement = document.getElementById('custom-theme-css');
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = 'custom-theme-css';
      document.head.appendChild(styleElement);
    }
    styleElement.textContent = theme.customCss;
  }

  // Update favicon if provided
  if (theme.faviconUrl) {
    let favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!favicon) {
      favicon = document.createElement('link');
      favicon.rel = 'icon';
      document.head.appendChild(favicon);
    }
    favicon.href = theme.faviconUrl;
  }

  // Update page title if brand name is provided
  if (theme.brandName) {
    document.title = theme.brandName;
  }
}
