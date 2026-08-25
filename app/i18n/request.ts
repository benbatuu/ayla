import { getRequestConfig } from "next-intl/server";
import { getMessages, type Locale } from "../lib/content";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requestedLocale = await requestLocale;

  const locale =
    requestedLocale &&
    routing.locales.includes(requestedLocale as "en" | "tr" | "ru")
      ? requestedLocale
      : routing.defaultLocale;

  const messages = await getMessages(locale as Locale);

  return {
    locale,
    timeZone: "Europe/Istanbul",
    messages,
  };
});