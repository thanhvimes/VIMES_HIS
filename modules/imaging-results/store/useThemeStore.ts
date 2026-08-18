import { create } from 'zustand';

type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
}

const STORAGE_KEY = 'theme';

const getSavedTheme = (): Theme => {
  try {
    // Clean up legacy pacs_theme if it exists
    if (localStorage.getItem('pacs_theme')) {
      localStorage.removeItem('pacs_theme');
    }
  } catch {}

  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === 'light' || saved === 'dark') return saved;
  return 'light';
};

const applyTheme = (theme: Theme) => {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  localStorage.setItem(STORAGE_KEY, theme);
};

// Apply saved theme immediately on module load
applyTheme(getSavedTheme());

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: getSavedTheme(),
  setTheme: (t) => {
    applyTheme(t);
    set({ theme: t });
  },
  toggleTheme: () => {
    const next: Theme = get().theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    set({ theme: next });
  },
}));

