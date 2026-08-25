import AdminShell from "../components/AdminShell";
import AdminPageHeader from "../components/AdminPageHeader";
import { getAdminUser } from "../layout";
import { prisma } from "../../lib/prisma";
import MenuManager, { type AdminMenuCategory, type AdminMenuItem } from "./MenuManager";

function mapItem(
  item: Awaited<ReturnType<typeof fetchCategories>>[number]["items"][number]
): AdminMenuItem {
  const tr = item.translations.find((t) => t.locale === "tr");
  const en = item.translations.find((t) => t.locale === "en");
  const ru = item.translations.find((t) => t.locale === "ru");

  return {
    id: item.id,
    slug: item.slug,
    categoryId: item.categoryId,
    imageUrl: item.imageUrl,
    price: item.price,
    sortOrder: item.sortOrder,
    published: item.published,
    isFeatured: item.isFeatured,
    isVegetarian: item.isVegetarian,
    isVegan: item.isVegan,
    isGlutenFree: item.isGlutenFree,
    spicyLevel: item.spicyLevel,
    allergens: item.allergens,
    calories: item.calories,
    prepTimeMinutes: item.prepTimeMinutes,
    tr: {
      name: tr?.name ?? "",
      description: tr?.description ?? "",
      ingredients: tr?.ingredients ?? "",
      category: tr?.category ?? "",
    },
    en: {
      name: en?.name ?? "",
      description: en?.description ?? "",
      ingredients: en?.ingredients ?? "",
      category: en?.category ?? "",
    },
    ru: {
      name: ru?.name ?? "",
      description: ru?.description ?? "",
      ingredients: ru?.ingredients ?? "",
      category: ru?.category ?? "",
    },
  };
}

function mapCategory(
  category: Awaited<ReturnType<typeof fetchCategories>>[number]
): AdminMenuCategory {
  const tr = category.translations.find((t) => t.locale === "tr");
  const en = category.translations.find((t) => t.locale === "en");
  const ru = category.translations.find((t) => t.locale === "ru");
  const name = tr?.name ?? category.slug ?? "Kategori";

  return {
    id: category.id,
    slug: category.slug,
    name,
    nameEn: en?.name ?? name,
    nameRu: ru?.name ?? name,
    imageUrl: category.imageUrl,
    hasSubcategories: category.hasSubcategories || category.children.length > 0,
    sortOrder: category.sortOrder,
    published: category.published,
    parentId: category.parentId,
    itemCount: category.items.length,
    children: category.children.map((child) => {
      const childTr = child.translations.find((t) => t.locale === "tr");
      const childEn = child.translations.find((t) => t.locale === "en");
      const childRu = child.translations.find((t) => t.locale === "ru");
      const childName = childTr?.name ?? child.slug ?? "Alt kategori";
      return {
        id: child.id,
        slug: child.slug,
        name: childName,
        nameEn: childEn?.name ?? childName,
        nameRu: childRu?.name ?? childName,
        imageUrl: child.imageUrl,
        hasSubcategories: false,
        sortOrder: child.sortOrder,
        published: child.published,
        parentId: child.parentId,
        itemCount: child.items.length,
        children: [],
        items: child.items.map(mapItem),
      };
    }),
    items: category.items.map(mapItem),
  };
}

async function fetchCategories() {
  return prisma.menuCategory.findMany({
    where: { parentId: null },
    orderBy: { sortOrder: "asc" },
    include: {
      translations: true,
      children: {
        orderBy: { sortOrder: "asc" },
        include: {
          translations: true,
          items: {
            orderBy: { sortOrder: "asc" },
            include: { translations: true },
          },
        },
      },
      items: {
        orderBy: { sortOrder: "asc" },
        include: { translations: true },
      },
    },
  });
}

export default async function AdminMenuPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; parent?: string; error?: string }>;
}) {
  const user = await getAdminUser();
  const { category, parent, error } = await searchParams;
  const rawCategories = await fetchCategories();
  const categories = rawCategories.map(mapCategory);

  return (
    <AdminShell user={user} wide>
      <AdminPageHeader
        title="Menü Yönetimi"
        description="Kategori ve ürünleri adım adım yönetin."
      />

      <MenuManager
        categories={categories}
        initialCategoryId={category}
        initialParentId={parent}
        error={error}
      />
    </AdminShell>
  );
}
