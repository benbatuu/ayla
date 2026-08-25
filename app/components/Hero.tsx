"use client";

import { motion, useTransform } from "framer-motion";
import { CalendarDays } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { menuBrowsePathForLocale } from "../lib/locale";
import { Link } from "../i18n/navigation";
import { useLenisScrollY } from "./scroll-motion";
import { useSiteData } from "./SiteDataProvider";
import type { Locale } from "../lib/content";

const HERO_VIDEO_SRC = "/hero-promote.mp4";
/** Tailwind `lg` — video only on desktop */
const DESKTOP_MQ = "(min-width: 1024px)";

export default function Hero() {
  const t = useTranslations("hero");
  const locale = useLocale() as Locale;
  const { settings } = useSiteData();
  const menuHref = menuBrowsePathForLocale(locale);
  const scrollY = useLenisScrollY();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showVideo, setShowVideo] = useState(false);

  const bgScale = useTransform(scrollY, [0, 700], [1, 1.14]);
  const bgY = useTransform(scrollY, [0, 700], [0, 140]);
  const contentY = useTransform(scrollY, [0, 550], [0, -72]);
  const contentOpacity = useTransform(scrollY, [0, 480], [1, 0]);
  const overlayOpacity = useTransform(scrollY, [0, 500], [0.35, 0.65]);

  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_MQ);
    const sync = () => setShowVideo(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!showVideo) return;
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");

    const tryPlay = () => {
      void video.play().catch(() => {});
    };

    tryPlay();
    video.addEventListener("loadeddata", tryPlay);
    return () => {
      video.removeEventListener("loadeddata", tryPlay);
      video.pause();
    };
  }, [showVideo]);

  return (
    <section className="relative min-h-screen overflow-hidden bg-[#171613] text-white">
      <div className="absolute inset-0">
        <motion.div
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{
            duration: 2,
            ease: [0.22, 1, 0.36, 1],
          }}
          style={{ scale: bgScale, y: bgY }}
          className="absolute inset-0 origin-center will-change-transform"
        >
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url('${settings.heroImageUrl}')` }}
            role="img"
            aria-label="Ay'la Food & More"
          />
          {showVideo ? (
            <video
              ref={videoRef}
              className="absolute inset-0 hidden h-full w-full object-cover lg:block"
              src={HERO_VIDEO_SRC}
              poster={settings.heroImageUrl}
              muted
              playsInline
              autoPlay
              loop
              preload="metadata"
              aria-hidden
            />
          ) : null}
        </motion.div>
        <motion.div
          style={{ opacity: overlayOpacity }}
          className="absolute inset-0 bg-black"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/25" />
      </div>

      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className="relative z-10 flex min-h-screen items-end will-change-transform"
      >
        <div className="mx-auto w-full max-w-[1440px] px-6 pb-20 lg:px-10 lg:pb-24">
          <div className="max-w-4xl">
            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
              className="mb-5 text-[10px] font-medium uppercase tracking-[0.35em] text-white/70"
            >
              {t("eyebrow")}
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.5,
                duration: 1,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="font-brand text-[clamp(4rem,9vw,9rem)] italic leading-[0.82] tracking-[-0.06em]"
            >
              {t("title")}
              <br />
              <span>{t("titleLine2")}</span>
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.78, duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
              className="mt-9 flex flex-col gap-5 sm:flex-row sm:items-center"
            >
              <Link
                href="#reservation"
                className="group flex w-fit items-center gap-3 rounded-full bg-white px-6 py-3.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#171613] transition-transform duration-500 hover:-translate-y-0.5"
              >
                <CalendarDays size={15} />
                <span>{t("reservation")}</span>
                <span className="transition-transform duration-300 group-hover:translate-x-1">
                  →
                </span>
              </Link>

              <Link
                href="#menu"
                className="flex w-fit items-center gap-3 text-[11px] font-medium uppercase tracking-[0.18em] text-white/80 transition-colors hover:text-white"
              >
                {t("discoverMenu")}
                <span className="animate-[float_2.4s_ease-in-out_infinite]">↓</span>
              </Link>

              <a
                href={menuHref}
                className="hidden w-fit items-center gap-3 text-[11px] font-medium uppercase tracking-[0.18em] text-white/55 transition-colors hover:text-white/80 sm:flex"
              >
                {t("fullMenu")} →
              </a>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1, duration: 0.9 }}
            className="mt-16 flex items-end justify-between border-t border-white/20 pt-5"
          >
            <p className="max-w-xs text-[11px] leading-relaxed text-white/55">
              {t("tagline")}
            </p>

            <div className="hidden items-center gap-3 text-[10px] uppercase tracking-[0.25em] text-white/50 sm:flex">
              <span>{t("scroll")}</span>
              <motion.span
                animate={{ y: [0, 6, 0] }}
                transition={{
                  duration: 2.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                ↓
              </motion.span>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
