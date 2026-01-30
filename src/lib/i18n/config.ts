// src/lib/i18n/config.ts

export const DEFAULT_LANGUAGE = "en";

export const SUPPORTED_LANGUAGES = ["en", "hi", "fr", "es", "pt", "zh"] as const;

export type Language = (typeof SUPPORTED_LANGUAGES)[number];

export const LANGUAGE_NAMES: Record<Language, string> = {
  en: "English",
  hi: "Hindi",
  fr: "French",
  es: "Spanish",
  pt: "Portuguese",
  zh: "Chinese",
};
