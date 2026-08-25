import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "tr", "ru"],
  defaultLocale: "tr",
  localePrefix: "as-needed",
});