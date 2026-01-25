import en from "./en.json";
import hi from "./hi.json";
import es from "./es.json";
import pt from "./pt.json";
import zh from "./zh.json";
import fr from "./fr.json";

export const languages = {
  en,
  hi,
  es,
  pt,
  zh,
  fr
};

export type LanguageKey = keyof typeof languages;
