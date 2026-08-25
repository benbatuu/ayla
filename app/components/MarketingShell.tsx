"use client";

import CookieConsent from "./CookieConsent";
import LenisProvider from "./LenisProvider";

export default function MarketingShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LenisProvider>
      {children}
      <CookieConsent />
    </LenisProvider>
  );
}
