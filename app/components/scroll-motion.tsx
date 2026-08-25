"use client";

import {
  motion,
  useMotionValue,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { useLenis } from "lenis/react";
import { useRef } from "react";

/** Sync Lenis scroll position to a Framer Motion value. */
export function useLenisScrollY() {
  const scrollY = useMotionValue(0);

  useLenis(({ scroll }) => {
    scrollY.set(scroll);
  });

  return scrollY;
}

export function useLenisParallax(
  scrollY: MotionValue<number>,
  input: [number, number],
  output: [number, number]
) {
  return useTransform(scrollY, input, output);
}

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  once?: boolean;
};

/** Scroll-triggered fade-up — tuned for Lenis smooth scroll. */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 40,
  once = true,
}: RevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: "-12% 0px -8% 0px" }}
      transition={{
        duration: 0.95,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

type ParallaxLayerProps = {
  children: React.ReactNode;
  className?: string;
  speed?: number;
  scrollY: MotionValue<number>;
};

/** Subtle parallax layer driven by Lenis scroll. */
export function ParallaxLayer({
  children,
  className,
  speed = 0.15,
  scrollY,
}: ParallaxLayerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const offsetTop = useMotionValue(0);

  useLenis(() => {
    if (ref.current) {
      offsetTop.set(ref.current.offsetTop);
    }
  });

  const y = useTransform(scrollY, (latest) => {
    const top = offsetTop.get();
    return (latest - top) * speed;
  });

  return (
    <motion.div ref={ref} style={{ y }} className={className}>
      {children}
    </motion.div>
  );
}
