export const QRTEKPRO_IMAGE_BASE = "https://menu.qrtekpro.com";
export const DEFAULT_CATEGORY_IMAGE = "/ayla_logo.jpg";

export type QrTekproCategorySeed = {
  externalId: number;
  name: string;
  slug: string;
  sortOrder: number;
  image: string | null;
  hasChildren: boolean;
  enName?: string;
  parentExternalId?: number;
};

export const qrTekproCategories: QrTekproCategorySeed[] = [
  { externalId: 32, name: "KAHVALTILAR", slug: "kahvaltilar", sortOrder: 1, image: null, hasChildren: true, enName: "Breakfast" },
  { externalId: 31, name: "BURGER", slug: "burger", sortOrder: 2, image: null, hasChildren: false },
  { externalId: 5, name: "MEZELER", slug: "mezeler", sortOrder: 3, image: "/uploads/images/ayla-food-more/28aa7eb539fc4ad29a1ce8b19f4fc53f.png", hasChildren: false, enName: "Meze" },
  { externalId: 6, name: "SALATALAR", slug: "salatalar", sortOrder: 4, image: "/uploads/images/ayla-food-more/9399ed0a611244de8c3a098c60d426bc.png", hasChildren: false, enName: "Salads" },
  { externalId: 7, name: "ARA SICAK", slug: "ara-sicak", sortOrder: 5, image: "/uploads/images/ayla-food-more/31959380d45b4b0baa7472c0cdc2a530.png", hasChildren: false, enName: "Hot Appetizers" },
  { externalId: 8, name: "ANA YEMEK", slug: "ana-yemek", sortOrder: 6, image: "/uploads/images/ayla-food-more/d8eeedacc6d54d8bb0c4686287260c8f.png", hasChildren: false, enName: "Main Course" },
  { externalId: 10, name: "MEYVELER", slug: "meyveler", sortOrder: 7, image: "/uploads/images/ayla-food-more/050332105b704c1090c44cb202963377.png", hasChildren: false, enName: "Fruits" },
  { externalId: 11, name: "TATLI", slug: "tatli", sortOrder: 8, image: "/uploads/images/ayla-food-more/d6abd6ddc4e6417a8a4b0e954504e400.png", hasChildren: false, enName: "Dessert" },
  { externalId: 12, name: "SICAK İÇECEKLER", slug: "sicak-icecekler", sortOrder: 9, image: "/uploads/images/ayla-food-more/18741405e6764cd2848d4aa9fd5689bb.png", hasChildren: false, enName: "Hot Drinks" },
  { externalId: 13, name: "SOFT İÇECEKLER", slug: "soft-icecekler", sortOrder: 10, image: "/uploads/images/ayla-food-more/0ed4649d35324236b97457d399bdaea8.png", hasChildren: false, enName: "Soft Drinks" },
  { externalId: 14, name: "SOĞUK İÇECEKLER", slug: "soguk-icecekler", sortOrder: 11, image: "/uploads/images/ayla-food-more/fe447ad5f2994c8e8c448896e2b8f1b5.png", hasChildren: false, enName: "Cold Drinks" },
  { externalId: 15, name: "KOKTEYL", slug: "kokteyl", sortOrder: 12, image: "/uploads/images/ayla-food-more/8dbd564a34f64e5e99173c108e371c38.png", hasChildren: false, enName: "Cocktails" },
  { externalId: 16, name: "BİRALAR", slug: "biralar", sortOrder: 13, image: "/uploads/images/ayla-food-more/65e9b6b0d6a1448d8cc83e6740595490.png", hasChildren: false, enName: "Beers" },
  { externalId: 17, name: "VODKALAR", slug: "vodkalar", sortOrder: 14, image: "/uploads/images/ayla-food-more/ec00b49e03bd40cda5358a44de0aba1e.png", hasChildren: false, enName: "Vodka" },
  { externalId: 18, name: "RAKILAR", slug: "rakilar", sortOrder: 15, image: "/uploads/images/ayla-food-more/b2629177230147e191b5e3447c4c3748.png", hasChildren: false, enName: "Raki" },
  { externalId: 19, name: "CİN", slug: "cin", sortOrder: 16, image: "/uploads/images/ayla-food-more/f65bae2c698e4f69bb6fff63f3a54439.png", hasChildren: false, enName: "Gin" },
  { externalId: 20, name: "VİSKİLER", slug: "viskiler", sortOrder: 17, image: "/uploads/images/ayla-food-more/554c50c1b3d54a0b90108bfdf4b12fcf.png", hasChildren: false, enName: "Whisky" },
  { externalId: 24, name: "KAHVALTI", slug: "kahvalti", sortOrder: 1, image: null, hasChildren: false, parentExternalId: 32, enName: "Breakfast" },
  { externalId: 25, name: "APARATİF", slug: "aparatif", sortOrder: 2, image: null, hasChildren: false, parentExternalId: 32, enName: "Snacks" },
  { externalId: 26, name: "BOWL", slug: "bowl", sortOrder: 3, image: null, hasChildren: false, parentExternalId: 32, enName: "Bowls" },
  { externalId: 27, name: "OMLET", slug: "omlet", sortOrder: 4, image: null, hasChildren: false, parentExternalId: 32, enName: "Omelette" },
  { externalId: 28, name: "SALATA", slug: "salata", sortOrder: 5, image: null, hasChildren: false, parentExternalId: 32, enName: "Salad" },
  { externalId: 29, name: "KRUVASAN", slug: "kruvasan", sortOrder: 6, image: null, hasChildren: false, parentExternalId: 32, enName: "Croissant" },
  { externalId: 30, name: "SANDVİÇ", slug: "sandvic", sortOrder: 7, image: null, hasChildren: false, parentExternalId: 32, enName: "Sandwich" },
];

export function resolveCategoryImage(image: string | null): string {
  if (!image) return DEFAULT_CATEGORY_IMAGE;
  if (image.startsWith("http://") || image.startsWith("https://")) return image;
  const path = image.startsWith("/") ? image : `/${image}`;
  return `${QRTEKPRO_IMAGE_BASE}${path}`;
}
