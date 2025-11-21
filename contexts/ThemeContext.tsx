
import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';

type Theme = 'light' | 'dark';

export interface FontSettings {
  listPrimary: string;   // Large lists (Orders, Worklists)
  listSecondary: string; // Detail lists (Results, Items)
  controls: string;      // Inputs, Buttons
}

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  fontSettings: FontSettings;
  updateFontSettings: (settings: Partial<FontSettings>) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

const defaultFontSettings: FontSettings = {
  listPrimary: 'text-base', // Default medium for lists
  listSecondary: 'text-sm', // Default small for details
  controls: 'text-sm',      // Default small for controls
};

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme;
    }
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  const [fontSettings, setFontSettings] = useState<FontSettings>(() => {
    try {
      const savedFonts = localStorage.getItem('fontSettings');
      return savedFonts ? { ...defaultFontSettings, ...JSON.parse(savedFonts) } : defaultFontSettings;
    } catch {
      return defaultFontSettings;
    }
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const updateFontSettings = (newSettings: Partial<FontSettings>) => {
    setFontSettings(prev => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('fontSettings', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, fontSettings, updateFontSettings }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
