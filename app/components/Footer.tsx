"use client";

import { motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "../i18n/navigation";
import { menuBrowsePathForLocale } from "../lib/locale";
import { resolveExternalUrl } from "../lib/site-links";
import { ExternalOptionalLink, LegalFooterLink } from "./SiteLink";
import { useSiteData } from "./SiteDataProvider";
import type { Locale } from "../lib/content";

function telHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

function directionsNoteForLocale(
  settings: {
    directionsNoteTr: string;
    directionsNoteEn: string;
    directionsNoteRu: string;
  },
  locale: Locale
) {
  if (locale === "en") return settings.directionsNoteEn;
  if (locale === "ru") return settings.directionsNoteRu;
  return settings.directionsNoteTr;
}

export default function Footer() {
  const t = useTranslations("footer");
  const locale = useLocale() as Locale;
  const { settings } = useSiteData();
  const menuHref = menuBrowsePathForLocale(locale);
  const mapUrl = resolveExternalUrl(settings.mapUrl);
  const instagramUrl = resolveExternalUrl(settings.instagramUrl);
  const facebookUrl = resolveExternalUrl(settings.facebookUrl);
  const whatsappUrl = resolveExternalUrl(settings.whatsappUrl);
  const directionsNote = directionsNoteForLocale(settings, locale);

  const navigation = [
    {
      title: t("discover"),
      links: [
        { label: t("links.story"), href: "#story", kind: "hash" as const },
        { label: t("links.menu"), href: menuHref, kind: "path" as const },
        { label: t("links.atmosphere"), href: "#gallery", kind: "hash" as const },
        { label: t("links.reviews"), href: "#reviews", kind: "hash" as const },
        {
          label: t("links.reservation"),
          href: "#reservation",
          kind: "hash" as const,
        },
        { label: t("links.faq"), href: "#faq", kind: "hash" as const },
      ],
    },
    {
      title: t("information"),
      links: [
        { label: t("links.contact"), href: "#contact", kind: "hash" as const },
        ...(instagramUrl
          ? [{ label: t("links.instagram"), href: instagramUrl, kind: "external" as const }]
          : []),
        ...(facebookUrl
          ? [{ label: t("links.facebook"), href: facebookUrl, kind: "external" as const }]
          : []),
        ...(whatsappUrl
          ? [{ label: t("links.whatsapp"), href: whatsappUrl, kind: "external" as const }]
          : []),
        ...(mapUrl
          ? [{ label: t("links.location"), href: mapUrl, kind: "external" as const }]
          : []),
      ],
    },
  ];

  return (
    <footer id="contact" className="bg-[#171613] text-[#f3f1eb]">
      <div className="mx-auto max-w-[1600px] px-6 lg:px-10">
        <div className="border-b border-white/10 py-20 sm:py-28 lg:py-36">
          <div className="flex flex-col justify-between gap-16 lg:flex-row lg:items-end">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <span className="block font-brand text-[clamp(6rem,16vw,15rem)] italic leading-[0.7] tracking-[-0.08em]">
                Ay&apos;la
              </span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.15 }}
              className="max-w-sm lg:pb-2"
            >
              <p className="text-sm leading-7 text-white/45">{t("statement")}</p>
              <p className="mt-5 font-brand text-2xl italic text-white/70">
                {t("tagline")}
              </p>
            </motion.div>
          </div>
        </div>

        <div className="grid border-b border-white/10 lg:grid-cols-[1.2fr_0.8fr_0.8fr]">
          <div className="border-b border-white/10 py-12 lg:border-b-0 lg:border-r lg:pr-16">
            <span className="text-[8px] uppercase tracking-[0.35em] text-white/25">
              {t("findUs")}
            </span>

            <div className="mt-7">
              <p className="font-brand text-3xl italic leading-tight text-white/80">
                {settings.addressLine1}
                <br />
                {settings.addressLine2}
              </p>

              <p className="mt-5 text-xs leading-6 text-white/35">
                {settings.businessName}
                <br />
                {settings.country}
              </p>

              <p className="mt-4 text-xs text-white/30">
                {t("hours")} · {settings.openTime} — {settings.closeTime}
              </p>

              {directionsNote ? (
                <p className="mt-5 max-w-md text-xs leading-6 text-white/35">
                  {directionsNote}
                </p>
              ) : null}

              {mapUrl ? (
                <a
                  href={mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group mt-6 inline-flex items-center gap-3 text-[8px] uppercase tracking-[0.25em] text-white/45 transition-colors hover:text-white"
                >
                  <span>{t("viewMap")}</span>
                  <span className="transition-transform duration-300 group-hover:translate-x-1">
                    →
                  </span>
                </a>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-10 border-b border-white/10 py-12 lg:border-b-0 lg:border-r lg:px-12">
            {navigation.map((group) => (
              <div key={group.title}>
                <span className="text-[8px] uppercase tracking-[0.35em] text-white/25">
                  {group.title}
                </span>

                <ul className="mt-7 space-y-4">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      {link.kind === "external" ? (
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group inline-flex items-center gap-2 text-xs text-white/50 transition-colors hover:text-white"
                        >
                          <span>{link.label}</span>
                          <span className="translate-x-[-4px] opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
                            →
                          </span>
                        </a>
                      ) : link.kind === "path" ? (
                        <a
                          href={link.href}
                          className="group inline-flex items-center gap-2 text-xs text-white/50 transition-colors hover:text-white"
                        >
                          <span>{link.label}</span>
                          <span className="translate-x-[-4px] opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
                            →
                          </span>
                        </a>
                      ) : (
                        <Link
                          href={link.href as "#story" | "#gallery" | "#reviews" | "#faq" | "#contact" | "#reservation"}
                          className="group inline-flex items-center gap-2 text-xs text-white/50 transition-colors hover:text-white"
                        >
                          <span>{link.label}</span>
                          <span className="translate-x-[-4px] opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
                            →
                          </span>
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="py-12 lg:pl-12">
            <span className="text-[8px] uppercase tracking-[0.35em] text-white/25">
              {t("contact")}
            </span>

            <div className="mt-7">
              <a
                href={telHref(settings.phone)}
                className="font-brand text-2xl italic text-white/70 transition-colors hover:text-white"
              >
                {settings.phone}
              </a>

              {settings.phoneSecondary ? (
                <a
                  href={telHref(settings.phoneSecondary)}
                  className="mt-2 block font-brand text-xl italic text-white/50 transition-colors hover:text-white"
                >
                  {settings.phoneSecondary}
                </a>
              ) : null}

              <a
                href={`mailto:${settings.email}`}
                className="mt-3 block text-xs text-white/35 transition-colors hover:text-white"
              >
                {settings.email}
              </a>

              <div className="mt-6 flex flex-col gap-3">
                <ExternalOptionalLink
                  href={whatsappUrl}
                  className="inline-flex text-[8px] uppercase tracking-[0.25em] text-white/40 transition-colors hover:text-white"
                >
                  {t("whatsappLink")}
                </ExternalOptionalLink>
                <ExternalOptionalLink
                  href={instagramUrl}
                  className="inline-flex text-[8px] uppercase tracking-[0.25em] text-white/40 transition-colors hover:text-white"
                >
                  {t("instagramLink")}
                </ExternalOptionalLink>
                <ExternalOptionalLink
                  href={facebookUrl}
                  className="inline-flex text-[8px] uppercase tracking-[0.25em] text-white/40 transition-colors hover:text-white"
                >
                  {t("facebookLink")}
                </ExternalOptionalLink>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-5 py-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[8px] uppercase tracking-[0.3em] text-white/20">
            {t("copyright", { year: new Date().getFullYear() })}
          </p>

          <div className="flex items-center gap-6">
            <LegalFooterLink
              customUrl={settings.privacyUrl}
              fallbackPath="/privacy"
              label={t("privacy")}
              className="text-[8px] uppercase tracking-[0.25em] text-white/20 transition-colors hover:text-white/50"
            />

            <LegalFooterLink
              customUrl={settings.kvkkUrl}
              fallbackPath="/kvkk"
              label={t("kvkk")}
              className="text-[8px] uppercase tracking-[0.25em] text-white/20 transition-colors hover:text-white/50"
            />

            <span className="text-[8px] uppercase tracking-[0.25em] text-white/20">
              Alanya · {new Date().getFullYear()}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
