import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { ThemeModeProvider, useThemeMode } from '@/hooks/useThemeMode';
import { getTheme } from '@/lib/theme';
import { ThemeMode } from '@/types';

// Pages
import { Dashboard } from '@/pages/Dashboard';
import { BrainstormPage } from '@/pages/BrainstormPage';
import { HistoryPage } from '@/pages/HistoryPage';
import { ChatPage } from '@/pages/ChatPage';
import { BackupPage } from '@/pages/BackupPage';
import { SettingsPage } from '@/pages/SettingsPage';

// PWA registration
import { registerSW } from 'virtual:pwa-register';

const AppWithTheme = () => {
  const { themeMode } = useThemeMode();
  const [currentTheme, setCurrentTheme] = useState(getTheme(themeMode));

  // Update theme when theme mode changes
  useEffect(() => {
    setCurrentTheme(getTheme(themeMode));
  }, [themeMode]);

  return (
    <ThemeProvider theme={currentTheme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/projects" element={<Dashboard />} />
          <Route path="/brainstorm/:projectId" element={<BrainstormPage />} />
          <Route path="/history/:projectId" element={<HistoryPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/backup" element={<BackupPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
};

const App = () => {
  // Register service worker for PWA
  useEffect(() => {
    const updateSW = registerSW({
      onNeedRefresh() {
        if (confirm('New content available. Reload?')) {
          updateSW(true);
        }
      },
      onOfflineReady() {
        console.log('App is ready for offline use');
      },
    });
  }, []);

  return (
    <ThemeModeProvider>
      <AppWithTheme />
    </ThemeModeProvider>
  );
};

export default App;
