import tr from "../app/messages/tr.json";
import en from "../app/messages/en.json";
import ru from "../app/messages/ru.json";
import { PrismaClient } from "../app/generated/prisma/client";

const prisma = new PrismaClient({
  datasources: { db: { url: "file:./dev.db" } },
});

async function main() {
  const bundles = { tr, en, ru } as const;
  for (const [locale, data] of Object.entries(bundles)) {
    await prisma.messageBundle.upsert({
      where: { locale },
      update: { data },
      create: { locale, data },
    });
    console.log("bundle", locale);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
