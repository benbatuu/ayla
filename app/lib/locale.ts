export type AppLocale = "tr" | "en" | "ru";

export const appLocales: AppLocale[] = ["tr", "en", "ru"];

export function localeFallbackOrder(locale: AppLocale): AppLocale[] {
  if (locale === "ru") return ["ru", "en", "tr"];
  if (locale === "en") return ["en", "tr"];
  return ["tr", "en"];
}

export function pickTranslation<T extends { locale: string }>(
  translations: T[],
  locale: AppLocale
): T | undefined {
  for (const loc of localeFallbackOrder(locale)) {
    const found = translations.find((t) => t.locale === loc);
    if (found) return found;
  }
  return translations[0];
}

export function websitePathForLocale(locale: AppLocale) {
  if (locale === "tr") return "/";
  return `/${locale}`;
}

export function menuBrowsePathForLocale(locale: AppLocale) {
  if (locale === "tr") return "/menu";
  return `/menu/${locale}`;
}

export function deepMergeMessages(
  base: Record<string, unknown>,
  override: Record<string, unknown>
): Record<string, unknown> {
  const result = { ...base };

  for (const [key, value] of Object.entries(override)) {
    const existing = result[key];

    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      existing &&
      typeof existing === "object" &&
      !Array.isArray(existing)
    ) {
      result[key] = deepMergeMessages(
        existing as Record<string, unknown>,
        value as Record<string, unknown>
      );
    } else {
      result[key] = value;
    }
  }

  return result;
}
