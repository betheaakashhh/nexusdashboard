'use client';
// src/hooks/useGsapEntrance.ts
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
    // Capture ref value at effect run time to avoid stale ref in cleanup
    const container = containerRef.current;
    if (!container) return;

    async function animate() {
      const mod = await import('gsap');
      gsap = mod.gsap;
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
      // Use the captured container variable, not containerRef.current
      if (gsap && container) {
        gsap.killTweensOf(container.querySelectorAll(selector));
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}