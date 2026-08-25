"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import {
  readConsentChoice,
  subscribeConsent,
  type ConsentChoice,
} from "./CookieConsent";

export default function MarketingScripts({
  googleAnalyticsId,
  googleTagManagerId,
  facebookPixelId,
}: {
  googleAnalyticsId?: string | null;
  googleTagManagerId?: string | null;
  facebookPixelId?: string | null;
}) {
  const [choice, setChoice] = useState<ConsentChoice | null>(null);

  useEffect(() => {
    setChoice(readConsentChoice());
    return subscribeConsent(setChoice);
  }, []);

  const allowMarketing = choice === "accept-all";
  const gtm = allowMarketing ? googleTagManagerId?.trim() : "";
  const ga = allowMarketing ? googleAnalyticsId?.trim() : "";
  const pixel = allowMarketing ? facebookPixelId?.trim() : "";

  if (!gtm && !ga && !pixel) {
    return null;
  }

  return (
    <>
      {gtm ? (
        <Script id="gtm-init" strategy="afterInteractive">{`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${gtm}');
          `}</Script>
      ) : null}

      {ga ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${ga}`}
            strategy="afterInteractive"
          />
          <Script id="ga-init" strategy="afterInteractive">{`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${ga}');
          `}</Script>
        </>
      ) : null}

      {pixel ? (
        <Script id="fb-pixel" strategy="afterInteractive">{`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${pixel}');
          fbq('track', 'PageView');
        `}</Script>
      ) : null}
    </>
  );
}
