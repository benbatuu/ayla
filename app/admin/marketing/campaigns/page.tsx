import AdminField from "../../components/AdminField";
import AdminPageHeader, { AdminCard, AdminSection } from "../../components/AdminPageHeader";
import AdminShell from "../../components/AdminShell";
import {
  createMarketingCampaignAction,
  deleteMarketingCampaignAction,
  toggleMarketingCampaignAction,
} from "../../actions";
import { getAdminUser } from "../../layout";
import { buildCampaignUrl } from "../../../lib/marketing";
import { getSeoSettings } from "../../../lib/seo";
import { prisma } from "../../../lib/prisma";

export default async function AdminMarketingCampaignsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const user = await getAdminUser();
  const [campaigns, seo] = await Promise.all([
    prisma.marketingCampaign.findMany({ orderBy: { createdAt: "desc" } }),
    getSeoSettings(),
  ]);
  const params = await searchParams;
  const baseUrl = seo.canonicalBaseUrl;

  return (
    <AdminShell user={user} wide>
      <AdminPageHeader
        title="Kampanyalar"
        description="UTM parametreli pazarlama linkleri oluşturun ve performanslarını izleyin."
      />

      {params.saved === "1" ? (
        <div className="mb-6 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          Kampanya oluşturuldu.
        </div>
      ) : null}

      <form action={createMarketingCampaignAction} className="rounded-3xl border border-dashed border-white/15 p-6">
        <h2 className="mb-6 text-lg">Yeni Kampanya</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <AdminField label="Kampanya Adı" name="name" required placeholder="Yaz Instagram Reklamı" />
          <AdminField label="UTM Source" name="source" required placeholder="instagram" />
          <AdminField label="UTM Medium" name="medium" required placeholder="social" />
          <AdminField label="UTM Campaign" name="campaign" required placeholder="yaz-menu-2026" />
          <AdminField label="UTM Content (opsiyonel)" name="content" placeholder="story-v1" />
        </div>
        <button
          type="submit"
          className="mt-6 rounded-full bg-[#f3f1eb] px-6 py-2.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#171613]"
        >
          Kampanya Oluştur
        </button>
      </form>

      <div className="mt-8 space-y-4">
        {campaigns.map((campaign) => {
          const trackingUrl = buildCampaignUrl(baseUrl, campaign);
          return (
            <AdminCard key={campaign.id}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-medium">{campaign.name}</h3>
                  <p className="mt-1 text-xs text-white/40">
                    {campaign.source} · {campaign.medium} · {campaign.campaign}
                    {campaign.content ? ` · ${campaign.content}` : ""}
                  </p>
                  <p className="mt-3 break-all rounded-xl bg-black/20 px-3 py-2 text-xs text-white/55">
                    {trackingUrl}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <form action={toggleMarketingCampaignAction.bind(null, campaign.id)}>
                    <button type="submit" className="text-xs text-white/55 hover:text-white">
                      {campaign.active ? "Pasifleştir" : "Aktifleştir"}
                    </button>
                  </form>
                  <form action={deleteMarketingCampaignAction.bind(null, campaign.id)}>
                    <button type="submit" className="text-xs text-red-300">Sil</button>
                  </form>
                </div>
              </div>
            </AdminCard>
          );
        })}
        {campaigns.length === 0 ? (
          <p className="text-sm text-white/35">Henüz kampanya yok.</p>
        ) : null}
      </div>

      <AdminSection title="Kampanya İpuçları" className="mt-8">
        <ul className="space-y-2 text-sm text-white/55">
          <li>• Instagram hikâyeleri için source=instagram, medium=social kullanın.</li>
          <li>• Google Ads için source=google, medium=cpc önerilir.</li>
          <li>• QR menü masaları için ayrı content parametreleri ile masayı ayırt edin.</li>
          <li>• Performansı Analitik → Ziyaretçiler → Kampanya Trafiği bölümünden takip edin.</li>
        </ul>
      </AdminSection>
    </AdminShell>
  );
}
