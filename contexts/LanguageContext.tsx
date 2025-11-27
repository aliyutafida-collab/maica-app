import React, { createContext, useState, useContext, useEffect, useCallback } from "react";
import { I18nManager, Alert, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { translations } from "@/lib/translations";
import * as Localization from "expo-localization";
import { reloadAppAsync } from "expo";

type Language = "en" | "fr" | "ha" | "yo" | "ig" | "ar";

const RTL_LANGUAGES = ["ar"];
const SUPPORTED_LANGUAGES = ["en", "fr", "ha", "yo", "ig", "ar"];

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  isLoading: boolean;
  isRTL: boolean;
  t: (key: string, options?: any) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const [isLoading, setIsLoading] = useState(true);
  const [isRTL, setIsRTL] = useState(false);

  useEffect(() => {
    loadLanguage();
  }, []);

  async function loadLanguage() {
    try {
      const saved = await AsyncStorage.getItem("@maica_language");
      let resolvedLang: Language = "en";
      
      if (saved && SUPPORTED_LANGUAGES.includes(saved)) {
        resolvedLang = saved as Language;
      } else {
        const deviceLang = Localization.getLocales()[0]?.languageCode as Language;
        resolvedLang = SUPPORTED_LANGUAGES.includes(deviceLang || "")
          ? deviceLang
          : "en";
      }
      
      setLanguageState(resolvedLang);
      const needsRTL = RTL_LANGUAGES.includes(resolvedLang);
      setIsRTL(needsRTL);
      
      if (needsRTL !== I18nManager.isRTL) {
        I18nManager.allowRTL(needsRTL);
        I18nManager.forceRTL(needsRTL);
        
        const hasReloaded = await AsyncStorage.getItem("@maica_rtl_reloaded");
        if (hasReloaded !== resolvedLang) {
          await AsyncStorage.setItem("@maica_rtl_reloaded", resolvedLang);
          if (Platform.OS !== "web") {
            try {
              await reloadAppAsync();
            } catch (error) {
              console.error("Failed to reload for RTL:", error);
            }
          }
        }
      }
    } catch (error) {
      console.error("Failed to load language:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function setLanguage(lang: Language) {
    const needsRTL = RTL_LANGUAGES.includes(lang);
    const currentRTL = I18nManager.isRTL;
    
    setLanguageState(lang);
    setIsRTL(needsRTL);
    await AsyncStorage.setItem("@maica_language", lang);
    
    if (needsRTL !== currentRTL) {
      I18nManager.allowRTL(needsRTL);
      I18nManager.forceRTL(needsRTL);
      
      if (Platform.OS !== "web") {
        Alert.alert(
          needsRTL ? "تم تغيير اللغة" : "Language Changed",
          needsRTL ? "سيتم إعادة تشغيل التطبيق لتطبيق التغييرات" : "The app will restart to apply changes",
          [
            {
              text: needsRTL ? "حسناً" : "OK",
              onPress: async () => {
                try {
                  await reloadAppAsync();
                } catch (error) {
                  console.error("Failed to reload app:", error);
                }
              },
            },
          ]
        );
      }
    }
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
    <LanguageContext.Provider value={{ language, setLanguage, isLoading, isRTL, t }}>
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

export function useRTL() {
  const { isRTL, language } = useLanguage();
  return { isRTL, language };
}
