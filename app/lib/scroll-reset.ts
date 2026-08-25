import type Lenis from "lenis";

export function resetLenisScroll(lenis?: Lenis | null) {
  if (lenis) {
    lenis.scrollTo(0, { immediate: true, force: true });
    return;
  }

  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}
