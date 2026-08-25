import { pickTranslation, type AppLocale } from "./locale";
import { getSiteSettings } from "./content";
import { prisma } from "./prisma";

export type QrLocale = AppLocale;

export type QrMenuItem = {
  id: string;
  categoryId: string | null;
  category: string;
  name: string;
  description: string;
  ingredients: string;
  image: string;
  price: string | null;
  isFeatured: boolean;
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  spicyLevel: number;
  allergens: string;
  calories: number | null;
  prepTimeMinutes: number | null;
};

export type QrMenuCategory = {
  id: string;
  name: string;
  slug: string | null;
  image: string;
  hasSubcategories: boolean;
  itemCount: number;
  items: QrMenuItem[];
  children: QrMenuCategory[];
};

export async function getMenuSettings() {
  const settings = await prisma.menuSettings.findUnique({
    where: { id: "default" },
  });

  if (settings) {
    return settings;
  }

  return prisma.menuSettings.create({
    data: { id: "default" },
  });
}

export async function getTableByToken(token: string) {
  return prisma.restaurantTable.findFirst({
    where: { qrToken: token, active: true },
  });
}

export async function getQrMenu(locale: QrLocale): Promise<QrMenuCategory[]> {
  const allCategories = await fetchCategories();

  if (allCategories.length > 0) {
    return allCategories.map((category) => mapCategory(category, locale));
  }

  const items = await prisma.menuItem.findMany({
    where: { published: true },
    orderBy: { sortOrder: "asc" },
    include: { translations: true },
  });

  const grouped = new Map<string, QrMenuItem[]>();

  for (const item of items) {
    const translation = pickTranslation(item.translations, locale);
    const categoryName = translation?.category ?? "Menu";
    const mapped = mapMenuItem(item, locale);
    const list = grouped.get(categoryName) ?? [];
    list.push(mapped);
    grouped.set(categoryName, list);
  }

  return Array.from(grouped.entries()).map(([name, categoryItems], index) => ({
    id: `legacy-${index}`,
    name,
    slug: null,
    image: "/ayla_logo.jpg",
    hasSubcategories: false,
    itemCount: categoryItems.length,
    items: categoryItems,
    children: [],
  }));
}

function mapCategory(category: Awaited<ReturnType<typeof fetchCategories>>[number], locale: QrLocale): QrMenuCategory {
  const items = category.items.map((item) => mapMenuItem(item, locale));
  const children = (category.children ?? []).map((child) => ({
    id: child.id,
    name: pickTranslation(child.translations, locale)?.name ?? "",
    slug: child.slug,
    image: child.imageUrl ?? "/ayla_logo.jpg",
    hasSubcategories: child.hasSubcategories,
    itemCount: child.items.length,
    items: child.items.map((item) => mapMenuItem(item, locale)),
    children: [],
  }));

  return {
    id: category.id,
    name: pickTranslation(category.translations, locale)?.name ?? "",
    slug: category.slug,
    image: category.imageUrl ?? "/ayla_logo.jpg",
    hasSubcategories: category.hasSubcategories || children.length > 0,
    itemCount: items.length,
    items,
    children,
  };
}

async function fetchCategories() {
  return prisma.menuCategory.findMany({
    where: { published: true, parentId: null },
    orderBy: { sortOrder: "asc" },
    include: {
      translations: true,
      children: {
        where: { published: true },
        orderBy: { sortOrder: "asc" },
        include: {
          translations: true,
          items: {
            where: { published: true },
            orderBy: { sortOrder: "asc" },
            include: { translations: true },
          },
        },
      },
      items: {
        where: { published: true },
        orderBy: { sortOrder: "asc" },
        include: { translations: true },
      },
    },
  });
}

function mapMenuItem(
  item: {
    id: string;
    categoryId: string | null;
    imageUrl: string;
    price: string | null;
    isFeatured: boolean;
    isVegetarian: boolean;
    isVegan: boolean;
    isGlutenFree: boolean;
    spicyLevel: number;
    allergens: string;
    calories: number | null;
    prepTimeMinutes: number | null;
    translations: Array<{
      locale: string;
      category: string;
      name: string;
      description: string;
      ingredients: string;
    }>;
  },
  locale: QrLocale
): QrMenuItem {
  const translation = pickTranslation(item.translations, locale);

  return {
    id: item.id,
    categoryId: item.categoryId,
    category: translation?.category ?? "",
    name: translation?.name ?? "",
    description: translation?.description ?? "",
    ingredients: translation?.ingredients ?? "",
    image: item.imageUrl,
    price: item.price,
    isFeatured: item.isFeatured,
    isVegetarian: item.isVegetarian,
    isVegan: item.isVegan,
    isGlutenFree: item.isGlutenFree,
    spicyLevel: item.spicyLevel,
    allergens: item.allergens,
    calories: item.calories,
    prepTimeMinutes: item.prepTimeMinutes,
  };
}

export function getMenuUrl(baseUrl: string, token: string, locale?: QrLocale) {
  const base = baseUrl.replace(/\/$/, "");
  if (locale && locale !== "tr") {
    return `${base}/${locale}/t/${token}`;
  }
  return `${base}/t/${token}`;
}

export async function getPendingServiceRequests() {
  const [waiterCalls, orders] = await Promise.all([
    prisma.waiterCall.findMany({
      where: { status: { in: ["pending", "preparing"] } },
      orderBy: { createdAt: "desc" },
      include: { table: true },
      take: 50,
    }),
    prisma.tableOrder.findMany({
      where: { status: { in: ["pending", "preparing"] } },
      orderBy: { createdAt: "desc" },
      include: {
        table: true,
        items: true,
      },
      take: 50,
    }),
  ]);

  return { waiterCalls, orders };
}

export async function getServiceHistory(limit = 40) {
  const [waiterCalls, orders] = await Promise.all([
    prisma.waiterCall.findMany({
      where: { status: { in: ["served", "paid"] } },
      orderBy: { updatedAt: "desc" },
      include: { table: true },
      take: limit,
    }),
    prisma.tableOrder.findMany({
      where: { status: { in: ["served", "cancelled", "closed"] } },
      orderBy: { updatedAt: "desc" },
      include: { table: true, items: true },
      take: limit,
    }),
  ]);
  return { waiterCalls, orders };
}

/** Server-side open-check total in TL (integer). */
export async function getOpenBillTotalForTable(tableId: string): Promise<number> {
  const orders = await prisma.tableOrder.findMany({
    where: {
      tableId,
      status: { in: ["pending", "preparing", "served"] },
    },
    include: { items: true },
  });

  let total = 0;
  for (const order of orders) {
    for (const item of order.items) {
      const price = Number.parseFloat(
        String(item.unitPrice ?? "0").replace(/[^\d.,]/g, "").replace(",", ".")
      );
      if (Number.isFinite(price)) {
        total += price * item.quantity;
      }
    }
  }
  return Math.round(total);
}

export async function getPublicMenuPageData() {
  const [menuSettings, siteSettings, menuTr, menuEn, menuRu] = await Promise.all([
    getMenuSettings(),
    getSiteSettings(),
    getQrMenu("tr"),
    getQrMenu("en"),
    getQrMenu("ru"),
  ]);

  return {
    menuSettings,
    siteSettings: {
      phone: siteSettings.phone,
      phoneSecondary: siteSettings.phoneSecondary,
      email: siteSettings.email,
      openTime: siteSettings.openTime,
      closeTime: siteSettings.closeTime,
      country: siteSettings.country,
      mapUrl: siteSettings.mapUrl,
      googlePlaceFeatureId: siteSettings.googlePlaceFeatureId,
      googlePlaceId: siteSettings.googlePlaceId,
      instagramUrl: siteSettings.instagramUrl,
      instagramHandle: siteSettings.instagramHandle,
      facebookUrl: siteSettings.facebookUrl,
      googleReviewsUrl: siteSettings.googleReviewsUrl,
      tripadvisorUrl: siteSettings.tripadvisorUrl,
      heroImageUrl: siteSettings.heroImageUrl,
      businessName: siteSettings.businessName,
    },
    menuByLocale: { tr: menuTr, en: menuEn, ru: menuRu },
  };
}
