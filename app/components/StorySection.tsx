"use client";

import {
  motion,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useMemo, useRef, useState } from "react";
import { Link } from "../i18n/navigation";
import { useSiteData } from "./SiteDataProvider";

const EASE = [0.22, 1, 0.36, 1] as const;

type ChapterMeta = {
  number: string;
  label: string;
  image: string;
  alt: string;
  tone: "cream" | "dark" | "warm" | "night";
};

export default function RestaurantStory() {
  const tChapters = useTranslations("story.chapters");
  const t1 = useTranslations("story.chapter1");
  const t2 = useTranslations("story.chapter2");
  const t3 = useTranslations("story.chapter3");
  const t4 = useTranslations("story.chapter4");
  const { settings } = useSiteData();
  const containerRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);

  const chapters: ChapterMeta[] = useMemo(
    () => [
      {
        number: "01",
        label: tChapters("story"),
        image: settings.storyImageMain,
        alt: t1("imageMainAlt"),
        tone: "cream",
      },
      {
        number: "02",
        label: tChapters("kitchen"),
        image: settings.storyImageKitchen,
        alt: t2("imageAlt"),
        tone: "dark",
      },
      {
        number: "03",
        label: tChapters("table"),
        image: settings.storyImageTable,
        alt: t3("imageAlt"),
        tone: "warm",
      },
      {
        number: "04",
        label: tChapters("ayla"),
        image: settings.storyImageAyla,
        alt: t4("imageAlt"),
        tone: "night",
      },
    ],
    [settings, tChapters, t1, t2, t3, t4]
  );

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 28,
    restDelta: 0.001,
  });

  useMotionValueEvent(smoothProgress, "change", (latest) => {
    const index = Math.min(
      chapters.length - 1,
      Math.floor(latest * chapters.length + 0.001)
    );
    setActive(index);
  });

  return (
    <section
      id="story"
      ref={containerRef}
      className="relative h-[240vh] bg-[#171613] md:h-[300vh] lg:h-[360vh]"
    >
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <StageBackground chapters={chapters} progress={smoothProgress} />

        <ChapterOne progress={smoothProgress} />
        <ChapterTwo progress={smoothProgress} />
        <ChapterThree progress={smoothProgress} />
        <ChapterFour progress={smoothProgress} />

        <StoryChrome
          chapters={chapters}
          active={active}
          progress={smoothProgress}
        />
      </div>
    </section>
  );
}

/* ─── Shared helpers ─── */

function chapterWindow(index: number) {
  const start = index / 4;
  const enter = start + 0.02;
  const hold = start + 0.18;
  const exit = start + 0.24;
  return { start, enter, hold, exit };
}

function useChapterMotion(progress: MotionValue<number>, index: number) {
  const { start, enter, hold, exit } = chapterWindow(index);
  const isFirst = index === 0;
  const isLast = index === 3;

  const opacity = useTransform(
    progress,
    [start, enter, hold, exit],
    [isFirst ? 1 : 0, 1, 1, isLast ? 1 : 0]
  );

  const y = useTransform(
    progress,
    [start, enter, hold, exit],
    [isFirst ? 0 : 48, 0, 0, isLast ? 0 : -28]
  );

  const blur = useTransform(
    progress,
    [start, enter, hold, exit],
    [isFirst ? 0 : 8, 0, 0, isLast ? 0 : 6]
  );

  const filter = useTransform(blur, (v) => `blur(${v}px)`);

  return { opacity, y, filter };
}

function useImageMotion(progress: MotionValue<number>, index: number) {
  const { start, enter, hold, exit } = chapterWindow(index);
  const isFirst = index === 0;
  const isLast = index === 3;

  const opacity = useTransform(
    progress,
    [start, enter, hold, Math.min(exit + 0.04, 1)],
    [isFirst ? 1 : 0, 1, 1, isLast ? 1 : 0]
  );

  const scale = useTransform(progress, [start, exit], [isFirst ? 1.06 : 1.14, 1]);

  const clip = useTransform(
    progress,
    [start, enter],
    [
      isFirst ? "inset(0% 0% 0% 0%)" : "inset(14% 10% 14% 10%)",
      "inset(0% 0% 0% 0%)",
    ]
  );

  return { opacity, scale, clip };
}

/* ─── Background stage ─── */

function StageBackground({
  chapters,
  progress,
}: {
  chapters: ChapterMeta[];
  progress: MotionValue<number>;
}) {
  return (
    <div className="absolute inset-0">
      {chapters.map((chapter, index) => (
        <ChapterImage
          key={chapter.number}
          chapter={chapter}
          index={index}
          progress={progress}
        />
      ))}

      {/* Atmospheric grain */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  );
}

function ChapterImage({
  chapter,
  index,
  progress,
}: {
  chapter: ChapterMeta;
  index: number;
  progress: MotionValue<number>;
}) {
  const { opacity, scale, clip } = useImageMotion(progress, index);

  const overlays: Record<ChapterMeta["tone"], string> = {
    cream: "from-[#f3f1eb]/95 via-[#f3f1eb]/55 to-[#f3f1eb]/25",
    dark: "from-[#171613]/95 via-[#171613]/55 to-[#171613]/30",
    warm: "from-[#dcd6cb]/92 via-[#dcd6cb]/50 to-[#dcd6cb]/20",
    night: "from-black/85 via-black/45 to-black/35",
  };

  return (
    <motion.div
      style={{ opacity, clipPath: clip }}
      className="absolute inset-0 will-change-[opacity,clip-path]"
    >
      <motion.div style={{ scale }} className="absolute inset-0 will-change-transform">
        <Image
          src={chapter.image}
          alt={chapter.alt}
          fill
          priority={index === 0}
          className="object-cover"
          sizes="100vw"
        />
      </motion.div>

      <div
        className={`absolute inset-0 bg-gradient-to-r ${overlays[chapter.tone]} lg:via-transparent`}
      />
      <div
        className={`absolute inset-0 bg-gradient-to-t ${
          chapter.tone === "night"
            ? "from-black/80 via-transparent to-black/40"
            : chapter.tone === "dark"
              ? "from-[#171613]/80 via-transparent to-[#171613]/40"
              : "from-black/25 via-transparent to-transparent"
        }`}
      />
    </motion.div>
  );
}

/* ─── Chapter content ─── */

function ChapterOne({
  progress,
}: {
  progress: MotionValue<number>;
}) {
  const t = useTranslations("story.chapter1");
  const { opacity, y, filter } = useChapterMotion(progress, 0);
  const detailY = useTransform(progress, [0, 0.25], [40, -20]);
  const detailOpacity = useTransform(progress, [0.02, 0.1, 0.2, 0.26], [0, 1, 1, 0]);

  return (
    <motion.div
      style={{ opacity, y, filter }}
      className="absolute inset-0 z-10 flex items-end pb-24 text-[#171613] md:items-center md:pb-0"
    >
      <div className="mx-auto grid w-full max-w-[1440px] gap-8 px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end lg:px-10">
        <div>
          <p className="mb-5 text-[10px] font-medium uppercase tracking-[0.35em] text-black/45">
            {t("label")}
          </p>
          <h2 className="max-w-[12ch] text-[clamp(2.75rem,7vw,6.5rem)] leading-[0.9] tracking-[-0.055em]">
            {t("titleLine1")}
            <br />
            <span className="font-brand italic text-[1.05em]">{t("titleLine2")}</span>
            <br />
            {t("titleLine3")}
          </h2>
          <p className="mt-7 max-w-md text-sm leading-7 text-black/55 md:text-base md:leading-8">
            {t("paragraph")}
          </p>
          <p className="mt-4 font-brand text-2xl italic leading-none text-black/80">
            {t("tagline")}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function ChapterTwo({ progress }: { progress: MotionValue<number> }) {
  const t = useTranslations("story.chapter2");
  const { opacity, y, filter } = useChapterMotion(progress, 1);

  const lines = [t("titleLine1"), t("titleLine2"), t("titleLine3")];

  return (
    <motion.div
      style={{ opacity, y, filter }}
      className="absolute inset-0 z-20 flex items-end pb-24 text-[#f3f1eb] md:items-center md:pb-0"
    >
      <div className="mx-auto w-full max-w-[1440px] px-6 lg:px-10">
        <p className="mb-5 text-[10px] font-medium uppercase tracking-[0.35em] text-white/45">
          {t("label")}
        </p>

        <h2 className="flex flex-col gap-1 text-[clamp(2.75rem,8vw,7rem)] leading-[0.88] tracking-[-0.055em]">
          {lines.map((line, i) => (
            <span
              key={line}
              className={i === 1 ? "ml-[6vw] font-brand italic" : i === 2 ? "ml-[12vw]" : ""}
            >
              {line}
            </span>
          ))}
        </h2>

        <div className="mt-10 flex max-w-lg flex-col gap-6 border-l border-white/20 pl-5">
          <p className="text-sm leading-7 text-white/60 md:text-base md:leading-8">
            {t("paragraph")}
          </p>
          <div className="flex items-center gap-3">
            <span className="font-brand text-xl italic text-white/80">02</span>
            <span className="h-px w-10 bg-white/25" />
            <span className="text-[9px] uppercase tracking-[0.3em] text-white/40">
              {t("heartOfKitchen")}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ChapterThree({ progress }: { progress: MotionValue<number> }) {
  const t = useTranslations("story.chapter3");
  const { opacity, y, filter } = useChapterMotion(progress, 2);
  const quoteX = useTransform(progress, [0.5, 0.62, 0.74], [32, 0, -16]);

  return (
    <motion.div
      style={{ opacity, y, filter }}
      className="absolute inset-0 z-30 flex items-end pb-24 text-[#171613] md:items-end md:pb-28"
    >
      <div className="mx-auto w-full max-w-[1440px] px-6 lg:px-10">
        <p className="mb-4 text-[10px] font-medium uppercase tracking-[0.35em] text-black/40">
          {t("label")}
        </p>

        <h2 className="font-brand text-[clamp(4.5rem,16vw,12rem)] italic leading-[0.78] tracking-[-0.06em]">
          {t("title")}
          <span className="not-italic">.</span>
        </h2>

        <motion.p
          style={{ x: quoteX }}
          className="mt-8 max-w-xl text-lg leading-snug tracking-[-0.02em] text-black/70 md:text-2xl md:leading-tight"
        >
          {t("quote")}{" "}
          <span className="font-brand italic text-black">{t("quoteItalic")}</span>
        </motion.p>
      </div>
    </motion.div>
  );
}

function ChapterFour({ progress }: { progress: MotionValue<number> }) {
  const t = useTranslations("story.chapter4");
  const { opacity, y, filter } = useChapterMotion(progress, 3);
  const ctaY = useTransform(progress, [0.78, 0.9], [24, 0]);
  const ctaOpacity = useTransform(progress, [0.78, 0.88], [0, 1]);

  return (
    <motion.div
      style={{ opacity, y, filter }}
      className="absolute inset-0 z-40 flex flex-col justify-end pb-24 text-white md:justify-center md:pb-0"
    >
      <div className="mx-auto w-full max-w-[1440px] px-6 lg:px-10">
        <p className="mb-5 text-[10px] font-medium uppercase tracking-[0.35em] text-white/55">
          {t("label")}
        </p>

        <h2 className="text-[clamp(3.5rem,9vw,8.5rem)] leading-[0.84] tracking-[-0.06em]">
          {t("titleLine1")}
          <br />
          <span className="font-brand italic">{t("titleLine2")}</span>
        </h2>

        <p className="mt-7 max-w-md text-sm leading-7 text-white/65 md:text-base md:leading-8">
          {t("description")}
        </p>

        <motion.div style={{ y: ctaY, opacity: ctaOpacity }} className="mt-9">
          <Link
            href="#reservation"
            className="group inline-flex items-center gap-5 rounded-full bg-[#f3f1eb] px-7 py-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#171613] transition-transform duration-500 hover:-translate-y-0.5"
          >
            <span>{t("reservation")}</span>
            <span className="transition-transform duration-500 group-hover:translate-x-1">→</span>
          </Link>
        </motion.div>

        <div className="mt-14 flex items-end justify-between border-t border-white/15 pt-5 md:mt-16">
          <div>
            <p className="text-[9px] uppercase tracking-[0.3em] text-white/40">
              {t("location")}
            </p>
            <p className="mt-2 text-xs text-white/55">{t("hours")}</p>
          </div>
          <span className="font-brand text-3xl italic text-white/80">Ay&apos;la</span>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Chrome: progress + hint ─── */

function StoryChrome({
  chapters,
  active,
  progress,
}: {
  chapters: ChapterMeta[];
  active: number;
  progress: MotionValue<number>;
}) {
  const t = useTranslations("story");
  const tone = chapters[active]?.tone ?? "dark";
  const isLight = tone === "cream" || tone === "warm";

  const barHeight = useTransform(progress, [0, 1], ["0%", "100%"]);
  const hintOpacity = useTransform(progress, [0, 0.08], [1, 0]);

  const labelClass = isLight ? "text-black/50" : "text-white/55";
  const numberClass = isLight ? "text-black/80" : "text-white/85";
  const trackClass = isLight ? "bg-black/15" : "bg-white/20";
  const fillClass = isLight ? "bg-black/70" : "bg-white";
  const dotClass = isLight ? "bg-black" : "bg-white";

  return (
    <>
      {/* Brand mark */}
      <div className="pointer-events-none absolute left-6 top-6 z-50 hidden lg:left-10 lg:top-8 lg:block">
        <span
          className={`font-brand text-xl italic transition-colors duration-500 lg:text-2xl ${
            isLight ? "text-black/70" : "text-white/80"
          }`}
        >
          Ay&apos;la
        </span>
      </div>

      {/* Desktop chapter rail */}
      <div className="absolute right-6 top-1/2 z-50 hidden -translate-y-1/2 lg:right-10 lg:block">
        <div className="flex items-center gap-5">
          <div className="flex flex-col items-end gap-5">
            {chapters.map((chapter, index) => (
              <motion.div
                key={chapter.number}
                animate={{
                  opacity: active === index ? 1 : 0.28,
                  x: active === index ? 0 : 6,
                }}
                transition={{ duration: 0.45, ease: EASE }}
                className="flex items-center gap-3"
              >
                <span className={`text-[8px] uppercase tracking-[0.3em] ${labelClass}`}>
                  {chapter.label}
                </span>
                <span className={`font-brand text-sm italic ${numberClass}`}>
                  {chapter.number}
                </span>
              </motion.div>
            ))}
          </div>

          <div className={`relative h-40 w-px ${trackClass}`}>
            <motion.div
              style={{ height: barHeight }}
              className={`absolute left-0 top-0 w-px ${fillClass}`}
            />
          </div>
        </div>
      </div>

      {/* Mobile dots */}
      <div className="absolute bottom-8 left-6 right-6 z-50 lg:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {chapters.map((chapter, index) => (
              <motion.span
                key={chapter.number}
                animate={{
                  width: active === index ? 28 : 7,
                  opacity: active === index ? 1 : 0.3,
                }}
                transition={{ duration: 0.4, ease: EASE }}
                className={`h-1 rounded-full ${dotClass}`}
              />
            ))}
          </div>

          <motion.div
            key={active}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: EASE }}
            className="flex items-center gap-3"
          >
            <span className={`text-[8px] uppercase tracking-[0.3em] ${labelClass}`}>
              {chapters[active].label}
            </span>
            <span className={`font-brand text-lg italic ${numberClass}`}>
              {chapters[active].number}
            </span>
          </motion.div>
        </div>
      </div>

      {/* Scroll hint */}
      <motion.div
        style={{ opacity: hintOpacity }}
        className={`pointer-events-none absolute bottom-20 left-1/2 z-50 hidden -translate-x-1/2 items-center gap-4 lg:bottom-10 lg:flex ${
          isLight ? "text-black/35" : "text-white/40"
        }`}
      >
        <span className="text-[8px] uppercase tracking-[0.35em]">{t("scrollHint")}</span>
        <motion.span
          animate={{ scaleY: [1, 0.55, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          className={`h-10 w-px origin-top ${isLight ? "bg-black/25" : "bg-white/30"}`}
        />
      </motion.div>
    </>
  );
}
