import { isUsableHttpUrl } from "./google-maps";

export type ResolvedLink =
  | { href: string; external: true }
  | { href: "/privacy" | "/kvkk" | string; external: false };

export function resolveExternalUrl(
  value?: string | null
): string | null {
  return isUsableHttpUrl(value) ? value!.trim() : null;
}

export function resolveLegalLink(
  customUrl: string | null | undefined,
  fallbackPath: "/privacy" | "/kvkk"
): ResolvedLink {
  const external = resolveExternalUrl(customUrl);
  if (external) {
    return { href: external, external: true };
  }
  return { href: fallbackPath, external: false };
}

export function starFillState(rating: number, index: number) {
  const threshold = index + 1;
  if (rating >= threshold) return "full" as const;
  if (rating >= threshold - 0.5) return "half" as const;
  return "empty" as const;
}
