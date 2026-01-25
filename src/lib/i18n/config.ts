// src/lib/i18n/config.ts

export const DEFAULT_LANGUAGE = "en";

export const SUPPORTED_LANGUAGES = ["en", "hi", "fr"] as const;

export type Language = (typeof SUPPORTED_LANGUAGES)[number];
