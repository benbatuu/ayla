import AdminPageHeader from "../components/AdminPageHeader";
import AdminShell from "../components/AdminShell";
import { getAdminUser } from "../layout";
import { prisma } from "../../lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminFeedbackPage() {
  const user = await getAdminUser();
  const feedback = await prisma.menuFeedback.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <AdminShell user={user}>
      <AdminPageHeader
        title="Misafir Geri Bildirim"
        description="QR menüden gelen öneri, şikayet ve ürün puanları."
      />

      <div className="space-y-3">
        {feedback.map((item) => (
          <article
            key={item.id}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
          >
            <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-wider text-white/40">
              <span>{item.type}</span>
              <span>·</span>
              <span>{item.createdAt.toLocaleString("tr-TR")}</span>
              {item.rating != null ? (
                <>
                  <span>·</span>
                  <span>★ {item.rating}</span>
                </>
              ) : null}
            </div>
            {item.message ? (
              <p className="mt-3 text-sm leading-6 text-white/75">{item.message}</p>
            ) : null}
            {item.menuItemId ? (
              <p className="mt-2 text-xs text-white/35">Ürün: {item.menuItemId}</p>
            ) : null}
          </article>
        ))}
        {feedback.length === 0 ? (
          <p className="text-sm text-white/40">Henüz geri bildirim yok.</p>
        ) : null}
      </div>
    </AdminShell>
  );
}
