import { getSeoSettings } from "./lib/seo";

export default async function robots() {
  const seo = await getSeoSettings();
  const base = seo.canonicalBaseUrl.replace(/\/$/, "");

  return {
    rules: {
      userAgent: "*",
      allow: seo.robotsAllowIndex ? "/" : "",
      disallow: seo.robotsAllowIndex ? ["/admin", "/api"] : "/",
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
