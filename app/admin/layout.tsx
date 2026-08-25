import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionUser } from "../lib/auth";

export const metadata: Metadata = {
  title: "Yönetim Paneli · Ay'la",
  description: "Ay'la web sitesi yönetim paneli",
};

function isLoginPath(pathname: string) {
  return pathname === "/admin/login" || pathname.startsWith("/admin/login/");
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headerStore = await headers();
  const pathname = headerStore.get("x-pathname") ?? "";

  // Enforce when path is known and not the login page.
  // Empty pathname (proxy miss) falls through — pages still call getAdminUser.
  if (pathname && !isLoginPath(pathname)) {
    const user = await getSessionUser();
    if (!user) {
      redirect("/admin/login");
    }
  }

  return (
    <div className="min-h-screen bg-[#171613] text-[#f3f1eb]">{children}</div>
  );
}

export { getAdminUser } from "./lib/auth-guard";
