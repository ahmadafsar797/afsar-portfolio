import { useEffect, useRef, RefObject } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * CLIP-PATH REVEAL — cinematic viewport opening
 * direction: 'up' | 'left' | 'right' | 'diagonal' | 'center'
 */
export function useRevealOnScroll<T extends HTMLElement>(
  direction: 'up' | 'left' | 'right' | 'diagonal' | 'center' = 'up',
  delay = 0
): RefObject<T> {
  const ref = useRef<T>(null!);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const clipStart: Record<string, string> = {
      up: 'inset(100% 0% 0% 0%)',
      left: 'inset(0% 100% 0% 0%)',
      right: 'inset(0% 0% 0% 100%)',
      diagonal: 'inset(100% 100% 0% 0%)',
      center: 'inset(40% 10% 40% 10%)',
    };

    gsap.set(el, { clipPath: clipStart[direction] || clipStart.up });

    const st = ScrollTrigger.create({
      trigger: el,
      start: 'top 88%',
      once: true,
      onEnter: () => {
        gsap.to(el, {
          clipPath: 'inset(0% 0% 0% 0%)',
          duration: 0.9,
          delay,
          ease: 'power3.out',
        });
      },
    });

    return () => st.kill();
  }, [direction, delay]);

  return ref;
}

/**
 * FADE + TRANSLATEY — Smooth upward entry on scroll
 */
export function useFadeUpOnScroll<T extends HTMLElement>(delay = 0): RefObject<T> {
  const ref = useRef<T>(null!);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    gsap.set(el, { y: 35, opacity: 0 });

    const st = ScrollTrigger.create({
      trigger: el,
      start: 'top 90%',
      once: true,
      onEnter: () => {
        gsap.to(el, {
          y: 0,
          opacity: 1,
          duration: 0.75,
          delay,
          ease: 'power3.out',
        });
      },
    });

    return () => st.kill();
  }, [delay]);

  return ref;
}

/**
 * STAGGER CHILDREN on scroll
 */
export function useStaggerOnScroll<T extends HTMLElement>(
  childSelector: string,
  staggerDelay = 0.08
): RefObject<T> {
  const ref = useRef<T>(null!);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const children = container.querySelectorAll<HTMLElement>(childSelector);
    if (!children.length) return;

    gsap.set(children, { y: 35, opacity: 0 });

    const st = ScrollTrigger.create({
      trigger: container,
      start: 'top 86%',
      once: true,
      onEnter: () => {
        gsap.to(children, {
          y: 0,
          opacity: 1,
          duration: 0.7,
          stagger: staggerDelay,
          ease: 'power3.out',
        });
      },
    });

    return () => st.kill();
  }, [childSelector, staggerDelay]);

  return ref;
}

/**
 * PARALLAX — scrub-based depth
 */
export function useParallax<T extends HTMLElement>(strength = 50): RefObject<T> {
  const ref = useRef<T>(null!);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const tween = gsap.to(el, {
      y: strength,
      ease: 'none',
      scrollTrigger: {
        trigger: el,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      },
    });

    return () => {
      (tween as gsap.core.Tween).scrollTrigger?.kill();
      tween.kill();
    };
  }, [strength]);

  return ref;
}
