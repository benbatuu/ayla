import type { QrMenuItem } from "../../lib/qr-menu";

export type MenuFilters = {
  prepTime: "all" | "15" | "30" | "30plus";
  vegetarian: boolean;
  vegan: boolean;
  spicy: boolean;
  glutenFree: boolean;
  excludeAllergens: string[];
};

export const defaultFilters: MenuFilters = {
  prepTime: "all",
  vegetarian: false,
  vegan: false,
  spicy: false,
  glutenFree: false,
  excludeAllergens: [],
};

export function countActiveFilters(filters: MenuFilters) {
  let count = filters.excludeAllergens.length;
  if (filters.prepTime !== "all") count += 1;
  if (filters.vegetarian) count += 1;
  if (filters.vegan) count += 1;
  if (filters.spicy) count += 1;
  if (filters.glutenFree) count += 1;
  return count;
}

export function itemMatchesFilters(item: QrMenuItem, filters: MenuFilters) {
  if (filters.vegetarian && !item.isVegetarian) return false;
  if (filters.vegan && !item.isVegan) return false;
  if (filters.spicy && item.spicyLevel <= 0) return false;
  if (filters.glutenFree && !item.isGlutenFree) return false;

  const prep = item.prepTimeMinutes ?? null;
  if (filters.prepTime === "15" && prep !== null && prep > 15) return false;
  if (filters.prepTime === "30" && prep !== null && prep > 30) return false;
  if (filters.prepTime === "30plus" && prep !== null && prep <= 30) return false;

  const allergenText = item.allergens.toLowerCase();
  for (const key of filters.excludeAllergens) {
    const map: Record<string, string[]> = {
      gluten: ["gluten", "buğday", "wheat"],
      milk: ["süt", "milk", "lactose"],
      nuts: ["fındık", "fıstık", "nut", "badam"],
      egg: ["yumurta", "egg"],
    };
    if (map[key]?.some((term) => allergenText.includes(term))) return false;
  }

  return true;
}

export function parsePrice(price: string | null) {
  if (!price) return 0;
  const n = Number.parseFloat(price.replace(/[^\d.,]/g, "").replace(",", "."));
  return Number.isNaN(n) ? 0 : n;
}
