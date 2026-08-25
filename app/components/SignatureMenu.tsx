"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import type { AppLocale } from "../lib/locale";
import { menuBrowsePathForLocale } from "../lib/locale";
import { SIGNATURE_DISH_IMAGES } from "../lib/signature-dishes";
import { useLocalizedMenu } from "./SiteDataProvider";

const AUTO_MS = 5500;

type Dish = {
  number: string;
  category: string;
  name: string;
  description: string;
  image: string;
  price?: string;
};

export default function SignatureMenu() {
  const t = useTranslations("menu");
  const locale = useLocale() as AppLocale;
  const localized = useLocalizedMenu(locale) as Dish[] | undefined;
  const menuBrowseHref = menuBrowsePathForLocale(locale);

  const fallbackDishes = useMemo(() => {
    const raw = t.raw("dishes") as Array<{
      category: string;
      name: string;
      description: string;
    }>;
    return (raw ?? []).slice(0, SIGNATURE_DISH_IMAGES.length).map((dish, index) => ({
      number: String(index + 1).padStart(2, "0"),
      category: dish.category,
      name: dish.name,
      description: dish.description,
      image: SIGNATURE_DISH_IMAGES[index],
    }));
  }, [t]);

  const dishes = useMemo(() => {
    const source =
      localized && localized.length > 0 ? localized : fallbackDishes;
    return source.slice(0, SIGNATURE_DISH_IMAGES.length).map((dish, index) => ({
      number: dish.number || String(index + 1).padStart(2, "0"),
      category: dish.category,
      name: dish.name,
      description: dish.description,
      price: "price" in dish && dish.price ? dish.price : "—",
      image: SIGNATURE_DISH_IMAGES[index],
    }));
  }, [localized, fallbackDishes]);

  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const safeIndex = dishes.length
    ? Math.min(active, dishes.length - 1)
    : 0;
  const current = dishes[safeIndex];
  const imageSrc = SIGNATURE_DISH_IMAGES[safeIndex];

  useEffect(() => {
    if (dishes.length <= 1 || paused) return;
    const id = window.setTimeout(() => {
      setActive((i) => (i + 1) % dishes.length);
    }, AUTO_MS);
    return () => window.clearTimeout(id);
  }, [active, dishes.length, paused]);

  if (!current || !imageSrc) return null;

  return (
    <section
      id="menu"
      className="relative bg-[#f3f1eb] text-[#171613]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_60%_40%,rgba(183,154,114,0.12),transparent_55%)]" />

      <div className="relative mx-auto grid max-w-[1440px] items-center gap-10 px-6 py-20 lg:grid-cols-[0.95fr_auto_0.95fr] lg:gap-14 lg:px-10 lg:py-28">
        <div className="order-1">
          <div className="flex items-center gap-4">
            <span className="h-px w-10 bg-black/30" />
            <span className="text-[9px] font-medium uppercase tracking-[0.35em] text-black/45">
              {t("label")}
            </span>
          </div>

          <h2 className="mt-7 text-[clamp(3rem,6vw,5.5rem)] leading-[0.88] tracking-[-0.055em]">
            {t("titleLine1")}
            <br />
            <span className="font-brand italic">{t("titleLine2")}</span>
          </h2>

          <p className="mt-7 max-w-sm text-sm leading-7 text-black/50 md:text-base md:leading-8">
            {t("description")}
          </p>

          <div className="mt-10 hidden space-y-1 border-t border-black/10 pt-5 lg:block">
            {dishes.map((dish, index) => (
              <button
                key={`${dish.number}-${dish.name}`}
                type="button"
                onClick={() => setActive(index)}
                className="group flex w-full items-center gap-4 py-2.5 text-left"
              >
                <span
                  className={`font-brand text-lg italic transition-opacity ${
                    index === safeIndex ? "opacity-100" : "opacity-30"
                  }`}
                >
                  {dish.number}
                </span>
                <span
                  className={`h-px flex-1 transition-all ${
                    index === safeIndex ? "bg-black/40" : "bg-black/10"
                  }`}
                />
                <span
                  className={`max-w-[55%] truncate text-[10px] uppercase tracking-[0.18em] transition-opacity ${
                    index === safeIndex ? "opacity-100" : "opacity-35"
                  }`}
                >
                  {dish.name}
                </span>
              </button>
            ))}
          </div>

          <a
            href={menuBrowseHref}
            className="group mt-10 inline-flex items-center gap-4 border-b border-black/30 pb-1.5 text-[9px] font-semibold uppercase tracking-[0.25em]"
          >
            <span>{t("exploreMenu")}</span>
            <span className="transition-transform duration-500 group-hover:translate-x-1.5">
              →
            </span>
          </a>
        </div>

        <div className="order-2 mx-auto w-full max-w-[300px] sm:max-w-[340px] lg:max-w-[360px]">
          <div className="relative mx-auto aspect-square w-full">
            <div
              aria-hidden
              className="absolute inset-x-[16%] bottom-[4%] h-[16%] rounded-[100%] bg-black/15 blur-2xl"
            />

            {/* Plain <img> — no next/image, no framer opacity:0 */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={imageSrc}
              src={imageSrc}
              alt={current.name}
              width={672}
              height={600}
              decoding="async"
              className="relative z-[1] h-full w-full object-contain"
              style={{
                filter: "drop-shadow(0 22px 36px rgba(23, 22, 19, 0.28))",
              }}
            />

            <div className="pointer-events-none absolute left-0 top-0 z-[2]">
              <span className="font-brand text-3xl italic text-black/70">
                {current.number}
              </span>
            </div>

            <div className="absolute inset-x-0 bottom-0 z-[2] h-px overflow-hidden bg-black/10">
              <div
                key={`${safeIndex}-${paused}`}
                className={`h-full bg-black/55 ${paused ? "" : "animate-[signature-menu-progress_5.5s_linear_forwards]"}`}
              />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between gap-3 lg:hidden">
            <button
              type="button"
              onClick={() =>
                setActive((i) => (i - 1 + dishes.length) % dishes.length)
              }
              className="flex h-10 w-10 items-center justify-center border border-black/15 text-sm"
              aria-label="Previous dish"
            >
              ←
            </button>
            <div className="flex gap-1.5">
              {dishes.map((dish, index) => (
                <button
                  key={`${dish.number}-dot`}
                  type="button"
                  aria-label={dish.name}
                  onClick={() => setActive(index)}
                  className={`h-1 rounded-full transition-all ${
                    index === safeIndex ? "w-8 bg-black" : "w-2 bg-black/20"
                  }`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => setActive((i) => (i + 1) % dishes.length)}
              className="flex h-10 w-10 items-center justify-center border border-black/15 text-sm"
              aria-label="Next dish"
            >
              →
            </button>
          </div>
        </div>

        <div className="order-3 hidden lg:block">
          <p className="text-[9px] uppercase tracking-[0.3em] text-black/40">
            {current.category}
          </p>
          <h3 className="mt-4 text-[clamp(2.5rem,4vw,3.75rem)] leading-[0.92] tracking-[-0.05em]">
            {current.name}
          </h3>
          {current.price && current.price !== "—" ? (
            <p className="mt-3 text-sm text-black/45">{current.price}</p>
          ) : null}
          <div className="mt-7 h-px w-14 bg-black/20" />
          <p className="mt-7 text-base leading-8 text-black/55">
            {current.description}
          </p>
          <div className="mt-10 flex items-end gap-3">
            <span className="font-brand text-5xl italic leading-none">
              {current.number}
            </span>
            <span className="mb-1 text-[9px] uppercase tracking-[0.3em] text-black/35">
              / {String(dishes.length).padStart(2, "0")}
            </span>
          </div>
        </div>

        <div className="order-3 lg:hidden">
          <p className="text-[9px] uppercase tracking-[0.25em] text-black/40">
            {current.category}
          </p>
          <h3 className="mt-2 text-2xl tracking-[-0.03em]">{current.name}</h3>
          <p className="mt-3 text-sm leading-7 text-black/55">
            {current.description}
          </p>
        </div>
      </div>
    </section>
  );
}
