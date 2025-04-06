import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ThemeMode, NodeType } from '../types';
import chatService from '../services/ChatService';
import s3Service from '../services/S3Service';
import indexedDBService, { ColorScheme, NodePreferences } from '../services/IndexedDBService';

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
  skipDeleteConfirmation: boolean;
  activeColorSchemeId: string;
  preferredNodeSize: 'small' | 'medium' | 'large';
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
  resetSettings: () => void;
  colorSchemes: ColorScheme[];
  activeColorScheme: ColorScheme | null;
  nodePreferences: NodePreferences | null;
  getNodeColor: (type: NodeType, customColor?: string) => string;
  exportSettings: () => Promise<string>;
  importSettings: (jsonData: string) => Promise<boolean>;
  updateColorScheme: (colorScheme: ColorScheme) => Promise<void>;
  createColorScheme: (name: string, colors: Record<NodeType, string>) => Promise<ColorScheme>;
  deleteColorScheme: (id: string) => Promise<void>;
  updateNodePreferences: (preferences: Partial<NodePreferences>) => Promise<void>;
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
  skipDeleteConfirmation: false,
  activeColorSchemeId: 'default',
  preferredNodeSize: 'medium',
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [colorSchemes, setColorSchemes] = useState<ColorScheme[]>([]);
  const [activeColorScheme, setActiveColorScheme] = useState<ColorScheme | null>(null);
  const [nodePreferences, setNodePreferences] = useState<NodePreferences | null>(null);

  // Initialize IndexedDB and load data
  useEffect(() => {
    const initializeData = async () => {
      try {
        // Initialize IndexedDB
        await indexedDBService.init();

        // Load color schemes
        const schemes = await indexedDBService.getColorSchemes();
        setColorSchemes(schemes);

        // Load node preferences
        const prefs = await indexedDBService.getNodePreferences();
        setNodePreferences(prefs);

        // Load settings from IndexedDB or localStorage
        const dbSettings = await indexedDBService.getAllSettings();
        const storedSettings = localStorage.getItem('app_settings');

        if (Object.keys(dbSettings).length > 0) {
          // Use settings from IndexedDB
          const mergedSettings = { ...defaultSettings, ...dbSettings };
          setSettings(mergedSettings as Settings);
          configureServices(mergedSettings as Settings);

          // Migrate settings from localStorage to IndexedDB if needed
          if (storedSettings) {
            localStorage.removeItem('app_settings');
          }
        } else if (storedSettings) {
          // Use settings from localStorage and migrate to IndexedDB
          const parsedSettings = JSON.parse(storedSettings);
          setSettings(parsedSettings);
          await indexedDBService.saveSettings(parsedSettings);
          configureServices(parsedSettings);
          localStorage.removeItem('app_settings');
        }

        // Set active color scheme
        const activeSchemeId = settings.activeColorSchemeId || 'default';
        const activeScheme =
          schemes.find(scheme => scheme.id === activeSchemeId) ||
          (await indexedDBService.getDefaultColorScheme());
        if (activeScheme) {
          setActiveColorScheme(activeScheme);
        }
      } catch (error) {
        console.error('Failed to initialize settings:', error);
        // Fallback to localStorage if IndexedDB fails
        const storedSettings = localStorage.getItem('app_settings');
        if (storedSettings) {
          const parsedSettings = JSON.parse(storedSettings);
          setSettings(parsedSettings);
          configureServices(parsedSettings);
        }
      }
    };

    initializeData();
  }, []);

  // Configure services with settings
  const configureServices = (settingsToUse: Settings) => {
    // Configure chat service
    if (settingsToUse.openRouterApiKey) {
      chatService.configure(settingsToUse.openRouterApiKey, settingsToUse.openRouterModel);
    }

    // Only configure S3 if it's available and credentials are provided
    if (
      s3Service.isS3Available() &&
      settingsToUse.awsAccessKeyId &&
      settingsToUse.awsSecretAccessKey
    ) {
      s3Service
        .configure(
          settingsToUse.awsAccessKeyId,
          settingsToUse.awsSecretAccessKey,
          settingsToUse.awsRegion,
          settingsToUse.awsBucketName
        )
        .catch(error => {
          console.warn('Failed to configure S3 service:', error);
        });
    }
  };

  // Update settings
  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings(prevSettings => {
      const updatedSettings = { ...prevSettings, ...newSettings };

      // Save to IndexedDB
      indexedDBService.saveSettings(updatedSettings).catch(error => {
        console.error('Failed to save settings to IndexedDB:', error);
        // Fallback to localStorage
        localStorage.setItem('app_settings', JSON.stringify(updatedSettings));
      });

      // Configure services with new settings
      if (newSettings.openRouterApiKey || newSettings.openRouterModel) {
        chatService.configure(updatedSettings.openRouterApiKey, updatedSettings.openRouterModel);
      }

      // Only configure S3 if it's available and credentials are provided
      if (
        s3Service.isS3Available() &&
        (newSettings.awsAccessKeyId ||
          newSettings.awsSecretAccessKey ||
          newSettings.awsRegion ||
          newSettings.awsBucketName)
      ) {
        if (updatedSettings.awsAccessKeyId && updatedSettings.awsSecretAccessKey) {
          s3Service
            .configure(
              updatedSettings.awsAccessKeyId,
              updatedSettings.awsSecretAccessKey,
              updatedSettings.awsRegion,
              updatedSettings.awsBucketName
            )
            .catch(error => {
              console.warn('Failed to configure S3 service:', error);
            });
        }
      }

      // Update active color scheme if changed
      if (
        newSettings.activeColorSchemeId &&
        newSettings.activeColorSchemeId !== prevSettings.activeColorSchemeId
      ) {
        const newActiveScheme = colorSchemes.find(
          scheme => scheme.id === newSettings.activeColorSchemeId
        );
        if (newActiveScheme) {
          setActiveColorScheme(newActiveScheme);
        }
      }

      return updatedSettings;
    });
  };

  // Reset settings to defaults
  const resetSettings = () => {
    setSettings(defaultSettings);
    indexedDBService.saveSettings(defaultSettings).catch(error => {
      console.error('Failed to reset settings in IndexedDB:', error);
      localStorage.removeItem('app_settings');
    });
  };

  // Get node color based on type and active color scheme
  const getNodeColor = (type: NodeType, customColor?: string): string => {
    // If a custom color is provided for this specific node, use it
    if (customColor) return customColor;

    // If node has a custom color in preferences, use it
    if (nodePreferences?.customColors?.[type]) {
      return nodePreferences.customColors[type]!;
    }

    // If active color scheme has a color for this node type, use it
    if (activeColorScheme) {
      return activeColorScheme.colors[type] || '#f5f5f5';
    }

    // Fallback colors if no active scheme
    switch (type) {
      case NodeType.IDEA:
        return '#e3f2fd'; // Light blue
      case NodeType.TASK:
        return '#e8f5e9'; // Light green
      case NodeType.NOTE:
        return '#fff8e1'; // Light yellow
      case NodeType.RESOURCE:
        return '#f3e5f5'; // Light purple
      default:
        return '#f5f5f5'; // Light grey
    }
  };

  // Export settings to JSON
  const exportSettings = async (): Promise<string> => {
    try {
      const exportData = {
        settings,
        colorSchemes,
        nodePreferences,
        metadata: {
          exportDate: new Date().toISOString(),
          version: '1.0.0',
          appName: 'd.o.it.brainstorming',
        },
      };
      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Failed to export settings:', error);
      throw new Error('Failed to export settings');
    }
  };

  // Import settings from JSON
  const importSettings = async (jsonData: string): Promise<boolean> => {
    try {
      const importData = JSON.parse(jsonData);

      // Validate imported data
      if (!importData.settings) {
        // Try to handle legacy format
        try {
          const legacySettings = JSON.parse(jsonData) as Settings;
          setSettings(prevSettings => ({
            ...prevSettings,
            ...legacySettings,
          }));
          await indexedDBService.saveSettings(legacySettings);
          return true;
        } catch (e) {
          throw new Error('Invalid settings data');
        }
      }

      // Log metadata if available
      if (importData.metadata) {
        console.log('Importing settings from:', importData.metadata);
      }

      // Import settings
      setSettings(prevSettings => ({
        ...prevSettings,
        ...importData.settings,
      }));
      await indexedDBService.saveSettings(importData.settings);

      // Import color schemes if available
      if (importData.colorSchemes && Array.isArray(importData.colorSchemes)) {
        for (const scheme of importData.colorSchemes) {
          await indexedDBService.saveColorScheme(scheme);
        }
        const updatedSchemes = await indexedDBService.getColorSchemes();
        setColorSchemes(updatedSchemes);
      }

      // Import node preferences if available
      if (importData.nodePreferences) {
        await indexedDBService.saveNodePreferences(importData.nodePreferences);
        setNodePreferences(importData.nodePreferences);
      }

      // Set active color scheme
      if (importData.settings.activeColorSchemeId) {
        const activeScheme =
          colorSchemes.find(scheme => scheme.id === importData.settings.activeColorSchemeId) ||
          (await indexedDBService.getColorScheme(importData.settings.activeColorSchemeId));

        if (activeScheme) {
          setActiveColorScheme(activeScheme);
        }
      }

      // Configure services with imported settings
      configureServices(importData.settings);

      return true;
    } catch (error) {
      console.error('Failed to import settings:', error);
      return false;
    }
  };

  // Update a color scheme
  const updateColorScheme = async (colorScheme: ColorScheme): Promise<void> => {
    try {
      await indexedDBService.saveColorScheme(colorScheme);

      // Update color schemes list
      const updatedSchemes = await indexedDBService.getColorSchemes();
      setColorSchemes(updatedSchemes);

      // Update active color scheme if it's the one being updated
      if (activeColorScheme && activeColorScheme.id === colorScheme.id) {
        setActiveColorScheme(colorScheme);
      }
    } catch (error) {
      console.error('Failed to update color scheme:', error);
      throw new Error('Failed to update color scheme');
    }
  };

  // Create a new color scheme
  const createColorScheme = async (
    name: string,
    colors: Record<NodeType, string>
  ): Promise<ColorScheme> => {
    try {
      const newScheme: ColorScheme = {
        id: crypto.randomUUID(),
        name,
        colors,
        isDefault: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await indexedDBService.saveColorScheme(newScheme);

      // Update color schemes list
      const updatedSchemes = await indexedDBService.getColorSchemes();
      setColorSchemes(updatedSchemes);

      return newScheme;
    } catch (error) {
      console.error('Failed to create color scheme:', error);
      throw new Error('Failed to create color scheme');
    }
  };

  // Delete a color scheme
  const deleteColorScheme = async (id: string): Promise<void> => {
    try {
      // Don't allow deleting the active color scheme
      if (settings.activeColorSchemeId === id) {
        throw new Error('Cannot delete the active color scheme');
      }

      await indexedDBService.deleteColorScheme(id);

      // Update color schemes list
      const updatedSchemes = await indexedDBService.getColorSchemes();
      setColorSchemes(updatedSchemes);
    } catch (error) {
      console.error('Failed to delete color scheme:', error);
      throw new Error('Failed to delete color scheme');
    }
  };

  // Update node preferences
  const updateNodePreferences = async (preferences: Partial<NodePreferences>): Promise<void> => {
    try {
      const updatedPreferences = { ...nodePreferences, ...preferences } as NodePreferences;
      await indexedDBService.saveNodePreferences(updatedPreferences);
      setNodePreferences(updatedPreferences);
    } catch (error) {
      console.error('Failed to update node preferences:', error);
      throw new Error('Failed to update node preferences');
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSettings,
        resetSettings,
        colorSchemes,
        activeColorScheme,
        nodePreferences,
        getNodeColor,
        exportSettings,
        importSettings,
        updateColorScheme,
        createColorScheme,
        deleteColorScheme,
        updateNodePreferences,
      }}
    >
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
