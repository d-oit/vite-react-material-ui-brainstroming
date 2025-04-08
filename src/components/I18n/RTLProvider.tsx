import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import React, { useEffect, useState } from 'react';
import { prefixer } from 'stylis';
import rtlPlugin from 'stylis-plugin-rtl';

import { useI18n } from '../../contexts/I18nContext';

// RTL languages
const RTL_LANGUAGES = ['ar', 'he', 'fa', 'ur', 'dv', 'ha', 'ku', 'ps', 'sd', 'ug', 'yi'];

// Create caches for LTR and RTL
const createLtrCache = () =>
  createCache({
    key: 'ltr',
    prepend: true,
    stylisPlugins: [prefixer],
  });

const createRtlCache = () =>
  createCache({
    key: 'rtl',
    prepend: true,
    stylisPlugins: [prefixer, rtlPlugin],
  });

interface RTLProviderProps {
  children: React.ReactNode;
}

/**
 * A provider component that handles Right-to-Left (RTL) text direction
 * based on the current language.
 */
export const RTLProvider: React.FC<RTLProviderProps> = ({ children }) => {
  const { language } = useI18n();
  const [isRtl, setIsRtl] = useState(false);
  const [cache, setCache] = useState(createLtrCache());

  // Update RTL state when language changes
  useEffect(() => {
    const languageCode = language.split('-')[0];
    const newIsRtl = RTL_LANGUAGES.includes(languageCode);

    // Update document direction
    document.dir = newIsRtl ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('dir', newIsRtl ? 'rtl' : 'ltr');
    document.body.setAttribute('dir', newIsRtl ? 'rtl' : 'ltr');

    // Update state
    setIsRtl(newIsRtl);
    setCache(newIsRtl ? createRtlCache() : createLtrCache());
  }, [language]);

  return <CacheProvider value={cache}>{children}</CacheProvider>;
};

export default RTLProvider;
