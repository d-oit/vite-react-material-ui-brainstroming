import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

// Define the structure of our translations
interface Translations {
  [key: string]: string | Translations;
}

// Define the structure of our I18n context
interface I18nContextType {
  locale: string;
  setLocale: (locale: string) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  isLoading: boolean;
}

// Create the context
const I18nContext = createContext<I18nContextType | undefined>(undefined);

// Default translations (English)
const defaultTranslations: Translations = {
  common: {
    loading: 'Loading...',
    error: 'An error occurred',
    retry: 'Retry',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    create: 'Create',
    search: 'Search',
    filter: 'Filter',
    sort: 'Sort',
    actions: 'Actions',
    confirm: 'Confirm',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    submit: 'Submit',
    reset: 'Reset',
    close: 'Close',
    open: 'Open',
    yes: 'Yes',
    no: 'No',
    success: 'Success',
    warning: 'Warning',
    info: 'Information',
  },
  navigation: {
    home: 'Home',
    projects: 'Projects',
    brainstorm: 'Brainstorm',
    settings: 'Settings',
    history: 'History',
    chat: 'Chat',
    backup: 'Backup',
    help: 'Help',
  },
  project: {
    title: 'Projects',
    createProject: 'Create Project',
    editProject: 'Edit Project',
    deleteProject: 'Delete Project',
    archiveProject: 'Archive Project',
    restoreProject: 'Restore Project',
    projectName: 'Project Name',
    projectDescription: 'Project Description',
    createFirstProject: 'Create your first brainstorming project to get started.',
    noProjects: 'No Projects Yet',
    noDescription: 'No description',
    created: 'Created',
    updated: 'Updated',
    empty: 'Empty',
    open: 'Open Project',
    delete: 'Delete',
    archive: 'Archive',
    sync: 'Sync to Cloud',
    pin: 'Pin Project',
    unpin: 'Unpin Project',
    confirmDelete: 'Are you sure you want to delete this project? This action cannot be undone.',
    confirmArchive:
      'Are you sure you want to archive this project? You can restore it later from the archive.',
  },
  brainstorm: {
    title: 'Brainstorm',
    newIdea: 'New Idea',
    addNode: 'Add Node',
    deleteNode: 'Delete Node',
    editNode: 'Edit Node',
    connectNodes: 'Connect Nodes',
    disconnectNodes: 'Disconnect Nodes',
    nodeTypes: 'Node Types',
    saveLayout: 'Save Layout',
    resetLayout: 'Reset Layout',
    zoomIn: 'Zoom In',
    zoomOut: 'Zoom Out',
    fitView: 'Fit View',
    undo: 'Undo',
    redo: 'Redo',
  },
  settings: {
    title: 'Settings',
    appearance: 'Appearance',
    language: 'Language',
    theme: 'Theme',
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
    systemDefault: 'System Default',
    notifications: 'Notifications',
    account: 'Account',
    privacy: 'Privacy',
    security: 'Security',
    advanced: 'Advanced',
    about: 'About',
    help: 'Help',
    feedback: 'Feedback',
    logout: 'Logout',
  },
  app: {
    title: 'd.o.it.brainstorming',
    tagline: 'Unleash structured creativity — anywhere, anytime.',
    update: 'Update Available',
    updateAction: 'Update',
    offlineReady: 'App is ready for offline use',
  },
};

// Provider component
interface I18nProviderProps {
  children: ReactNode;
  initialLocale?: string;
}

export const I18nProvider = ({ children, initialLocale = 'en' }: I18nProviderProps) => {
  const [locale, setLocale] = useState<string>(initialLocale);
  const [translations, setTranslations] = useState<Translations>(defaultTranslations);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Load translations for the current locale
  useEffect(() => {
    const loadTranslations = async () => {
      if (locale === 'en') {
        setTranslations(defaultTranslations);
        return;
      }

      setIsLoading(true);
      try {
        // In a real app, you would load translations from a file or API
        // For now, we'll just use the default translations
        setTranslations(defaultTranslations);
      } catch (error) {
        console.error('Failed to load translations:', error);
        // Fallback to default translations
        setTranslations(defaultTranslations);
      } finally {
        setIsLoading(false);
      }
    };

    loadTranslations();
  }, [locale]);

  // Translation function
  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const keys = key.split('.');
      let value: unknown = translations;

      // Navigate through the nested translations object
      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          // Safe to access property as we've checked it exists
          // eslint-disable-next-line security/detect-object-injection
          value = (value as Record<string, unknown>)[k];
        } else {
          // Key not found, return the key itself
          return key;
        }
      }

      // If the value is not a string, return the key
      if (typeof value !== 'string') {
        return key;
      }

      // Replace parameters in the translation string
      if (params) {
        return Object.entries(params).reduce((acc, [paramKey, paramValue]) => {
          // Create a safe pattern for replacement
          const pattern = '{{' + paramKey + '}}';
          // Use a string replace instead of RegExp for safety
          return acc.split(pattern).join(String(paramValue));
        }, value);
      }

      return value;
    },
    [translations]
  );

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      locale,
      setLocale,
      t,
      isLoading,
    }),
    [locale, t, isLoading]
  );

  return <I18nContext.Provider value={contextValue}>{children}</I18nContext.Provider>;
};

// Custom hook to use the I18n context
export const useI18n = () => {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};
