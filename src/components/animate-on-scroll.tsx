"use client";

import { useEffect, useRef } from "react";

interface Props {
  /** `aos-fade-up` | `aos-fade-left` | `aos-fade-right` | `aos-zoom-in` */
  animation?: string;
  /** One of the `aos-delay-*` classes, e.g. "aos-delay-200" */
  delay?: string;
  className?: string;
  children: React.ReactNode;
  /** Root-margin for the observer. Default "-10% 0px" fires slightly after entering viewport. */
  rootMargin?: string;
  style?: React.CSSProperties;
}

/**
 * Wraps children in a <div> that gains `.is-visible` when it scrolls into view.
 * The animation is driven entirely by CSS in globals.css — no external libraries.
 *
 * Usage:
 *   <AnimateOnScroll animation="aos-fade-up" delay="aos-delay-200">
 *     <h2>Hello</h2>
 *   </AnimateOnScroll>
 */
export function AnimateOnScroll({
  animation = "aos-fade-up",
  delay = "",
  className = "",
  children,
  rootMargin = "-10% 0px",
  style,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("is-visible");
          observer.unobserve(el); // fire once
        }
      },
      { rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin]);

  return (
    <div
      ref={ref}
      className={[animation, delay, className].filter(Boolean).join(" ")}
      style={{ display: "block", willChange: "transform", ...style }}
    >
      {children}
    </div>
  );
}
