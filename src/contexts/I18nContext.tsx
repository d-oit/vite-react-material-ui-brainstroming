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
    'common.menu': 'Menu',
    'common.closeSidebar': 'Close Sidebar',
    'common.openSidebar': 'Open Sidebar',
    'common.create': 'Create',
    'common.open': 'Open',
    'common.confirm': 'Confirm',
    'nav.home': 'Home',
    'nav.projects': 'Projects',
    'nav.quickBrainstorm': 'Quick Brainstorm',
    'nav.settings': 'Settings',
    'dashboard.title': 'Dashboard',
    'dashboard.projects': 'My Projects',
    'dashboard.newProject': 'New Project',
    'dashboard.noProjects': 'No Projects Yet',
    'dashboard.createFirst': 'Create your first brainstorming project to get started.',
    'brainstorm.title': 'Brainstorming',
    'brainstorm.quickBrainstorm': 'Quick Brainstorm',
    'brainstorm.quickBrainstormDescription':
      'Create a quick brainstorming session without project setup.',
    'brainstorm.addNode': 'Add Node',
    'brainstorm.saveFlow': 'Save Flow',
    'brainstorm.newVersion': 'New Version',
    'brainstorm.start': 'Start Brainstorming',
    'brainstorm.clickToAdd': 'Click the + button to add your first idea, task, note, or resource.',
    'brainstorm.addFirstNode': 'Add First Node',
    'brainstorm.version': 'Version',
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
    'chat.typeMessage': 'Type a message...',
    'chat.offlineDisabled': 'Chat unavailable while offline',
    'chat.offlineHelp': 'Chat will be available when you reconnect',
    'chat.offlineError': 'Cannot send messages while offline',
    'chat.errorSendingMessage': 'Error sending message',
    'chat.apiKeyMissing': 'API key is not configured',
    'chat.clearChat': 'Clear Chat',
    'chat.startConversation': 'Start a conversation with the AI assistant',
    'chat.offlineMode': 'Offline Mode - Chat functionality is limited',
    'chat.offlineWarning': 'You are currently offline. Chat functionality is unavailable until you reconnect.',
    'chat.generateNodes': 'Generate brainstorming nodes from your input',
    'chat.nodesNotSupported': 'Node generation is not supported in this context',
    'chat.generateNodesError': 'An error occurred while generating nodes. Please try again.',
    'chat.suggestedNodes': 'Suggested Nodes',
    'chat.basedOnPrompt': 'Based on your prompt',
    'chat.acceptNode': 'Add this node to your brainstorming canvas',
    'chat.accept': 'Add to Canvas',
    'chat.accepted': 'Added',
    'chat.alreadyAccepted': 'This node has already been added to the canvas',
    'chat.acceptAll': 'Add All to Canvas',
    'chat.dismiss': 'Dismiss Suggestions',
    'brainstorm.nodesAdded': 'Added {{count}} nodes to the canvas',
    'brainstorm.nodeUpdated': 'Node updated successfully',
    'brainstorm.confirmDelete': 'Confirm Delete',
    'brainstorm.confirmDeleteMessage': 'Are you sure you want to delete this node? This action cannot be undone.',
    'brainstorm.dontAskAgain': 'Don\'t ask again',
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
    'project.name': 'Project Name',
    'project.nameHelper': 'Enter a descriptive name for your project',
    'project.description': 'Description',
    'project.descriptionPlaceholder': 'Describe the purpose and goals of your project',
    'project.selectTemplate': 'Select a Template',
    'project.moreInfo': 'More Information',
    'project.templateIncludes': 'This template includes',
    'project.useTemplate': 'Use This Template',
    'common.creating': 'Creating...',
    'common.close': 'Close',
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
    'common.menu': 'Menü',
    'common.closeSidebar': 'Seitenleiste schließen',
    'common.openSidebar': 'Seitenleiste öffnen',
    'common.create': 'Erstellen',
    'common.open': 'Öffnen',
    'common.confirm': 'Bestätigen',
    'nav.home': 'Startseite',
    'nav.projects': 'Projekte',
    'nav.quickBrainstorm': 'Schnelles Brainstorming',
    'nav.settings': 'Einstellungen',
    'dashboard.title': 'Dashboard',
    'dashboard.projects': 'Meine Projekte',
    'dashboard.newProject': 'Neues Projekt',
    'dashboard.noProjects': 'Noch keine Projekte',
    'dashboard.createFirst': 'Erstellen Sie Ihr erstes Brainstorming-Projekt, um zu beginnen.',
    'brainstorm.title': 'Brainstorming',
    'brainstorm.quickBrainstorm': 'Schnelles Brainstorming',
    'brainstorm.quickBrainstormDescription':
      'Erstellen Sie eine schnelle Brainstorming-Sitzung ohne Projekteinrichtung.',
    'brainstorm.addNode': 'Knoten hinzufügen',
    'brainstorm.saveFlow': 'Flow speichern',
    'brainstorm.newVersion': 'Neue Version',
    'brainstorm.start': 'Brainstorming starten',
    'brainstorm.clickToAdd':
      'Klicken Sie auf die Schaltfläche +, um Ihre erste Idee, Aufgabe, Notiz oder Ressource hinzuzufügen.',
    'brainstorm.addFirstNode': 'Ersten Knoten hinzufügen',
    'brainstorm.version': 'Version',
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
    'chat.typeMessage': 'Nachricht eingeben...',
    'chat.offlineDisabled': 'Chat im Offline-Modus nicht verfügbar',
    'chat.offlineHelp': 'Chat wird verfügbar sein, wenn Sie wieder online sind',
    'chat.offlineError': 'Im Offline-Modus können keine Nachrichten gesendet werden',
    'chat.errorSendingMessage': 'Fehler beim Senden der Nachricht',
    'chat.apiKeyMissing': 'API-Schlüssel ist nicht konfiguriert',
    'chat.clearChat': 'Chat löschen',
    'chat.startConversation': 'Starten Sie eine Unterhaltung mit dem KI-Assistenten',
    'chat.offlineMode': 'Offline-Modus - Chat-Funktionalität ist eingeschränkt',
    'chat.offlineWarning': 'Sie sind derzeit offline. Die Chat-Funktionalität ist erst wieder verfügbar, wenn Sie wieder online sind.',
    'chat.generateNodes': 'Brainstorming-Knoten aus Ihrer Eingabe generieren',
    'chat.nodesNotSupported': 'Knotengenerierung wird in diesem Kontext nicht unterstützt',
    'chat.generateNodesError': 'Beim Generieren von Knoten ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.',
    'chat.suggestedNodes': 'Vorgeschlagene Knoten',
    'chat.basedOnPrompt': 'Basierend auf Ihrer Anfrage',
    'chat.acceptNode': 'Diesen Knoten zu Ihrer Brainstorming-Leinwand hinzufügen',
    'chat.accept': 'Zur Leinwand hinzufügen',
    'chat.accepted': 'Hinzugefügt',
    'chat.alreadyAccepted': 'Dieser Knoten wurde bereits zur Leinwand hinzugefügt',
    'chat.acceptAll': 'Alle zur Leinwand hinzufügen',
    'chat.dismiss': 'Vorschläge verwerfen',
    'brainstorm.nodesAdded': '{{count}} Knoten zur Leinwand hinzugefügt',
    'brainstorm.nodeUpdated': 'Knoten erfolgreich aktualisiert',
    'brainstorm.confirmDelete': 'Löschen bestätigen',
    'brainstorm.confirmDeleteMessage': 'Sind Sie sicher, dass Sie diesen Knoten löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.',
    'brainstorm.dontAskAgain': 'Nicht erneut fragen',
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
    'project.name': 'Projektname',
    'project.nameHelper': 'Geben Sie einen beschreibenden Namen für Ihr Projekt ein',
    'project.description': 'Beschreibung',
    'project.descriptionPlaceholder': 'Beschreiben Sie den Zweck und die Ziele Ihres Projekts',
    'project.selectTemplate': 'Wählen Sie eine Vorlage',
    'project.moreInfo': 'Weitere Informationen',
    'project.templateIncludes': 'Diese Vorlage enthält',
    'project.useTemplate': 'Diese Vorlage verwenden',
    'common.creating': 'Wird erstellt...',
    'common.close': 'Schließen',
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
