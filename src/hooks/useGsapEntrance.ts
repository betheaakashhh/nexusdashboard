'use client';
// src/hooks/useGsapEntrance.ts
// Lightweight GSAP entrance animation hook.
// Usage: call useGsapEntrance(containerRef) in any page component.

import { useEffect, RefObject } from 'react';

export function useGsapEntrance(
  containerRef: RefObject<HTMLElement | null>,
  selector = '[data-animate]',
  options?: {
    duration?: number;
    stagger?: number;
    y?: number;
    delay?: number;
  }
) {
  useEffect(() => {
    let gsap: typeof import('gsap').gsap | undefined;

    async function animate() {
      const mod = await import('gsap');
      gsap = mod.gsap;

      const container = containerRef.current;
      if (!container) return;

      const elements = container.querySelectorAll(selector);
      if (!elements.length) return;

      gsap.fromTo(
        elements,
        { opacity: 0, y: options?.y ?? 16 },
        {
          opacity: 1,
          y: 0,
          duration: options?.duration ?? 0.4,
          stagger:  options?.stagger  ?? 0.06,
          delay:    options?.delay    ?? 0,
          ease: 'power2.out',
          clearProps: 'all',
        }
      );
    }

    animate();

    return () => {
      // Cleanup: kill any running tweens on unmount
      if (gsap && containerRef.current) {
        gsap.killTweensOf(containerRef.current.querySelectorAll(selector));
      }
    };
  }, [containerRef, selector, options?.duration, options?.stagger, options?.y, options?.delay]);
}

// ── Utility: staggered list animation ──────────────────────────────────────
// Add data-animate to any element to have it animate in on mount.
// Example:
//   const ref = useRef<HTMLDivElement>(null);
//   useGsapEntrance(ref);
//   return <div ref={ref}><div data-animate>Item 1</div><div data-animate>Item 2</div></div>
