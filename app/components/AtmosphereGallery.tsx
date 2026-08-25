"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Locale } from "../lib/content";
import { Reveal } from "./scroll-motion";
import { useLocalizedGallery, useSiteData } from "./SiteDataProvider";

const EASE = [0.22, 1, 0.36, 1] as const;

type MediaItem = {
  type: "video" | "image";
  src: string;
  poster?: string;
  title: string;
  subtitle: string;
};

export default function AtmosphereGallery() {
  const t = useTranslations("atmosphere");
  const locale = useLocale() as Locale;
  const media = useLocalizedGallery(locale) as MediaItem[];
  const { settings } = useSiteData();
  const IMAGE_DURATION = settings.galleryImageDuration;

  const [active, setActive] = useState(0);
  const [direction, setDirection] = useState(1);
  const [progress, setProgress] = useState(0);
  const [inView, setInView] = useState(false);

  const sectionRef = useRef<HTMLElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const current = media[active];
  const prevItem = media[(active - 1 + media.length) % media.length];
  const nextItem = media[(active + 1) % media.length];

  const posterFor = useCallback((item: MediaItem) => {
    if (item.type === "video") return item.poster || "/gallery/gallery-01.jpg";
    return item.src;
  }, []);

  const clearTimers = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (progressRef.current) clearInterval(progressRef.current);
    timerRef.current = null;
    progressRef.current = null;
  }, []);

  const next = useCallback(() => {
    if (!media.length) return;
    setDirection(1);
    setActive((i) => (i + 1) % media.length);
    setProgress(0);
  }, [media.length]);

  const previous = useCallback(() => {
    if (!media.length) return;
    setDirection(-1);
    setActive((i) => (i - 1 + media.length) % media.length);
    setProgress(0);
  }, [media.length]);

  const goTo = useCallback(
    (index: number) => {
      if (index === active) return;
      setDirection(index > active ? 1 : -1);
      setActive(index);
      setProgress(0);
    },
    [active]
  );

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting && entry.intersectionRatio > 0.35),
      { threshold: [0, 0.35, 0.6] }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Auto-advance images only (videos advance onEnded)
  useEffect(() => {
    clearTimers();
    if (!media.length || !inView || !current) return;
    if (current.type !== "image") return;

    const startedAt = Date.now();
    progressRef.current = setInterval(() => {
      const value = Math.min(((Date.now() - startedAt) / IMAGE_DURATION) * 100, 100);
      setProgress(value);
    }, 50);

    timerRef.current = setTimeout(next, IMAGE_DURATION);

    return clearTimers;
  }, [active, current, inView, media.length, IMAGE_DURATION, next, clearTimers]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const handleVideoProgress = useCallback((ratio: number) => {
    setProgress(Math.min(ratio * 100, 100));
  }, []);

  const ambientSrc = useMemo(
    () => (current ? posterFor(current) : "/gallery/gallery-01.jpg"),
    [current, posterFor]
  );

  if (!current) return null;

  return (
    <section
      id="gallery"
      ref={sectionRef}
      className="relative overflow-hidden bg-[#171613] text-[#f3f1eb]"
    >
      {/* Blurred ambient from current reel */}
      <div className="pointer-events-none absolute inset-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={ambientSrc}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0"
          >
            <Image
              src={ambientSrc}
              alt=""
              fill
              sizes="100vw"
              className="scale-110 object-cover opacity-25 blur-2xl"
            />
          </motion.div>
        </AnimatePresence>
        <div className="absolute inset-0 bg-[#171613]/70" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#171613] via-transparent to-[#171613]" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1440px] px-6 py-20 lg:px-10 lg:py-28">
        <Reveal y={28}>
          <div className="mb-10 flex items-end justify-between gap-6 lg:mb-14">
            <div>
              <div className="flex items-center gap-4">
                <span className="h-px w-10 bg-white/30" />
                <span className="text-[9px] uppercase tracking-[0.35em] text-white/45">
                  {t("label")}
                </span>
              </div>
              <h2 className="mt-6 text-[clamp(3rem,6vw,5.5rem)] leading-[0.88] tracking-[-0.055em]">
                {t("titleLine1")}
                <br />
                <span className="font-brand italic">{t("titleLine2")}</span>
              </h2>
            </div>
            <span className="hidden font-brand text-5xl italic text-white/12 lg:block">
              Ay&apos;la
            </span>
          </div>
        </Reveal>

        {/* Reels stage */}
        <div className="flex items-center justify-center gap-4 lg:gap-8">
          <SideReel item={prevItem} onClick={previous} side="left" />

          <div className="relative w-full max-w-[300px] sm:max-w-[340px] lg:max-w-[380px]">
            <div className="relative aspect-[9/16] w-full overflow-hidden bg-black">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={active}
                  custom={direction}
                  variants={{
                    initial: (dir: number) => ({
                      opacity: 0,
                      y: dir > 0 ? 40 : -40,
                      scale: 0.98,
                    }),
                    animate: { opacity: 1, y: 0, scale: 1 },
                    exit: (dir: number) => ({
                      opacity: 0,
                      y: dir > 0 ? -28 : 28,
                      scale: 1.01,
                    }),
                  }}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.55, ease: EASE }}
                  className="absolute inset-0"
                >
                  {current.type === "video" ? (
                    <ReelVideo
                      src={current.src}
                      poster={posterFor(current)}
                      active={inView}
                      onProgress={handleVideoProgress}
                      onEnded={next}
                    />
                  ) : (
                    <Image
                      src={current.src}
                      alt={current.title}
                      fill
                      priority
                      sizes="380px"
                      className="object-cover"
                    />
                  )}
                </motion.div>
              </AnimatePresence>

              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/25" />

              <div className="absolute left-4 top-4 z-10">
                <span className="font-brand text-2xl italic">
                  {String(active + 1).padStart(2, "0")}
                </span>
              </div>

              {current.type === "video" ? (
                <div className="absolute right-4 top-4 z-10 rounded-full border border-white/25 px-2.5 py-1 text-[8px] uppercase tracking-[0.2em] text-white/70">
                  Reel
                </div>
              ) : null}

              <div className="absolute inset-x-0 bottom-0 z-10 p-5">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={active}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35 }}
                  >
                    <p className="text-[8px] uppercase tracking-[0.3em] text-white/50">
                      {current.subtitle}
                    </p>
                    <p className="mt-2 font-brand text-3xl italic leading-none">
                      {current.title}
                    </p>
                  </motion.div>
                </AnimatePresence>

                <div className="mt-5 h-px overflow-hidden bg-white/20">
                  <div
                    className="h-full bg-white transition-[width] duration-100 ease-linear"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <SideReel item={nextItem} onClick={next} side="right" />
        </div>

        {/* Controls */}
        <div className="mx-auto mt-10 max-w-[380px] border-t border-white/10 pt-5 lg:max-w-none">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="font-brand text-xl italic">
                {String(active + 1).padStart(2, "0")}
              </span>
              <span className="text-[9px] uppercase tracking-[0.3em] text-white/35">
                / {String(media.length).padStart(2, "0")}
              </span>
            </div>

            <div className="hidden flex-1 items-center justify-center gap-2 px-6 lg:flex">
              {media.map((item, index) => (
                <button
                  key={`${item.src}-${index}`}
                  type="button"
                  onClick={() => goTo(index)}
                  aria-label={item.title}
                  className={`relative aspect-[9/16] w-9 overflow-hidden transition-opacity ${
                    index === active ? "opacity-100" : "opacity-30 hover:opacity-60"
                  }`}
                >
                  <Image
                    src={posterFor(item)}
                    alt=""
                    fill
                    sizes="36px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={previous}
                aria-label="Previous"
                className="flex h-10 w-10 items-center justify-center border border-white/20 text-sm transition hover:border-white/50"
              >
                ←
              </button>
              <button
                type="button"
                onClick={next}
                aria-label="Next"
                className="flex h-10 w-10 items-center justify-center border border-white/20 text-sm transition hover:border-white/50"
              >
                →
              </button>
            </div>
          </div>

          <div className="mt-5 flex justify-center gap-1.5 lg:hidden">
            {media.map((item, index) => (
              <button
                key={`${item.src}-dot-${index}`}
                type="button"
                aria-label={item.title}
                onClick={() => goTo(index)}
                className={`h-1 rounded-full transition-all ${
                  index === active ? "w-8 bg-white" : "w-2 bg-white/25"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function SideReel({
  item,
  onClick,
  side,
}: {
  item: MediaItem;
  onClick: () => void;
  side: "left" | "right";
}) {
  const src =
    item.type === "video" ? item.poster || "/gallery/gallery-01.jpg" : item.src;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === "left" ? "Previous" : "Next"}
      className="group relative hidden aspect-[9/16] w-[120px] shrink-0 overflow-hidden opacity-35 transition hover:opacity-70 xl:block xl:w-[140px]"
    >
      <Image src={src} alt="" fill sizes="140px" className="object-cover" />
      <div className="absolute inset-0 bg-black/45" />
      <span
        className={`absolute top-1/2 -translate-y-1/2 font-brand text-2xl italic text-white ${
          side === "left" ? "right-3" : "left-3"
        }`}
      >
        {side === "left" ? "←" : "→"}
      </span>
    </button>
  );
}

function ReelVideo({
  src,
  poster,
  active,
  onProgress,
  onEnded,
}: {
  src: string;
  poster: string;
  active: boolean;
  onProgress: (ratio: number) => void;
  onEnded: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");
    video.preload = "auto";

    let raf = 0;

    const tick = () => {
      if (video.duration && Number.isFinite(video.duration)) {
        onProgress(video.currentTime / video.duration);
      }
      raf = requestAnimationFrame(tick);
    };

    const start = async () => {
      try {
        video.currentTime = 0;
        if (active) {
          await video.play();
          raf = requestAnimationFrame(tick);
        } else {
          video.pause();
        }
      } catch {
        /* autoplay may be blocked until gesture */
      }
    };

    const onMeta = () => {
      void start();
    };

    if (video.readyState >= 1) {
      void start();
    } else {
      video.addEventListener("loadedmetadata", onMeta, { once: true });
    }

    return () => {
      cancelAnimationFrame(raf);
      video.removeEventListener("loadedmetadata", onMeta);
      video.pause();
    };
  }, [src, active, onProgress]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (active) {
      void video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [active]);

  return (
    <video
      ref={videoRef}
      src={src}
      poster={poster}
      muted
      playsInline
      autoPlay
      preload="auto"
      onEnded={onEnded}
      className="absolute inset-0 h-full w-full object-cover"
    />
  );
}
