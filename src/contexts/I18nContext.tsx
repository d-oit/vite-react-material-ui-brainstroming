import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { translations as allTranslations } from '../i18n';
import defaultTranslations from '../i18n/en';

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

// Default translations are imported from '../i18n/en'

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
      setIsLoading(true);
      try {
        // Check if we have translations for the selected locale
        if (locale in allTranslations) {
          // Type assertion to ensure TypeScript knows this is a valid key
          const localeKey = locale as keyof typeof allTranslations;
          setTranslations(allTranslations[localeKey]);
        } else {
          // Fallback to default translations if the locale is not supported
          console.warn(`Translations for locale '${locale}' not found, using default (en)`);
          setTranslations(defaultTranslations);
        }
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
