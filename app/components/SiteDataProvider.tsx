"use client";

import { createContext, useContext } from "react";
import type { getPublicSiteData, GoogleReviewSummary } from "../lib/content";
import type { Locale } from "../lib/content";

type MenuItem = Awaited<ReturnType<typeof getPublicSiteData>>["menuItems"][number];
type GalleryItem = Awaited<ReturnType<typeof getPublicSiteData>>["galleryItems"][number];
type Settings = Awaited<ReturnType<typeof getPublicSiteData>>["settings"];

type SiteDataContextValue = {
  settings: Settings;
  menuByLocale: Record<Locale, MenuItem[]>;
  galleryByLocale: Record<Locale, GalleryItem[]>;
  googleReviewSummary: GoogleReviewSummary;
};

const SiteDataContext = createContext<SiteDataContextValue | null>(null);

export function SiteDataProvider({
  settings,
  menuByLocale,
  galleryByLocale,
  googleReviewSummary,
  children,
}: SiteDataContextValue & { children: React.ReactNode }) {
  return (
    <SiteDataContext.Provider
      value={{ settings, menuByLocale, galleryByLocale, googleReviewSummary }}
    >
      {children}
    </SiteDataContext.Provider>
  );
}

export function useSiteData() {
  const context = useContext(SiteDataContext);
  if (!context) {
    throw new Error("useSiteData must be used within SiteDataProvider");
  }
  return context;
}

export function useLocalizedMenu(locale: Locale) {
  const { menuByLocale } = useSiteData();
  return menuByLocale[locale];
}

export function useLocalizedGallery(locale: Locale) {
  const { galleryByLocale } = useSiteData();
  return galleryByLocale[locale];
}

export function useGoogleReviewSummary() {
  const { googleReviewSummary } = useSiteData();
  return googleReviewSummary;
}
