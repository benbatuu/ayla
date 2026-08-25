"use client";

import { NextIntlClientProvider, type AbstractIntlMessages } from "next-intl";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname, useRouter } from "../i18n/navigation";
import { routing } from "../i18n/routing";
import { resetLenisScroll } from "../lib/scroll-reset";
import { deepMergeMessages } from "../lib/locale";
import enMessages from "../messages/en.json";
import ruMessages from "../messages/ru.json";
import trMessages from "../messages/tr.json";

type Locale = (typeof routing.locales)[number];

const fallbackMessages = {
  en: enMessages,
  tr: trMessages,
  ru: ruMessages,
};

type LocaleSwitchContextValue = {
  switchLocale: (nextLocale: Locale) => void;
};

const LocaleSwitchContext = createContext<LocaleSwitchContextValue | null>(null);

export function useLocaleSwitch() {
  const context = useContext(LocaleSwitchContext);

  if (!context) {
    throw new Error("useLocaleSwitch must be used within LocaleProvider");
  }

  return context;
}

function setLocaleCookie(locale: Locale) {
  document.cookie = `NEXT_LOCALE=${locale};path=/;SameSite=Lax`;
}

function LocaleSwitchInner({
  locale,
  setLocale,
  messagesByLocale,
  children,
}: {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  messagesByLocale: Record<Locale, Record<string, unknown>>;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const switchLocale = useCallback(
    (nextLocale: Locale) => {
      if (nextLocale === locale) {
        return;
      }

      resetLenisScroll();
      setLocale(nextLocale);
      setLocaleCookie(nextLocale);
      router.replace(pathname, { locale: nextLocale, scroll: false });

      document.documentElement.lang = nextLocale;
      const metadata = messagesByLocale[nextLocale].metadata as { title: string };
      document.title = metadata.title;

      requestAnimationFrame(() => {
        resetLenisScroll();
      });
    },
    [locale, messagesByLocale, pathname, router, setLocale]
  );

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return (
    <LocaleSwitchContext.Provider value={{ switchLocale }}>
      {children}
    </LocaleSwitchContext.Provider>
  );
}

export default function LocaleProvider({
  initialLocale,
  messagesByLocale: serverMessages,
  children,
}: {
  initialLocale: Locale;
  messagesByLocale?: Record<Locale, Record<string, unknown>>;
  children: React.ReactNode;
}) {
  const messagesByLocale = useMemo(
    () => ({
      tr: deepMergeMessages(
        fallbackMessages.tr,
        (serverMessages?.tr ?? {}) as Record<string, unknown>
      ),
      en: deepMergeMessages(
        fallbackMessages.en,
        (serverMessages?.en ?? {}) as Record<string, unknown>
      ),
      ru: deepMergeMessages(
        fallbackMessages.ru,
        (serverMessages?.ru ?? {}) as Record<string, unknown>
      ),
    }),
    [serverMessages]
  );

  const [locale, setLocale] = useState<Locale>(initialLocale);

  useEffect(() => {
    setLocale(initialLocale);
  }, [initialLocale]);

  return (
    <NextIntlClientProvider
      locale={locale}
      timeZone="Europe/Istanbul"
      messages={messagesByLocale[locale] as unknown as AbstractIntlMessages}
    >
      <LocaleSwitchInner
        locale={locale}
        setLocale={setLocale}
        messagesByLocale={messagesByLocale}
      >
        {children}
      </LocaleSwitchInner>
    </NextIntlClientProvider>
  );
}
