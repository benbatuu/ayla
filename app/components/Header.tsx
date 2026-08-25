"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown, CalendarDays } from "lucide-react";
import { useLenis } from "lenis/react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Link, usePathname } from "../i18n/navigation";
import { routing } from "../i18n/routing";
import { menuBrowsePathForLocale, type AppLocale } from "../lib/locale";
import { useLocaleSwitch } from "./LocaleProvider";

const localeLabels: Record<(typeof routing.locales)[number], string> = {
  tr: "TR",
  en: "EN",
  ru: "RU",
};

const LIGHT_PATH_MARKERS = ["/privacy", "/kvkk"];

export default function RestaurantHeader({
  variant,
}: {
  variant?: "light" | "dark";
}) {
  const t = useTranslations("header");
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();
  const { switchLocale } = useLocaleSwitch();

  const [scrolled, setScrolled] = useState(false);
  const [headerHidden, setHeaderHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);

  const fullMenuHref = menuBrowsePathForLocale(locale);
  const isLightSurface =
    variant === "light" ||
    LIGHT_PATH_MARKERS.some((marker) => pathname.includes(marker));
  const useDarkText = isLightSurface || scrolled;

  const navItems = [
    { href: "#story" as const, label: t("story") },
    { href: "#menu" as const, label: t("menu") },
    { href: "#gallery" as const, label: t("gallery") },
    { href: "#reviews" as const, label: t("reviews") },
    { href: "#faq" as const, label: t("faq") },
    { href: "#contact" as const, label: t("contact") },
  ];

  function handleLocaleChange(nextLocale: (typeof routing.locales)[number]) {
    switchLocale(nextLocale);
    setLanguageOpen(false);
    setMenuOpen(false);
  }

  const lenis = useLenis();

  useLenis(({ scroll, direction }) => {
    setScrolled(scroll > 40);
    if (menuOpen) {
      setHeaderHidden(false);
      return;
    }
    if (scroll < 120) {
      setHeaderHidden(false);
      return;
    }
    setHeaderHidden(direction === 1);
  });

  useEffect(() => {
    if (!lenis) return;
    if (menuOpen) {
      lenis.stop();
    } else {
      lenis.start();
    }
  }, [menuOpen, lenis]);

  useEffect(() => {
    if (menuOpen) {
      setHeaderHidden(false);
    }
  }, [menuOpen]);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduced) return;

    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 40);
      setHeaderHidden(false);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-xs focus:font-semibold focus:uppercase focus:tracking-wider focus:text-[#171613]"
      >
        {t("skipToContent")}
      </a>
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{
          y: headerHidden ? -100 : 0,
          opacity: 1,
        }}
        transition={{
          y: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
          opacity: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
        }}
        className={`fixed left-0 right-0 top-0 z-50 transition-all duration-500 ${
          useDarkText
            ? "bg-[#f7f5f0]/95 shadow-[0_10px_40px_rgba(0,0,0,0.06)] backdrop-blur-xl"
            : "bg-transparent"
        }`}
      >
        <div
          className={`mx-auto flex h-24 max-w-[1440px] items-center justify-between px-6 transition-all duration-500 lg:px-10 ${
            useDarkText ? "h-20" : "h-24"
          }`}
        >
          <Link href="/" className="group relative z-10 flex items-center">
            <motion.span
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
              className={`font-brand text-4xl italic tracking-[-0.06em] transition-colors duration-500 ${
                useDarkText ? "text-[#161616]" : "text-white"
              }`}
            >
              Ay&apos;la
            </motion.span>
          </Link>

          <nav className="hidden items-center gap-10 lg:flex">
            {navItems.map((item, index) => (
              <motion.div
                key={item.href}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.15 + index * 0.08,
                  duration: 0.5,
                }}
              >
                <Link
                  href={item.href}
                  className={`group relative text-[13px] font-medium uppercase tracking-[0.16em] transition-colors duration-300 ${
                    useDarkText ? "text-[#333]" : "text-white/90"
                  }`}
                >
                  {item.label}
                  <span
                    className={`absolute -bottom-2 left-0 h-px w-0 transition-all duration-300 group-hover:w-full ${
                      useDarkText ? "bg-[#161616]" : "bg-white"
                    }`}
                  />
                </Link>
              </motion.div>
            ))}
          </nav>

          <div className="hidden items-center gap-5 lg:flex">
            <div className="relative">
              <button
                onClick={() => setLanguageOpen(!languageOpen)}
                className={`flex items-center gap-1.5 text-[12px] font-medium tracking-[0.15em] transition-colors ${
                  useDarkText ? "text-[#333]" : "text-white"
                }`}
              >
                {localeLabels[locale as keyof typeof localeLabels]}
                <ChevronDown
                  size={13}
                  className={`transition-transform duration-300 ${
                    languageOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              <AnimatePresence>
                {languageOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 top-8 min-w-[130px] overflow-hidden rounded-xl border border-black/5 bg-white p-1.5 shadow-xl"
                  >
                    {routing.locales.map((item) => (
                      <button
                        key={item}
                        onClick={() => handleLocaleChange(item)}
                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-xs transition-colors ${
                          locale === item
                            ? "bg-black/[0.04]"
                            : "hover:bg-black/[0.03]"
                        }`}
                      >
                        <span>{t(`languages.${item}`)}</span>
                        <span className="text-[10px] tracking-widest text-black/40">
                          {localeLabels[item]}
                        </span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link href="#reservation">
              <motion.div
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
                className={`group relative flex items-center gap-2 overflow-hidden rounded-full px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] transition-all duration-300 ${
                  useDarkText
                    ? "bg-[#161616] text-white"
                    : "bg-white text-[#161616]"
                }`}
              >
                <CalendarDays size={14} />
                <span className="relative z-10">{t("reservation")}</span>
                <span className="absolute inset-0 -translate-x-full bg-[#b79a72] transition-transform duration-500 group-hover:translate-x-0" />
              </motion.div>
            </Link>
          </div>

          <button
            onClick={() => setMenuOpen(true)}
            className={`relative z-10 flex h-11 w-11 items-center justify-center rounded-full transition-colors lg:hidden ${
              useDarkText
                ? "bg-black/[0.05] text-[#161616]"
                : "bg-white/10 text-white backdrop-blur-md"
            }`}
            aria-label={t("openMenu")}
          >
            <Menu size={20} />
          </button>
        </div>
      </motion.header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-[#f7f5f0]"
          >
            <motion.div
              initial={{ y: -30 }}
              animate={{ y: 0 }}
              exit={{ y: -30 }}
              transition={{
                duration: 0.5,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="flex h-full flex-col px-6 py-6"
            >
              <div className="flex items-center justify-between">
                <Link
                  href="/"
                  onClick={() => setMenuOpen(false)}
                  className="font-brand text-4xl italic tracking-[-0.06em]"
                >
                  Ay&apos;la
                </Link>

                <button
                  onClick={() => setMenuOpen(false)}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-black/[0.05]"
                  aria-label={t("closeMenu")}
                >
                  <X size={20} />
                </button>
              </div>

              <nav className="flex flex-1 flex-col justify-center">
                {navItems.map((item, index) => (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      delay: 0.1 + index * 0.08,
                      duration: 0.5,
                    }}
                  >
                    <Link
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      className="group flex items-center justify-between border-b border-black/10 py-5"
                    >
                      <span className="font-brand text-4xl italic">
                        {item.label}
                      </span>
                      <span className="text-xs tracking-widest text-black/30 transition-transform duration-300 group-hover:translate-x-1">
                        →
                      </span>
                    </Link>
                  </motion.div>
                ))}
              </nav>

              <div className="space-y-6">
                <Link
                  href="#reservation"
                  onClick={() => setMenuOpen(false)}
                  className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-[#161616] text-xs font-semibold uppercase tracking-[0.2em] text-white"
                >
                  <CalendarDays size={15} />
                  {t("makeReservation")}
                </Link>

                <a
                  href={fullMenuHref}
                  onClick={() => setMenuOpen(false)}
                  className="flex h-12 w-full items-center justify-center border border-black/15 text-[10px] font-semibold uppercase tracking-[0.2em] text-black/70"
                >
                  {t("fullMenu")}
                </a>

                <div className="flex items-center justify-center gap-6">
                  {routing.locales.map((item) => (
                    <button
                      key={item}
                      onClick={() => handleLocaleChange(item)}
                      className={`text-xs tracking-[0.15em] ${
                        locale === item
                          ? "font-semibold text-black"
                          : "text-black/35"
                      }`}
                    >
                      {localeLabels[item]}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
