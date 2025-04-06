import type { ReactNode } from 'react';
import React, { createContext, useContext, useState } from 'react';

// Define the shape of our translations
interface Translations {
  [key: string]: string;
}

// Define the shape of our context
interface I18nContextType {
  locale: string;
  setLocale: (locale: string) => void;
  t: (key: string, params?: Record<string, string>) => string;
}

// Create the context with a default value
const I18nContext = createContext<I18nContextType | undefined>(undefined);

// Sample translations
const translations: Record<string, Translations> = {
  en: {
    'app.title': 'd.o.it.brainstorming',
    'app.tagline': 'Unleash structured creativity — anywhere, anytime.',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.add': 'Add',
    'common.loading': 'Loading...',
    'common.error': 'An error occurred. Please try again.',
    'dashboard.title': 'Dashboard',
    'dashboard.projects': 'My Projects',
    'dashboard.newProject': 'New Project',
    'dashboard.noProjects': 'No Projects Yet',
    'dashboard.createFirst': 'Create your first brainstorming project to get started.',
    'brainstorm.title': 'Brainstorming',
    'brainstorm.addNode': 'Add Node',
    'brainstorm.saveFlow': 'Save Flow',
    'brainstorm.newVersion': 'New Version',
    'brainstorm.start': 'Start Brainstorming',
    'brainstorm.clickToAdd': 'Click the + button to add your first idea, task, note, or resource.',
    'brainstorm.addFirstNode': 'Add First Node',
    'node.add': 'Add New Node',
    'node.edit': 'Edit Node',
    'node.type': 'Node Type',
    'node.type.idea': 'Idea',
    'node.type.task': 'Task',
    'node.type.note': 'Note',
    'node.type.resource': 'Resource',
    'node.label': 'Label',
    'node.content': 'Content',
    'node.addTag': 'Add Tag',
    'chat.title': 'Chat Assistant',
    'chat.placeholder': 'Ask for ideas or suggestions...',
    'chat.send': 'Send',
    'chat.clear': 'Clear Chat',
    'settings.title': 'Settings',
    'settings.appearance': 'Appearance',
    'settings.behavior': 'Behavior',
    'settings.apiConfig': 'API Configuration',
    'settings.themeMode': 'Theme Mode',
    'settings.language': 'Language',
    'settings.fontSize': 'Font Size',
    'settings.autoSave': 'Auto-save projects',
    'settings.autoBackup': 'Auto-backup to cloud',
    'settings.saveSettings': 'Save Settings',
  },
  de: {
    'app.title': 'd.o.it.brainstorming',
    'app.tagline': 'Entfesseln Sie strukturierte Kreativität — überall und jederzeit.',
    'common.save': 'Speichern',
    'common.cancel': 'Abbrechen',
    'common.delete': 'Löschen',
    'common.edit': 'Bearbeiten',
    'common.add': 'Hinzufügen',
    'common.loading': 'Wird geladen...',
    'common.error': 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.',
    'dashboard.title': 'Dashboard',
    'dashboard.projects': 'Meine Projekte',
    'dashboard.newProject': 'Neues Projekt',
    'dashboard.noProjects': 'Noch keine Projekte',
    'dashboard.createFirst': 'Erstellen Sie Ihr erstes Brainstorming-Projekt, um zu beginnen.',
    'brainstorm.title': 'Brainstorming',
    'brainstorm.addNode': 'Knoten hinzufügen',
    'brainstorm.saveFlow': 'Flow speichern',
    'brainstorm.newVersion': 'Neue Version',
    'brainstorm.start': 'Brainstorming starten',
    'brainstorm.clickToAdd':
      'Klicken Sie auf die Schaltfläche +, um Ihre erste Idee, Aufgabe, Notiz oder Ressource hinzuzufügen.',
    'brainstorm.addFirstNode': 'Ersten Knoten hinzufügen',
    'node.add': 'Neuen Knoten hinzufügen',
    'node.edit': 'Knoten bearbeiten',
    'node.type': 'Knotentyp',
    'node.type.idea': 'Idee',
    'node.type.task': 'Aufgabe',
    'node.type.note': 'Notiz',
    'node.type.resource': 'Ressource',
    'node.label': 'Bezeichnung',
    'node.content': 'Inhalt',
    'node.addTag': 'Tag hinzufügen',
    'chat.title': 'Chat-Assistent',
    'chat.placeholder': 'Fragen Sie nach Ideen oder Vorschlägen...',
    'chat.send': 'Senden',
    'chat.clear': 'Chat löschen',
    'settings.title': 'Einstellungen',
    'settings.appearance': 'Erscheinungsbild',
    'settings.behavior': 'Verhalten',
    'settings.apiConfig': 'API-Konfiguration',
    'settings.themeMode': 'Themenmodus',
    'settings.language': 'Sprache',
    'settings.fontSize': 'Schriftgröße',
    'settings.autoSave': 'Projekte automatisch speichern',
    'settings.autoBackup': 'Automatisches Backup in der Cloud',
    'settings.saveSettings': 'Einstellungen speichern',
  },
};

// Provider component
interface I18nProviderProps {
  children: ReactNode;
  defaultLocale?: string;
}

export const I18nProvider: React.FC<I18nProviderProps> = ({ children, defaultLocale = 'en' }) => {
  const [locale, setLocale] = useState(defaultLocale);

  // Translation function
  const t = (key: string, params?: Record<string, string>): string => {
    const translation = translations[locale]?.[key] || key;

    if (params) {
      return Object.entries(params).reduce(
        (acc, [paramKey, paramValue]) => acc.replace(`{{${paramKey}}}`, paramValue),
        translation
      );
    }

    return translation;
  };

  const value = {
    locale,
    setLocale,
    t,
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

// Hook to use the I18n context
export const useI18n = (): I18nContextType => {
  const context = useContext(I18nContext);

  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nContextProvider');
  }

  return context;
};
