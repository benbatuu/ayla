import { prisma } from "./prisma";
import { formatCurrency, parsePrice } from "./price";

export type DateRange = "7d" | "30d" | "90d" | "all";

function rangeStart(range: DateRange) {
  if (range === "all") return null;
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(0, 0, 0, 0);
  return date;
}

function orderWhere(range: DateRange) {
  const start = rangeStart(range);
  return start ? { createdAt: { gte: start } } : {};
}

function pageViewWhere(range: DateRange) {
  const start = rangeStart(range);
  return start ? { createdAt: { gte: start } } : {};
}

function lineTotal(quantity: number, unitPrice: string | null) {
  return quantity * parsePrice(unitPrice);
}

export async function getAnalyticsOverview(range: DateRange = "30d") {
  const [orders, pageViews, reservations, feedback, servedOrders] = await Promise.all([
    prisma.tableOrder.findMany({
      where: orderWhere(range),
      include: { items: true, table: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.pageView.findMany({ where: pageViewWhere(range) }),
    prisma.reservation.count({ where: orderWhere(range) }),
    prisma.menuFeedback.count({ where: orderWhere(range) }),
    prisma.tableOrder.findMany({
      where: { ...orderWhere(range), status: "served" },
      include: { items: true },
    }),
  ]);

  const totalRevenue = servedOrders.reduce(
    (sum, order) =>
      sum + order.items.reduce((itemSum, item) => itemSum + lineTotal(item.quantity, item.unitPrice), 0),
    0
  );

  const pipelineOrders = orders.filter((o) => ["pending", "preparing"].includes(o.status));
  const pipelineRevenue = pipelineOrders.reduce(
    (sum, order) =>
      sum + order.items.reduce((itemSum, item) => itemSum + lineTotal(item.quantity, item.unitPrice), 0),
    0
  );

  const uniqueSessions = new Set(pageViews.map((v) => v.sessionId).filter(Boolean)).size;
  const menuViews = pageViews.filter((v) => v.isMenu).length;
  const siteViews = pageViews.length - menuViews;

  return {
    orderCount: orders.length,
    servedCount: servedOrders.length,
    totalRevenue,
    pipelineRevenue,
    formattedRevenue: formatCurrency(totalRevenue),
    formattedPipeline: formatCurrency(pipelineRevenue),
    pageViews: pageViews.length,
    uniqueVisitors: uniqueSessions || pageViews.length,
    menuViews,
    siteViews,
    reservationCount: reservations,
    feedbackCount: feedback,
    avgOrderValue: servedOrders.length
      ? formatCurrency(totalRevenue / servedOrders.length)
      : formatCurrency(0),
  };
}

export async function getOrderAnalytics(range: DateRange = "30d") {
  const orders = await prisma.tableOrder.findMany({
    where: orderWhere(range),
    include: {
      items: true,
      table: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const byStatus = orders.reduce<Record<string, number>>((acc, order) => {
    acc[order.status] = (acc[order.status] ?? 0) + 1;
    return acc;
  }, {});

  const byTable = orders.reduce<
    Record<string, { tableNumber: number; zone: string; orders: number; revenue: number }>
  >((acc, order) => {
    const key = order.tableId;
    const revenue =
      order.status === "served"
        ? order.items.reduce((sum, item) => sum + lineTotal(item.quantity, item.unitPrice), 0)
        : 0;
    if (!acc[key]) {
      acc[key] = {
        tableNumber: order.table.number,
        zone: order.table.zone,
        orders: 0,
        revenue: 0,
      };
    }
    acc[key].orders += 1;
    acc[key].revenue += revenue;
    return acc;
  }, {});

  const dailyMap = orders.reduce<Record<string, { orders: number; revenue: number }>>((acc, order) => {
    const key = order.createdAt.toISOString().slice(0, 10);
    const revenue =
      order.status === "served"
        ? order.items.reduce((sum, item) => sum + lineTotal(item.quantity, item.unitPrice), 0)
        : 0;
    if (!acc[key]) acc[key] = { orders: 0, revenue: 0 };
    acc[key].orders += 1;
    acc[key].revenue += revenue;
    return acc;
  }, {});

  const daily = Object.entries(dailyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({ date, ...data }));

  const detailedOrders = orders.map((order) => {
    const total = order.items.reduce(
      (sum, item) => sum + lineTotal(item.quantity, item.unitPrice),
      0
    );
    return {
      id: order.id,
      status: order.status,
      tableNumber: order.table.number,
      zone: order.table.zone,
      createdAt: order.createdAt,
      itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
      total,
      formattedTotal: formatCurrency(total),
      items: order.items.map((item) => ({
        name: item.nameSnapshot,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: lineTotal(item.quantity, item.unitPrice),
      })),
    };
  });

  return {
    orders: detailedOrders,
    byStatus,
    byTable: Object.values(byTable).sort((a, b) => b.revenue - a.revenue),
    daily,
  };
}

export async function getProductAnalytics(range: DateRange = "30d") {
  const items = await prisma.tableOrderItem.findMany({
    where: {
      order: orderWhere(range),
    },
    include: {
      order: true,
      menuItem: {
        include: {
          translations: { where: { locale: "tr" } },
          category: { include: { translations: { where: { locale: "tr" } } } },
        },
      },
    },
  });

  const productMap = items.reduce<
    Record<
      string,
      {
        name: string;
        category: string;
        quantity: number;
        revenue: number;
        orders: number;
      }
    >
  >((acc, item) => {
    const key = item.menuItemId ?? item.nameSnapshot;
    const revenue = lineTotal(item.quantity, item.unitPrice);
    const category =
      item.menuItem?.category?.translations[0]?.name ??
      item.menuItem?.translations[0]?.category ??
      "Diğer";
    const name = item.menuItem?.translations[0]?.name ?? item.nameSnapshot;

    if (!acc[key]) {
      acc[key] = { name, category, quantity: 0, revenue: 0, orders: 0 };
    }
    acc[key].quantity += item.quantity;
    acc[key].revenue += revenue;
    acc[key].orders += 1;
    return acc;
  }, {});

  const products = Object.values(productMap).sort((a, b) => b.revenue - a.revenue);
  const byCategory = products.reduce<Record<string, { quantity: number; revenue: number }>>(
    (acc, product) => {
      if (!acc[product.category]) acc[product.category] = { quantity: 0, revenue: 0 };
      acc[product.category].quantity += product.quantity;
      acc[product.category].revenue += product.revenue;
      return acc;
    },
    {}
  );

  return {
    products: products.map((p) => ({
      ...p,
      formattedRevenue: formatCurrency(p.revenue),
    })),
    byCategory: Object.entries(byCategory)
      .map(([category, data]) => ({
        category,
        ...data,
        formattedRevenue: formatCurrency(data.revenue),
      }))
      .sort((a, b) => b.revenue - a.revenue),
  };
}

export async function getVisitorAnalytics(range: DateRange = "30d") {
  const views = await prisma.pageView.findMany({
    where: pageViewWhere(range),
    orderBy: { createdAt: "desc" },
  });

  const byPath = views.reduce<Record<string, number>>((acc, view) => {
    acc[view.path] = (acc[view.path] ?? 0) + 1;
    return acc;
  }, {});

  const byLocale = views.reduce<Record<string, number>>((acc, view) => {
    const key = view.locale ?? "unknown";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const byReferrer = views.reduce<Record<string, number>>((acc, view) => {
    const ref = view.referrer?.trim();
    const key = !ref ? "Doğrudan" : ref.length > 48 ? `${ref.slice(0, 48)}…` : ref;
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const byCampaign = views.reduce<Record<string, number>>((acc, view) => {
    if (!view.utmCampaign) return acc;
    const key = `${view.utmSource ?? "?"} / ${view.utmCampaign}`;
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const dailyMap = views.reduce<Record<string, { views: number; sessions: Set<string> }>>(
    (acc, view) => {
      const key = view.createdAt.toISOString().slice(0, 10);
      if (!acc[key]) acc[key] = { views: 0, sessions: new Set() };
      acc[key].views += 1;
      if (view.sessionId) acc[key].sessions.add(view.sessionId);
      return acc;
    },
    {}
  );

  const daily = Object.entries(dailyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({
      date,
      views: data.views,
      uniqueVisitors: data.sessions.size || data.views,
    }));

  const uniqueSessions = new Set(views.map((v) => v.sessionId).filter(Boolean)).size;

  return {
    totalViews: views.length,
    uniqueVisitors: uniqueSessions || views.length,
    menuViews: views.filter((v) => v.isMenu).length,
    siteViews: views.filter((v) => !v.isMenu).length,
    topPaths: Object.entries(byPath)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([path, count]) => ({ path, count })),
    byLocale: Object.entries(byLocale).map(([locale, count]) => ({ locale, count })),
    byReferrer: Object.entries(byReferrer)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([referrer, count]) => ({ referrer, count })),
    byCampaign: Object.entries(byCampaign)
      .sort(([, a], [, b]) => b - a)
      .map(([campaign, count]) => ({ campaign, count })),
    daily,
    recent: views.slice(0, 20).map((view) => ({
      path: view.path,
      locale: view.locale,
      isMenu: view.isMenu,
      referrer: view.referrer,
      campaign: view.utmCampaign,
      createdAt: view.createdAt,
    })),
  };
}

export { formatCurrency };
