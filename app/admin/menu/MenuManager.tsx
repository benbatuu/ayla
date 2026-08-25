"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowLeft, ChevronRight, FolderOpen, Pencil, Plus, UtensilsCrossed, X } from "lucide-react";
import AdminField from "../components/AdminField";
import AdminImageUpload from "../components/AdminImageUpload";
import { slugify } from "../../lib/slugify";
import {
  createMenuCategoryAction,
  createMenuItemAction,
  deleteMenuCategoryAction,
  deleteMenuItemAction,
  updateMenuCategoryAction,
  updateMenuItemAction,
} from "../actions";

export type AdminMenuItem = {
  id: string;
  slug: string | null;
  categoryId: string | null;
  imageUrl: string;
  price: string | null;
  sortOrder: number;
  published: boolean;
  isFeatured: boolean;
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  spicyLevel: number;
  allergens: string;
  calories: number | null;
  prepTimeMinutes: number | null;
  tr: {
    name: string;
    description: string;
    ingredients: string;
    category: string;
  };
  en: {
    name: string;
    description: string;
    ingredients: string;
    category: string;
  };
  ru: {
    name: string;
    description: string;
    ingredients: string;
    category: string;
  };
};

export type AdminMenuCategory = {
  id: string;
  slug: string | null;
  name: string;
  nameEn: string;
  nameRu: string;
  imageUrl: string | null;
  hasSubcategories: boolean;
  sortOrder: number;
  published: boolean;
  parentId: string | null;
  itemCount: number;
  children: AdminMenuCategory[];
  items: AdminMenuItem[];
};

type Props = {
  categories: AdminMenuCategory[];
  initialCategoryId?: string;
  initialParentId?: string;
  error?: string;
};

function resolveInitialState(
  categories: AdminMenuCategory[],
  initialCategoryId?: string,
  initialParentId?: string
) {
  if (initialCategoryId) {
    for (const cat of categories) {
      if (cat.id === initialCategoryId) {
        if (cat.hasSubcategories || cat.children.length > 0) {
          return { parentId: cat.id, categoryId: null as string | null };
        }
        return { parentId: null as string | null, categoryId: cat.id };
      }
      const child = cat.children.find((c) => c.id === initialCategoryId);
      if (child) {
        return { parentId: cat.id, categoryId: child.id };
      }
    }
  }

  if (initialParentId) {
    return { parentId: initialParentId, categoryId: null as string | null };
  }

  return { parentId: null as string | null, categoryId: null as string | null };
}

export default function MenuManager({
  categories,
  initialCategoryId,
  initialParentId,
  error,
}: Props) {
  const router = useRouter();
  const initial = resolveInitialState(categories, initialCategoryId, initialParentId);
  const [parentId, setParentId] = useState<string | null>(initial.parentId);
  const [categoryId, setCategoryId] = useState<string | null>(initial.categoryId);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<AdminMenuCategory | null>(null);
  const [showCreateCategory, setShowCreateCategory] = useState(false);

  const parentCategory = useMemo(
    () => categories.find((c) => c.id === parentId) ?? null,
    [categories, parentId]
  );

  const activeCategory = useMemo(() => {
    if (!categoryId) return null;
    for (const cat of categories) {
      if (cat.id === categoryId) return cat;
      const child = cat.children.find((c) => c.id === categoryId);
      if (child) return child;
    }
    return null;
  }, [categories, categoryId]);

  const view = useMemo(() => {
    if (categoryId && activeCategory) return "products" as const;
    if (parentId && parentCategory) return "subcategories" as const;
    return "categories" as const;
  }, [categoryId, activeCategory, parentId, parentCategory]);

  const nextSortOrder = activeCategory?.items.length ?? 0;

  function openCategory(cat: AdminMenuCategory) {
    if (cat.hasSubcategories || cat.children.length > 0) {
      setParentId(cat.id);
      setCategoryId(null);
      setEditingId(null);
      setEditingCategory(null);
      setShowCreateCategory(false);
      router.push(`/admin/menu?parent=${cat.id}`);
      return;
    }
    setParentId(null);
    setCategoryId(cat.id);
    setEditingId(null);
    setEditingCategory(null);
    setShowCreateCategory(false);
    router.push(`/admin/menu?category=${cat.id}`);
  }

  function openSubcategory(cat: AdminMenuCategory) {
    setCategoryId(cat.id);
    setEditingId(null);
    setEditingCategory(null);
    router.push(`/admin/menu?category=${cat.id}`);
  }

  function goBack() {
    if (view === "products" && parentCategory) {
      setCategoryId(null);
      setEditingId(null);
      setEditingCategory(null);
      router.push(`/admin/menu?parent=${parentCategory.id}`);
      return;
    }
    setParentId(null);
    setCategoryId(null);
    setEditingId(null);
    setEditingCategory(null);
    setShowCreateCategory(false);
    router.push("/admin/menu");
  }

  function openCategoryEdit(cat: AdminMenuCategory, parent?: AdminMenuCategory | null) {
    setEditingCategory(cat);
    setShowCreateCategory(false);
    if (parent) {
      setParentId(parent.id);
    }
  }

  return (
    <div className="space-y-6">
      {error === "category-not-empty" ? (
        <p className="rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          Kategori silinemedi. Önce içindeki ürünleri ve alt kategorileri kaldırın.
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        {view !== "categories" ? (
          <button
            type="button"
            onClick={goBack}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/70 transition hover:bg-white/5"
          >
            <ArrowLeft size={14} />
            Geri
          </button>
        ) : null}
        <nav className="flex flex-wrap items-center gap-2 text-sm text-white/45">
          <button
            type="button"
            onClick={() => {
              setParentId(null);
              setCategoryId(null);
              setEditingId(null);
              router.push("/admin/menu");
            }}
            className="transition hover:text-white/80"
          >
            Menü
          </button>
          {parentCategory ? (
            <>
              <ChevronRight size={14} />
              <span className="text-white/75">{parentCategory.name}</span>
            </>
          ) : null}
          {activeCategory && view === "products" ? (
            <>
              {parentCategory ? <ChevronRight size={14} /> : null}
              <span className="text-white/75">{activeCategory.name}</span>
            </>
          ) : null}
        </nav>
      </div>

      {view === "categories" ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-white/45">Kategori seçin veya yeni kategori ekleyin.</p>
            <button
              type="button"
              onClick={() => {
                setShowCreateCategory((v) => !v);
                setEditingCategory(null);
              }}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/70 transition hover:bg-white/5"
            >
              <Plus size={14} />
              Yeni kategori
            </button>
          </div>

          {showCreateCategory ? (
            <CategoryCreateForm
              title="Yeni ana kategori"
              sortOrder={categories.length}
              allowSubcategoryGroup
              onClose={() => setShowCreateCategory(false)}
            />
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {categories.map((cat) => (
              <CategoryCard
                key={cat.id}
                category={cat}
                onSelect={() => openCategory(cat)}
                onEdit={() => openCategoryEdit(cat)}
              />
            ))}
          </div>

          {editingCategory && !parentCategory ? (
            <AdminPanel title={`Kategori düzenle — ${editingCategory.name}`} onClose={() => setEditingCategory(null)}>
              <CategoryEditForm category={editingCategory} />
            </AdminPanel>
          ) : null}
        </>
      ) : null}

      {view === "subcategories" && parentCategory ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-white/45">{parentCategory.name} alt kategorileri</p>
            <button
              type="button"
              onClick={() => {
                setShowCreateCategory((v) => !v);
                setEditingCategory(null);
              }}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/70 transition hover:bg-white/5"
            >
              <Plus size={14} />
              Alt kategori ekle
            </button>
          </div>

          {showCreateCategory ? (
            <CategoryCreateForm
              title={`Yeni alt kategori — ${parentCategory.name}`}
              parentId={parentCategory.id}
              sortOrder={parentCategory.children.length}
              onClose={() => setShowCreateCategory(false)}
            />
          ) : null}

          {parentCategory.children.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/15 p-10 text-center text-sm text-white/40">
              Henüz alt kategori yok. &quot;Alt kategori ekle&quot; ile başlayın.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {parentCategory.children.map((child) => (
                <CategoryCard
                  key={child.id}
                  category={child}
                  onSelect={() => openSubcategory(child)}
                  onEdit={() => openCategoryEdit(child, parentCategory)}
                />
              ))}
            </div>
          )}

          {editingCategory ? (
            <AdminPanel title={`Kategori düzenle — ${editingCategory.name}`} onClose={() => setEditingCategory(null)}>
              <CategoryEditForm category={editingCategory} parentId={parentCategory.id} />
            </AdminPanel>
          ) : null}
        </>
      ) : null}

      {view === "products" && activeCategory ? (
        <>
          <form
            action={createMenuItemAction}
            className="rounded-2xl border border-[#f3f1eb]/20 bg-[#f3f1eb]/[0.04] p-5"
          >
            <div className="mb-4 flex items-center gap-2">
              <Plus size={16} className="text-[#f3f1eb]/70" />
              <h2 className="text-sm font-medium text-[#f3f1eb]">Yeni ürün — {activeCategory.name}</h2>
            </div>
            <input type="hidden" name="categoryId" value={activeCategory.id} />
            <input type="hidden" name="returnCategoryId" value={activeCategory.id} />
            <input type="hidden" name="sortOrder" value={nextSortOrder} />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <AdminField label="Ürün adı (TR)" name="tr_name" required placeholder="Örn: Acılı Ezme" />
              <AdminField label="Ürün adı (EN)" name="en_name" placeholder="Opsiyonel" />
              <AdminField label="Ürün adı (RU)" name="ru_name" placeholder="Opsiyonel" />
              <AdminField label="Fiyat" name="price" placeholder="₺245" />
            </div>
            <div className="mt-4">
              <AdminImageUpload
                categorySlug={activeCategory.slug ?? undefined}
                slugSourceFieldName="tr_name"
                hint="JPEG veya PNG yükleyin. Dosya kategori klasörüne WebP olarak kaydedilir."
              />
            </div>
            <details className="mt-4">
              <summary className="cursor-pointer text-xs text-white/40">İsteğe bağlı: açıklama</summary>
              <div className="mt-3 grid gap-4 lg:grid-cols-3">
                <AdminField label="Açıklama (TR)" name="tr_description" textarea />
                <AdminField label="Description (EN)" name="en_description" textarea />
                <AdminField label="Описание (RU)" name="ru_description" textarea />
              </div>
            </details>
            <button
              type="submit"
              className="mt-5 rounded-full bg-[#f3f1eb] px-6 py-2.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#171613]"
            >
              Ürünü ekle
            </button>
          </form>

          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.2em] text-white/35">
              {activeCategory.items.length} ürün
            </p>
            {activeCategory.items.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center text-sm text-white/40">
                Bu kategoride henüz ürün yok. Yukarıdaki formdan ekleyebilirsiniz.
              </div>
            ) : (
              activeCategory.items.map((item) => (
                <div key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setEditingId(editingId === item.id ? null : item.id)}
                    className="flex w-full items-center gap-4 p-4 text-left transition hover:bg-white/[0.04]"
                  >
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-white/5">
                      {item.imageUrl ? (
                        <Image src={item.imageUrl} alt={item.tr.name} fill className="object-cover" unoptimized />
                      ) : (
                        <div className="flex h-full items-center justify-center text-white/20">
                          <UtensilsCrossed size={18} />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{item.tr.name}</p>
                      <p className="mt-0.5 text-sm text-white/45">
                        {item.price ?? "—"} · Sıra {item.sortOrder}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] uppercase tracking-wider ${
                        item.published
                          ? "bg-emerald-500/15 text-emerald-300"
                          : "bg-white/10 text-white/40"
                      }`}
                    >
                      {item.published ? "Yayında" : "Taslak"}
                    </span>
                    <ChevronRight
                      size={16}
                      className={`shrink-0 text-white/30 transition ${editingId === item.id ? "rotate-90" : ""}`}
                    />
                  </button>

                  {editingId === item.id ? (
                    <div className="border-t border-white/10 p-5">
                      <ProductEditForm
                        item={item}
                        categoryId={activeCategory.id}
                        categorySlug={activeCategory.slug}
                      />
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}

function AdminPanel({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
      <button type="button" className="absolute inset-0" aria-label="Kapat" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/10 bg-[#171613] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h3 className="font-brand text-xl italic">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 p-2 text-white/50 transition hover:bg-white/5 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function CategoryCreateForm({
  title,
  parentId,
  sortOrder,
  allowSubcategoryGroup = false,
  onClose,
}: {
  title: string;
  parentId?: string;
  sortOrder: number;
  allowSubcategoryGroup?: boolean;
  onClose?: () => void;
}) {
  return (
    <form
      action={createMenuCategoryAction}
      className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FolderOpen size={16} className="text-white/50" />
          <h2 className="text-sm font-medium text-white/85">{title}</h2>
        </div>
        {onClose ? (
          <button type="button" onClick={onClose} className="text-white/40 transition hover:text-white/70">
            <X size={16} />
          </button>
        ) : null}
      </div>
      {parentId ? <input type="hidden" name="parentId" value={parentId} /> : null}
      <input type="hidden" name="sortOrder" value={sortOrder} />
      <div className="grid gap-4 sm:grid-cols-2">
        <AdminField label="Kategori adı (TR)" name="tr_name" required placeholder="Örn: Mezeler" />
        <AdminField label="Kategori adı (EN)" name="en_name" placeholder="Opsiyonel" />
        <AdminField label="Kategori adı (RU)" name="ru_name" placeholder="Opsiyonel" />
      </div>
      <div className="mt-4">
        <AdminImageUpload
          categorySlugFieldName="tr_name"
          itemSlug="_category"
          hint="Kategori kapak görseli. Örn: uploads/mezeler/_category.webp"
        />
      </div>
      {allowSubcategoryGroup ? (
        <label className="mt-4 flex items-center gap-2 text-xs text-white/55">
          <input type="checkbox" name="hasSubcategories" />
          Alt kategori grubu (içinde alt kategoriler olacak)
        </label>
      ) : null}
      <button
        type="submit"
        className="mt-5 rounded-full border border-white/20 px-6 py-2.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/80 transition hover:bg-white/5"
      >
        Kategori ekle
      </button>
    </form>
  );
}

function CategoryEditForm({
  category,
  parentId,
}: {
  category: AdminMenuCategory;
  parentId?: string;
}) {
  return (
    <div className="space-y-4">
      <form action={updateMenuCategoryAction.bind(null, category.id)} className="space-y-4">
        {parentId ? <input type="hidden" name="parentId" value={parentId} /> : null}
        <div className="flex items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-xs text-white/50">
            <input type="checkbox" name="published" defaultChecked={category.published} />
            Yayında
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <AdminField label="Ad (TR)" name="tr_name" defaultValue={category.name} />
          <AdminField label="Ad (EN)" name="en_name" defaultValue={category.nameEn} />
          <AdminField label="Ad (RU)" name="ru_name" defaultValue={category.nameRu} />
          <AdminField label="Sıra" name="sortOrder" type="number" defaultValue={category.sortOrder} />
        </div>
        <AdminImageUpload
          defaultUrl={category.imageUrl ?? ""}
          categorySlug={category.slug ?? undefined}
          itemSlug="_category"
          hint="Kategori kapak görseli yükleyin."
        />
        {!parentId ? (
          <label className="flex items-center gap-2 text-xs text-white/55">
            <input type="checkbox" name="hasSubcategories" defaultChecked={category.hasSubcategories} />
            Alt kategori grubu
          </label>
        ) : null}
        <button
          type="submit"
          className="rounded-full bg-[#f3f1eb] px-6 py-2.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#171613]"
        >
          Kaydet
        </button>
      </form>
      <form action={deleteMenuCategoryAction}>
        <input type="hidden" name="id" value={category.id} />
        {parentId ? <input type="hidden" name="parentId" value={parentId} /> : null}
        <button
          type="submit"
          className="w-full rounded-full border border-red-500/25 py-2.5 text-[10px] uppercase tracking-[0.18em] text-red-300/90"
        >
          Kategoriyi sil
        </button>
      </form>
    </div>
  );
}

function CategoryCard({
  category,
  onSelect,
  onEdit,
}: {
  category: AdminMenuCategory;
  onSelect: () => void;
  onEdit?: () => void;
}) {
  const hasChildren = category.hasSubcategories || category.children.length > 0;

  return (
    <div className="group/card relative">
      <button
        type="button"
        onClick={onSelect}
        className="flex w-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] text-left transition hover:border-white/20 hover:bg-white/[0.05]"
      >
      <div className="relative aspect-[4/3] w-full bg-white/5">
        {category.imageUrl ? (
          <Image
            src={category.imageUrl}
            alt={category.name}
            fill
            className="object-cover transition group-hover:scale-[1.02]"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center text-white/20">
            <FolderOpen size={28} />
          </div>
        )}
      </div>
      <div className="flex items-center justify-between gap-2 p-4">
        <div>
          <p className="font-medium">{category.name}</p>
          <p className="mt-1 text-xs text-white/40">
            {hasChildren
              ? `${category.children.length} alt kategori`
              : `${category.itemCount} ürün`}
          </p>
        </div>
        <ChevronRight size={16} className="shrink-0 text-white/30 transition group-hover/card:translate-x-0.5 group-hover/card:text-white/60" />
      </div>
      </button>
      {onEdit ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          aria-label="Kategoriyi düzenle"
          className="absolute right-3 top-3 rounded-full border border-white/10 bg-[#171613]/90 p-2 text-white/55 opacity-0 backdrop-blur transition hover:text-white group-hover/card:opacity-100"
        >
          <Pencil size={14} />
        </button>
      ) : null}
    </div>
  );
}

function ProductEditForm({
  item,
  categoryId,
  categorySlug,
}: {
  item: AdminMenuItem;
  categoryId: string;
  categorySlug: string | null;
}) {
  return (
    <>
      <form action={updateMenuItemAction.bind(null, item.id)} className="space-y-5">
      <input type="hidden" name="categoryId" value={categoryId} />
      <input type="hidden" name="returnCategoryId" value={categoryId} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-brand text-xl italic">{item.tr.name}</h3>
        <label className="flex items-center gap-2 text-xs text-white/50">
          <input type="checkbox" name="published" defaultChecked={item.published} />
          Yayında
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminField label="Fiyat" name="price" defaultValue={item.price ?? ""} />
        <AdminField label="Sıra" name="sortOrder" type="number" defaultValue={item.sortOrder} />
        <AdminField label="Hazırlık (dk)" name="prepTimeMinutes" type="number" defaultValue={item.prepTimeMinutes ?? ""} />
      </div>

      <AdminImageUpload
        defaultUrl={item.imageUrl}
        categorySlug={categorySlug ?? undefined}
        itemSlug={item.slug ?? slugify(item.tr.name, "urun")}
        hint="Yeni görsel yüklediğinizde mevcut dosyanın üzerine yazılır."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <AdminField label="İsim (TR)" name="tr_name" defaultValue={item.tr.name} />
        <AdminField label="Name (EN)" name="en_name" defaultValue={item.en.name} />
        <AdminField label="Название (RU)" name="ru_name" defaultValue={item.ru.name} />
        <AdminField label="Açıklama (TR)" name="tr_description" defaultValue={item.tr.description} textarea />
        <AdminField label="Description (EN)" name="en_description" defaultValue={item.en.description} textarea />
        <AdminField label="Описание (RU)" name="ru_description" defaultValue={item.ru.description} textarea />
      </div>

      <details>
        <summary className="cursor-pointer text-xs text-white/40">Gelişmiş seçenekler</summary>
        <div className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <AdminField label="Alerjenler" name="allergens" defaultValue={item.allergens} hint="Virgülle ayırın" />
            <AdminField label="Acı (0-3)" name="spicyLevel" type="number" defaultValue={item.spicyLevel} />
            <AdminField label="Kalori" name="calories" type="number" defaultValue={item.calories ?? ""} />
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <AdminField label="İçindekiler (TR)" name="tr_ingredients" defaultValue={item.tr.ingredients} textarea />
            <AdminField label="Ingredients (EN)" name="en_ingredients" defaultValue={item.en.ingredients} textarea />
            <AdminField label="Состав (RU)" name="ru_ingredients" defaultValue={item.ru.ingredients} textarea />
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-white/60">
            <label className="flex items-center gap-2">
              <input type="checkbox" name="isFeatured" defaultChecked={item.isFeatured} /> Öne çıkan
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="isVegetarian" defaultChecked={item.isVegetarian} /> Vejetaryen
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="isVegan" defaultChecked={item.isVegan} /> Vegan
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="isGlutenFree" defaultChecked={item.isGlutenFree} /> Glütensiz
            </label>
          </div>
        </div>
      </details>

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          className="rounded-full bg-[#f3f1eb] px-6 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#171613]"
        >
          Kaydet
        </button>
      </div>
      </form>
      <form action={deleteMenuItemAction} className="mt-3">
        <input type="hidden" name="id" value={item.id} />
        <input type="hidden" name="returnCategoryId" value={categoryId} />
        <button
          type="submit"
          className="rounded-full border border-red-500/30 px-6 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-red-300"
        >
          Sil
        </button>
      </form>
    </>
  );
}
