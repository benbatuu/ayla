import AdminShell from "../components/AdminShell";
import AdminPageHeader from "../components/AdminPageHeader";
import { getAdminUser } from "../layout";
import { prisma } from "../../lib/prisma";
import ContentEditor from "./ContentEditor";

export default async function AdminContentPage() {
  const user = await getAdminUser();

  const bundles = await prisma.messageBundle.findMany();
  const data = {
    tr: (bundles.find((b) => b.locale === "tr")?.data as Record<string, unknown>) ?? {},
    en: (bundles.find((b) => b.locale === "en")?.data as Record<string, unknown>) ?? {},
    ru: (bundles.find((b) => b.locale === "ru")?.data as Record<string, unknown>) ?? {},
  };

  return (
    <AdminShell user={user}>
      <AdminPageHeader
        title="İçerik & Metinler"
        description="Tüm site metinlerini bölüm bölüm, dil dil düzenleyin."
      />

      <ContentEditor bundles={data} />
    </AdminShell>
  );
}
