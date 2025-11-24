import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { translations } from "@/lib/translations";
import * as Localization from "expo-localization";

type Language = "en" | "fr" | "ha" | "yo" | "ig";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  isLoading: boolean;
  t: (key: string, options?: any) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLanguage();
  }, []);

  async function loadLanguage() {
    try {
      const saved = await AsyncStorage.getItem("@maica_language");
      if (saved && ["en", "fr", "ha", "yo", "ig"].includes(saved)) {
        setLanguageState(saved as Language);
      } else {
        const deviceLang = Localization.getLocales()[0]?.languageCode as Language;
        const defaultLang: Language = ["en", "fr", "ha", "yo", "ig"].includes(
          deviceLang || ""
        )
          ? deviceLang
          : "en";
        setLanguageState(defaultLang);
      }
    } catch (error) {
      console.error("Failed to load language:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function setLanguage(lang: Language) {
    setLanguageState(lang);
    await AsyncStorage.setItem("@maica_language", lang);
  }

  function t(key: string): string {
    const keys = key.split(".");
    let value: any = translations[language];
    for (const k of keys) {
      value = value?.[k];
    }
    return value || key;
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
