"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BarChart3,
  CalendarDays,
  Clapperboard,
  Clock3,
  ConciergeBell,
  ExternalLink,
  FileText,
  Image,
  LayoutDashboard,
  LogOut,
  MapPin,
  Megaphone,
  Menu,
  MessageSquare,
  QrCode,
  Search,
  Settings,
  ShoppingBag,
  Target,
  TrendingUp,
  Users,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { logoutAction } from "../actions";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    label: "Genel",
    items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Analitik",
    items: [
      { href: "/admin/analytics", label: "Genel Bakış", icon: BarChart3 },
      { href: "/admin/analytics/orders", label: "Sipariş & Gelir", icon: ShoppingBag },
      { href: "/admin/analytics/products", label: "Ürün Performansı", icon: TrendingUp },
      { href: "/admin/analytics/visitors", label: "Ziyaretçiler", icon: Users },
    ],
  },
  {
    label: "SEO",
    items: [
      { href: "/admin/seo", label: "SEO Ayarları", icon: Search },
      { href: "/admin/seo/local", label: "Yerel SEO", icon: MapPin },
    ],
  },
  {
    label: "Pazarlama",
    items: [
      { href: "/admin/marketing", label: "Entegrasyonlar", icon: Megaphone },
      { href: "/admin/marketing/campaigns", label: "Kampanyalar", icon: Target },
    ],
  },
  {
    label: "Site & İçerik",
    items: [
      { href: "/admin/settings", label: "Site Ayarları", icon: Settings },
      { href: "/admin/content", label: "İçerik & Metinler", icon: FileText },
      { href: "/admin/gallery", label: "Galeri", icon: Clapperboard },
      { href: "/admin/media", label: "Medya", icon: Image },
    ],
  },
  {
    label: "Menü & Servis",
    items: [
      { href: "/admin/menu", label: "Menü", icon: UtensilsCrossed },
      { href: "/admin/menu-settings", label: "QR Menü Ayarları", icon: Settings },
      { href: "/admin/tables", label: "Masalar & QR", icon: QrCode },
      { href: "/admin/service", label: "Servis & Sipariş", icon: ConciergeBell },
      { href: "/admin/feedback", label: "Geri Bildirim", icon: MessageSquare },
    ],
  },
  {
    label: "Rezervasyon",
    items: [
      { href: "/admin/reservations", label: "Rezervasyonlar", icon: CalendarDays },
      { href: "/admin/reservation-slots", label: "Rezervasyon Saatleri", icon: Clock3 },
    ],
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavContent({
  pathname,
  user,
  onNavigate,
}: {
  pathname: string;
  user: { email: string; name: string | null };
  onNavigate?: () => void;
}) {
  return (
    <>
      <div className="border-b border-white/10 px-7 py-8">
        <Link
          href="/admin"
          onClick={onNavigate}
          className="font-brand text-[2rem] italic leading-none tracking-[-0.04em]"
        >
          Ay&apos;la
        </Link>
        <p className="mt-3 text-[10px] uppercase tracking-[0.28em] text-white/35">
          Yönetim Paneli
        </p>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto p-4">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="mb-2 px-4 text-[9px] uppercase tracking-[0.24em] text-white/28">
              {group.label}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const active = isActive(pathname, item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={`group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition ${
                      active
                        ? "bg-[#f3f1eb] text-[#171613] shadow-lg shadow-black/20"
                        : "text-white/55 hover:bg-white/[0.05] hover:text-white"
                    }`}
                  >
                    <Icon
                      size={16}
                      className={active ? "opacity-80" : "opacity-60 group-hover:opacity-90"}
                    />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
          <p className="truncate text-xs text-white/35">Oturum</p>
          <p className="mt-1 truncate text-sm text-white/80">{user.email}</p>
        </div>
        <form action={logoutAction} className="mt-3">
          <button
            type="submit"
            className="flex w-full items-center gap-2 rounded-2xl px-4 py-3 text-sm text-white/55 transition hover:bg-white/[0.05] hover:text-white"
          >
            <LogOut size={16} />
            Çıkış Yap
          </button>
        </form>
        <Link
          href="/"
          target="_blank"
          onClick={onNavigate}
          className="mt-2 flex items-center gap-2 px-4 py-2 text-xs text-white/30 transition hover:text-white/60"
        >
          <ExternalLink size={12} />
          Siteyi görüntüle
        </Link>
      </div>
    </>
  );
}

export default function AdminShell({
  user,
  children,
  wide = false,
}: {
  user: { email: string; name: string | null };
  children: React.ReactNode;
  wide?: boolean;
}) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDrawerOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [drawerOpen]);

  const closeDrawer = () => setDrawerOpen(false);

  return (
    <div className="relative min-h-screen bg-[#171613] text-[#f3f1eb]">
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
      <div className="pointer-events-none fixed -left-32 top-0 h-[420px] w-[420px] rounded-full bg-white/[0.03] blur-3xl" />
      <div className="pointer-events-none fixed -right-32 bottom-0 h-[420px] w-[420px] rounded-full bg-white/[0.02] blur-3xl" />

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col border-r border-white/10 bg-[#111]/95 backdrop-blur-xl lg:flex">
        <NavContent pathname={pathname} user={user} />
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-white/10 bg-[#111]/90 px-4 py-3 backdrop-blur-xl lg:hidden">
        <Link
          href="/admin"
          className="font-brand text-2xl italic leading-none tracking-[-0.04em]"
        >
          Ay&apos;la
        </Link>
        <button
          type="button"
          aria-label={drawerOpen ? "Menüyü kapat" : "Menüyü aç"}
          aria-expanded={drawerOpen}
          onClick={() => setDrawerOpen((open) => !open)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/80 transition hover:bg-white/[0.08]"
        >
          {drawerOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Mobile drawer overlay */}
      {drawerOpen ? (
        <button
          type="button"
          aria-label="Menüyü kapat"
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={closeDrawer}
        />
      ) : null}

      {/* Mobile slide-over */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(18rem,88vw)] flex-col border-r border-white/10 bg-[#111] shadow-2xl transition-transform duration-300 ease-out lg:hidden ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!drawerOpen}
      >
        <div className="flex items-center justify-end border-b border-white/10 px-3 py-3">
          <button
            type="button"
            aria-label="Menüyü kapat"
            onClick={closeDrawer}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-white/60 transition hover:bg-white/[0.06] hover:text-white"
          >
            <X size={18} />
          </button>
        </div>
        <NavContent pathname={pathname} user={user} onNavigate={closeDrawer} />
      </aside>

      <main className="relative min-h-screen lg:pl-72">
        <div
          className={`mx-auto px-4 py-8 sm:px-6 lg:px-10 lg:py-12 ${wide ? "max-w-7xl" : "max-w-6xl"}`}
        >
          {children}
        </div>
      </main>
    </div>
  );
}
