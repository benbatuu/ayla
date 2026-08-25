"use client";

import { useLocale, useTranslations } from "next-intl";
import { resolveExternalUrl } from "../lib/site-links";
import type { AppLocale } from "../lib/locale";
import { Reveal } from "./scroll-motion";
import { useSiteData } from "./SiteDataProvider";

function telHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

function directionsNoteForLocale(
  settings: {
    directionsNoteTr: string;
    directionsNoteEn: string;
    directionsNoteRu: string;
  },
  locale: AppLocale
) {
  if (locale === "en") return settings.directionsNoteEn;
  if (locale === "ru") return settings.directionsNoteRu;
  return settings.directionsNoteTr;
}

export default function FaqSection() {
  const t = useTranslations("faq");
  const locale = useLocale() as AppLocale;
  const { settings } = useSiteData();

  const items = t.raw("items") as Array<{ q: string; a: string }>;
  const whatsappUrl = resolveExternalUrl(settings.whatsappUrl);
  const mapUrl = resolveExternalUrl(settings.mapUrl);
  const directionsNote = directionsNoteForLocale(settings, locale);
  const threshold = settings.largePartyPhoneThreshold ?? 8;
  const maxDays = settings.maxReservationDaysAhead ?? 7;

  function fill(text: string) {
    return text
      .replace("{maxDays}", String(maxDays))
      .replace("{threshold}", String(threshold))
      .replace("{openTime}", settings.openTime)
      .replace("{closeTime}", settings.closeTime)
      .replace("{phone}", settings.phone);
  }

  return (
    <section id="faq" className="relative overflow-hidden bg-[#171613] text-[#f3f1eb]">
      <div className="mx-auto max-w-[1600px] px-6 py-24 sm:py-32 lg:px-10 lg:py-40">
        <div className="grid gap-16 lg:grid-cols-[0.45fr_1fr] lg:gap-24">
          <Reveal y={28}>
            <div>
              <div className="flex items-center gap-4">
                <span className="h-px w-10 bg-white/25" />
                <span className="text-[8px] uppercase tracking-[0.35em] text-white/35">
                  {t("eyebrow")}
                </span>
              </div>

              <h2 className="mt-8 text-[clamp(2.5rem,5vw,4.5rem)] leading-[0.92] tracking-[-0.05em]">
                <span className="font-brand italic">{t("title")}</span>
              </h2>

              <p className="mt-6 max-w-sm text-sm leading-7 text-white/45 lg:text-base">
                {t("intro")}
              </p>

              <div className="mt-12 border-t border-white/10 pt-10">
                <p className="text-[8px] uppercase tracking-[0.35em] text-white/30">
                  {t("directionsTitle")}
                </p>
                <p className="mt-4 text-sm leading-7 text-white/45">{directionsNote}</p>
                <p className="mt-4 text-sm text-white/35">
                  {settings.addressLine1}
                  <br />
                  {settings.addressLine2}
                </p>
                <p className="mt-3 text-[10px] uppercase tracking-[0.2em] text-white/25">
                  {t("hoursLabel")} · {settings.openTime} — {settings.closeTime}
                </p>

                <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3">
                  <a
                    href={telHref(settings.phone)}
                    className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/80 transition-colors hover:text-white"
                  >
                    {t("callUs")} →
                  </a>
                  {whatsappUrl ? (
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/55 transition-colors hover:text-white"
                    >
                      {t("whatsapp")} →
                    </a>
                  ) : null}
                  {mapUrl ? (
                    <a
                      href={mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/55 transition-colors hover:text-white"
                    >
                      {t("directionsCta")} →
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          </Reveal>

          <div className="space-y-0 border-t border-white/10 lg:border-t-0 lg:border-l lg:pl-16 xl:pl-20">
            {items.map((item, index) => (
              <Reveal key={item.q} y={20} delay={index * 0.06}>
                <div
                  className={`py-8 ${
                    index < items.length - 1 ? "border-b border-white/10" : ""
                  }`}
                >
                  <h3 className="text-lg tracking-[-0.02em] text-white/90 sm:text-xl">
                    {fill(item.q)}
                  </h3>
                  <p className="mt-3 max-w-xl text-sm leading-7 text-white/45">
                    {fill(item.a)}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
