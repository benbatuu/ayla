import "dotenv/config";
import { createPrismaClient } from "../app/lib/prisma";

const p = createPrismaClient();

async function main() {
  const [u, m, s, seo] = await Promise.all([
    p.user.findFirst({ select: { email: true } }),
    p.menuItem.count(),
    p.siteSettings.findFirst({
      select: { businessName: true, phone: true },
    }),
    p.seoSettings.findFirst({ select: { canonicalBaseUrl: true } }),
  ]);
  console.log({
    admin: u?.email,
    menuItems: m,
    business: s?.businessName,
    phone: s?.phone,
    canonical: seo?.canonicalBaseUrl,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => p.$disconnect());
