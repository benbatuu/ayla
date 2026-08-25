"use client";

import { Link } from "../i18n/navigation";
import { resolveExternalUrl } from "../lib/site-links";

export function ExternalOptionalLink({
  href,
  className,
  children,
}: {
  href?: string | null;
  className?: string;
  children: React.ReactNode;
}) {
  const url = resolveExternalUrl(href);

  if (!url) {
    return null;
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {children}
    </a>
  );
}

export function LegalFooterLink({
  customUrl,
  fallbackPath,
  label,
  className,
}: {
  customUrl?: string | null;
  fallbackPath: "/privacy" | "/kvkk";
  label: string;
  className?: string;
}) {
  const external = resolveExternalUrl(customUrl);

  if (external) {
    return (
      <a
        href={external}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {label}
      </a>
    );
  }

  return (
    <Link href={fallbackPath} className={className}>
      {label}
    </Link>
  );
}
