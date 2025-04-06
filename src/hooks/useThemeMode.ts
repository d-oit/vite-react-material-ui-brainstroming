import { useCallback } from 'react';

import { useSettings } from '../contexts/SettingsContext';
import { ThemeMode } from '../types';

export function useThemeMode() {
  const { settings, updateSettings } = useSettings();

  const toggleThemeMode = useCallback(() => {
    const newMode = settings.themeMode === ThemeMode.LIGHT ? ThemeMode.DARK : ThemeMode.LIGHT;
    updateSettings({ themeMode: newMode });
  }, [settings.themeMode, updateSettings]);

  return {
    themeMode: settings.themeMode,
    toggleThemeMode,
  };
}
