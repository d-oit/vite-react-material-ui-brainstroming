import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ThemeMode } from '@/types';

interface ThemeModeContextType {
  themeMode: ThemeMode;
  toggleThemeMode: () => void;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeModeContext = createContext<ThemeModeContextType | undefined>(undefined);

interface ThemeModeProviderProps {
  children: ReactNode;
}

export const ThemeModeProvider = ({ children }: ThemeModeProviderProps) => {
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    // Get saved theme from localStorage or use system preference
    const savedTheme = localStorage.getItem('themeMode') as ThemeMode;
    if (savedTheme && Object.values(ThemeMode).includes(savedTheme)) {
      return savedTheme;
    }
    
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return ThemeMode.DARK;
    }
    
    return ThemeMode.LIGHT;
  });

  useEffect(() => {
    // Save theme preference to localStorage
    localStorage.setItem('themeMode', themeMode);
  }, [themeMode]);

  // Listen for system theme changes if using system theme
  useEffect(() => {
    if (themeMode !== ThemeMode.SYSTEM) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setThemeMode(e.matches ? ThemeMode.DARK : ThemeMode.LIGHT);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [themeMode]);

  const toggleThemeMode = () => {
    setThemeMode(prevMode => 
      prevMode === ThemeMode.LIGHT ? ThemeMode.DARK : ThemeMode.LIGHT
    );
  };

  return (
    <ThemeModeContext.Provider value={{ themeMode, toggleThemeMode, setThemeMode }}>
      {children}
    </ThemeModeContext.Provider>
  );
};

export const useThemeMode = (): ThemeModeContextType => {
  const context = useContext(ThemeModeContext);
  if (context === undefined) {
    throw new Error('useThemeMode must be used within a ThemeModeProvider');
  }
  return context;
};
