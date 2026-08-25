"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

function beep() {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.value = 0.04;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.18);
    window.setTimeout(() => void ctx.close(), 300);
  } catch {
    // ignore autoplay restrictions
  }
}

export default function ServiceLiveRefresh({
  pendingCount = 0,
}: {
  pendingCount?: number;
}) {
  const router = useRouter();
  const prevCount = useRef<number | null>(null);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      router.refresh();
    }, 10000);
    return () => window.clearInterval(intervalId);
  }, [router]);

  useEffect(() => {
    if (prevCount.current === null) {
      prevCount.current = pendingCount;
      return;
    }
    if (pendingCount > prevCount.current) {
      beep();
    }
    prevCount.current = pendingCount;
  }, [pendingCount]);

  return (
    <p className="mb-6 text-[10px] uppercase tracking-[0.25em] text-white/30">
      Otomatik yenileme: 10 sn · Yeni istekte ses uyarısı
    </p>
  );
}
