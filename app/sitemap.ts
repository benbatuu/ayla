import type { MetadataRoute } from "next";
import { getSeoSettings } from "./lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const seo = await getSeoSettings();
  const base = seo.canonicalBaseUrl.replace(/\/$/, "");
  const now = new Date();

  const entries: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/en`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/ru`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/menu`, lastModified: now, changeFrequency: "daily", priority: 0.85 },
    { url: `${base}/menu/en`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/menu/ru`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/en/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/ru/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/kvkk`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/en/kvkk`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/ru/kvkk`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  return entries;
}
