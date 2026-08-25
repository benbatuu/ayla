import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { PrismaClient } from "../app/generated/prisma/client";
import {
  DEFAULT_CATEGORY_IMAGE,
  QRTEKPRO_IMAGE_BASE,
} from "./qrtekpro-categories";

export type QrTekproProduct = {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  currency: string;
  cover_image: string | null;
  is_featured: boolean;
  is_available: boolean;
  category_id: number;
  category_name: string;
  category_slug: string;
  ingredients: string | null;
  allergens: string | null;
  preparation_time: number | null;
  dietary_tags: string[];
};

export function loadQrTekproProducts(): QrTekproProduct[] {
  const filePath = join(process.cwd(), "prisma/data/qrtekpro-products.json");
  return JSON.parse(readFileSync(filePath, "utf-8")) as QrTekproProduct[];
}

export function resolveProductImage(coverImage: string | null): string {
  if (!coverImage) return DEFAULT_CATEGORY_IMAGE;
  if (coverImage.startsWith("http://") || coverImage.startsWith("https://")) {
    return coverImage;
  }
  const path = coverImage.startsWith("/") ? coverImage : `/${coverImage}`;
  return `${QRTEKPRO_IMAGE_BASE}${path}`;
}

export function formatProductPrice(price: number, currency: string): string {
  if (currency === "TRY") {
    return `₺${price.toLocaleString("tr-TR")}`;
  }
  return `${price} ${currency}`;
}

function mapDietaryTags(tags: string[]) {
  const normalized = tags.map((tag) => tag.toLowerCase());

  return {
    isVegetarian: normalized.some(
      (tag) => tag.includes("vegetarian") || tag.includes("vejetaryen")
    ),
    isVegan: normalized.some((tag) => tag.includes("vegan")),
    isGlutenFree: normalized.some(
      (tag) => tag.includes("gluten") || tag.includes("glutensiz")
    ),
  };
}

export async function seedQrTekproProducts(
  prisma: PrismaClient,
  categoryIdByExternal: Map<number, string>
) {
  const products = loadQrTekproProducts();
  const sortCounters = new Map<number, number>();

  for (const product of products) {
    const categoryId = categoryIdByExternal.get(product.category_id);
    if (!categoryId) {
      throw new Error(
        `Missing category for product ${product.id} (${product.name}), category_id=${product.category_id}`
      );
    }

    const sortOrder = sortCounters.get(product.category_id) ?? 0;
    sortCounters.set(product.category_id, sortOrder + 1);

    const dietary = mapDietaryTags(product.dietary_tags ?? []);

    await prisma.menuItem.create({
      data: {
        externalId: product.id,
        slug: product.slug,
        categoryId,
        sortOrder,
        imageUrl: resolveProductImage(product.cover_image),
        price: formatProductPrice(product.price, product.currency),
        published: product.is_available,
        isFeatured: product.is_featured,
        isVegetarian: dietary.isVegetarian,
        isVegan: dietary.isVegan,
        isGlutenFree: dietary.isGlutenFree,
        allergens: product.allergens ?? "",
        prepTimeMinutes: product.preparation_time ?? undefined,
        translations: {
          create: [
            {
              locale: "tr",
              category: product.category_name,
              name: product.name,
              description: product.description ?? "",
              ingredients: product.ingredients ?? "",
            },
            {
              locale: "en",
              category: product.category_name,
              name: product.name,
              description: product.description ?? "",
              ingredients: product.ingredients ?? "",
            },
          ],
        },
      },
    });
  }

  return products.length;
}
