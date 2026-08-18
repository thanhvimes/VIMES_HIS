import React, { createContext, useContext, ReactNode } from 'react';
import { useThemeStore } from '../store/useThemeStore';

export interface FontSettings {
  listPrimary: string;
  listSecondary: string;
  controls: string;
}

interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  fontSettings: FontSettings;
  updateFontSettings: (settings: Partial<FontSettings>) => void;
}

const defaultFontSettings: FontSettings = {
  listPrimary: 'text-base',
  listSecondary: 'text-sm',
  controls: 'text-sm',
};

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  toggleTheme: () => {},
  fontSettings: defaultFontSettings,
  updateFontSettings: () => {},
});

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
        fontSettings: defaultFontSettings,
        updateFontSettings: () => {},
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  return useContext(ThemeContext);
};
