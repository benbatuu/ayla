"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  createSession,
  destroySession,
  hashPassword,
  requireAdmin,
  verifyPassword,
} from "../lib/auth";
import {
  DEFAULT_GOOGLE_FEATURE_ID,
  isUsableHttpUrl,
  normalizeGooglePlaceId,
} from "../lib/google-maps";
import { prisma } from "../lib/prisma";
import {
  clearRateLimit,
  clientIpFromHeaders,
  isRateLimited,
  rateLimit,
} from "../lib/rate-limit";
import { slugify } from "../lib/slugify";

const LOGIN_RATE_LIMIT = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

const RESERVATION_STATUSES = [
  "pending",
  "confirmed",
  "cancelled",
  "no_show",
  "completed",
] as const;

const WAITER_CALL_STATUSES = [
  "pending",
  "preparing",
  "served",
  "paid",
] as const;

const TABLE_ORDER_STATUSES = [
  "pending",
  "preparing",
  "served",
  "cancelled",
  "closed",
] as const;

async function adminGuard() {
  try {
    return await requireAdmin();
  } catch {
    redirect("/admin/login");
  }
}

async function logLoginAttempt(email: string, ip: string, success: boolean) {
  try {
    await prisma.loginAttempt.create({
      data: { email, ip, success },
    });
  } catch {
    // Table may not exist yet if migrations lag behind generate.
  }
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const headerStore = await headers();
  const ip = clientIpFromHeaders(headerStore);
  const rateKey = `admin-login:${email}:${ip}`;

  const limited = isRateLimited(rateKey, LOGIN_RATE_LIMIT);

  if (!limited.ok) {
    redirect("/admin/login?error=locked");
  }

  const user = await prisma.user.findUnique({ where: { email } });
  const valid =
    Boolean(user) && (await verifyPassword(password, user!.password));

  if (!valid) {
    rateLimit(rateKey, {
      limit: LOGIN_RATE_LIMIT,
      windowMs: LOGIN_WINDOW_MS,
    });
    await logLoginAttempt(email, ip, false);
    redirect("/admin/login?error=1");
  }

  clearRateLimit(rateKey);
  await logLoginAttempt(email, ip, true);
  await createSession(user!.id);
  redirect("/admin");
}

export async function updateAdminCredentialsAction(formData: FormData) {
  const admin = await adminGuard();

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newEmail = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  const emailParsed = z.string().email().safeParse(newEmail);
  if (!emailParsed.success) {
    redirect("/admin/settings?account=invalid-email");
  }

  const existing = await prisma.user.findUnique({ where: { id: admin.id } });
  if (!existing || !(await verifyPassword(currentPassword, existing.password))) {
    redirect("/admin/settings?account=bad-password");
  }

  if (newPassword) {
    if (newPassword.length < 8) {
      redirect("/admin/settings?account=weak-password");
    }
    if (newPassword !== confirmPassword) {
      redirect("/admin/settings?account=mismatch");
    }
  }

  if (newEmail !== existing.email) {
    const taken = await prisma.user.findUnique({ where: { email: newEmail } });
    if (taken && taken.id !== existing.id) {
      redirect("/admin/settings?account=email-taken");
    }
  }

  await prisma.user.update({
    where: { id: existing.id },
    data: {
      email: newEmail,
      ...(newPassword ? { password: await hashPassword(newPassword) } : {}),
    },
  });

  revalidatePath("/admin/settings");
  redirect("/admin/settings?account=saved");
}

export async function logoutAction() {
  await destroySession();
  redirect("/admin/login");
}

const siteSettingsSchema = z.object({
  businessName: z.string().min(1),
  phone: z.string().min(1),
  phoneSecondary: z.string(),
  email: z.string().email(),
  addressLine1: z.string().min(1),
  addressLine2: z.string().min(1),
  country: z.string().min(1),
  postalCode: z.string(),
  latitude: z.coerce.number(),
  longitude: z.coerce.number(),
  mapUrl: z.string(),
  googlePlaceFeatureId: z.string(),
  googlePlaceId: z.string(),
  instagramUrl: z.string(),
  instagramHandle: z.string().min(1),
  facebookUrl: z.string(),
  whatsappUrl: z.string(),
  googleReviewsUrl: z.string(),
  tripadvisorUrl: z.string(),
  privacyUrl: z.string(),
  kvkkUrl: z.string(),
  directionsNoteTr: z.string(),
  directionsNoteEn: z.string(),
  directionsNoteRu: z.string(),
  largePartyPhoneThreshold: z.coerce.number().min(2).max(50),
  maxReservationDaysAhead: z.coerce.number().min(1).max(90),
  heroImageUrl: z.string().min(1),
  storyImageMain: z.string().min(1),
  storyImageKitchen: z.string().min(1),
  storyImageTable: z.string().min(1),
  storyImageAyla: z.string().min(1),
  reservationBgUrl: z.string().min(1),
  galleryImageDuration: z.coerce.number().min(1000).max(30000),
});

export async function updateSiteSettingsAction(formData: FormData) {
  await adminGuard();

  const parsed = siteSettingsSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!parsed.success) {
    redirect("/admin/settings?error=1");
  }

  const data = {
    ...parsed.data,
    googlePlaceFeatureId:
      parsed.data.googlePlaceFeatureId.trim() || DEFAULT_GOOGLE_FEATURE_ID,
    googlePlaceId: normalizeGooglePlaceId(parsed.data.googlePlaceId),
    googleReviewsUrl: isUsableHttpUrl(parsed.data.googleReviewsUrl)
      ? parsed.data.googleReviewsUrl.trim()
      : "",
  };

  await prisma.siteSettings.update({
    where: { id: "default" },
    data,
  });

  revalidatePath("/", "layout");
  redirect("/admin/settings?saved=1");
}

export async function updateMessageBundleAction(
  locale: string,
  data: Record<string, unknown>
) {
  await adminGuard();

  await prisma.messageBundle.upsert({
    where: { locale },
    update: { data: data as object },
    create: { locale, data: data as object },
  });

  revalidatePath("/", "layout");
}

async function getCategoryTranslationNames(categoryId: string | null) {
  if (!categoryId) {
    return { tr: "", en: "", ru: "" };
  }

  const category = await prisma.menuCategory.findUnique({
    where: { id: categoryId },
    include: { translations: true },
  });

  return {
    tr: category?.translations.find((t) => t.locale === "tr")?.name ?? "",
    en: category?.translations.find((t) => t.locale === "en")?.name ?? "",
    ru: category?.translations.find((t) => t.locale === "ru")?.name ?? "",
  };
}

function slugifyCategoryName(name: string) {
  return slugify(name, "kategori");
}

async function uniqueCategorySlug(base: string) {
  let slug = base;
  let suffix = 2;

  while (await prisma.menuCategory.findUnique({ where: { slug } })) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

async function uniqueMenuItemSlug(base: string, excludeId?: string) {
  let slug = base;
  let suffix = 2;

  while (true) {
    const existing = await prisma.menuItem.findFirst({ where: { slug } });
    if (!existing || existing.id === excludeId) {
      break;
    }
    slug = `${base}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

export async function createMenuCategoryAction(formData: FormData) {
  await adminGuard();

  const parentId = String(formData.get("parentId") ?? "") || null;
  const trName = String(formData.get("tr_name") ?? "").trim();
  const enName = String(formData.get("en_name") ?? "").trim() || trName;
  const ruName = String(formData.get("ru_name") ?? "").trim() || enName;
  const imageUrl = String(formData.get("imageUrl") ?? "").trim() || "/ayla_logo.jpg";
  const hasSubcategories = formData.get("hasSubcategories") === "on" && !parentId;

  if (!trName) {
    redirect(parentId ? `/admin/menu?parent=${parentId}` : "/admin/menu");
  }

  const slug = await uniqueCategorySlug(slugifyCategoryName(trName));
  const sortOrder = await prisma.menuCategory.count({
    where: { parentId: parentId ?? null },
  });

  const category = await prisma.menuCategory.create({
    data: {
      slug,
      parentId,
      imageUrl,
      sortOrder,
      hasSubcategories,
      published: true,
      translations: {
        create: [
          { locale: "tr", name: trName },
          { locale: "en", name: enName },
          { locale: "ru", name: ruName },
        ],
      },
    },
  });

  if (parentId) {
    await prisma.menuCategory.update({
      where: { id: parentId },
      data: { hasSubcategories: true },
    });
  }

  revalidatePath("/admin/menu");
  revalidatePath("/menu", "layout");
  revalidatePath("/", "layout");

  if (parentId) {
    redirect(`/admin/menu?parent=${parentId}`);
  }

  if (hasSubcategories) {
    redirect(`/admin/menu?parent=${category.id}`);
  }

  redirect(`/admin/menu?category=${category.id}`);
}

export async function updateMenuCategoryAction(id: string, formData: FormData) {
  await adminGuard();

  const parentId = String(formData.get("parentId") ?? "") || null;
  const trName = String(formData.get("tr_name") ?? "").trim();
  const enName = String(formData.get("en_name") ?? "").trim() || trName;
  const ruName = String(formData.get("ru_name") ?? "").trim() || enName;
  const imageUrl = String(formData.get("imageUrl") ?? "").trim() || "/ayla_logo.jpg";
  const sortOrder = Number(formData.get("sortOrder") ?? 0);
  const hasSubcategories = formData.get("hasSubcategories") === "on";

  await prisma.menuCategory.update({
    where: { id },
    data: {
      imageUrl,
      sortOrder,
      published: formData.get("published") === "on",
      hasSubcategories: parentId ? false : hasSubcategories,
    },
  });

  for (const [locale, name] of [
    ["tr", trName],
    ["en", enName],
    ["ru", ruName],
  ] as const) {
    await prisma.menuCategoryTranslation.upsert({
      where: { categoryId_locale: { categoryId: id, locale } },
      update: { name },
      create: { categoryId: id, locale, name },
    });
  }

  revalidatePath("/admin/menu");
  revalidatePath("/menu", "layout");
  revalidatePath("/", "layout");

  if (parentId) {
    redirect(`/admin/menu?parent=${parentId}`);
  }

  redirect("/admin/menu");
}

export async function deleteMenuCategoryAction(formData: FormData) {
  await adminGuard();

  const id = String(formData.get("id") ?? "");
  const parentId = String(formData.get("parentId") ?? "") || null;

  if (!id) {
    redirect(parentId ? `/admin/menu?parent=${parentId}` : "/admin/menu");
  }

  const category = await prisma.menuCategory.findUnique({
    where: { id },
    include: {
      _count: { select: { items: true, children: true } },
    },
  });

  if (!category) {
    redirect(parentId ? `/admin/menu?parent=${parentId}` : "/admin/menu");
  }

  if (category._count.items > 0 || category._count.children > 0) {
    redirect(
      parentId
        ? `/admin/menu?parent=${parentId}&error=category-not-empty`
        : `/admin/menu?error=category-not-empty`
    );
  }

  await prisma.menuCategory.delete({ where: { id } });

  if (category.parentId) {
    const siblingCount = await prisma.menuCategory.count({
      where: { parentId: category.parentId },
    });
    if (siblingCount === 0) {
      await prisma.menuCategory.update({
        where: { id: category.parentId },
        data: { hasSubcategories: false },
      });
    }
  }

  revalidatePath("/admin/menu");
  revalidatePath("/menu", "layout");
  revalidatePath("/", "layout");
  redirect(parentId ? `/admin/menu?parent=${parentId}` : "/admin/menu");
}

export async function createMenuItemAction(formData: FormData) {
  await adminGuard();

  const categoryId = String(formData.get("categoryId") ?? "") || null;
  const returnCategoryId =
    String(formData.get("returnCategoryId") ?? "") || categoryId || "";
  const imageUrl = String(formData.get("imageUrl") ?? "").trim() || "/ayla_logo.jpg";
  const price = String(formData.get("price") ?? "").trim() || null;
  const sortOrder = Number(formData.get("sortOrder") ?? 0);
  const trName = String(formData.get("tr_name") ?? "").trim();
  const enName = String(formData.get("en_name") ?? "").trim() || trName;
  const ruName = String(formData.get("ru_name") ?? "").trim() || enName;
  const trDescription = String(formData.get("tr_description") ?? "");
  const enDescription = String(formData.get("en_description") ?? "") || trDescription;
  const ruDescription = String(formData.get("ru_description") ?? "") || enDescription;

  if (!trName || !categoryId) {
    redirect(returnCategoryId ? `/admin/menu?category=${returnCategoryId}` : "/admin/menu");
  }

  const categoryNames = await getCategoryTranslationNames(categoryId);
  const slug = await uniqueMenuItemSlug(slugify(trName, "urun"));

  const item = await prisma.menuItem.create({
    data: {
      slug,
      imageUrl,
      price,
      sortOrder,
      categoryId,
      published: true,
    },
  });

  await prisma.menuItemTranslation.createMany({
    data: [
      {
        menuItemId: item.id,
        locale: "tr",
        category: categoryNames.tr,
        name: trName,
        description: trDescription,
        ingredients: "",
      },
      {
        menuItemId: item.id,
        locale: "en",
        category: categoryNames.en,
        name: enName,
        description: enDescription,
        ingredients: "",
      },
      {
        menuItemId: item.id,
        locale: "ru",
        category: categoryNames.ru || categoryNames.en,
        name: ruName,
        description: ruDescription,
        ingredients: "",
      },
    ],
  });

  revalidatePath("/admin/menu");
  revalidatePath("/", "layout");
  revalidatePath("/menu", "layout");
  redirect(returnCategoryId ? `/admin/menu?category=${returnCategoryId}` : "/admin/menu");
}

export async function updateMenuItemAction(id: string, formData: FormData) {
  await adminGuard();

  const categoryId = String(formData.get("categoryId") ?? "") || null;
  const returnCategoryId =
    String(formData.get("returnCategoryId") ?? "") || categoryId || "";
  const categoryNames = await getCategoryTranslationNames(categoryId);
  const trName = String(formData.get("tr_name") ?? "").trim();

  const existingItem = await prisma.menuItem.findUnique({
    where: { id },
    include: { translations: { where: { locale: "tr" }, take: 1 } },
  });
  const currentTrName = existingItem?.translations[0]?.name ?? "";
  const nextSlugBase = slugify(trName, "urun");
  const slugChanged = Boolean(trName) && slugify(currentTrName, "urun") !== nextSlugBase;
  const slug = slugChanged ? await uniqueMenuItemSlug(nextSlugBase, id) : undefined;

  await prisma.menuItem.update({
    where: { id },
    data: {
      ...(slug ? { slug } : {}),
      imageUrl: String(formData.get("imageUrl") ?? "").trim() || "/ayla_logo.jpg",
      price: String(formData.get("price") ?? "") || null,
      sortOrder: Number(formData.get("sortOrder") ?? 0),
      published: formData.get("published") === "on",
      isFeatured: formData.get("isFeatured") === "on",
      isVegetarian: formData.get("isVegetarian") === "on",
      isVegan: formData.get("isVegan") === "on",
      isGlutenFree: formData.get("isGlutenFree") === "on",
      spicyLevel: Number(formData.get("spicyLevel") ?? 0),
      allergens: String(formData.get("allergens") ?? ""),
      calories: String(formData.get("calories") ?? "")
        ? Number(formData.get("calories"))
        : null,
      prepTimeMinutes: String(formData.get("prepTimeMinutes") ?? "")
        ? Number(formData.get("prepTimeMinutes"))
        : null,
      categoryId,
    },
  });

  for (const locale of ["tr", "en", "ru"] as const) {
    await prisma.menuItemTranslation.upsert({
      where: { menuItemId_locale: { menuItemId: id, locale } },
      update: {
        category: categoryNames[locale] || categoryNames.en || categoryNames.tr,
        name: String(formData.get(`${locale}_name`) ?? ""),
        description: String(formData.get(`${locale}_description`) ?? ""),
        ingredients: String(formData.get(`${locale}_ingredients`) ?? ""),
      },
      create: {
        menuItemId: id,
        locale,
        category: categoryNames[locale] || categoryNames.en || categoryNames.tr,
        name: String(formData.get(`${locale}_name`) ?? ""),
        description: String(formData.get(`${locale}_description`) ?? ""),
        ingredients: String(formData.get(`${locale}_ingredients`) ?? ""),
      },
    });
  }

  revalidatePath("/admin/menu");
  revalidatePath("/", "layout");
  revalidatePath("/menu", "layout");
  redirect(returnCategoryId ? `/admin/menu?category=${returnCategoryId}` : "/admin/menu");
}

export async function deleteMenuItemAction(formData: FormData) {
  await adminGuard();

  const id = String(formData.get("id") ?? "");
  const returnCategoryId = String(formData.get("returnCategoryId") ?? "");

  if (id) {
    await prisma.menuItem.delete({ where: { id } });
  }

  revalidatePath("/admin/menu");
  revalidatePath("/", "layout");
  revalidatePath("/menu", "layout");
  redirect(returnCategoryId ? `/admin/menu?category=${returnCategoryId}` : "/admin/menu");
}

export async function createGalleryItemAction(formData: FormData) {
  await adminGuard();

  const item = await prisma.galleryItem.create({
    data: {
      type: String(formData.get("type") ?? "image"),
      src: String(formData.get("src") ?? ""),
      poster: String(formData.get("poster") ?? "") || null,
      sortOrder: Number(formData.get("sortOrder") ?? 0),
    },
  });

  for (const locale of ["tr", "en", "ru"] as const) {
    await prisma.galleryItemTranslation.create({
      data: {
        galleryItemId: item.id,
        locale,
        title: String(formData.get(`${locale}_title`) ?? ""),
        subtitle: String(formData.get(`${locale}_subtitle`) ?? ""),
      },
    });
  }

  revalidatePath("/", "layout");
}

export async function updateGalleryItemAction(id: string, formData: FormData) {
  await adminGuard();

  await prisma.galleryItem.update({
    where: { id },
    data: {
      type: String(formData.get("type") ?? "image"),
      src: String(formData.get("src") ?? ""),
      poster: String(formData.get("poster") ?? "") || null,
      sortOrder: Number(formData.get("sortOrder") ?? 0),
      published: formData.get("published") === "on",
    },
  });

  for (const locale of ["tr", "en", "ru"] as const) {
    await prisma.galleryItemTranslation.upsert({
      where: { galleryItemId_locale: { galleryItemId: id, locale } },
      update: {
        title: String(formData.get(`${locale}_title`) ?? ""),
        subtitle: String(formData.get(`${locale}_subtitle`) ?? ""),
      },
      create: {
        galleryItemId: id,
        locale,
        title: String(formData.get(`${locale}_title`) ?? ""),
        subtitle: String(formData.get(`${locale}_subtitle`) ?? ""),
      },
    });
  }

  revalidatePath("/", "layout");
}

export async function deleteGalleryItemAction(id: string) {
  await adminGuard();
  await prisma.galleryItem.delete({ where: { id } });
  revalidatePath("/", "layout");
}

export async function updateReservationStatusAction(
  id: string,
  formData: FormData
) {
  await adminGuard();

  const status = String(formData.get("status") ?? "pending");
  if (!(RESERVATION_STATUSES as readonly string[]).includes(status)) {
    return;
  }

  await prisma.reservation.update({
    where: { id },
    data: { status },
  });

  revalidatePath("/admin/reservations");
  revalidatePath("/", "layout");
}

export async function deleteReservationAction(id: string) {
  await adminGuard();
  await prisma.reservation.delete({ where: { id } });
  revalidatePath("/admin/reservations");
  revalidatePath("/", "layout");
}

export async function deleteMediaAction(id: string) {
  await adminGuard();
  const asset = await prisma.mediaAsset.findUnique({ where: { id } });
  if (asset?.url?.startsWith("/uploads/")) {
    const { unlink } = await import("fs/promises");
    const path = await import("path");
    const filePath = path.join(process.cwd(), "public", asset.url.replace(/^\//, ""));
    try {
      await unlink(filePath);
    } catch {
      // file may already be missing
    }
  }
  await prisma.mediaAsset.delete({ where: { id } });
  revalidatePath("/admin/media");
}

const reservationSettingsSchema = z.object({
  openTime: z.string().min(1),
  closeTime: z.string().min(1),
  maxGuests: z.coerce.number().min(1).max(50),
  timeSlotInterval: z.coerce.number().min(15).max(120),
  maxCoversPerSlot: z.coerce.number().min(1).max(200),
  maxReservationsPerSlot: z.coerce.number().min(1).max(100),
});

export async function updateReservationSettingsAction(formData: FormData) {
  await adminGuard();

  const parsed = reservationSettingsSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!parsed.success) {
    redirect("/admin/reservation-slots?error=1");
  }

  await prisma.siteSettings.update({
    where: { id: "default" },
    data: parsed.data,
  });

  revalidatePath("/", "layout");
  revalidatePath("/admin/reservation-slots");
  redirect("/admin/reservation-slots?saved=1");
}

export async function syncReservationSlotsAction() {
  await adminGuard();

  const { syncReservationSlotsFromSettings } = await import(
    "../lib/reservations"
  );
  await syncReservationSlotsFromSettings();

  revalidatePath("/", "layout");
  revalidatePath("/admin/reservation-slots");
  redirect("/admin/reservation-slots?synced=1");
}

export async function createReservationSlotAction(formData: FormData) {
  await adminGuard();

  const time = String(formData.get("time") ?? "").trim();
  if (!/^\d{2}:\d{2}$/.test(time)) {
    redirect("/admin/reservation-slots?error=1");
  }

  const count = await prisma.reservationSlot.count();

  await prisma.reservationSlot.upsert({
    where: { time },
    update: { enabled: true },
    create: { time, sortOrder: count, enabled: true },
  });

  revalidatePath("/", "layout");
  revalidatePath("/admin/reservation-slots");
}

export async function updateReservationSlotAction(
  id: string,
  formData: FormData
) {
  await adminGuard();

  const enabled = formData.get("enabled") === "on";
  const maxCoversRaw = String(formData.get("maxCovers") ?? "").trim();
  const maxBookingsRaw = String(formData.get("maxBookings") ?? "").trim();
  const sortOrder = Number(formData.get("sortOrder") ?? 0);

  await prisma.reservationSlot.update({
    where: { id },
    data: {
      enabled,
      sortOrder,
      maxCovers: maxCoversRaw ? Number(maxCoversRaw) : null,
      maxBookings: maxBookingsRaw ? Number(maxBookingsRaw) : null,
    },
  });

  revalidatePath("/", "layout");
  revalidatePath("/admin/reservation-slots");
}

export async function deleteReservationSlotAction(id: string) {
  await adminGuard();
  await prisma.reservationSlot.delete({ where: { id } });
  revalidatePath("/", "layout");
  revalidatePath("/admin/reservation-slots");
}

const menuSettingsSchema = z.object({
  wifiSsid: z.string(),
  wifiPassword: z.string(),
  welcomeMessageTr: z.string().min(1),
  welcomeMessageEn: z.string().min(1),
  welcomeMessageRu: z.string().min(1),
  menuLogoUrl: z.string().min(1),
  menuBaseUrl: z.string().min(1),
  callWaiterEnabled: z.coerce.boolean().optional(),
  orderingEnabled: z.coerce.boolean().optional(),
  showImages: z.coerce.boolean().optional(),
  showPrices: z.coerce.boolean().optional(),
});

export async function updateMenuSettingsAction(formData: FormData) {
  await adminGuard();

  const parsed = menuSettingsSchema.safeParse({
    ...Object.fromEntries(formData.entries()),
    callWaiterEnabled: formData.get("callWaiterEnabled") === "on",
    orderingEnabled: formData.get("orderingEnabled") === "on",
    showImages: formData.get("showImages") === "on",
    showPrices: formData.get("showPrices") === "on",
  });

  if (!parsed.success) {
    redirect("/admin/menu-settings?error=1");
  }

  await prisma.menuSettings.upsert({
    where: { id: "default" },
    update: parsed.data,
    create: { id: "default", ...parsed.data },
  });

  revalidatePath("/menu", "layout");
  redirect("/admin/menu-settings?saved=1");
}

export async function createTableAction(formData: FormData) {
  await adminGuard();

  const number = Number(formData.get("number"));
  const zone = String(formData.get("zone") ?? "Salon");
  const label = String(formData.get("label") ?? "").trim() || null;

  if (!Number.isInteger(number) || number < 1) {
    redirect("/admin/tables?error=1");
  }

  await prisma.restaurantTable.create({
    data: { number, zone, label },
  });

  revalidatePath("/admin/tables");
}

export async function updateTableAction(id: string, formData: FormData) {
  await adminGuard();

  await prisma.restaurantTable.update({
    where: { id },
    data: {
      number: Number(formData.get("number")),
      zone: String(formData.get("zone") ?? "Salon"),
      label: String(formData.get("label") ?? "").trim() || null,
      active: formData.get("active") === "on",
    },
  });

  revalidatePath("/admin/tables");
}

export async function deleteTableAction(id: string) {
  await adminGuard();
  await prisma.restaurantTable.delete({ where: { id } });
  revalidatePath("/admin/tables");
}

export async function regenerateTableTokenAction(id: string) {
  await adminGuard();
  const { randomUUID } = await import("crypto");
  await prisma.restaurantTable.update({
    where: { id },
    data: { qrToken: randomUUID() },
  });
  revalidatePath("/admin/tables");
}

export async function updateWaiterCallStatusAction(
  id: string,
  formData: FormData
) {
  await adminGuard();
  const status = String(formData.get("status") ?? "pending");
  if (!(WAITER_CALL_STATUSES as readonly string[]).includes(status)) {
    return;
  }

  const call = await prisma.waiterCall.findUnique({ where: { id } });
  if (!call) return;

  await prisma.$transaction(async (tx) => {
    await tx.waiterCall.update({
      where: { id },
      data: { status },
    });

    // Garson "Hesap alındı" dediğinde masa adisyonunu kapat
    if (status === "paid" && call.type === "bill") {
      await tx.tableOrder.updateMany({
        where: {
          tableId: call.tableId,
          status: { in: ["pending", "preparing", "served"] },
        },
        data: { status: "closed" },
      });
      // Aynı masadaki diğer açık hesap isteklerini de kapat
      await tx.waiterCall.updateMany({
        where: {
          tableId: call.tableId,
          type: "bill",
          status: { in: ["pending", "preparing", "served"] },
          id: { not: id },
        },
        data: { status: "paid" },
      });
    }
  });

  revalidatePath("/admin/service");
}

export async function updateTableOrderStatusAction(
  id: string,
  formData: FormData
) {
  await adminGuard();
  const status = String(formData.get("status") ?? "pending");
  if (!(TABLE_ORDER_STATUSES as readonly string[]).includes(status)) {
    return;
  }
  await prisma.tableOrder.update({
    where: { id },
    data: { status },
  });
  revalidatePath("/admin/service");
}

const seoSettingsSchema = z.object({
  metaTitleTr: z.string().min(1),
  metaTitleEn: z.string().min(1),
  metaTitleRu: z.string().min(1),
  metaDescriptionTr: z.string().min(1),
  metaDescriptionEn: z.string().min(1),
  metaDescriptionRu: z.string().min(1),
  metaKeywords: z.string(),
  ogImageUrl: z.string().min(1),
  canonicalBaseUrl: z.string().url(),
  googleSiteVerification: z.string(),
  bingSiteVerification: z.string(),
});

export async function updateSeoSettingsAction(formData: FormData) {
  await adminGuard();

  const parsed = seoSettingsSchema.safeParse({
    metaTitleTr: String(formData.get("metaTitleTr") ?? ""),
    metaTitleEn: String(formData.get("metaTitleEn") ?? ""),
    metaTitleRu: String(formData.get("metaTitleRu") ?? ""),
    metaDescriptionTr: String(formData.get("metaDescriptionTr") ?? ""),
    metaDescriptionEn: String(formData.get("metaDescriptionEn") ?? ""),
    metaDescriptionRu: String(formData.get("metaDescriptionRu") ?? ""),
    metaKeywords: String(formData.get("metaKeywords") ?? ""),
    ogImageUrl: String(formData.get("ogImageUrl") ?? ""),
    canonicalBaseUrl: String(formData.get("canonicalBaseUrl") ?? ""),
    googleSiteVerification: String(formData.get("googleSiteVerification") ?? ""),
    bingSiteVerification: String(formData.get("bingSiteVerification") ?? ""),
  });

  if (!parsed.success) {
    redirect("/admin/seo?error=1");
  }

  await prisma.seoSettings.upsert({
    where: { id: "default" },
    update: {
      ...parsed.data,
      robotsAllowIndex: formData.get("robotsAllowIndex") === "on",
      structuredDataEnabled: formData.get("structuredDataEnabled") === "on",
    },
    create: {
      id: "default",
      ...parsed.data,
      robotsAllowIndex: formData.get("robotsAllowIndex") === "on",
      structuredDataEnabled: formData.get("structuredDataEnabled") === "on",
    },
  });

  revalidatePath("/", "layout");
  redirect("/admin/seo?saved=1");
}

const marketingSettingsSchema = z.object({
  googleAnalyticsId: z.string(),
  googleTagManagerId: z.string(),
  facebookPixelId: z.string(),
});

export async function updateMarketingSettingsAction(formData: FormData) {
  await adminGuard();

  const parsed = marketingSettingsSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    redirect("/admin/marketing?error=1");
  }

  await prisma.marketingSettings.upsert({
    where: { id: "default" },
    update: parsed.data,
    create: { id: "default", ...parsed.data },
  });

  revalidatePath("/", "layout");
  redirect("/admin/marketing?saved=1");
}

export async function createMarketingCampaignAction(formData: FormData) {
  await adminGuard();

  const name = String(formData.get("name") ?? "").trim();
  const source = String(formData.get("source") ?? "").trim();
  const medium = String(formData.get("medium") ?? "").trim();
  const campaign = String(formData.get("campaign") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim() || null;

  if (!name || !source || !medium || !campaign) {
    redirect("/admin/marketing/campaigns?error=1");
  }

  await prisma.marketingCampaign.create({
    data: { name, source, medium, campaign, content, active: true },
  });

  revalidatePath("/admin/marketing/campaigns");
  redirect("/admin/marketing/campaigns?saved=1");
}

export async function toggleMarketingCampaignAction(id: string) {
  await adminGuard();

  const current = await prisma.marketingCampaign.findUnique({ where: { id } });
  if (!current) return;

  await prisma.marketingCampaign.update({
    where: { id },
    data: { active: !current.active },
  });

  revalidatePath("/admin/marketing/campaigns");
}

export async function deleteMarketingCampaignAction(id: string) {
  await adminGuard();
  await prisma.marketingCampaign.delete({ where: { id } });
  revalidatePath("/admin/marketing/campaigns");
}
