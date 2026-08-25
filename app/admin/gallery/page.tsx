import AdminField from "../components/AdminField";
import AdminImageUpload from "../components/AdminImageUpload";
import AdminShell from "../components/AdminShell";
import AdminPageHeader from "../components/AdminPageHeader";
import {
  createGalleryItemAction,
  deleteGalleryItemAction,
  updateGalleryItemAction,
} from "../actions";
import { getAdminUser } from "../layout";
import { slugify } from "../../lib/slugify";
import { prisma } from "../../lib/prisma";

export default async function AdminGalleryPage() {
  const user = await getAdminUser();

  const items = await prisma.galleryItem.findMany({
    orderBy: { sortOrder: "asc" },
    include: { translations: true },
  });

  return (
    <AdminShell user={user}>
      <AdminPageHeader
        title="Galeri & Atmosfer"
        description="Fotoğraf ve videoları, başlıkları ve sıralamayı yönetin."
      />

      <div className="space-y-8">
        {items.map((item) => {
          const tr = item.translations.find((t) => t.locale === "tr");
          const en = item.translations.find((t) => t.locale === "en");
          const fileSlug = slugify(tr?.title ?? "galeri", "galeri");

          return (
            <form
              key={item.id}
              action={updateGalleryItemAction.bind(null, item.id)}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"
            >
              <div className="mb-6 flex items-center justify-between gap-4">
                <h2 className="font-brand text-2xl italic">{tr?.title ?? "Galeri öğesi"}</h2>
                <label className="flex items-center gap-2 text-xs text-white/50">
                  <input type="checkbox" name="published" defaultChecked={item.published} />
                  Yayında
                </label>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <AdminField label="Tip (image/video)" name="type" defaultValue={item.type} />
                <AdminField label="Sıra" name="sortOrder" type="number" defaultValue={item.sortOrder} />
              </div>

              <div className="mt-5 grid gap-6 sm:grid-cols-2">
                <AdminImageUpload
                  name="src"
                  label="Görsel / Video"
                  defaultUrl={item.src}
                  folder="gallery"
                  fileName={fileSlug}
                  accept="image/*,video/*"
                  hint={`uploads/gallery/${fileSlug}.webp veya .mp4`}
                />
                <AdminImageUpload
                  name="poster"
                  label="Video Posteri"
                  defaultUrl={item.poster ?? ""}
                  folder="gallery"
                  fileName={`${fileSlug}-poster`}
                  hint={`uploads/gallery/${fileSlug}-poster.webp`}
                />
              </div>

              <div className="mt-6 grid gap-6 lg:grid-cols-3">
                <div className="space-y-4">
                  <h3 className="text-xs uppercase tracking-[0.2em] text-white/35">Türkçe</h3>
                  <AdminField label="Başlık" name="tr_title" defaultValue={tr?.title} />
                  <AdminField label="Alt başlık" name="tr_subtitle" defaultValue={tr?.subtitle} />
                </div>
                <div className="space-y-4">
                  <h3 className="text-xs uppercase tracking-[0.2em] text-white/35">English</h3>
                  <AdminField label="Title" name="en_title" defaultValue={en?.title} />
                  <AdminField label="Subtitle" name="en_subtitle" defaultValue={en?.subtitle} />
                </div>
                <div className="space-y-4">
                  <h3 className="text-xs uppercase tracking-[0.2em] text-white/35">Русский</h3>
                  <AdminField
                    label="Заголовок"
                    name="ru_title"
                    defaultValue={item.translations.find((t) => t.locale === "ru")?.title}
                  />
                  <AdminField
                    label="Подзаголовок"
                    name="ru_subtitle"
                    defaultValue={item.translations.find((t) => t.locale === "ru")?.subtitle}
                  />
                </div>
              </div>

              <button type="submit" className="mt-6 rounded-full bg-[#f3f1eb] px-6 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#171613]">
                Güncelle
              </button>
            </form>
          );
        })}

        <form action={createGalleryItemAction} className="rounded-2xl border border-dashed border-white/15 p-6">
          <h2 className="mb-6 text-lg">Yeni Galeri Öğesi</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <AdminField label="Tip" name="type" defaultValue="image" />
            <AdminField label="Sıra" name="sortOrder" type="number" defaultValue={items.length} />
            <AdminField label="TR Başlık" name="tr_title" required placeholder="Örn: Akşam Işıkları" />
            <AdminField label="TR Alt başlık" name="tr_subtitle" />
            <AdminField label="EN Title" name="en_title" />
            <AdminField label="EN Subtitle" name="en_subtitle" />
            <AdminField label="RU Title" name="ru_title" />
            <AdminField label="RU Subtitle" name="ru_subtitle" />
          </div>

          <div className="mt-5 grid gap-6 sm:grid-cols-2">
            <AdminImageUpload
              name="src"
              label="Görsel / Video"
              folder="gallery"
              fileNameFieldName="tr_title"
              accept="image/*,video/*"
              hint="Önce başlığı yazın, ardından dosyayı yükleyin."
            />
            <AdminImageUpload
              name="poster"
              label="Video Posteri"
              folder="gallery"
              fileNameFieldName="tr_title"
              fileNameSuffix="-poster"
              hint="Video için kapak görseli (opsiyonel)."
            />
          </div>

          <button type="submit" className="mt-6 rounded-full bg-white/10 px-6 py-2 text-[10px] font-semibold uppercase tracking-[0.2em]">
            Ekle
          </button>
        </form>

        {items.length > 0 ? (
          <div className="rounded-2xl border border-red-500/20 p-4">
            <div className="flex flex-wrap gap-2">
              {items.map((item) => (
                <form key={item.id} action={deleteGalleryItemAction.bind(null, item.id)}>
                  <button type="submit" className="rounded-lg border border-red-500/30 px-3 py-2 text-xs text-red-200">
                    Sil: {item.translations.find((t) => t.locale === "tr")?.title}
                  </button>
                </form>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </AdminShell>
  );
}
