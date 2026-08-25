"use client";

import { useState } from "react";
import { deleteMediaAction } from "../actions";
import { slugify } from "../../lib/slugify";

function fileNameFromUpload(name: string) {
  const base = name.replace(/\.[^.]+$/, "");
  return slugify(base, "medya");
}

export default function MediaUploader({
  assets,
}: {
  assets: Array<{
    id: string;
    filename: string;
    url: string;
    mimeType: string;
    size: number;
    createdAt: Date;
  }>;
}) {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setUploading(true);
    setMessage("");

    const form = event.currentTarget;
    const fileInput = form.elements.namedItem("file") as HTMLInputElement;
    const file = fileInput.files?.[0];

    if (!file) {
      setMessage("Dosya seçin.");
      setUploading(false);
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("scope", "asset");
    formData.append("folder", "media");
    formData.append("fileName", fileNameFromUpload(file.name));

    if (!file.type.startsWith("image/")) {
      formData.append("convertWebp", "false");
    }

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      setMessage("Yüklendi. Sayfa yenileniyor...");
      window.location.reload();
    } catch {
      setMessage("Yükleme başarısız.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleUpload} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="mb-4 text-lg">Dosya Yükle</h2>
        <input
          type="file"
          name="file"
          accept="image/*,video/*"
          required
          className="block w-full text-sm text-white/60 file:mr-4 file:rounded-full file:border-0 file:bg-[#f3f1eb] file:px-4 file:py-2 file:text-[10px] file:font-semibold file:uppercase file:tracking-[0.15em] file:text-[#171613]"
        />
        <p className="mt-2 text-xs text-white/35">
          Görseller WebP olarak uploads/media/ klasörüne kaydedilir.
        </p>
        <button
          type="submit"
          disabled={uploading}
          className="mt-4 rounded-full bg-[#f3f1eb] px-6 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#171613] disabled:opacity-50"
        >
          {uploading ? "Yükleniyor..." : "Yükle"}
        </button>
        {message ? <p className="mt-3 text-sm text-white/50">{message}</p> : null}
      </form>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {assets.map((asset) => (
          <div
            key={asset.id}
            className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"
          >
            {asset.mimeType.startsWith("image/") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={asset.url} alt={asset.filename} className="h-40 w-full object-cover" />
            ) : (
              <div className="flex h-40 items-center justify-center bg-black/30 text-xs text-white/40">
                {asset.mimeType}
              </div>
            )}
            <div className="p-4">
              <p className="truncate text-sm">{asset.filename}</p>
              <p className="mt-1 break-all text-xs text-white/35">{asset.url}</p>
              <form action={deleteMediaAction.bind(null, asset.id)} className="mt-3">
                <button type="submit" className="text-xs text-red-300">
                  Sil
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>

      {assets.length === 0 ? (
        <p className="text-sm text-white/35">Henüz medya yüklenmedi.</p>
      ) : null}
    </div>
  );
}
