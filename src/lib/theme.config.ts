/**
 * Theme Configuration
 * Centralized theme colors and utilities
 * Admin can customize these via the admin settings API
 */

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  border: string;
  success: string;
  warning: string;
  danger: string;
}

/**
 * Default theme colors (matching the HTML design)
 */
export const DEFAULT_THEME: ThemeColors = {
  primary: "#6fcf2e", // Green accent
  secondary: "#a78bfa", // Purple
  accent: "#70a8e8", // Blue
  background: "#0d0d12", // Dark background
  surface: "#181820", // Card background
  text: "#ffffff", // White text
  border: "#2a2a36", // Border color
  success: "#1e8449", // Green
  warning: "#b7770d", // Orange
  danger: "#c0392b", // Red
};

/**
 * Generate CSS variable string from theme colors
 * Can be injected into a <style> tag or applied to document.documentElement
 *
 * @param colors - ThemeColors object
 * @returns CSS variable declarations as string
 */
export function getThemeCSS(colors: Partial<ThemeColors> = {}): string {
  const theme = { ...DEFAULT_THEME, ...colors };

  return `
:root {
  --primary: ${theme.primary};
  --secondary: ${theme.secondary};
  --accent: ${theme.accent};
  --background: ${theme.background};
  --surface: ${theme.surface};
  --text: ${theme.text};
  --border: ${theme.border};
  --success: ${theme.success};
  --warning: ${theme.warning};
  --danger: ${theme.danger};
}
  `.trim();
}

/**
 * Apply theme colors to document root
 * Use this client-side to update theme dynamically
 *
 * @param colors - ThemeColors object
 */
export function applyThemeToDOM(colors: Partial<ThemeColors> = {}): void {
  const theme = { ...DEFAULT_THEME, ...colors };
  const root = document.documentElement;

  Object.entries(theme).forEach(([key, value]) => {
    root.style.setProperty(`--${key}`, value);
  });
}

/**
 * Get color by key
 * @param key - Color key
 * @returns Color hex value
 */
export function getThemeColor(key: keyof ThemeColors): string {
  return DEFAULT_THEME[key];
}

/**
 * Validate if a string is a valid hex color
 * @param color - Color string to validate
 * @returns true if valid hex color
 */
export function isValidHexColor(color: string): boolean {
  return /^#[0-9A-F]{6}$/i.test(color);
}

/**
 * Theme presets for quick selection
 */
export const THEME_PRESETS: Record<string, ThemeColors> = {
  default: DEFAULT_THEME,
  dark: {
    ...DEFAULT_THEME,
    background: "#0a0a0f",
    surface: "#151520",
  },
  light: {
    ...DEFAULT_THEME,
    background: "#f5f5f7",
    surface: "#ffffff",
    text: "#1a1a1a",
    border: "#e0e0e4",
  },
  highContrast: {
    ...DEFAULT_THEME,
    primary: "#00ff00",
    text: "#ffffff",
    background: "#000000",
    surface: "#1a1a1a",
  },
};
