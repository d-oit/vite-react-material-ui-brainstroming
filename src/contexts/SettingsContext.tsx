import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ThemeMode } from '../types';
import chatService from '../services/ChatService';
import s3Service from '../services/S3Service';

interface Settings {
  themeMode: ThemeMode;
  language: string;
  openRouterApiKey: string;
  openRouterModel: string;
  awsAccessKeyId: string;
  awsSecretAccessKey: string;
  awsRegion: string;
  awsBucketName: string;
  autoSave: boolean;
  autoBackup: boolean;
  fontSize: number;
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
  resetSettings: () => void;
}

const defaultSettings: Settings = {
  themeMode: ThemeMode.SYSTEM,
  language: 'en',
  openRouterApiKey: '',
  openRouterModel: 'anthropic/claude-3-opus',
  awsAccessKeyId: '',
  awsSecretAccessKey: '',
  awsRegion: 'us-east-1',
  awsBucketName: 'do-it-brainstorming',
  autoSave: true,
  autoBackup: false,
  fontSize: 16,
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  // Load settings from localStorage on mount
  useEffect(() => {
    const storedSettings = localStorage.getItem('app_settings');
    if (storedSettings) {
      const parsedSettings = JSON.parse(storedSettings);
      setSettings(parsedSettings);
      
      // Configure services with stored settings
      if (parsedSettings.openRouterApiKey) {
        chatService.configure(parsedSettings.openRouterApiKey, parsedSettings.openRouterModel);
      }
      
      if (parsedSettings.awsAccessKeyId && parsedSettings.awsSecretAccessKey) {
        s3Service.configure(
          parsedSettings.awsAccessKeyId,
          parsedSettings.awsSecretAccessKey,
          parsedSettings.awsRegion,
          parsedSettings.awsBucketName
        );
      }
    }
  }, []);

  // Update settings
  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings(prevSettings => {
      const updatedSettings = { ...prevSettings, ...newSettings };
      
      // Save to localStorage
      localStorage.setItem('app_settings', JSON.stringify(updatedSettings));
      
      // Configure services with new settings
      if (newSettings.openRouterApiKey || newSettings.openRouterModel) {
        chatService.configure(
          updatedSettings.openRouterApiKey, 
          updatedSettings.openRouterModel
        );
      }
      
      if (newSettings.awsAccessKeyId || newSettings.awsSecretAccessKey || 
          newSettings.awsRegion || newSettings.awsBucketName) {
        s3Service.configure(
          updatedSettings.awsAccessKeyId,
          updatedSettings.awsSecretAccessKey,
          updatedSettings.awsRegion,
          updatedSettings.awsBucketName
        );
      }
      
      return updatedSettings;
    });
  };

  // Reset settings to defaults
  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.removeItem('app_settings');
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
