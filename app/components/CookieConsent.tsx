"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

const STORAGE_KEY = "ayla_cookie_consent";

export type ConsentChoice = "necessary-only" | "accept-all";

function getSessionId() {
  try {
    const key = "ayla_session_id";
    const existing = localStorage.getItem(key);
    if (existing) return existing;
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `s_${Date.now()}`;
    localStorage.setItem(key, id);
    return id;
  } catch {
    return undefined;
  }
}

export function readConsentChoice(): ConsentChoice | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (value === "necessary-only" || value === "accept-all") return value;
  } catch {
    /* ignore */
  }
  return null;
}

export function subscribeConsent(listener: (choice: ConsentChoice) => void) {
  const handler = (event: Event) => {
    const detail = (event as CustomEvent<ConsentChoice>).detail;
    if (detail === "necessary-only" || detail === "accept-all") {
      listener(detail);
    }
  };
  window.addEventListener("ayla-consent", handler);
  return () => window.removeEventListener("ayla-consent", handler);
}

export default function CookieConsent() {
  const t = useTranslations("cookies");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!readConsentChoice()) {
      setVisible(true);
    }
  }, []);

  async function save(choice: ConsentChoice) {
    try {
      localStorage.setItem(STORAGE_KEY, choice);
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new CustomEvent("ayla-consent", { detail: choice }));
    setVisible(false);

    try {
      await fetch("/api/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          choice,
          sessionId: getSessionId(),
        }),
      });
    } catch {
      /* offline / ignore */
    }
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[100] p-4 sm:p-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-4 rounded-2xl border border-black/10 bg-[#f7f5f0] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.18)] sm:flex-row sm:items-end sm:gap-6 sm:p-6">
        <div className="flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-black/40">
            {t("title")}
          </p>
          <p className="mt-2 text-sm leading-6 text-black/65">{t("body")}</p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => save("necessary-only")}
            className="rounded-full border border-black/15 px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-black/70 transition hover:border-black/30 hover:text-black"
          >
            {t("necessary")}
          </button>
          <button
            type="button"
            onClick={() => save("accept-all")}
            className="rounded-full bg-[#171613] px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-black"
          >
            {t("acceptAll")}
          </button>
        </div>
      </div>
    </div>
  );
}
