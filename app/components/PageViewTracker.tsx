"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function TrackerInner({
  locale,
  isMenu,
  tableId,
}: {
  locale?: string;
  isMenu?: boolean;
  tableId?: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    let sessionId = sessionStorage.getItem("ayla_sid");
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem("ayla_sid", sessionId);
    }

    fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: pathname,
        locale,
        isMenu,
        tableId,
        sessionId,
        referrer: document.referrer || undefined,
        utmSource: searchParams.get("utm_source"),
        utmMedium: searchParams.get("utm_medium"),
        utmCampaign: searchParams.get("utm_campaign"),
        utmContent: searchParams.get("utm_content"),
      }),
      keepalive: true,
    }).catch(() => {});
  }, [pathname, locale, isMenu, tableId, searchParams]);

  return null;
}

export default function PageViewTracker(props: {
  locale?: string;
  isMenu?: boolean;
  tableId?: string;
}) {
  return (
    <Suspense fallback={null}>
      <TrackerInner {...props} />
    </Suspense>
  );
}
