import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import MarketingScripts from "./components/MarketingScripts";
import { getMarketingSettings } from "./lib/marketing";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-brand",
  subsets: ["latin"],
  style: ["italic", "normal"],
});

export const metadata: Metadata = {
  title: "Ay'la Food & More | Bazı Şeyler Asla Değişmez",
  description: "Ay'la Food & More | Bazı Şeyler Asla Değişmez",
};

function resolveHtmlLang(cookieValue?: string) {
  if (cookieValue === "en" || cookieValue === "ru" || cookieValue === "tr") {
    return cookieValue;
  }
  return "tr";
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  let marketing = {
    googleAnalyticsId: "",
    googleTagManagerId: "",
    facebookPixelId: "",
  };
  try {
    marketing = await getMarketingSettings();
  } catch {
    /* DB unavailable — skip marketing tags */
  }
  const lang = resolveHtmlLang(cookieStore.get("NEXT_LOCALE")?.value);

  return (
    <html
      lang={lang}
      className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <MarketingScripts
          googleAnalyticsId={marketing.googleAnalyticsId}
          googleTagManagerId={marketing.googleTagManagerId}
          facebookPixelId={marketing.facebookPixelId}
        />
        {children}
      </body>
    </html>
  );
}
