"use client";

import { useMemo, useState, useTransition } from "react";
import { updateMessageBundleAction } from "../actions";

const sections = [
  "metadata",
  "header",
  "hero",
  "story",
  "menu",
  "atmosphere",
  "reservation",
  "socialProof",
  "footer",
  "faq",
  "cookies",
  "legal",
] as const;

function flattenObject(
  obj: Record<string, unknown>,
  prefix = ""
): Array<{ path: string; value: string }> {
  const entries: Array<{ path: string; value: string }> = [];

  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;

    if (value && typeof value === "object" && !Array.isArray(value)) {
      entries.push(
        ...flattenObject(value as Record<string, unknown>, path)
      );
    } else if (Array.isArray(value)) {
      entries.push({ path, value: JSON.stringify(value, null, 2) });
    } else {
      entries.push({ path, value: String(value ?? "") });
    }
  }

  return entries;
}

function setNestedValue(
  obj: Record<string, unknown>,
  path: string,
  value: string
) {
  const keys = path.split(".");
  let current: Record<string, unknown> = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!current[key] || typeof current[key] !== "object") {
      current[key] = {};
    }
    current = current[key] as Record<string, unknown>;
  }

  const lastKey = keys[keys.length - 1];
  const trimmed = value.trim();

  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    try {
      current[lastKey] = JSON.parse(trimmed);
      return;
    } catch {
      current[lastKey] = value;
      return;
    }
  }

  current[lastKey] = value;
}

export default function ContentEditor({
  bundles,
}: {
  bundles: Record<"tr" | "en" | "ru", Record<string, unknown>>;
}) {
  const [locale, setLocale] = useState<"tr" | "en" | "ru">("tr");
  const [section, setSection] = useState<(typeof sections)[number]>("hero");
  const [draft, setDraft] = useState<Record<string, unknown>>(bundles.tr);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const fields = useMemo(() => {
    const sectionData = (draft[section] as Record<string, unknown>) ?? {};
    return flattenObject(sectionData);
  }, [draft, section]);

  function switchLocale(nextLocale: "tr" | "en" | "ru") {
    setLocale(nextLocale);
    setDraft(JSON.parse(JSON.stringify(bundles[nextLocale])));
    setMessage("");
  }

  function updateField(path: string, value: string) {
    setDraft((current) => {
      const next = JSON.parse(JSON.stringify(current));
      setNestedValue(next, `${section}.${path}`, value);
      return next;
    });
  }

  function save() {
    startTransition(async () => {
      await updateMessageBundleAction(locale, draft);
      bundles[locale] = draft;
      setMessage("Kaydedildi.");
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        {(["tr", "en", "ru"] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => switchLocale(item)}
            className={`rounded-full px-4 py-2 text-xs uppercase tracking-[0.15em] ${
              locale === item
                ? "bg-white text-[#171613]"
                : "border border-white/10 text-white/50"
            }`}
          >
            {item.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {sections.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setSection(item)}
            className={`rounded-xl px-3 py-2 text-xs ${
              section === item
                ? "bg-white/10 text-white"
                : "text-white/40 hover:text-white/70"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        {fields.map((field) => (
          <label key={`${locale}-${section}-${field.path}`} className="block">
            <span className="mb-2 block text-[10px] uppercase tracking-[0.2em] text-white/35">
              {field.path}
            </span>
            {field.value.includes("\n") || field.value.length > 80 ? (
              <textarea
                key={`${locale}-${section}-${field.path}-ta`}
                defaultValue={field.value}
                onChange={(event) => updateField(field.path, event.target.value)}
                rows={4}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-white/30"
              />
            ) : (
              <input
                key={`${locale}-${section}-${field.path}-in`}
                defaultValue={field.value}
                onChange={(event) => updateField(field.path, event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-white/30"
              />
            )}
          </label>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={save}
          disabled={isPending}
          className="rounded-full bg-[#f3f1eb] px-8 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#171613] disabled:opacity-50"
        >
          {isPending ? "Kaydediliyor..." : "Kaydet"}
        </button>
        {message ? <span className="text-sm text-white/50">{message}</span> : null}
      </div>
    </div>
  );
}
