"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";

/**
 * Single restrained landing-page product reveal — adapts the intent of
 * `@aceternity/container-scroll-animation` without its WebGL/motion-lib weight.
 * As the framed preview scrolls into view it settles from a slight downward
 * tilt + lift to flat; on small screens it's a plain fade+scale; under
 * prefers-reduced-motion (handled in globals.css via [data-reveal]) it renders
 * flat immediately. Uses IntersectionObserver — no scroll listener, no jank.
 */
export function ScrollReveal({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShown(true);
            io.disconnect();
          }
        }
      },
      { threshold: 0.2 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      data-reveal
      className={clsx(
        "transition-all duration-700 ease-ep-out [perspective:1200px] motion-reduce:!transform-none motion-reduce:!opacity-100",
        shown
          ? "translate-y-0 opacity-100 [transform:rotateX(0deg)]"
          : "translate-y-6 opacity-0 sm:[transform:rotateX(12deg)_scale(0.97)]",
        className,
      )}
    >
      {children}
    </div>
  );
}
