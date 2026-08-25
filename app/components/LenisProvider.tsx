"use client";

import { ReactLenis, useLenis } from "lenis/react";
import { useLocale } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { resetLenisScroll } from "../lib/scroll-reset";

const LENIS_EASING = (t: number) => Math.min(1, 1.001 - 2 ** (-10 * t));

export const lenisScrollOptions = {
  lerp: 0.075,
  duration: 1.35,
  easing: LENIS_EASING,
  smoothWheel: true,
  touchMultiplier: 1.35,
  syncTouch: true,
  syncTouchLerp: 0.1,
};

function LenisAnchorHandler() {
  const lenis = useLenis();

  useEffect(() => {
    if (!lenis) return;

    const onClick = (event: MouseEvent) => {
      const anchor = (event.target as HTMLElement).closest(
        'a[href^="#"]'
      ) as HTMLAnchorElement | null;

      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || href === "#") return;

      const target = document.querySelector(href);
      if (!target || !(target instanceof HTMLElement)) return;

      event.preventDefault();
      lenis.scrollTo(target, {
        offset: -96,
        duration: 1.35,
        easing: LENIS_EASING,
      });
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [lenis]);

  return null;
}

/** Keep scroll at top when locale changes — Lenis otherwise jumps to footer. */
function LenisLocaleReset() {
  const locale = useLocale();
  const lenis = useLenis();
  const previousLocale = useRef(locale);

  useEffect(() => {
    if (previousLocale.current === locale) {
      return;
    }

    previousLocale.current = locale;

    requestAnimationFrame(() => {
      resetLenisScroll(lenis);
    });
  }, [locale, lenis]);

  return null;
}

function LenisHtmlClass() {
  useLenis(() => {});

  useEffect(() => {
    document.documentElement.classList.add("lenis-active");
    return () => document.documentElement.classList.remove("lenis-active");
  }, []);

  return null;
}

export default function LenisProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setEnabled(!media.matches);

    const onChange = () => setEnabled(!media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <ReactLenis root options={lenisScrollOptions}>
      <LenisHtmlClass />
      <LenisLocaleReset />
      <LenisAnchorHandler />
      {children}
    </ReactLenis>
  );
}
