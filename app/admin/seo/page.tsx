import AdminField from "../components/AdminField";
import AdminImageUpload from "../components/AdminImageUpload";
import AdminPageHeader, { AdminSection } from "../components/AdminPageHeader";
import AdminShell from "../components/AdminShell";
import { updateSeoSettingsAction } from "../actions";
import { getAdminUser } from "../layout";
import { getSeoSettings } from "../../lib/seo";

export default async function AdminSeoPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const user = await getAdminUser();
  const seo = await getSeoSettings();
  const params = await searchParams;

  return (
    <AdminShell user={user}>
      <AdminPageHeader
        title="SEO Ayarları"
        description="Meta etiketleri, Open Graph, robots ve arama motoru doğrulama ayarları."
      />

      {params.saved === "1" ? (
        <div className="mb-6 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          SEO ayarları kaydedildi.
        </div>
      ) : null}

      <form action={updateSeoSettingsAction} className="space-y-8">
        <AdminSection title="Meta Etiketleri (TR)">
          <div className="grid gap-5">
            <AdminField label="Sayfa Başlığı (TR)" name="metaTitleTr" defaultValue={seo.metaTitleTr} />
            <AdminField label="Meta Açıklama (TR)" name="metaDescriptionTr" defaultValue={seo.metaDescriptionTr} textarea />
          </div>
        </AdminSection>

        <AdminSection title="Meta Etiketleri (EN)">
          <div className="grid gap-5">
            <AdminField label="Page Title (EN)" name="metaTitleEn" defaultValue={seo.metaTitleEn} />
            <AdminField label="Meta Description (EN)" name="metaDescriptionEn" defaultValue={seo.metaDescriptionEn} textarea />
          </div>
        </AdminSection>

        <AdminSection title="Meta Etiketleri (RU)">
          <div className="grid gap-5">
            <AdminField label="Заголовок (RU)" name="metaTitleRu" defaultValue={seo.metaTitleRu} />
            <AdminField label="Meta описание (RU)" name="metaDescriptionRu" defaultValue={seo.metaDescriptionRu} textarea />
          </div>
        </AdminSection>

        <AdminSection title="Open Graph & Teknik">
          <div className="grid gap-5 sm:grid-cols-2">
            <AdminField label="Anahtar Kelimeler" name="metaKeywords" defaultValue={seo.metaKeywords} hint="Virgülle ayırın" />
            <AdminField label="Canonical Base URL" name="canonicalBaseUrl" defaultValue={seo.canonicalBaseUrl} />
            <AdminImageUpload
              name="ogImageUrl"
              label="OG Görseli"
              defaultUrl={seo.ogImageUrl}
              folder="site"
              fileName="og-image"
              hint="uploads/site/og-image.webp"
            />
            <AdminField label="Google Site Verification" name="googleSiteVerification" defaultValue={seo.googleSiteVerification} />
            <AdminField label="Bing Site Verification" name="bingSiteVerification" defaultValue={seo.bingSiteVerification} />
          </div>
          <div className="mt-5 flex flex-wrap gap-6 text-sm text-white/65">
            <label className="flex items-center gap-2">
              <input type="checkbox" name="robotsAllowIndex" defaultChecked={seo.robotsAllowIndex} />
              Arama motorları indexleyebilir
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="structuredDataEnabled" defaultChecked={seo.structuredDataEnabled} />
              Yapılandırılmış veri (JSON-LD)
            </label>
          </div>
        </AdminSection>

        <AdminSection title="Önizleme">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white p-4 text-[#171613]">
              <p className="text-xs text-blue-700">Google Önizleme (TR)</p>
              <p className="mt-2 text-lg text-blue-800">{seo.metaTitleTr}</p>
              <p className="text-sm text-green-700">{seo.canonicalBaseUrl}</p>
              <p className="mt-1 text-sm text-gray-600">{seo.metaDescriptionTr}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#1a1a1a] p-4">
              <p className="text-xs text-white/40">Open Graph</p>
              <p className="mt-2 font-medium">{seo.metaTitleTr}</p>
              <p className="mt-1 text-sm text-white/55">{seo.metaDescriptionTr}</p>
              <p className="mt-2 text-xs text-white/35">{seo.ogImageUrl}</p>
            </div>
          </div>
          <p className="mt-4 text-xs text-white/35">
            Sitemap: <a href="/sitemap.xml" className="underline" target="_blank">/sitemap.xml</a> · Robots: <a href="/robots.txt" className="underline" target="_blank">/robots.txt</a>
          </p>
        </AdminSection>

        <button
          type="submit"
          className="rounded-full bg-[#f3f1eb] px-8 py-3.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#171613]"
        >
          Kaydet
        </button>
      </form>
    </AdminShell>
  );
}
