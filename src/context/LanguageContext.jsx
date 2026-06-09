'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { translations } from '@/data/translations';

const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    try {
      const savedLanguage = window.localStorage.getItem('language');
      if (savedLanguage && translations[savedLanguage]) {
        setLanguage(savedLanguage);
      }
    } catch (error) {
      console.warn('[LanguageProvider] Could not read saved language:', error);
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem('language', language);
    } catch (error) {
      console.warn('[LanguageProvider] Could not save language:', error);
    }
  }, [language]);

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'en' ? 'es' : 'en'));
  };

  const value = useMemo(() => ({
    language,
    toggleLanguage,
    t: translations[language] || translations.en,
  }), [language]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
