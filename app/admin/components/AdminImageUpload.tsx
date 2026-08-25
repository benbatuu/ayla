"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { Film, ImagePlus, Loader2 } from "lucide-react";
import { slugify } from "../../lib/slugify";

type Props = {
  name?: string;
  label?: string;
  defaultUrl?: string;
  hint?: string;
  accept?: string;
  scope?: "menu" | "asset";

  categorySlug?: string;
  categorySlugFieldName?: string;
  itemSlug?: string;
  slugSourceFieldName?: string;

  folder?: string;
  fileName?: string;
  fileNameFieldName?: string;
  fileNameSuffix?: string;
  convertWebp?: boolean;
};

function isVideoUrl(url: string) {
  return /\.(mp4|webm|mov)(\?|$)/i.test(url);
}

export default function AdminImageUpload({
  name = "imageUrl",
  label = "Görsel",
  defaultUrl = "",
  hint,
  accept = "image/*",
  scope,
  categorySlug,
  categorySlugFieldName,
  itemSlug,
  slugSourceFieldName,
  folder,
  fileName,
  fileNameFieldName,
  fileNameSuffix,
  convertWebp = true,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(defaultUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const resolvedScope =
    scope ?? (categorySlug || categorySlugFieldName || itemSlug || slugSourceFieldName ? "menu" : "asset");

  function queryInForm(fieldName: string) {
    const form = rootRef.current?.closest("form");
    const queryScope = form ?? rootRef.current ?? document;
    return queryScope.querySelector<HTMLInputElement | HTMLTextAreaElement>(
      `[name="${fieldName}"]`
    );
  }

  async function handleFileChange(file: File | null) {
    if (!file) return;

    setError("");
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    if (resolvedScope === "menu") {
      let resolvedCategorySlug = categorySlug;

      if (!resolvedCategorySlug && categorySlugFieldName) {
        const categoryValue = queryInForm(categorySlugFieldName)?.value.trim() ?? "";
        if (!categoryValue) {
          setError("Önce kategori adını doldurun.");
          setUploading(false);
          return;
        }
        resolvedCategorySlug = slugify(categoryValue);
      }

      let resolvedItemSlug = itemSlug;

      if (!resolvedItemSlug && slugSourceFieldName) {
        const sourceValue = queryInForm(slugSourceFieldName)?.value.trim() ?? "";
        if (!sourceValue) {
          setError("Önce ad alanını doldurun.");
          setUploading(false);
          return;
        }
        resolvedItemSlug = slugify(sourceValue);
      }

      if (!resolvedItemSlug) {
        setError("Görsel adı belirlenemedi.");
        setUploading(false);
        return;
      }

      if (!resolvedCategorySlug) {
        setError("Kategori seçilmedi.");
        setUploading(false);
        return;
      }

      formData.append("scope", "menu");
      formData.append("categorySlug", resolvedCategorySlug);
      formData.append("itemSlug", resolvedItemSlug);
    } else {
      let resolvedFileName = fileName;

      if (!resolvedFileName && fileNameFieldName) {
        const sourceValue = queryInForm(fileNameFieldName)?.value.trim() ?? "";
        if (!sourceValue) {
          setError("Önce ad/başlık alanını doldurun.");
          setUploading(false);
          return;
        }
        resolvedFileName = slugify(sourceValue);
      }

      if (resolvedFileName && fileNameSuffix) {
        resolvedFileName = `${resolvedFileName}${fileNameSuffix}`;
      }

      if (!resolvedFileName) {
        setError("Dosya adı belirlenemedi.");
        setUploading(false);
        return;
      }

      if (!folder) {
        setError("Yükleme klasörü belirlenemedi.");
        setUploading(false);
        return;
      }

      formData.append("scope", "asset");
      formData.append("folder", folder);
      formData.append("fileName", resolvedFileName);

      if (!file.type.startsWith("image/") || !convertWebp) {
        formData.append("convertWebp", "false");
      }
    }

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !data.url) {
        throw new Error(data.error ?? "Yükleme başarısız");
      }

      setUrl(data.url);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Yükleme başarısız.");
    } finally {
      setUploading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  const previewUrl = url || "/ayla_logo.jpg";
  const showVideoPreview = Boolean(url && isVideoUrl(url));

  return (
    <div ref={rootRef} className="block">
      <span className="mb-2 block text-[10px] uppercase tracking-[0.2em] text-white/40">
        {label}
      </span>
      <input type="hidden" name={name} value={url} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
          {showVideoPreview ? (
            <div className="flex h-full flex-col items-center justify-center gap-1 text-white/45">
              <Film size={22} />
              <span className="text-[9px] uppercase tracking-wider">Video</span>
            </div>
          ) : (
            <Image
              src={previewUrl}
              alt={label}
              fill
              className="object-cover"
              unoptimized
            />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/15 bg-white/[0.03] px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/70 transition hover:bg-white/[0.06]">
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} />}
            {uploading ? "Yükleniyor..." : "Dosya yükle"}
            <input
              ref={inputRef}
              type="file"
              accept={accept}
              className="hidden"
              disabled={uploading}
              onChange={(event) => void handleFileChange(event.target.files?.[0] ?? null)}
            />
          </label>

          {url ? (
            <p className="mt-2 break-all text-xs text-white/35">{url}</p>
          ) : (
            <p className="mt-2 text-xs text-white/35">
              {hint ?? "Görsel WebP olarak kaydedilir. Videolar orijinal formatında saklanır."}
            </p>
          )}

          {error ? <p className="mt-2 text-xs text-red-300">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}
