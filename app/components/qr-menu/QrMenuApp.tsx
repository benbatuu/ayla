"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ChevronRight,
  Compass,
  Filter,
  MessageSquare,
  Minus,
  Plus,
  Receipt,
  ShoppingCart,
  SlidersHorizontal,
  Star,
  Wifi,
  Banknote,
  BellRing,
  CreditCard,
  Split,
} from "lucide-react";
import type { PaymentMethod } from "../../lib/payment-methods";
import {
  createDefaultSplitPortions,
  type BillPaymentDetails,
  type PortionMethod,
  type TipMode,
} from "../../lib/bill-payment";
import type { QrMenuCategory, QrMenuItem } from "../../lib/qr-menu";
import { buildGoogleMapsLinks } from "../../lib/google-maps";
import { menuBrowsePathForLocale, websitePathForLocale } from "../../lib/locale";
import { qrMenuMessages, type QrMenuLocale } from "../../menu/qr-menu-messages";
import {
  countActiveFilters,
  defaultFilters,
  itemMatchesFilters,
  parsePrice,
  type MenuFilters,
} from "./filters";

type CartLine = {
  menuItemId: string;
  name: string;
  price: string | null;
  quantity: number;
  note?: string;
};

type BillLine = {
  name: string;
  quantity: number;
  unitPrice: string | null;
  note: string | null;
};

type Sheet =
  | "cart"
  | "wifi"
  | "discover"
  | "suggestion"
  | "complaint"
  | "filters"
  | "product"
  | null;

type View = "categories" | "subcategories" | "items";

type SharedProps = {
  initialLocale: QrMenuLocale;
  menuSettings: {
    wifiSsid: string;
    wifiPassword: string;
    welcomeMessageTr: string;
    welcomeMessageEn: string;
    welcomeMessageRu: string;
    menuLogoUrl: string;
    callWaiterEnabled: boolean;
    orderingEnabled: boolean;
    showImages: boolean;
    showPrices: boolean;
  };
  siteSettings: {
    phone: string;
    phoneSecondary?: string;
    email: string;
    openTime: string;
    closeTime: string;
    country: string;
    mapUrl: string;
    googlePlaceFeatureId?: string;
    googlePlaceId?: string;
    instagramUrl: string;
    instagramHandle: string;
    facebookUrl?: string;
    googleReviewsUrl: string;
    tripadvisorUrl: string;
    heroImageUrl: string;
    businessName?: string;
  };
  menuByLocale: Record<QrMenuLocale, QrMenuCategory[]>;
};

type TableModeProps = SharedProps & {
  mode?: "table";
  table: { number: number; label: string | null; zone: string; token: string };
};

type BrowseModeProps = SharedProps & {
  mode: "browse";
  table?: never;
};

type Props = TableModeProps | BrowseModeProps;

export default function QrMenuApp(props: Props) {
  const {
    initialLocale,
    menuSettings,
    siteSettings,
    menuByLocale,
    mode = "table",
  } = props;
  const isBrowse = mode === "browse";
  const table = mode === "table" ? props.table : null;

  const [locale, setLocale] = useState<QrMenuLocale>(initialLocale);
  const [view, setView] = useState<View>("categories");
  const [sheet, setSheet] = useState<Sheet>(null);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<QrMenuItem | null>(null);
  const [filters, setFilters] = useState<MenuFilters>(defaultFilters);
  const [draftFilters, setDraftFilters] = useState<MenuFilters>(defaultFilters);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [orderNote, setOrderNote] = useState("");
  const [productQty, setProductQty] = useState(1);
  const [productNote, setProductNote] = useState("");
  const [productRating, setProductRating] = useState(0);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackName, setFeedbackName] = useState("");
  const [feedbackPhone, setFeedbackPhone] = useState("");
  const [feedbackType, setFeedbackType] = useState<"suggestion" | "complaint">("suggestion");
  const [billLines, setBillLines] = useState<BillLine[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<"ssid" | "pass" | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [splitCount, setSplitCount] = useState(2);
  const [splitPortions, setSplitPortions] = useState<PortionMethod[]>(
    createDefaultSplitPortions(2)
  );
  const [tipMode, setTipMode] = useState<TipMode>("none");
  const [tipPercent, setTipPercent] = useState(15);
  const [tipCustomAmount, setTipCustomAmount] = useState("");
  const [clock, setClock] = useState("");

  const t = qrMenuMessages[locale];
  const categories = menuByLocale[locale];
  const welcome =
    locale === "tr"
      ? menuSettings.welcomeMessageTr
      : locale === "ru"
        ? menuSettings.welcomeMessageRu || menuSettings.welcomeMessageEn
        : menuSettings.welcomeMessageEn;
  const activeCategory = useMemo(() => {
    if (!activeCategoryId) return null;
    const top = categories.find((c) => c.id === activeCategoryId);
    if (top) return top;
    for (const cat of categories) {
      const child = cat.children.find((c) => c.id === activeCategoryId);
      if (child) return child;
    }
    return null;
  }, [categories, activeCategoryId]);

  const parentCategory = useMemo(() => {
    if (view !== "subcategories" || !activeCategoryId) return null;
    return categories.find((c) => c.id === activeCategoryId) ?? null;
  }, [categories, activeCategoryId, view]);

  const filteredItems = useMemo(() => {
    if (!activeCategory || view !== "items") return [];
    return activeCategory.items.filter((item) => itemMatchesFilters(item, filters));
  }, [activeCategory, filters, view]);

  const cartCount = cart.reduce((s, l) => s + l.quantity, 0);
  const cartTotal = cart.reduce((s, l) => s + parsePrice(l.price) * l.quantity, 0);
  const billTotal = useMemo(
    () => billLines.reduce((sum, line) => sum + parsePrice(line.unitPrice) * line.quantity, 0),
    [billLines]
  );
  const perPersonAmount = splitCount > 0 ? billTotal / splitCount : 0;
  const tipAmount = useMemo(() => {
    if (tipMode === "none") return 0;
    if (tipMode === "percent") return Math.round((billTotal * tipPercent) / 100);
    return Math.round(parsePrice(tipCustomAmount));
  }, [billTotal, tipCustomAmount, tipMode, tipPercent]);
  const grandTotal = billTotal + tipAmount;
  const activeFilterCount = countActiveFilters(filters);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  useEffect(() => {
    const tick = () => {
      setClock(
        new Date().toLocaleTimeString(
          locale === "tr" ? "tr-TR" : locale === "ru" ? "ru-RU" : "en-GB",
          {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    };
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, [locale]);

  async function loadBill() {
    if (!table) return;
    const res = await fetch(`/api/menu/${table.token}/bill`);
    if (res.ok) {
      const data = (await res.json()) as { lines: BillLine[] };
      setBillLines(data.lines);
    }
  }

  useEffect(() => {
    if (sheet === "cart" && table) void loadBill();
  }, [sheet, table?.token]);

  function openCategory(id: string) {
    const top = categories.find((c) => c.id === id);
    if (top?.hasSubcategories) {
      setActiveCategoryId(id);
      setView("subcategories");
      return;
    }

    setActiveCategoryId(id);
    setView("items");
  }

  function goBack() {
    if (view === "items") {
      const parent = categories.find((c) => c.children.some((child) => child.id === activeCategoryId));
      if (parent) {
        setActiveCategoryId(parent.id);
        setView("subcategories");
        return;
      }
    }
    setActiveCategoryId(null);
    setView("categories");
  }

  function addToCart(item: QrMenuItem, qty = 1, note?: string) {
    setCart((cur) => {
      const ex = cur.find((l) => l.menuItemId === item.id);
      if (ex) {
        return cur.map((l) =>
          l.menuItemId === item.id
            ? { ...l, quantity: l.quantity + qty, note: note || l.note }
            : l
        );
      }
      return [...cur, { menuItemId: item.id, name: item.name, price: item.price, quantity: qty, note }];
    });
    showToast(t.added);
  }

  useEffect(() => {
    setSplitPortions((current) => {
      if (current.length === splitCount) return current;
      if (current.length < splitCount) {
        return [
          ...current,
          ...createDefaultSplitPortions(splitCount - current.length),
        ];
      }
      return current.slice(0, splitCount);
    });
  }, [splitCount]);

  function resetPaymentForm() {
    setPaymentMethod(null);
    setSplitCount(2);
    setSplitPortions(createDefaultSplitPortions(2));
    setTipMode("none");
    setTipPercent(15);
    setTipCustomAmount("");
  }

  function buildPaymentDetails(): BillPaymentDetails {
    const tip =
      tipMode === "none"
        ? { mode: "none" as const }
        : tipMode === "percent"
          ? { mode: "percent" as const, percent: tipPercent }
          : { mode: "custom" as const, amount: parsePrice(tipCustomAmount) };

    if (paymentMethod === "split") {
      return {
        totalAmount: billTotal,
        splitCount,
        perPersonAmount,
        portions: splitPortions,
        tip,
      };
    }

    return {
      totalAmount: billTotal,
      tip,
    };
  }

  function selectPaymentMethod(method: PaymentMethod) {
    setPaymentMethod(method);
    if (method === "split" && splitPortions.length !== splitCount) {
      setSplitPortions(createDefaultSplitPortions(splitCount));
    }
  }

  function updateSplitPortion(index: number, method: PortionMethod) {
    setSplitPortions((current) =>
      current.map((portion, i) => (i === index ? method : portion))
    );
  }

  async function serviceCall(type: "waiter" | "bill") {
    if (!table) return;

    if (type === "bill") {
      if (!paymentMethod) {
        showToast(t.selectPaymentMethod);
        return;
      }
      if (paymentMethod === "split" && splitPortions.length !== splitCount) {
        showToast(t.splitDetailsRequired);
        return;
      }
      if (tipMode === "custom" && !tipCustomAmount.trim()) {
        showToast(t.tipRequired);
        return;
      }

      const paymentDetails = buildPaymentDetails();

      setSubmitting(true);
      const res = await fetch("/api/menu/waiter-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: table.token,
          type: "bill",
          paymentMethod,
          paymentDetails,
        }),
      });
      setSubmitting(false);

      if (res.ok) {
        resetPaymentForm();
        showToast(t.billRequested);
        return;
      }
      const data = (await res.json()) as { error?: string };
      showToast(data.error ?? t.error);
      return;
    }

    setSubmitting(true);
    const res = await fetch("/api/menu/waiter-call", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: table.token,
        type: "waiter",
      }),
    });
    setSubmitting(false);
    if (res.ok) {
      showToast(t.callWaiterSent);
      return;
    }
    const data = (await res.json()) as { error?: string };
    showToast(data.error ?? t.error);
  }

  async function submitOrder() {
    if (!table || !cart.length) return;
    setSubmitting(true);
    const res = await fetch("/api/menu/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: table.token,
        note: orderNote || undefined,
        items: cart.map((l) => ({ menuItemId: l.menuItemId, quantity: l.quantity, note: l.note })),
      }),
    });
    setSubmitting(false);
    if (res.ok) {
      setCart([]);
      setOrderNote("");
      void loadBill();
      showToast(t.orderSent);
      return;
    }
    const data = (await res.json()) as { error?: string };
    showToast(data.error ?? t.error);
  }

  async function submitFeedback() {
    if (!table || !feedbackMessage.trim()) return;
    setSubmitting(true);
    const res = await fetch("/api/menu/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: table.token,
        type: feedbackType,
        message: feedbackMessage,
        name: feedbackName || undefined,
        phone: feedbackPhone || undefined,
      }),
    });
    setSubmitting(false);
    if (res.ok) {
      setFeedbackMessage("");
      setFeedbackName("");
      setFeedbackPhone("");
      setSheet(null);
      showToast(t.feedbackSent);
    }
  }

  async function submitProductRating() {
    if (!table || !selectedItem || productRating < 1) return;
    await fetch("/api/menu/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: table.token,
        type: "product_rating",
        message: `${selectedItem.name}: ${productRating}/5`,
        menuItemId: selectedItem.id,
        rating: productRating,
      }),
    });
  }

  async function copyText(text: string, field: "ssid" | "pass") {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    window.setTimeout(() => setCopiedField(null), 2000);
  }

  function openProduct(item: QrMenuItem) {
    setSelectedItem(item);
    setProductQty(1);
    setProductNote("");
    setProductRating(0);
    setSheet("product");
  }

  function openFeedback(type: "suggestion" | "complaint") {
    setFeedbackType(type);
    setSheet(type);
  }

  function switchMenuLocale(nextLocale: QrMenuLocale) {
    if (nextLocale === locale) return;
    if (isBrowse) {
      window.location.href = menuBrowsePathForLocale(nextLocale);
      return;
    }
    setLocale(nextLocale);
  }

  const websiteHref = websitePathForLocale(locale);
  const canOrder = !isBrowse && menuSettings.orderingEnabled;
  const googleLinks = buildGoogleMapsLinks(siteSettings);

  return (
    <div className="relative min-h-screen w-full bg-[#171613] text-[#f3f1eb]">
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#171613]/90 backdrop-blur-xl">
        <div className="flex w-full items-center justify-between px-4 py-4 sm:px-6 lg:px-10">
          <div className="flex items-center gap-3">
            {view === "items" || view === "subcategories" ? (
              <button
                type="button"
                onClick={goBack}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white/70 transition hover:bg-white/5"
              >
                <ArrowLeft size={18} />
              </button>
            ) : (
              <Image
                src={menuSettings.menuLogoUrl}
                alt="Ay'la"
                width={44}
                height={44}
                className="rounded-full"
              />
            )}
            <div>
              <p className="font-brand text-2xl italic leading-none tracking-[-0.04em]">Ay&apos;la</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.25em] text-white/40">
                {isBrowse
                  ? t.browseSubtitle
                  : `${t.table} ${table!.number} · ${table!.zone}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-[10px] tabular-nums text-white/35 sm:inline">{clock}</span>
            <div className="flex overflow-hidden rounded-full border border-white/15 text-[10px] font-medium uppercase tracking-[0.15em]">
              {(["tr", "en", "ru"] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => switchMenuLocale(l)}
                  className={`px-3 py-2 transition ${
                    locale === l ? "bg-[#f3f1eb] text-[#171613]" : "text-white/55 hover:bg-white/5"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="relative w-full px-4 pb-32 pt-6 sm:px-6 lg:px-10 xl:px-12">
        {(view === "categories" || view === "subcategories") && (
          <>
            {view === "categories" ? (
              <div className="mb-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
                <p className="text-[10px] uppercase tracking-[0.28em] text-white/35">{t.welcome}</p>
                <h1 className="mt-3 font-brand text-[clamp(2rem,5vw,2.75rem)] italic leading-[0.95] tracking-[-0.03em]">
                  {welcome}
                </h1>
                <p className="mt-4 text-sm text-white/45">
                  {siteSettings.country} · {t.hours} {siteSettings.openTime} — {siteSettings.closeTime}
                </p>
                {isBrowse ? (
                  <p className="mt-3 text-sm text-white/40">{t.browseHint}</p>
                ) : null}
              </div>
            ) : (
              <h2 className="mb-5 font-brand text-3xl italic leading-tight">{parentCategory?.name}</h2>
            )}

            <p className="mb-4 text-[10px] uppercase tracking-[0.25em] text-white/35">
              {view === "subcategories" ? t.backCategories : t.selectCategory}
            </p>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8">
              {(view === "subcategories" ? parentCategory?.children ?? [] : categories).map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => openCategory(cat.id)}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] text-left transition hover:border-white/20 hover:bg-white/[0.05] md:rounded-3xl"
                >
                  {menuSettings.showImages ? (
                    <div className="relative aspect-[4/3] w-full overflow-hidden sm:aspect-[16/10]">
                      <Image
                        src={cat.image}
                        alt={cat.name}
                        fill
                        className="object-cover transition duration-700 group-hover:scale-[1.03]"
                        sizes="(max-width: 640px) 50vw, (max-width: 1280px) 25vw, 12vw"
                        unoptimized={cat.image.startsWith("http")}
                      />
                      <div className="absolute inset-0 bg-black/25" />
                      <span className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/35 text-white/70 backdrop-blur-sm transition group-hover:bg-black/50 md:right-3 md:top-3">
                        <ChevronRight size={14} />
                      </span>
                    </div>
                  ) : null}
                  <div className="flex flex-1 flex-col justify-between p-3 sm:p-4">
                    <p className="font-brand text-base italic leading-tight sm:text-lg md:text-xl xl:text-2xl">
                      {cat.name}
                    </p>
                    <p className="mt-2 text-[8px] uppercase tracking-[0.2em] text-white/40 sm:text-[9px]">
                      {cat.hasSubcategories ? t.selectCategory : `${cat.itemCount} ${t.products}`}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {view === "items" && activeCategory && (
          <>
            <h2 className="mb-5 font-brand text-3xl italic leading-tight">{activeCategory.name}</h2>
            <div className="mb-5 flex items-center justify-end">
              <button
                type="button"
                onClick={() => {
                  setDraftFilters(filters);
                  setSheet("filters");
                }}
                className="flex items-center gap-2 rounded-full border border-white/15 px-4 py-2.5 text-[10px] uppercase tracking-[0.2em] text-white/60 transition hover:bg-white/5"
              >
                <SlidersHorizontal size={14} />
                {t.filters}
                {activeFilterCount > 0 ? (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#f3f1eb] px-1 text-[9px] font-semibold text-[#171613]">
                    {activeFilterCount}
                  </span>
                ) : null}
              </button>
            </div>

            {filteredItems.length === 0 ? (
              <p className="py-16 text-center text-sm text-white/40">{t.noResults}</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8">
                {filteredItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => openProduct(item)}
                    className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] text-left transition hover:border-white/20 hover:bg-white/[0.05] md:rounded-3xl"
                  >
                    {menuSettings.showImages && item.image ? (
                      <div className="relative aspect-[4/3] w-full overflow-hidden">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover transition duration-500 group-hover:scale-[1.04]"
                          sizes="(max-width: 640px) 100vw, (max-width: 1280px) 25vw, 12vw"
                        />
                      </div>
                    ) : null}
                    <div className="flex flex-1 flex-col p-3 sm:p-4">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-brand text-lg italic leading-tight sm:text-xl">{item.name}</p>
                        {menuSettings.showPrices && item.price ? (
                          <span className="shrink-0 text-xs text-white/70 sm:text-sm">{item.price}</span>
                        ) : null}
                      </div>
                      <p className="mt-2 line-clamp-2 flex-1 text-xs leading-relaxed text-white/45 sm:text-sm">
                        {item.description}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {item.prepTimeMinutes ? <Chip>{item.prepTimeMinutes} dk</Chip> : null}
                        {item.isVegetarian ? <Chip>{t.vegetarian}</Chip> : null}
                        {item.spicyLevel > 0 ? <Chip>{t.spicy}</Chip> : null}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        <p className="mt-10 text-center text-[10px] leading-relaxed text-white/30">
          {t.imageDisclaimer}
          <br />
          {t.poweredBy}
        </p>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-[#171613]/95 backdrop-blur-xl">
        <div className="flex w-full justify-around px-2 py-2.5 sm:px-4 lg:px-10">
          {isBrowse ? (
            <>
              <NavBtn icon={<Wifi size={20} />} label={t.wifi} onClick={() => setSheet("wifi")} />
              <NavBtn icon={<Compass size={20} />} label={t.discover} active={sheet === "discover"} onClick={() => setSheet("discover")} />
            </>
          ) : (
            <>
              <NavBtn icon={<ShoppingCart size={20} />} label={t.cart} badge={cartCount} onClick={() => setSheet("cart")} />
              <NavBtn icon={<MessageSquare size={20} />} label={t.suggestion} onClick={() => openFeedback("suggestion")} />
              <NavBtn icon={<Filter size={20} />} label={t.complaint} onClick={() => openFeedback("complaint")} />
              <NavBtn icon={<Wifi size={20} />} label={t.wifi} onClick={() => setSheet("wifi")} />
              <NavBtn icon={<Compass size={20} />} label={t.discover} active={sheet === "discover"} onClick={() => setSheet("discover")} />
            </>
          )}
        </div>
      </nav>

      {/* Sheets */}
      {sheet === "product" && selectedItem && (
        <SheetOverlay onClose={() => setSheet(null)}>
          {menuSettings.showImages && selectedItem.image ? (
            <div className="relative aspect-[16/10] w-full">
              <Image src={selectedItem.image} alt={selectedItem.name} fill className="object-cover" sizes="100vw" />
            </div>
          ) : null}
          <div className="p-5">
            <h3 className="font-brand text-3xl italic">{selectedItem.name}</h3>
            {menuSettings.showPrices && selectedItem.price ? (
              <p className="mt-1 text-lg text-white/70">{selectedItem.price}</p>
            ) : null}
            <Section title={t.description} text={selectedItem.description} />
            {selectedItem.ingredients ? <Section title={t.ingredients} text={selectedItem.ingredients} /> : null}
            {selectedItem.allergens ? <Section title={t.allergens} text={selectedItem.allergens} /> : null}
            {selectedItem.prepTimeMinutes ? (
              <p className="mt-3 text-sm text-white/50">{t.prepTimeLabel}: {selectedItem.prepTimeMinutes} dk</p>
            ) : null}
            {!isBrowse ? (
              <>
                <p className="mt-4 text-[10px] uppercase tracking-wider text-white/35">{t.rateProduct}</p>
                <div className="mt-2 flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} type="button" onClick={() => setProductRating(n)} className="p-1">
                      <Star size={22} className={n <= productRating ? "fill-amber-400 text-amber-400" : "text-white/20"} />
                    </button>
                  ))}
                </div>
              </>
            ) : null}
            {canOrder ? (
              <>
                <div className="mt-5 flex items-center gap-4">
                  <span className="text-sm text-white/50">{t.quantity}</span>
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => setProductQty(Math.max(1, productQty - 1))} className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15"><Minus size={14} /></button>
                    <span className="w-6 text-center font-medium">{productQty}</span>
                    <button type="button" onClick={() => setProductQty(productQty + 1)} className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15"><Plus size={14} /></button>
                  </div>
                </div>
                <input
                  value={productNote}
                  onChange={(e) => setProductNote(e.target.value)}
                  placeholder={t.productNote}
                  className="mt-4 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-white/25"
                />
                <button
                  type="button"
                  onClick={() => {
                    addToCart(selectedItem, productQty, productNote || undefined);
                    if (productRating > 0) void submitProductRating();
                    setSheet(null);
                  }}
                  className="mt-5 w-full rounded-full bg-[#f3f1eb] py-3.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#171613]"
                >
                  {t.add}
                </button>
              </>
            ) : null}
          </div>
        </SheetOverlay>
      )}

      {sheet === "cart" && (
        <SheetOverlay onClose={() => setSheet(null)}>
          <div className="flex max-h-[85vh] flex-col">
            <div className="border-b border-white/10 p-5">
              <h3 className="font-brand text-3xl italic">{t.cart}</h3>
              <p className="text-sm text-white/45">{cartCount} ürün · {t.table} {table?.number}</p>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              {cart.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="font-medium">{t.emptyCart}</p>
                  <p className="mt-2 text-sm text-white/45">{t.emptyCartHint}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((line) => (
                    <div key={line.menuItemId} className="flex items-center justify-between rounded-2xl border border-white/10 p-3">
                      <div>
                        <p className="font-medium">{line.name}</p>
                        {line.price ? <p className="text-sm text-white/45">{line.price}</p> : null}
                      </div>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => setCart((c) => c.map((l) => l.menuItemId === line.menuItemId ? { ...l, quantity: Math.max(1, l.quantity - 1) } : l))} className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15"><Minus size={12} /></button>
                        <span>{line.quantity}</span>
                        <button type="button" onClick={() => setCart((c) => c.map((l) => l.menuItemId === line.menuItemId ? { ...l, quantity: l.quantity + 1 } : l))} className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15"><Plus size={12} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="mb-3 text-[10px] uppercase tracking-wider text-white/35">{t.tableBill}</p>
                {billLines.length === 0 ? (
                  <p className="text-sm text-white/40">{t.billEmpty}</p>
                ) : (
                  <ul className="space-y-1 text-sm">
                    {billLines.map((line, i) => (
                      <li key={i} className="flex justify-between gap-2">
                        <span>{line.quantity}x {line.name}</span>
                        {line.unitPrice ? <span className="text-white/45">{line.unitPrice}</span> : null}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {!isBrowse && menuSettings.callWaiterEnabled ? (
                <div className="mt-6 space-y-4">
                  <p className="text-[10px] uppercase tracking-wider text-white/35">{t.quickService}</p>
                  <button type="button" disabled={submitting} onClick={() => void serviceCall("waiter")} className="flex w-full flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center transition hover:bg-white/[0.05]">
                    <BellRing size={20} />
                    <span className="text-xs font-medium">{t.callWaiter}</span>
                    <span className="text-[10px] text-white/40">{t.quickServiceHint}</span>
                  </button>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-[10px] uppercase tracking-wider text-white/35">{t.paymentMethod}</p>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {([
                        { id: "cash" as const, label: t.paymentCash, icon: Banknote },
                        { id: "card" as const, label: t.paymentCard, icon: CreditCard },
                        { id: "split" as const, label: t.paymentSplit, icon: Split },
                      ]).map((option) => {
                        const Icon = option.icon;
                        const active = paymentMethod === option.id;
                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => selectPaymentMethod(option.id)}
                            className={`flex flex-col items-center gap-2 rounded-xl border px-2 py-3 text-center transition ${
                              active
                                ? "border-[#f3f1eb]/40 bg-[#f3f1eb]/10 text-[#f3f1eb]"
                                : "border-white/10 bg-white/[0.02] text-white/70 hover:bg-white/[0.05]"
                            }`}
                          >
                            <Icon size={18} />
                            <span className="text-[10px] font-medium leading-tight">{option.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {paymentMethod ? (
                      <div className="mt-4 space-y-4 border-t border-white/10 pt-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-white/50">{t.billTotal}</span>
                          <span className="font-medium">₺{Math.round(billTotal)}</span>
                        </div>

                        {paymentMethod === "split" ? (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-xs text-white/55">{t.splitCount}</span>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  disabled={splitCount <= 2}
                                  onClick={() => setSplitCount((count) => Math.max(2, count - 1))}
                                  className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 disabled:opacity-40"
                                >
                                  <Minus size={12} />
                                </button>
                                <span className="min-w-6 text-center text-sm font-medium">{splitCount}</span>
                                <button
                                  type="button"
                                  disabled={splitCount >= 12}
                                  onClick={() => setSplitCount((count) => Math.min(12, count + 1))}
                                  className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 disabled:opacity-40"
                                >
                                  <Plus size={12} />
                                </button>
                              </div>
                            </div>

                            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm">
                              <span className="text-white/50">{t.perPerson}</span>
                              <span className="font-medium">₺{Math.round(perPersonAmount)}</span>
                            </div>

                            <div className="space-y-2">
                              {splitPortions.map((portion, index) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between gap-3 rounded-xl border border-white/10 px-3 py-2"
                                >
                                  <span className="text-xs text-white/60">
                                    {t.personLabel} {index + 1}
                                  </span>
                                  <div className="flex gap-1">
                                    {(["cash", "card"] as const).map((method) => (
                                      <button
                                        key={method}
                                        type="button"
                                        onClick={() => updateSplitPortion(index, method)}
                                        className={`rounded-full px-2.5 py-1 text-[10px] uppercase tracking-wider transition ${
                                          portion === method
                                            ? method === "cash"
                                              ? "bg-emerald-500/20 text-emerald-200"
                                              : "bg-sky-500/20 text-sky-200"
                                            : "bg-white/5 text-white/45"
                                        }`}
                                      >
                                        {method === "cash" ? t.paymentCash : t.paymentCard}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null}

                        <div className="space-y-2">
                          <p className="text-[10px] uppercase tracking-wider text-white/35">{t.tip}</p>
                          <div className="grid grid-cols-5 gap-1.5">
                            {([
                              { id: "none" as const, label: t.tipNone },
                              { id: "percent" as const, label: "%10", value: 10 },
                              { id: "percent" as const, label: "%15", value: 15 },
                              { id: "percent" as const, label: "%20", value: 20 },
                              { id: "custom" as const, label: t.tipCustom },
                            ]).map((option, index) => {
                              const active =
                                option.id === "custom"
                                  ? tipMode === "custom"
                                  : option.id === "none"
                                    ? tipMode === "none"
                                    : tipMode === "percent" && tipPercent === option.value;
                              return (
                                <button
                                  key={`${option.id}-${index}`}
                                  type="button"
                                  onClick={() => {
                                    if (option.id === "custom") {
                                      setTipMode("custom");
                                      return;
                                    }
                                    if (option.id === "none") {
                                      setTipMode("none");
                                      return;
                                    }
                                    setTipMode("percent");
                                    setTipPercent(option.value!);
                                  }}
                                  className={`rounded-lg border px-1 py-2 text-[10px] font-medium transition ${
                                    active
                                      ? "border-[#f3f1eb]/40 bg-[#f3f1eb]/10 text-[#f3f1eb]"
                                      : "border-white/10 text-white/55 hover:bg-white/[0.04]"
                                  }`}
                                >
                                  {option.label}
                                </button>
                              );
                            })}
                          </div>
                          {tipMode === "custom" ? (
                            <input
                              type="number"
                              min={0}
                              value={tipCustomAmount}
                              onChange={(e) => setTipCustomAmount(e.target.value)}
                              placeholder={t.tipCustomPlaceholder}
                              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-white/25"
                            />
                          ) : null}
                        </div>

                        {tipAmount > 0 || billTotal > 0 ? (
                          <div className="flex items-center justify-between border-t border-white/10 pt-3 text-sm">
                            <span className="text-white/50">{t.grandTotal}</span>
                            <span className="font-medium">₺{Math.round(grandTotal)}</span>
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    <button
                      type="button"
                      disabled={submitting || !paymentMethod}
                      onClick={() => void serviceCall("bill")}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.04] py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/85 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Receipt size={14} />
                      {t.requestBill}
                    </button>
                    <p className="mt-2 text-center text-[10px] text-white/35">{t.billHint}</p>
                  </div>
                </div>
              ) : null}
            </div>
            {canOrder ? (
              <div className="border-t border-white/10 p-5">
                {cartTotal > 0 ? <p className="mb-3 text-sm text-white/60">{t.total}: ₺{cartTotal.toFixed(0)}</p> : null}
                <textarea value={orderNote} onChange={(e) => setOrderNote(e.target.value)} placeholder={t.orderNote} rows={2} className="mb-3 w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-white/25" />
                <button type="button" disabled={submitting || !cart.length} onClick={() => void submitOrder()} className="w-full rounded-full bg-[#f3f1eb] py-3.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#171613] disabled:opacity-40">
                  {t.placeOrder}
                </button>
              </div>
            ) : null}
          </div>
        </SheetOverlay>
      )}

      {sheet === "wifi" && (
        <SheetOverlay onClose={() => setSheet(null)}>
          <div className="p-5">
            <h3 className="font-brand text-3xl italic">{t.wifiTitle}</h3>
            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-[10px] uppercase tracking-wider text-white/35">{t.networkName}</p>
                <div className="mt-2 flex items-center justify-between">
                  <p className="font-medium">{menuSettings.wifiSsid || "—"}</p>
                  {menuSettings.wifiSsid ? (
                    <button type="button" onClick={() => void copyText(menuSettings.wifiSsid, "ssid")} className="text-xs text-white/50 underline">
                      {copiedField === "ssid" ? t.copied : t.copy}
                    </button>
                  ) : null}
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-[10px] uppercase tracking-wider text-white/35">{t.password}</p>
                <div className="mt-2 flex items-center justify-between">
                  <p className="font-medium">{menuSettings.wifiPassword || "—"}</p>
                  {menuSettings.wifiPassword ? (
                    <button type="button" onClick={() => void copyText(menuSettings.wifiPassword, "pass")} className="text-xs text-white/50 underline">
                      {copiedField === "pass" ? t.copied : t.copy}
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </SheetOverlay>
      )}

      {sheet === "discover" && (
        <SheetOverlay onClose={() => setSheet(null)}>
          <div className="p-5">
            <p className="text-[10px] uppercase tracking-[0.28em] text-white/35">{t.discoverTitle}</p>
            <h3 className="mt-2 font-brand text-3xl italic">{t.discoverTitle}</h3>
            <p className="mt-4 text-sm leading-7 text-white/45">{t.discoverDesc}</p>
            <p className="mt-5 text-sm text-white/55">
              {siteSettings.country}
              <br />
              {t.hours}: {siteSettings.openTime} — {siteSettings.closeTime}
            </p>

            {siteSettings.instagramUrl || siteSettings.facebookUrl ? (
              <>
                <p className="mt-6 text-[10px] uppercase tracking-[0.28em] text-white/35">{t.discoverSocial}</p>
                <div className="mt-3 space-y-3">
                  {siteSettings.instagramUrl ? (
                    <DiscoverLink
                      href={siteSettings.instagramUrl}
                      label={siteSettings.instagramHandle || t.instagram}
                      hint={t.followUs}
                      external
                    />
                  ) : null}
                  {siteSettings.facebookUrl ? (
                    <DiscoverLink
                      href={siteSettings.facebookUrl}
                      label="Facebook"
                      hint={t.followUs}
                      external
                    />
                  ) : null}
                </div>
              </>
            ) : null}

            {googleLinks.writeReviewUrl ? (
              <>
                <p className="mt-6 text-[10px] uppercase tracking-[0.28em] text-white/35">{t.discoverReviews}</p>
                <div className="mt-3 space-y-3">
                  <DiscoverLink
                    href={googleLinks.writeReviewUrl}
                    label={t.googleReviews}
                    hint={t.leaveReview}
                    external
                  />
                </div>
              </>
            ) : null}

            <p className="mt-6 text-[10px] uppercase tracking-[0.28em] text-white/35">{t.discoverContact}</p>
            <div className="mt-3 space-y-3">
              <DiscoverLink href={websiteHref} label={t.visitWebsite} hint={t.exploreAylla} />
              <DiscoverLink href={`${websiteHref}#reservation`} label={t.bookTable} hint={t.reserveOnline} />
              {siteSettings.mapUrl ? (
                <DiscoverLink href={googleLinks.mapUrl} label={t.getDirections} external />
              ) : null}
              <DiscoverLink href={`tel:${siteSettings.phone}`} label={t.callUs} detail={siteSettings.phone} />
              {siteSettings.email ? (
                <DiscoverLink href={`mailto:${siteSettings.email}`} label={t.emailUs} detail={siteSettings.email} />
              ) : null}
            </div>
          </div>
        </SheetOverlay>
      )}

      {(sheet === "suggestion" || sheet === "complaint") && (
        <SheetOverlay onClose={() => setSheet(null)}>
          <div className="p-5">
            <h3 className="font-brand text-3xl italic">
              {sheet === "suggestion" ? t.suggestionTitle : t.complaintTitle}
            </h3>
            <textarea value={feedbackMessage} onChange={(e) => setFeedbackMessage(e.target.value)} placeholder={t.yourMessage} rows={4} className="mt-5 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-white/25" />
            <p className="mt-4 text-[10px] uppercase tracking-wider text-white/35">{t.contactOptional}</p>
            <input value={feedbackName} onChange={(e) => setFeedbackName(e.target.value)} placeholder={t.name} className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-white/25" />
            <input value={feedbackPhone} onChange={(e) => setFeedbackPhone(e.target.value)} placeholder={t.phone} className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-white/25" />
            <button type="button" disabled={submitting} onClick={() => void submitFeedback()} className="mt-5 w-full rounded-full bg-[#f3f1eb] py-3.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#171613]">
              {t.send}
            </button>
          </div>
        </SheetOverlay>
      )}

      {sheet === "filters" && (
        <SheetOverlay onClose={() => setSheet(null)}>
          <div className="p-5">
            <h3 className="font-brand text-3xl italic">{t.filters}</h3>
            <p className="mt-4 text-[10px] uppercase tracking-wider text-white/35">{t.prepTime}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(["all", "15", "30", "30plus"] as const).map((key) => (
                <FilterChip key={key} active={draftFilters.prepTime === key} onClick={() => setDraftFilters({ ...draftFilters, prepTime: key })} label={t[key === "all" ? "prepAll" : key === "15" ? "prep15" : key === "30" ? "prep30" : "prep30plus"]} />
              ))}
            </div>
            <p className="mt-5 text-[10px] uppercase tracking-wider text-white/35">{t.nutritionTags}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <FilterChip active={draftFilters.vegetarian} onClick={() => setDraftFilters({ ...draftFilters, vegetarian: !draftFilters.vegetarian })} label={t.vegetarian} />
              <FilterChip active={draftFilters.vegan} onClick={() => setDraftFilters({ ...draftFilters, vegan: !draftFilters.vegan })} label={t.vegan} />
              <FilterChip active={draftFilters.spicy} onClick={() => setDraftFilters({ ...draftFilters, spicy: !draftFilters.spicy })} label={t.spicy} />
              <FilterChip active={draftFilters.glutenFree} onClick={() => setDraftFilters({ ...draftFilters, glutenFree: !draftFilters.glutenFree })} label={t.glutenFree} />
            </div>
            <p className="mt-5 text-[10px] uppercase tracking-wider text-white/35">{t.excludeAllergens}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(["gluten", "milk", "nuts", "egg"] as const).map((key) => (
                <FilterChip
                  key={key}
                  active={draftFilters.excludeAllergens.includes(key)}
                  onClick={() =>
                    setDraftFilters({
                      ...draftFilters,
                      excludeAllergens: draftFilters.excludeAllergens.includes(key)
                        ? draftFilters.excludeAllergens.filter((k) => k !== key)
                        : [...draftFilters.excludeAllergens, key],
                    })
                  }
                  label={t[key === "gluten" ? "allergenGluten" : key === "milk" ? "allergenMilk" : key === "nuts" ? "allergenNuts" : "allergenEgg"]}
                />
              ))}
            </div>
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => setDraftFilters(defaultFilters)} className="flex-1 rounded-full border border-white/15 py-3 text-[10px] uppercase tracking-wider text-white/60 transition hover:bg-white/5">
                {t.clearFilters}
              </button>
              <button
                type="button"
                onClick={() => {
                  setFilters(draftFilters);
                  setSheet(null);
                }}
                className="flex-1 rounded-full bg-[#f3f1eb] py-3 text-[10px] font-semibold uppercase tracking-wider text-[#171613]"
              >
                {t.applyFilters}
              </button>
            </div>
          </div>
        </SheetOverlay>
      )}

      {toast ? (
        <div className="fixed bottom-28 left-1/2 z-[70] -translate-x-1/2 rounded-full border border-white/15 bg-[#111]/95 px-5 py-3 text-sm shadow-2xl backdrop-blur">
          {toast}
        </div>
      ) : null}
    </div>
  );
}

function NavBtn({ icon, label, onClick, badge, active }: { icon: React.ReactNode; label: string; onClick: () => void; badge?: number; active?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex flex-col items-center gap-1 px-2 py-1 transition-colors ${
        active ? "text-[#f3f1eb]" : "text-white/45 hover:text-white/75"
      }`}
    >
      {icon}
      <span className="text-[8px] font-medium uppercase tracking-[0.18em]">{label}</span>
      {badge && badge > 0 ? (
        <span className="absolute -right-0.5 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#f3f1eb] px-1 text-[9px] font-semibold text-[#171613]">
          {badge}
        </span>
      ) : null}
    </button>
  );
}

function SheetOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
      <button type="button" className="absolute inset-0" aria-label="Close" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full md:max-w-lg sm:max-w-full overflow-y-auto rounded-3xl border border-white/10 bg-[#171613] shadow-2xl">
        {children}
      </div>
    </div>
  );
}

function DiscoverLink({
  href,
  label,
  detail,
  hint,
  external,
}: {
  href: string;
  label: string;
  detail?: string;
  hint?: string;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      className="group flex items-center justify-between rounded-3xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-white/20 hover:bg-white/[0.05]"
    >
      <div className="min-w-0 pr-3">
        <span className="text-sm font-medium">{label}</span>
        {hint ? <span className="mt-0.5 block text-xs leading-relaxed text-white/40">{hint}</span> : null}
      </div>
      <span className="flex shrink-0 items-center gap-2 text-sm text-white/45">
        {detail}
        <ChevronRight size={16} className="transition group-hover:translate-x-0.5 group-hover:text-white/70" />
      </span>
    </a>
  );
}

function Section({ title, text }: { title: string; text: string }) {
  return (
    <div className="mt-4">
      <p className="text-[10px] uppercase tracking-wider text-white/35">{title}</p>
      <p className="mt-1 text-sm leading-relaxed text-white/60">{text}</p>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-white/10 px-2.5 py-0.5 text-[9px] uppercase tracking-[0.15em] text-white/45">
      {children}
    </span>
  );
}

function FilterChip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs transition ${
        active
          ? "bg-[#f3f1eb] text-[#171613]"
          : "border border-white/15 text-white/55 hover:bg-white/5"
      }`}
    >
      {label}
    </button>
  );
}
