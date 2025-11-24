import React, { createContext, useState, useContext, useEffect } from "react";
import {
  initializeI18n,
  changeLanguage,
  getCurrentLanguage,
  subscribeToLanguageChange,
  translate,
} from "@/lib/i18n";

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => Promise<void>;
  isLoading: boolean;
  t: (key: string, options?: any) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState("en");
  const [isLoading, setIsLoading] = useState(true);
  const [, forceUpdate] = useState({});

  useEffect(() => {
    async function init() {
      await initializeI18n();
      setLanguageState(getCurrentLanguage());
      setIsLoading(false);
    }
    init();

    const unsubscribe = subscribeToLanguageChange(() => {
      setLanguageState(getCurrentLanguage());
      forceUpdate({});
    });

    return unsubscribe;
  }, []);

  async function setLanguage(lang: string) {
    await changeLanguage(lang);
  }

  function t(key: string, options?: any) {
    return translate(key, options);
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, isLoading, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}

export function useTranslation() {
  const { t } = useLanguage();
  return { t };
}
