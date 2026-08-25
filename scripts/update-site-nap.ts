import { PrismaClient } from "../app/generated/prisma/client";
import { generateTimeSlots } from "../app/lib/content";

const prisma = new PrismaClient({
  datasources: { db: { url: "file:./dev.db" } },
});

const MAP =
  "https://www.google.com/maps/place/Ay'La+Food+%26+More/@36.5484256,31.9945747,17z/data=!4m6!3m5!1s0x14dc9983c30ef407:0xf396f6025729a5bb!8m2!3d36.5484256!4d31.9945747!16s%2Fg%2F11z0mq9pyl";

async function main() {
  await prisma.siteSettings.update({
    where: { id: "default" },
    data: {
      businessName: "Ay'la Food & More",
      phone: "+90 549 613 53 73",
      phoneSecondary: "+90 242 502 71 70",
      email: "reservation@aylaalanya.com",
      addressLine1: "Kadıpaşa, Sugözü Cd. No:10",
      addressLine2: "07400 Alanya / Antalya",
      country: "Türkiye",
      postalCode: "07400",
      latitude: 36.5484256,
      longitude: 31.9945747,
      mapUrl: MAP,
      googlePlaceFeatureId: "0x14dc9983c30ef407:0xf396f6025729a5bb",
      googlePlaceId: "ChIJB_QOw4OZ3BQRu6UpVwL2lvM",
      instagramUrl: "https://www.instagram.com/ayla_alanya/",
      instagramHandle: "@ayla_alanya",
      facebookUrl: "https://www.facebook.com/aylaalanyaa",
      googleReviewsUrl:
        "https://search.google.com/local/writereview?placeid=ChIJB_QOw4OZ3BQRu6UpVwL2lvM",
      tripadvisorUrl: "",
      openTime: "10:00",
      closeTime: "01:00",
    },
  });

  await prisma.seoSettings.upsert({
    where: { id: "default" },
    update: {
      metaTitleTr: "Ay'la Food & More | Bazı Şeyler Asla Değişmez",
      metaTitleEn: "Ay'la Food & More | Some Things Never Change",
      metaTitleRu: "Ay'la Food & More | Некоторые вещи никогда не меняются",
      metaDescriptionTr:
        "Ay'la Food & More | Bazı Şeyler Asla Değişmez. Akdeniz ve Türk mutfağı, steak & ızgara. Her gün 10:00–01:00.",
      metaDescriptionEn:
        "Ay'la Food & More | Some Things Never Change. Mediterranean & Turkish cuisine, steak & grill. Open daily 10:00–01:00.",
      metaDescriptionRu:
        "Ay'la Food & More | Некоторые вещи никогда не меняются. Средиземноморская и турецкая кухня, стейки и гриль. Ежедневно 10:00–01:00.",
      metaKeywords:
        "ayla food and more, ayla alanya, bazı şeyler asla değişmez, steak alanya, ızgara, akdeniz mutfağı, türk mutfağı, rezervasyon alanya",
      ogImageUrl: "/hero_image.jpeg",
      canonicalBaseUrl: "https://aylaalanya.com",
      robotsAllowIndex: true,
      structuredDataEnabled: true,
    },
    create: { id: "default" },
  });

  const settings = await prisma.siteSettings.findUniqueOrThrow({
    where: { id: "default" },
  });
  const times = generateTimeSlots(
    settings.openTime,
    settings.closeTime,
    settings.timeSlotInterval
  );
  await prisma.reservationSlot.deleteMany({});
  for (let i = 0; i < times.length; i++) {
    await prisma.reservationSlot.create({
      data: { time: times[i], sortOrder: i, enabled: true },
    });
  }
  console.log(
    "Updated NAP/SEO. Slots:",
    times.length,
    times[0],
    "→",
    times[times.length - 1]
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
