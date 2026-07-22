export type AppLanguage = "en" | "fr";

interface LanguageValue {
  language: AppLanguage;
  t: (text: string) => string;
}

const englishLanguage: LanguageValue = {
  language: "en",
  t: (text) => text,
};

/**
 * Returns the app's fixed English presentation helpers.
 * Kept small so translated wrappers do not obscure the page components.
 */
export function useLanguage(): LanguageValue {
  return englishLanguage;
}
