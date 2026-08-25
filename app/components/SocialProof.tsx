"use client";

import { Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { resolveExternalUrl, starFillState } from "../lib/site-links";
import { ExternalOptionalLink } from "./SiteLink";
import { Reveal } from "./scroll-motion";
import { useGoogleReviewSummary, useSiteData } from "./SiteDataProvider";

type FallbackReview = {
  name: string;
  source: string;
  rating: number;
  date: string;
  text: string;
};

function RatingStars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => {
        const state = starFillState(rating, i);
        return (
          <Star
            key={i}
            size={size}
            className={
              state === "empty"
                ? "text-[#b79a72]/25"
                : "fill-[#b79a72] text-[#b79a72]"
            }
            style={state === "half" ? { clipPath: "inset(0 50% 0 0)" } : undefined}
          />
        );
      })}
    </div>
  );
}

export default function SocialProof() {
  const t = useTranslations("socialProof");
  const { settings } = useSiteData();
  const google = useGoogleReviewSummary();

  const fallbackReviews = t.raw("reviews") as FallbackReview[];
  const displayReviews =
    google.reviews.length > 0
      ? google.reviews
      : fallbackReviews.map((review) => ({
          name: review.name,
          rating: review.rating,
          date: review.date,
          text: review.text,
          source: review.source as "Google",
        }));

  const numericRating = google.rating ?? 4.8;
  const rating = numericRating.toFixed(1);
  const reviewCount =
    google.reviewCount != null
      ? t("reviewCountLive", { count: google.reviewCount })
      : t("reviewCount");

  const showCuratedNote =
    google.fromGoogle && google.reviews.length === 0 && displayReviews.length > 0;

  const { writeReviewUrl, reviewsUrl } = google.links;
  const facebookUrl = resolveExternalUrl(settings.facebookUrl);
  const instagramUrl = resolveExternalUrl(settings.instagramUrl);

  return (
    <section id="reviews" className="relative overflow-hidden bg-[#f3f1eb] text-[#171613]">
      <div className="mx-auto max-w-[1600px] px-6 py-24 sm:py-32 lg:px-10 lg:py-40">
        <div className="grid gap-12 lg:grid-cols-[0.55fr_1fr] lg:gap-20">
          <Reveal y={28}>
            <div>
            <div className="flex items-center gap-4">
              <span className="h-px w-10 bg-black/25" />
              <span className="text-[8px] uppercase tracking-[0.35em] text-black/35">
                {t("label")}
              </span>
            </div>

            <h2 className="mt-8 text-[clamp(2.5rem,5vw,5rem)] leading-[0.9] tracking-[-0.05em]">
              {t("titleLine1")}
              <br />
              <span className="font-brand italic">{t("titleLine2")}</span>
            </h2>

            <p className="mt-6 max-w-md text-sm leading-7 text-black/50 lg:text-base">
              {t("description")}
            </p>

            {google.fromGoogle ? (
              <p className="mt-4 text-[10px] uppercase tracking-[0.2em] text-black/35">
                {t("liveFromGoogle")}
              </p>
            ) : null}

            {showCuratedNote ? (
              <p className="mt-4 max-w-md text-xs leading-6 text-black/40">
                {t("curatedReviewsNote")}
              </p>
            ) : null}

            <div className="mt-10 flex flex-wrap items-end gap-8 border-t border-black/10 pt-8">
              <div>
                <p className="text-[9px] uppercase tracking-[0.25em] text-black/35">
                  {t("ratingLabel")}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="font-brand text-4xl italic">{rating}</span>
                  <RatingStars rating={numericRating} />
                </div>
                <p className="mt-1 text-xs text-black/40">{reviewCount}</p>
              </div>

              <div className="flex flex-col gap-2">
                <a
                  href={writeReviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[9px] font-semibold uppercase tracking-[0.22em] underline decoration-black/25 underline-offset-4 transition-colors hover:text-black/70"
                >
                  {t("writeReview")} →
                </a>
                <a
                  href={reviewsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[9px] uppercase tracking-[0.2em] text-black/40 transition-colors hover:text-black/65"
                >
                  {t("viewAllReviews")} ↗
                </a>
              </div>
            </div>
            </div>
          </Reveal>

          <div className="space-y-4">
            {displayReviews.map((review, index) => (
              <Reveal key={`${review.name}-${index}`} delay={index * 0.06} y={32}>
                <article className="rounded-2xl border border-black/[0.08] bg-white/60 p-6 sm:p-8">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-[#171613]">{review.name}</p>
                    <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-black/35">
                      {review.source} · {review.date}
                    </p>
                  </div>
                  <RatingStars rating={review.rating} size={12} />
                </div>
                <p className="mt-5 text-sm leading-7 text-black/55 lg:text-[15px] lg:leading-8">
                  &ldquo;{review.text}&rdquo;
                </p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>

        <Reveal y={24} delay={0.1}>
        <div
          className={`mt-16 grid gap-px overflow-hidden border border-black/10 bg-black/10 lg:mt-20 ${
            facebookUrl ? "sm:grid-cols-2" : "sm:grid-cols-1"
          }`}
        >
          <motion.a
            href={writeReviewUrl}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5 }}
            className="group flex min-h-[120px] flex-col justify-between bg-[#f3f1eb] p-8 transition-colors duration-300 hover:bg-[#171613] hover:text-[#f3f1eb] sm:p-10"
          >
            <span className="text-[8px] uppercase tracking-[0.3em] text-black/35 group-hover:text-white/35">
              {t("platforms.0.label")}
            </span>
            <div className="mt-4 flex items-center justify-between">
              <p className="max-w-xs text-sm text-black/50 group-hover:text-white/50">
                {t("platforms.0.description")}
              </p>
              <span className="text-lg opacity-40 transition-transform group-hover:translate-x-1 group-hover:opacity-70">
                ↗
              </span>
            </div>
          </motion.a>

          {facebookUrl ? (
            <motion.a
              href={facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="group flex min-h-[120px] flex-col justify-between bg-[#f3f1eb] p-8 transition-colors duration-300 hover:bg-[#171613] hover:text-[#f3f1eb] sm:p-10"
            >
              <span className="text-[8px] uppercase tracking-[0.3em] text-black/35 group-hover:text-white/35">
                {t("platforms.1.label")}
              </span>
              <div className="mt-4 flex items-center justify-between">
                <p className="max-w-xs text-sm text-black/50 group-hover:text-white/50">
                  {t("platforms.1.description")}
                </p>
                <span className="text-lg opacity-40 transition-transform group-hover:translate-x-1 group-hover:opacity-70">
                  ↗
                </span>
              </div>
            </motion.a>
          ) : null}
        </div>
        </Reveal>

        {instagramUrl ? (
          <Reveal y={16} delay={0.05}>
          <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-black/10 pt-6 sm:flex-row sm:items-center">
            <p className="text-[8px] uppercase tracking-[0.3em] text-black/30">
              {t("instagramEyebrow")}
            </p>
            <ExternalOptionalLink
              href={instagramUrl}
              className="group inline-flex items-center gap-3 text-[9px] uppercase tracking-[0.25em]"
            >
              <span>{settings.instagramHandle || t("instagramHandle")}</span>
              <span className="transition-transform duration-300 group-hover:translate-x-1">
                ↗
              </span>
            </ExternalOptionalLink>
          </div>
          </Reveal>
        ) : null}
      </div>
    </section>
  );
}
