import AdminPageHeader, { AdminCard, AdminSection } from "../../components/AdminPageHeader";
import AdminShell from "../../components/AdminShell";
import { getAdminUser } from "../../layout";
import { getSiteSettings } from "../../../lib/content";
import { getSeoSettings } from "../../../lib/seo";
import Link from "next/link";

export default async function AdminLocalSeoPage() {
  const user = await getAdminUser();
  const [site, seo] = await Promise.all([getSiteSettings(), getSeoSettings()]);

  const napComplete = Boolean(
    site.businessName &&
      site.phone &&
      site.email &&
      site.addressLine1 &&
      site.postalCode &&
      site.mapUrl &&
      site.latitude &&
      site.longitude
  );

  const checklist = [
    {
      label: "NAP bilgileri (Ad, Adres, Telefon) tutarlı",
      done: napComplete,
    },
    {
      label: "Google Haritalar + koordinatlar tanımlı",
      done: Boolean(site.mapUrl && site.latitude && site.longitude),
    },
    {
      label: "Google Place ID tanımlı",
      done: Boolean(site.googlePlaceId),
    },
    {
      label: "Google yorumları bağlantısı tanımlı",
      done: Boolean(site.googleReviewsUrl || site.googlePlaceId),
    },
    {
      label: "Instagram + Facebook tanımlı",
      done: Boolean(site.instagramUrl && site.facebookUrl),
    },
    {
      label: "Yerel anahtar kelimeler SEO ayarlarında",
      done: seo.metaKeywords.toLowerCase().includes("alanya"),
    },
    {
      label: "Yapılandırılmış veri aktif",
      done: seo.structuredDataEnabled,
    },
    {
      label: "Canonical domain ayarlı",
      done: Boolean(seo.canonicalBaseUrl.includes("ayla")),
    },
  ];

  const score = Math.round((checklist.filter((item) => item.done).length / checklist.length) * 100);

  return (
    <AdminShell user={user}>
      <AdminPageHeader
        title="Yerel SEO"
        description="Restoranınızın yerel arama görünürlüğü için NAP tutarlılığı ve platform bağlantıları."
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <AdminCard>
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/35">Yerel SEO Skoru</p>
          <p className="mt-3 font-brand text-5xl italic">%{score}</p>
        </AdminCard>
        <AdminCard>
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/35">Tamamlanan</p>
          <p className="mt-3 font-brand text-5xl italic">
            {checklist.filter((item) => item.done).length}/{checklist.length}
          </p>
        </AdminCard>
        <AdminCard>
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/35">Canonical</p>
          <p className="mt-3 break-all text-sm text-white/65">{seo.canonicalBaseUrl}</p>
        </AdminCard>
      </div>

      <AdminSection title="NAP Bilgileri (Name, Address, Phone)">
        <div className="grid gap-4 sm:grid-cols-2 text-sm">
          <div className="rounded-2xl border border-white/10 p-4">
            <p className="text-white/35">Restoran</p>
            <p className="mt-1 text-lg">{site.businessName}</p>
          </div>
          <div className="rounded-2xl border border-white/10 p-4">
            <p className="text-white/35">Telefon</p>
            <p className="mt-1">{site.phone}</p>
            {site.phoneSecondary ? (
              <p className="mt-1 text-white/55">{site.phoneSecondary}</p>
            ) : null}
          </div>
          <div className="rounded-2xl border border-white/10 p-4">
            <p className="text-white/35">Adres</p>
            <p className="mt-1">
              {site.addressLine1}
              <br />
              {site.addressLine2}
              <br />
              {site.country} · {site.postalCode}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 p-4">
            <p className="text-white/35">E-posta / GEO</p>
            <p className="mt-1">{site.email}</p>
            <p className="mt-2 text-white/45">
              {site.latitude}, {site.longitude}
            </p>
          </div>
        </div>
        <Link href="/admin/settings" className="mt-4 inline-block text-xs text-white/45 hover:text-white">
          NAP bilgilerini düzenle →
        </Link>
      </AdminSection>

      <AdminSection title="Yerel SEO Kontrol Listesi" className="mt-8">
        <div className="space-y-3">
          {checklist.map((item) => (
            <div
              key={item.label}
              className={`flex items-center justify-between rounded-2xl border px-4 py-3 ${
                item.done ? "border-emerald-500/20 bg-emerald-500/5" : "border-white/10"
              }`}
            >
              <span className="text-sm">{item.label}</span>
              <span className={`text-xs uppercase tracking-wider ${item.done ? "text-emerald-300" : "text-white/35"}`}>
                {item.done ? "Tamam" : "Eksik"}
              </span>
            </div>
          ))}
        </div>
      </AdminSection>

      <AdminSection title="Platform Bağlantıları" className="mt-8">
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { label: "Google Haritalar", url: site.mapUrl },
            { label: "Google Yorumları", url: site.googleReviewsUrl },
            { label: "Instagram", url: site.instagramUrl },
            { label: "Facebook", url: site.facebookUrl },
          ].map((link) => (
            <div key={link.label} className="rounded-2xl border border-white/10 p-4">
              <p className="text-xs uppercase tracking-wider text-white/35">{link.label}</p>
              {link.url ? (
                <a href={link.url} target="_blank" rel="noreferrer" className="mt-2 block truncate text-sm text-white/70 hover:text-white">
                  {link.url}
                </a>
              ) : (
                <p className="mt-2 text-sm text-white/35">Tanımlı değil</p>
              )}
            </div>
          ))}
        </div>
      </AdminSection>
    </AdminShell>
  );
}
