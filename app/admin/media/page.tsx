import AdminShell from "../components/AdminShell";
import AdminPageHeader from "../components/AdminPageHeader";
import { getAdminUser } from "../layout";
import { prisma } from "../../lib/prisma";
import MediaUploader from "./MediaUploader";

export default async function AdminMediaPage() {
  const user = await getAdminUser();

  const assets = await prisma.mediaAsset.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <AdminShell user={user}>
      <AdminPageHeader
        title="Medya Kütüphanesi"
        description="Görselleri ve videoları yükleyin. Dosyalar uploads/media/ klasörüne kaydedilir."
      />

      <MediaUploader assets={assets} />
    </AdminShell>
  );
}
