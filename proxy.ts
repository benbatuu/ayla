import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./app/i18n/routing";

const intlMiddleware = createMiddleware(routing);
const menuLocales = "en|ru";

function getHostname(host: string) {
  return host.split(":")[0].toLowerCase();
}

function isMenuSubdomain(host: string) {
  const hostname = getHostname(host);
  return (
    hostname === "menu.localhost" ||
    hostname.startsWith("menu.") ||
    hostname === "menu"
  );
}

function rewriteMenuSubdomain(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next")
  ) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();

  if (pathname === "/" || pathname === "") {
    url.pathname = "/menu";
    return NextResponse.rewrite(url);
  }

  if (pathname.match(new RegExp(`^\\/(${menuLocales})\\/?$`))) {
    const locale = pathname.split("/")[1];
    url.pathname = `/menu/${locale}`;
    return NextResponse.rewrite(url);
  }

  const localeTableMatch = pathname.match(
    new RegExp(`^\\/(${menuLocales})\\/t\\/([^/]+)\\/?$`)
  );
  if (localeTableMatch) {
    url.pathname = `/menu/${localeTableMatch[1]}/t/${localeTableMatch[2]}`;
    return NextResponse.rewrite(url);
  }

  const tableMatch = pathname.match(/^\/t\/([^/]+)\/?$/);
  if (tableMatch) {
    url.pathname = `/menu/t/${tableMatch[1]}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.rewrite(url);
}

export default function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-pathname", pathname);
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  if (isMenuSubdomain(host)) {
    return rewriteMenuSubdomain(request);
  }

  if (pathname.startsWith("/menu")) {
    return NextResponse.next();
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: [
    "/",
    "/admin",
    "/admin/:path*",
    "/(tr|en|ru)/:path*",
    "/menu/:path*",
    "/t/:path*",
    "/en/t/:path*",
    "/ru/t/:path*",
    "/((?!admin|api|_next|_vercel|.*\\..*).*)",
  ],
};
