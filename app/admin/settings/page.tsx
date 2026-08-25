import AdminField from "../components/AdminField";
import AdminImageUpload from "../components/AdminImageUpload";
import AdminPageHeader, { AdminSection } from "../components/AdminPageHeader";
import AdminShell from "../components/AdminShell";
import {
  updateAdminCredentialsAction,
  updateSiteSettingsAction,
} from "../actions";
import { getAdminUser } from "../layout";
import { getSiteSettings } from "../../lib/content";

const ACCOUNT_MESSAGES: Record<string, { tone: "ok" | "err"; text: string }> = {
  saved: { tone: "ok", text: "Hesap bilgileri güncellendi." },
  "bad-password": { tone: "err", text: "Mevcut şifre hatalı." },
  "invalid-email": { tone: "err", text: "Geçerli bir e-posta girin." },
  "weak-password": { tone: "err", text: "Yeni şifre en az 8 karakter olmalı." },
  mismatch: { tone: "err", text: "Yeni şifreler eşleşmiyor." },
  "email-taken": { tone: "err", text: "Bu e-posta başka bir hesapta kullanılıyor." },
};

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ account?: string; saved?: string; error?: string }>;
}) {
  const user = await getAdminUser();
  const settings = await getSiteSettings();
  const params = await searchParams;
  const accountMsg = params.account ? ACCOUNT_MESSAGES[params.account] : null;

  return (
    <AdminShell user={user}>
      <AdminPageHeader
        title="Site Ayarları"
        description="İletişim bilgileri, çalışma saatleri, görseller ve bağlantılar."
      />

      <div className="mb-8">
        <AdminSection title="Hesap">
          {accountMsg ? (
            <div
              className={`mb-5 rounded-xl border px-4 py-3 text-sm ${
                accountMsg.tone === "ok"
                  ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-100"
                  : "border-red-400/20 bg-red-500/10 text-red-200"
              }`}
            >
              {accountMsg.text}
            </div>
          ) : null}

          <form action={updateAdminCredentialsAction} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <AdminField
                label="Giriş E-postası"
                name="email"
                type="email"
                defaultValue={user.email}
                required
              />
              <AdminField
                label="Mevcut Şifre"
                name="currentPassword"
                type="password"
                required
              />
              <AdminField
                label="Yeni Şifre"
                name="newPassword"
                type="password"
                hint="Boş bırakırsanız şifre değişmez. En az 8 karakter."
              />
              <AdminField
                label="Yeni Şifre (tekrar)"
                name="confirmPassword"
                type="password"
              />
            </div>
            <button
              type="submit"
              className="rounded-full border border-white/15 bg-white/[0.06] px-8 py-3.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/85 transition hover:bg-white/[0.1]"
            >
              Hesabı Güncelle
            </button>
          </form>
        </AdminSection>
      </div>

      <form action={updateSiteSettingsAction} className="space-y-8">
        <AdminSection title="İletişim">
          <div className="grid gap-5 sm:grid-cols-2">
            <AdminField
              label="İşletme Adı"
              name="businessName"
              defaultValue={settings.businessName}
            />
            <AdminField label="E-posta" name="email" type="email" defaultValue={settings.email} />
            <AdminField label="Telefon (birincil)" name="phone" defaultValue={settings.phone} />
            <AdminField
              label="Telefon (ikincil)"
              name="phoneSecondary"
              defaultValue={settings.phoneSecondary}
            />
            <AdminField label="Adres Satır 1" name="addressLine1" defaultValue={settings.addressLine1} />
            <AdminField label="Adres Satır 2" name="addressLine2" defaultValue={settings.addressLine2} />
            <AdminField label="Ülke" name="country" defaultValue={settings.country} />
            <AdminField label="Posta Kodu" name="postalCode" defaultValue={settings.postalCode} />
            <AdminField
              label="Enlem (latitude)"
              name="latitude"
              type="number"
              defaultValue={settings.latitude}
            />
            <AdminField
              label="Boylam (longitude)"
              name="longitude"
              type="number"
              defaultValue={settings.longitude}
            />
            <AdminField label="Harita URL" name="mapUrl" defaultValue={settings.mapUrl} />
            <AdminField
              label="Google Place Feature ID"
              name="googlePlaceFeatureId"
              defaultValue={settings.googlePlaceFeatureId}
              hint="Maps URL içindeki 0x...:0x... kimliği"
            />
            <AdminField
              label="Google Place ID (ChIJ…)"
              name="googlePlaceId"
              defaultValue={settings.googlePlaceId}
              hint="ChIJB_QOw4OZ3BQRu6UpVwL2lvM gibi — API key değil!"
            />
          </div>
        </AdminSection>

        <AdminSection title="Sosyal & Bağlantılar">
          <div className="grid gap-5 sm:grid-cols-2">
            <AdminField label="Instagram URL" name="instagramUrl" defaultValue={settings.instagramUrl} />
            <AdminField label="Instagram Kullanıcı Adı" name="instagramHandle" defaultValue={settings.instagramHandle} />
            <AdminField
              label="Facebook URL"
              name="facebookUrl"
              defaultValue={settings.facebookUrl}
            />
            <AdminField
              label="WhatsApp URL"
              name="whatsappUrl"
              defaultValue={settings.whatsappUrl}
              hint="Örn. https://wa.me/905496135373"
            />
            <AdminField
              label="Google Reviews URL (isteğe bağlı)"
              name="googleReviewsUrl"
              defaultValue={settings.googleReviewsUrl}
              hint="Boş bırakın — otomatik yorum formu linki kullanılır."
            />
            <AdminField
              label="Tripadvisor URL (opsiyonel)"
              name="tripadvisorUrl"
              defaultValue={settings.tripadvisorUrl}
            />
            <AdminField label="Gizlilik URL" name="privacyUrl" defaultValue={settings.privacyUrl} />
            <AdminField label="KVKK URL" name="kvkkUrl" defaultValue={settings.kvkkUrl} />
          </div>
        </AdminSection>

        <AdminSection title="Yol Tarifi & Rezervasyon Kuralları">
          <div className="grid gap-5 sm:grid-cols-2">
            <AdminField
              label="Büyük grup telefon eşiği"
              name="largePartyPhoneThreshold"
              type="number"
              defaultValue={settings.largePartyPhoneThreshold}
              hint="Bu kişi sayısından itibaren telefonla rezervasyon"
            />
            <AdminField
              label="Max rezervasyon günü"
              name="maxReservationDaysAhead"
              type="number"
              defaultValue={settings.maxReservationDaysAhead}
              hint="Online kaç gün öncesine kadar rezervasyon"
            />
            <div className="sm:col-span-2">
              <AdminField
                label="Yol tarifi notu (TR)"
                name="directionsNoteTr"
                defaultValue={settings.directionsNoteTr}
                textarea
              />
            </div>
            <div className="sm:col-span-2">
              <AdminField
                label="Directions note (EN)"
                name="directionsNoteEn"
                defaultValue={settings.directionsNoteEn}
                textarea
              />
            </div>
            <div className="sm:col-span-2">
              <AdminField
                label="Заметка о маршруте (RU)"
                name="directionsNoteRu"
                defaultValue={settings.directionsNoteRu}
                textarea
              />
            </div>
          </div>
        </AdminSection>

        <AdminSection title="Görseller">
          <div className="grid gap-6 sm:grid-cols-2">
            <AdminImageUpload
              name="heroImageUrl"
              label="Hero Görseli"
              defaultUrl={settings.heroImageUrl}
              folder="site"
              fileName="hero"
              hint="uploads/site/hero.webp"
            />
            <AdminImageUpload
              name="reservationBgUrl"
              label="Rezervasyon Arka Plan"
              defaultUrl={settings.reservationBgUrl}
              folder="site"
              fileName="reservation-bg"
              hint="uploads/site/reservation-bg.webp"
            />
            <AdminImageUpload
              name="storyImageMain"
              label="Hikâye Ana Görsel"
              defaultUrl={settings.storyImageMain}
              folder="site"
              fileName="story-main"
              hint="uploads/site/story-main.webp"
            />
            <AdminImageUpload
              name="storyImageKitchen"
              label="Mutfak Görseli"
              defaultUrl={settings.storyImageKitchen}
              folder="site"
              fileName="story-kitchen"
              hint="uploads/site/story-kitchen.webp"
            />
            <AdminImageUpload
              name="storyImageTable"
              label="Sofra Görseli"
              defaultUrl={settings.storyImageTable}
              folder="site"
              fileName="story-table"
              hint="uploads/site/story-table.webp"
            />
            <AdminImageUpload
              name="storyImageAyla"
              label="Ay'la Görseli"
              defaultUrl={settings.storyImageAyla}
              folder="site"
              fileName="story-ayla"
              hint="uploads/site/story-ayla.webp"
            />
            <AdminField
              label="Galeri Foto Süresi (ms)"
              name="galleryImageDuration"
              type="number"
              defaultValue={settings.galleryImageDuration}
            />
          </div>
        </AdminSection>

        <button
          type="submit"
          className="rounded-full bg-[#f3f1eb] px-8 py-3.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#171613] transition hover:-translate-y-0.5 hover:bg-white"
        >
          Kaydet
        </button>
      </form>
    </AdminShell>
  );
}
