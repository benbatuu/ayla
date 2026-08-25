"use client";

import {
    AnimatePresence,
    motion,
    useMotionValue,
    useScroll,
    useSpring,
    useTransform,
} from "framer-motion";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "../i18n/navigation";
import type { AvailabilityResponse, SlotAvailability } from "../lib/reservation-types";
import { toDateKey } from "../lib/reservation-types";
import { useSiteData } from "./SiteDataProvider";

/** Keep in sync with app/lib/reservations.ts (client-safe; avoid importing prisma). */
const MAX_RESERVATION_DAYS_AHEAD = 7;
const LARGE_PARTY_PHONE_THRESHOLD = 8;

type Step = "reservation" | "details" | "success";

function telHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

export default function ReservationFinale() {
  const t = useTranslations("reservation");
  const { settings } = useSiteData();
  const monthNames = t.raw("months") as string[];
  const dayNames = t.raw("daysShort") as string[];
  const restaurantPhone = settings.phone;
  const maxDaysAhead =
    settings.maxReservationDaysAhead ?? MAX_RESERVATION_DAYS_AHEAD;
  const largePartyThreshold =
    settings.largePartyPhoneThreshold ?? LARGE_PARTY_PHONE_THRESHOLD;
    const [step, setStep] = useState<Step>("reservation");

    const [guests, setGuests] = useState(2);

    const [selectedDate, setSelectedDate] =
        useState<Date | null>(null);

    const [selectedTime, setSelectedTime] =
        useState<string | null>(null);

    const [slotAvailability, setSlotAvailability] = useState<SlotAvailability[]>([]);
    const [availabilityLoading, setAvailabilityLoading] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [calendarOpen, setCalendarOpen] =
        useState(false);

    const [timeOpen, setTimeOpen] =
        useState(false);

    const [details, setDetails] = useState({
        name: "",
        phone: "",
        email: "",
        note: "",
    });

    const [currentMonth, setCurrentMonth] =
        useState(new Date());

    const sectionRef = useRef<HTMLElement>(null);

    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ["start end", "end start"],
    });

    const bgScale = useTransform(scrollYProgress, [0, 1], [1.12, 1]);
    const bgY = useTransform(scrollYProgress, [0, 1], ["-3%", "3%"]);

    /*
     * ----------------------------------------------------------
     * MOUSE PARALLAX
     * ----------------------------------------------------------
     */

    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const smoothX = useSpring(mouseX, {
        stiffness: 50,
        damping: 20,
    });

    const smoothY = useSpring(mouseY, {
        stiffness: 50,
        damping: 20,
    });

    const backgroundX = useTransform(
        smoothX,
        [-500, 500],
        [-12, 12]
    );

    const backgroundY = useTransform(
        smoothY,
        [-500, 500],
        [-8, 8]
    );

    function handleMouseMove(
        event: React.MouseEvent<HTMLElement>
    ) {
        const x =
            event.clientX - window.innerWidth / 2;

        const y =
            event.clientY - window.innerHeight / 2;

        mouseX.set(x);
        mouseY.set(y);
    }

    /*
     * ----------------------------------------------------------
     * CALENDAR
     * ----------------------------------------------------------
     */

    const calendarDays = useMemo(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        /*
         * JS:
         * Sunday = 0
         *
         * Biz:
         * Monday = 0
         */

        const startDay =
            firstDay.getDay() === 0
                ? 6
                : firstDay.getDay() - 1;

        const days = [];

        for (let i = 0; i < startDay; i++) {
            days.push(null);
        }

        for (
            let day = 1;
            day <= lastDay.getDate();
            day++
        ) {
            days.push(
                new Date(year, month, day)
            );
        }

        return days;
    }, [currentMonth]);

    function startOfDay(date: Date) {
        const next = new Date(date);
        next.setHours(0, 0, 0, 0);
        return next;
    }

    function isPast(date: Date) {
        return startOfDay(date) < startOfDay(new Date());
    }

    function isBeyondWindow(date: Date) {
        const max = startOfDay(new Date());
        max.setDate(max.getDate() + maxDaysAhead);
        return startOfDay(date) > max;
    }

    function isDateDisabled(date: Date) {
        return isPast(date) || isBeyondWindow(date);
    }

    function isSameDate(
        first: Date | null,
        second: Date
    ) {
        if (!first) return false;

        return (
            first.getFullYear() ===
            second.getFullYear() &&
            first.getMonth() ===
            second.getMonth() &&
            first.getDate() ===
            second.getDate()
        );
    }

    function selectDate(date: Date) {
        if (isDateDisabled(date)) return;

        setSelectedDate(date);
        setSelectedTime(null);
        setCalendarOpen(false);
    }

    function canGoPreviousMonth() {
        const today = new Date();
        return (
            currentMonth.getFullYear() > today.getFullYear() ||
            (currentMonth.getFullYear() === today.getFullYear() &&
                currentMonth.getMonth() > today.getMonth())
        );
    }

    function canGoNextMonth() {
        const firstOfNext = new Date(
            currentMonth.getFullYear(),
            currentMonth.getMonth() + 1,
            1
        );
        return !isBeyondWindow(firstOfNext);
    }

    const selectedDateKey = selectedDate ? toDateKey(selectedDate) : null;

    const fetchAvailability = useCallback(async () => {
        if (!selectedDateKey) {
            setSlotAvailability([]);
            return;
        }

        setAvailabilityLoading(true);

        try {
            const response = await fetch(
                `/api/reservations/availability?date=${selectedDateKey}`,
                { cache: "no-store" }
            );

            if (!response.ok) {
                setSlotAvailability([]);
                return;
            }

            const data = (await response.json()) as AvailabilityResponse;
            setSlotAvailability(data.slots);
        } catch {
            setSlotAvailability([]);
        } finally {
            setAvailabilityLoading(false);
        }
    }, [selectedDateKey]);

    useEffect(() => {
        void fetchAvailability();
    }, [fetchAvailability]);

    useEffect(() => {
        if (!selectedDateKey || step !== "reservation") {
            return;
        }

        const intervalId = window.setInterval(() => {
            void fetchAvailability();
        }, 15000);

        return () => window.clearInterval(intervalId);
    }, [fetchAvailability, selectedDateKey, step]);

    useEffect(() => {
        if (!selectedTime) {
            return;
        }

        const selectedSlot = slotAvailability.find(
            (slot) => slot.time === selectedTime
        );

        if (
            !selectedSlot ||
            !selectedSlot.isAvailable ||
            selectedSlot.remainingCovers < guests
        ) {
            setSelectedTime(null);
        }
    }, [slotAvailability, selectedTime, guests]);

    function previousMonth() {
        if (!canGoPreviousMonth()) return;

        setCurrentMonth(
            new Date(
                currentMonth.getFullYear(),
                currentMonth.getMonth() - 1,
                1
            )
        );
    }

    function nextMonth() {
        if (!canGoNextMonth()) return;

        setCurrentMonth(
            new Date(
                currentMonth.getFullYear(),
                currentMonth.getMonth() + 1,
                1
            )
        );
    }

    /*
     * ----------------------------------------------------------
     * RESERVATION READY?
     * ----------------------------------------------------------
     */

    const selectedSlot = useMemo(
        () => slotAvailability.find((slot) => slot.time === selectedTime) ?? null,
        [slotAvailability, selectedTime]
    );

    const isLargeParty = guests > largePartyThreshold;

    const reservationReady =
        !isLargeParty &&
        selectedDate !== null &&
        selectedTime !== null &&
        selectedSlot !== null &&
        selectedSlot.isAvailable &&
        selectedSlot.remainingCovers >= guests;

    /*
     * ----------------------------------------------------------
     * DATE LABEL
     * ----------------------------------------------------------
     */

  const dateLabel = selectedDate
    ? `${selectedDate.getDate()} ${monthNames[selectedDate.getMonth()]}`
    : t("step1.selectDate");

    /*
     * ----------------------------------------------------------
     * SUBMIT
     * ----------------------------------------------------------
     */

    function continueToDetails() {
        if (!reservationReady || isLargeParty) return;

        setStep("details");
    }

    async function submitReservation(event: React.FormEvent) {
        event.preventDefault();

        if (
            !selectedDate ||
            !selectedTime ||
            !reservationReady ||
            isLargeParty
        ) {
            return;
        }

        setSubmitError(null);
        setIsSubmitting(true);

        try {
            const response = await fetch("/api/reservations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    guests,
                    date: toDateKey(selectedDate),
                    time: selectedTime,
                    name: details.name,
                    phone: details.phone,
                    email: details.email,
                    note: details.note,
                }),
            });

            if (response.ok) {
                setStep("success");
                return;
            }

            const data = (await response.json()) as { error?: string };
            setSubmitError(data.error ?? t("step2.submitError"));
            void fetchAvailability();
        } catch {
            setSubmitError(t("step2.submitError"));
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <section
            id="reservation"
            ref={sectionRef}
            onMouseMove={handleMouseMove}
            className="relative min-h-screen overflow-hidden bg-[#171613] text-[#f3f1eb]"
        >
            {/* ====================================================== */}
            {/* BACKGROUND VIDEO */}
            {/* ====================================================== */}

            <motion.div
                style={{
                    x: backgroundX,
                    y: backgroundY,
                    scale: bgScale,
                }}
                className="absolute -inset-8 will-change-transform"
            >
                <motion.div style={{ y: bgY }} className="h-full w-full">
                <Image
                    src={settings.reservationBgUrl}
                    alt="Ay'la Reservation Background"
                    width={1920}
                    height={1080}
                    className="h-full w-full object-cover opacity-35"
                />
                </motion.div>
            </motion.div>

            <div className="absolute inset-0 bg-[#171613]/65" />

            <div className="absolute inset-0 bg-gradient-to-b from-[#171613]/80 via-transparent to-[#171613]" />

            {/* subtle grain — CSS only (no external asset) */}
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.035] mix-blend-overlay"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
              }}
            />

            {/* ====================================================== */}
            {/* CONTENT */}
            {/* ====================================================== */}

            <div className="relative z-10 mx-auto flex min-h-screen max-w-[1600px] flex-col px-6 py-10 lg:px-10">
                {/* TOP */}

                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <span className="h-px w-10 bg-white/30" />

                        <span className="text-[9px] uppercase tracking-[0.35em] text-white/40">
                            {t("label")}
                        </span>
                    </div>

                    <span className="font-brand text-3xl italic text-white/20">
                        Ay&apos;la
                    </span>
                </div>

                {/* MAIN */}

                <div className="flex flex-1 items-center justify-center py-16">
                    <AnimatePresence mode="wait">
                        {step === "reservation" && (
                            <ReservationStep
                                key="reservation"
                                t={t}
                                monthNames={monthNames}
                                dayNames={dayNames}
                                slotAvailability={slotAvailability}
                                availabilityLoading={availabilityLoading}
                                maxGuests={settings.maxGuests}
                                guests={guests}
                                setGuests={setGuests}
                                isLargeParty={isLargeParty}
                                largePartyThreshold={largePartyThreshold}
                                restaurantPhone={restaurantPhone}
                                selectedDate={selectedDate}
                                dateLabel={dateLabel}
                                calendarOpen={calendarOpen}
                                setCalendarOpen={setCalendarOpen}
                                currentMonth={currentMonth}
                                calendarDays={calendarDays}
                                selectDate={selectDate}
                                isSameDate={isSameDate}
                                isDateDisabled={isDateDisabled}
                                canGoPreviousMonth={canGoPreviousMonth()}
                                canGoNextMonth={canGoNextMonth()}
                                previousMonth={previousMonth}
                                nextMonth={nextMonth}
                                selectedTime={selectedTime}
                                timeOpen={timeOpen}
                                setTimeOpen={setTimeOpen}
                                setSelectedTime={setSelectedTime}
                                reservationReady={reservationReady}
                                continueToDetails={continueToDetails}
                            />
                        )}

                        {step === "details" && (
                            <DetailsStep
                                key="details"
                                t={t}
                                monthNames={monthNames}
                                details={details}
                                setDetails={setDetails}
                                guests={guests}
                                selectedDate={selectedDate}
                                selectedTime={selectedTime}
                                submitError={submitError}
                                isSubmitting={isSubmitting}
                                isLargeParty={isLargeParty}
                                onBack={() => setStep("reservation")}
                                onSubmit={submitReservation}
                            />
                        )}

                        {step === "success" && (
                            <SuccessStep
                                key="success"
                                t={t}
                                monthNames={monthNames}
                                guests={guests}
                                selectedDate={selectedDate}
                                selectedTime={selectedTime}
                                restaurantPhone={restaurantPhone}
                            />
                        )}
                    </AnimatePresence>
                </div>

                {/* BOTTOM */}

                <div className="border-t border-white/10 pt-5">
                    <div className="flex items-end justify-between">
                        <div>
                            <p className="text-[9px] uppercase tracking-[0.3em] text-white/35">
                                {t("restaurant")}
                            </p>

                            <p className="mt-2 text-xs text-white/50">
                                {settings.country}
                            </p>
                        </div>

                        <div className="text-right">
                            <p className="text-[9px] uppercase tracking-[0.3em] text-white/30">
                                {t("everyEvening")}
                            </p>

                            <p className="mt-2 text-xs text-white/50">
                                {settings.openTime} — {settings.closeTime}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

/* =============================================================== */
/* RESERVATION STEP */
/* =============================================================== */

function ReservationStep({
    t,
    monthNames,
    dayNames,
    slotAvailability,
    availabilityLoading,
    maxGuests,
    guests,
    setGuests,
    isLargeParty,
    largePartyThreshold,
    restaurantPhone,
    selectedDate,
    dateLabel,
    calendarOpen,
    setCalendarOpen,
    currentMonth,
    calendarDays,
    selectDate,
    isSameDate,
    isDateDisabled,
    canGoPreviousMonth,
    canGoNextMonth,
    previousMonth,
    nextMonth,
    selectedTime,
    timeOpen,
    setTimeOpen,
    setSelectedTime,
    reservationReady,
    continueToDetails,
}: {
    t: ReturnType<typeof useTranslations<"reservation">>;
    monthNames: string[];
    dayNames: string[];
    slotAvailability: SlotAvailability[];
    availabilityLoading: boolean;
    maxGuests: number;
    guests: number;
    setGuests: React.Dispatch<React.SetStateAction<number>>;
    isLargeParty: boolean;
    largePartyThreshold: number;
    restaurantPhone: string;
    selectedDate: Date | null;
    dateLabel: string;
    calendarOpen: boolean;
    setCalendarOpen: React.Dispatch<
        React.SetStateAction<boolean>
    >;
    currentMonth: Date;
    calendarDays: (Date | null)[];
    selectDate: (date: Date) => void;
    isSameDate: (
        first: Date | null,
        second: Date
    ) => boolean;
    isDateDisabled: (date: Date) => boolean;
    canGoPreviousMonth: boolean;
    canGoNextMonth: boolean;
    previousMonth: () => void;
    nextMonth: () => void;
    selectedTime: string | null;
    timeOpen: boolean;
    setTimeOpen: React.Dispatch<
        React.SetStateAction<boolean>
    >;
    setSelectedTime: React.Dispatch<
        React.SetStateAction<string | null>
    >;
    reservationReady: boolean;
    continueToDetails: () => void;
}) {
    return (
        <motion.div
            initial={{
                opacity: 0,
                y: 40,
            }}
            animate={{
                opacity: 1,
                y: 0,
            }}
            exit={{
                opacity: 0,
                y: -30,
            }}
            transition={{
                duration: 0.8,
                ease: [0.22, 1, 0.36, 1],
            }}
            className="w-full max-w-5xl"
        >
            {/* TITLE */}

            <div className="text-center">
                <p className="mb-7 text-[9px] uppercase tracking-[0.35em] text-white/40">
                    {t("step1.eyebrow")}
                </p>

                <h2 className="text-[clamp(4rem,9vw,9rem)] leading-[0.78] tracking-[-0.07em]">
                    {t("step1.titleLine1")}
                    <br />

                    <span className="font-brand italic">
                        {t("step1.titleLine2")}
                    </span>
                </h2>
            </div>

            {/* RESERVATION CONTROLS */}

            <div className="mx-auto mt-16 max-w-3xl">
                <div className="grid border-y border-white/15 sm:grid-cols-3">
                    {/* GUESTS */}

                    <div className="relative border-b border-white/10 px-5 py-7 sm:border-b-0 sm:border-r">
                        <span className="block text-[8px] uppercase tracking-[0.3em] text-white/30">
                            {t("step1.guests")}
                        </span>

                        <div className="mt-5 flex items-center justify-between">
                            <span className="font-brand text-4xl italic">
                                {String(guests).padStart(2, "0")}
                            </span>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() =>
                                        setGuests((value) =>
                                            Math.max(1, value - 1)
                                        )
                                    }
                                    className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 text-xs transition hover:bg-white/10"
                                >
                                    −
                                </button>

                                <button
                                    onClick={() =>
                                        setGuests((value) =>
                                            Math.min(maxGuests, value + 1)
                                        )
                                    }
                                    className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 text-xs transition hover:bg-white/10"
                                >
                                    +
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* DATE */}

                    <div className="relative border-b border-white/10 px-5 py-7 sm:border-b-0 sm:border-r">
                        <span className="block text-[8px] uppercase tracking-[0.3em] text-white/30">
                            {t("step1.date")}
                        </span>

                        <button
                            onClick={() =>
                                setCalendarOpen((value) => !value)
                            }
                            className="mt-5 flex w-full items-center justify-between text-left"
                        >
                            <span
                                className={`font-brand text-3xl italic ${selectedDate
                                        ? "text-white"
                                        : "text-white/30"
                                    }`}
                            >
                                {dateLabel}
                            </span>

                            <span className="text-xs text-white/30">
                                ↓
                            </span>
                        </button>

                        <AnimatePresence>
                            {calendarOpen && (
                                <Calendar
                                    monthNames={monthNames}
                                    dayNames={dayNames}
                                    selectedDate={selectedDate}
                                    currentMonth={currentMonth}
                                    calendarDays={calendarDays}
                                    selectDate={selectDate}
                                    isSameDate={isSameDate}
                                    isDateDisabled={isDateDisabled}
                                    canGoPreviousMonth={canGoPreviousMonth}
                                    canGoNextMonth={canGoNextMonth}
                                    previousMonth={previousMonth}
                                    nextMonth={nextMonth}
                                />
                            )}
                        </AnimatePresence>
                    </div>

                    {/* TIME */}

                    <div className="relative px-5 py-7">
                        <span className="block text-[8px] uppercase tracking-[0.3em] text-white/30">
                            {t("step1.time")}
                        </span>

                        <button
                            onClick={() => {
                                if (!selectedDate || isLargeParty) {
                                    return;
                                }
                                setTimeOpen((value) => !value);
                            }}
                            disabled={!selectedDate || isLargeParty}
                            className="mt-5 flex w-full items-center justify-between text-left disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <span
                                className={`font-brand text-3xl italic ${selectedTime
                                        ? "text-white"
                                        : "text-white/30"
                                    }`}
                            >
                                {selectedTime || t("step1.selectTime")}
                            </span>

                            <span className="text-xs text-white/30">
                                ↓
                            </span>
                        </button>

                        <AnimatePresence>
                            {timeOpen && selectedDate && !isLargeParty && (
                                <TimePicker
                                    t={t}
                                    slotAvailability={slotAvailability}
                                    availabilityLoading={availabilityLoading}
                                    guests={guests}
                                    selectedTime={selectedTime}
                                    setSelectedTime={setSelectedTime}
                                    close={() => setTimeOpen(false)}
                                />
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {isLargeParty ? (
                    <div className="mt-10 text-center">
                        <p className="mx-auto max-w-md text-sm leading-7 text-white/50">
                            {t("step1.largePartyMessage", {
                                count: largePartyThreshold,
                                phone: restaurantPhone,
                            })}
                        </p>

                        <a
                            href={telHref(restaurantPhone)}
                            className="group mx-auto mt-8 flex w-fit items-center gap-7 rounded-full bg-[#f3f1eb] px-8 py-4 text-[9px] font-medium uppercase tracking-[0.25em] text-[#171613] transition hover:-translate-y-1"
                        >
                            <span>{t("step1.largePartyCta")}</span>
                            <span className="text-base transition-transform group-hover:translate-x-1">
                                →
                            </span>
                        </a>
                    </div>
                ) : (
                    <>
                        {!selectedDate ? (
                            <p className="mt-6 text-center text-[8px] uppercase tracking-[0.25em] text-white/25">
                                {t("step1.selectDateFirst")}
                            </p>
                        ) : null}

                        <motion.button
                            onClick={continueToDetails}
                            disabled={!reservationReady}
                            whileHover={
                                reservationReady
                                    ? {
                                        y: -3,
                                    }
                                    : undefined
                            }
                            whileTap={
                                reservationReady
                                    ? {
                                        scale: 0.98,
                                    }
                                    : undefined
                            }
                            className={`group mx-auto mt-12 flex items-center gap-7 rounded-full px-8 py-4 text-[9px] font-medium uppercase tracking-[0.25em] transition-all duration-500 ${reservationReady
                                    ? "bg-[#f3f1eb] text-[#171613]"
                                    : "cursor-not-allowed bg-white/10 text-white/25"
                                }`}
                        >
                            <span>{t("step1.cta")}</span>

                            <span
                                className={`text-base transition-transform duration-300 ${reservationReady
                                        ? "group-hover:translate-x-1"
                                        : ""
                                    }`}
                            >
                                →
                            </span>
                        </motion.button>

                        <p className="mt-6 text-center text-[8px] uppercase tracking-[0.25em] text-white/25">
                            {t("step1.hint")}
                        </p>
                    </>
                )}
            </div>
        </motion.div>
    );
}

/* =============================================================== */
/* CALENDAR */
/* =============================================================== */

function Calendar({
    monthNames,
    dayNames,
    selectedDate,
    currentMonth,
    calendarDays,
    selectDate,
    isSameDate,
    isDateDisabled,
    canGoPreviousMonth,
    canGoNextMonth,
    previousMonth,
    nextMonth,
}: {
    monthNames: string[];
    dayNames: string[];
    selectedDate: Date | null;
    currentMonth: Date;
    calendarDays: (Date | null)[];
    selectDate: (date: Date) => void;
    isSameDate: (
        first: Date | null,
        second: Date
    ) => boolean;
    isDateDisabled: (date: Date) => boolean;
    canGoPreviousMonth: boolean;
    canGoNextMonth: boolean;
    previousMonth: () => void;
    nextMonth: () => void;
}) {
    return (
        <motion.div
            initial={{
                opacity: 0,
                y: 10,
                scale: 0.98,
            }}
            animate={{
                opacity: 1,
                y: 0,
                scale: 1,
            }}
            exit={{
                opacity: 0,
                y: 10,
                scale: 0.98,
            }}
            className="absolute left-0 top-full z-50 mt-4 w-[320px] border border-black/10 bg-[#f3f1eb] p-5 text-[#171613] shadow-2xl"
        >
            {/* Header */}

            <div className="flex items-center justify-between border-b border-black/10 pb-4">
                <button
                    onClick={previousMonth}
                    disabled={!canGoPreviousMonth}
                    className="text-xs text-black/40 transition hover:text-black disabled:cursor-not-allowed disabled:opacity-25"
                >
                    ←
                </button>

                <span className="font-brand text-xl italic">
                    {monthNames[currentMonth.getMonth()]}{" "}
                    {currentMonth.getFullYear()}
                </span>

                <button
                    onClick={nextMonth}
                    disabled={!canGoNextMonth}
                    className="text-xs text-black/40 transition hover:text-black disabled:cursor-not-allowed disabled:opacity-25"
                >
                    →
                </button>
            </div>

            {/* Week */}

            <div className="mt-5 grid grid-cols-7 gap-1">
                {dayNames.map((day, index) => (
                    <span
                        key={`${day}-${index}`}
                        className="pb-2 text-center text-[8px] uppercase tracking-wider text-black/30"
                    >
                        {day}
                    </span>
                ))}

                {calendarDays.map((date, index) => {
                    if (!date) {
                        return (
                            <span key={`empty-${index}`} />
                        );
                    }

                    const disabled = isDateDisabled(date);
                    const selected = isSameDate(selectedDate, date);

                    return (
                        <button
                            key={date.toISOString()}
                            disabled={disabled}
                            onClick={() => selectDate(date)}
                            className={`aspect-square text-xs transition ${disabled
                                    ? "cursor-not-allowed text-black/15"
                                    : "hover:bg-black hover:text-white"
                                } ${selected
                                    ? "bg-black text-white"
                                    : ""
                                }`}
                        >
                            {date.getDate()}
                        </button>
                    );
                })}
            </div>
        </motion.div>
    );
}

/* =============================================================== */
/* TIME PICKER */
/* =============================================================== */

function TimePicker({
    t,
    slotAvailability,
    availabilityLoading,
    guests,
    selectedTime,
    setSelectedTime,
    close,
}: {
    t: ReturnType<typeof useTranslations<"reservation">>;
    slotAvailability: SlotAvailability[];
    availabilityLoading: boolean;
    guests: number;
    selectedTime: string | null;
    setSelectedTime: (
        time: string
    ) => void;
    close: () => void;
}) {
    const availableSlots = slotAvailability.filter(
        (slot) => slot.isAvailable && slot.remainingCovers >= guests
    );

    return (
        <motion.div
            initial={{
                opacity: 0,
                y: 10,
                scale: 0.98,
            }}
            animate={{
                opacity: 1,
                y: 0,
                scale: 1,
            }}
            exit={{
                opacity: 0,
                y: 10,
                scale: 0.98,
            }}
            className="absolute right-0 top-full z-50 mt-4 w-[320px] border border-black/10 bg-[#f3f1eb] p-5 text-[#171613] shadow-2xl"
        >
            <div className="mb-4 border-b border-black/10 pb-4">
                <span className="text-[8px] uppercase tracking-[0.3em] text-black/35">
                    {t("step1.availableTimes")}
                </span>
                <p className="mt-2 text-[10px] text-black/40">
                    {t("step1.liveAvailability")}
                </p>
            </div>

            {availabilityLoading && slotAvailability.length === 0 ? (
                <p className="py-4 text-center text-xs text-black/45">
                    {t("step1.loadingTimes")}
                </p>
            ) : null}

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {slotAvailability.length === 0 && !availabilityLoading ? (
                    <p className="col-span-full py-4 text-center text-xs text-black/45">
                        {t("step1.noTimesAvailable")}
                    </p>
                ) : (
                    slotAvailability.map((slot) => {
                        const fitsGuests = slot.remainingCovers >= guests;
                        const selectable = slot.isAvailable && fitsGuests;
                        const active = selectedTime === slot.time;

                        return (
                            <button
                                key={slot.time}
                                disabled={!selectable}
                                onClick={() => {
                                    if (!selectable) {
                                        return;
                                    }
                                    setSelectedTime(slot.time);
                                    close();
                                }}
                                className={`flex flex-col items-center gap-1 py-3 text-xs transition ${active
                                        ? "bg-[#171613] text-[#f3f1eb]"
                                        : selectable
                                          ? "bg-black/[0.035] hover:bg-black hover:text-white"
                                          : "cursor-not-allowed bg-black/[0.02] text-black/25"
                                    }`}
                            >
                                <span>{slot.time}</span>
                                <span className="text-[9px] uppercase tracking-wider opacity-70">
                                    {selectable
                                        ? t("step1.remainingCovers", {
                                              count: slot.remainingCovers,
                                          })
                                        : slot.isPast
                                          ? t("step1.slotPast")
                                          : t("step1.slotFull")}
                                </span>
                            </button>
                        );
                    })
                )}
            </div>

            {availableSlots.length === 0 && slotAvailability.length > 0 ? (
                <p className="mt-4 text-center text-[10px] text-black/45">
                    {t("step1.noTimesForGuests", { count: guests })}
                </p>
            ) : null}
        </motion.div>
    );
}

/* =============================================================== */
/* DETAILS */
/* =============================================================== */

function DetailsStep({
    t,
    monthNames,
    details,
    setDetails,
    guests,
    selectedDate,
    selectedTime,
    submitError,
    isSubmitting,
    isLargeParty,
    onBack,
    onSubmit,
}: {
    t: ReturnType<typeof useTranslations<"reservation">>;
    monthNames: string[];
    details: {
        name: string;
        phone: string;
        email: string;
        note: string;
    };
    setDetails: React.Dispatch<
        React.SetStateAction<{
            name: string;
            phone: string;
            email: string;
            note: string;
        }>
    >;
    guests: number;
    selectedDate: Date | null;
    selectedTime: string | null;
    submitError: string | null;
    isSubmitting: boolean;
    isLargeParty: boolean;
    onBack: () => void;
    onSubmit: (
        event: React.FormEvent
    ) => void;
}) {
    return (
        <motion.div
            initial={{
                opacity: 0,
                y: 40,
            }}
            animate={{
                opacity: 1,
                y: 0,
            }}
            exit={{
                opacity: 0,
                y: -30,
            }}
            transition={{
                duration: 0.8,
                ease: [0.22, 1, 0.36, 1],
            }}
            className="w-full max-w-4xl"
        >
            <div className="text-center">
                <button
                    onClick={onBack}
                    className="mb-8 text-[8px] uppercase tracking-[0.3em] text-white/35 transition hover:text-white"
                >
                    {t("step2.back")}
                </button>

                <p className="text-[9px] uppercase tracking-[0.35em] text-white/40">
                    {t("step2.eyebrow")}
                </p>

                <h2 className="mt-6 text-[clamp(3.5rem,7vw,7rem)] leading-[0.8] tracking-[-0.07em]">
                    {t("step2.titleLine1")}
                    <br />

                    <span className="font-brand italic">
                        {t("step2.titleLine2")}
                    </span>
                </h2>

                <p className="mx-auto mt-8 max-w-md text-sm leading-7 text-white/45">
                    {t("step2.description")}
                </p>
            </div>

            {/* SUMMARY */}

            <div className="mx-auto mt-12 flex max-w-2xl justify-center gap-8 border-y border-white/10 py-5 text-[9px] uppercase tracking-[0.2em] text-white/40">
                <span>
                    {t("step2.guests", { count: guests })}
                </span>

                <span>
                    {selectedDate
                        ? `${selectedDate.getDate()} ${monthNames[
                        selectedDate.getMonth()
                        ]
                        }`
                        : ""}
                </span>

                <span>{selectedTime}</span>
            </div>

            {/* FORM */}

            <form
                onSubmit={onSubmit}
                className="mx-auto mt-10 max-w-2xl"
            >
                <div className="grid gap-8 sm:grid-cols-2">
                    <ElegantInput
                        label={t("step2.name")}
                        value={details.name}
                        onChange={(value) =>
                            setDetails((current) => ({
                                ...current,
                                name: value,
                            }))
                        }
                        required
                    />

                    <ElegantInput
                        label={t("step2.phone")}
                        type="tel"
                        value={details.phone}
                        onChange={(value) =>
                            setDetails((current) => ({
                                ...current,
                                phone: value,
                            }))
                        }
                        required
                    />

                    <ElegantInput
                        label={t("step2.email")}
                        type="email"
                        value={details.email}
                        onChange={(value) =>
                            setDetails((current) => ({
                                ...current,
                                email: value,
                            }))
                        }
                        required
                    />

                    <ElegantInput
                        label={t("step2.note")}
                        value={details.note}
                        onChange={(value) =>
                            setDetails((current) => ({
                                ...current,
                                note: value,
                            }))
                        }
                    />
                </div>

                {submitError ? (
                    <p className="mt-8 text-center text-sm text-red-300">{submitError}</p>
                ) : null}

                <button
                    type="submit"
                    disabled={
                        isSubmitting ||
                        isLargeParty ||
                        !details.name ||
                        !details.phone ||
                        !details.email
                    }
                    className="group mx-auto mt-12 flex items-center gap-7 rounded-full bg-[#f3f1eb] px-8 py-4 text-[9px] font-medium uppercase tracking-[0.25em] text-[#171613] transition hover:-translate-y-1 disabled:cursor-not-allowed disabled:opacity-30"
                >
                    <span>{isSubmitting ? t("step2.submitting") : t("step2.submit")}</span>

                    <span className="text-base transition-transform group-hover:translate-x-1">
                        →
                    </span>
                </button>
            </form>
        </motion.div>
    );
}

/* =============================================================== */
/* INPUT */
/* =============================================================== */

function ElegantInput({
    label,
    value,
    onChange,
    type = "text",
    required = false,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    type?: string;
    required?: boolean;
}) {
    return (
        <label className="group block border-b border-white/15 pb-3">
            <span className="block text-[8px] uppercase tracking-[0.3em] text-white/30 transition group-focus-within:text-white/60">
                {label}
            </span>

            <input
                type={type}
                required={required}
                value={value}
                onChange={(event) =>
                    onChange(event.target.value)
                }
                className="mt-3 w-full bg-transparent text-lg outline-none placeholder:text-white/15"
                placeholder="..."
            />
        </label>
    );
}

/* =============================================================== */
/* SUCCESS */
/* =============================================================== */

function SuccessStep({
    t,
    monthNames,
    guests,
    selectedDate,
    selectedTime,
    restaurantPhone,
}: {
    t: ReturnType<typeof useTranslations<"reservation">>;
    monthNames: string[];
    guests: number;
    selectedDate: Date | null;
    selectedTime: string | null;
    restaurantPhone: string;
}) {
    return (
        <motion.div
            initial={{
                opacity: 0,
                scale: 0.96,
            }}
            animate={{
                opacity: 1,
                scale: 1,
            }}
            transition={{
                duration: 1,
                ease: [0.22, 1, 0.36, 1],
            }}
            className="w-full max-w-3xl text-center"
        >
            <span className="font-brand text-2xl italic text-white/40">
                Ay&apos;la
            </span>

            <h2 className="mt-8 text-[clamp(4rem,9vw,9rem)] leading-[0.78] tracking-[-0.07em]">
                {t("step3.titleLine1")}
                <br />

                <span className="font-brand italic">
                    {t("step3.titleLine2")}
                </span>
            </h2>

            <p className="mx-auto mt-10 max-w-md text-sm leading-7 text-white/45">
                {t("step3.description", { phone: restaurantPhone })}
            </p>

            <div className="mx-auto mt-10 flex max-w-md justify-center gap-6 border-y border-white/10 py-5 text-[9px] uppercase tracking-[0.2em] text-white/40">
                <span>{t("step3.guests", { count: guests })}</span>

                <span>
                    {selectedDate
                        ? `${selectedDate.getDate()} ${monthNames[
                        selectedDate.getMonth()
                        ]
                        }`
                        : ""}
                </span>

                <span>{selectedTime}</span>
            </div>

            <Link
                href="/"
                className="mt-10 inline-flex items-center gap-5 text-[9px] uppercase tracking-[0.25em] text-white/50 transition hover:text-white"
            >
                <span>{t("step3.backHome")}</span>

                <span>→</span>
            </Link>
        </motion.div>
    );
}