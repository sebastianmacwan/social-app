// src/lib/i18n/getDictionary.ts

import { dictionaries } from "./dictionaries";
import { DEFAULT_LANGUAGE, Language } from "./config";

export function getDictionary(lang?: string) {
  if (!lang || !(lang in dictionaries)) {
    return dictionaries[DEFAULT_LANGUAGE];
  }

  return dictionaries[lang as Language];
}
