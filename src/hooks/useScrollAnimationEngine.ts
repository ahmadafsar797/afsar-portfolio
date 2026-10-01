import { useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * MASTER SCROLL ANIMATION ENGINE v3.0
 * Pure, high-end motion design for Afsar Ahmad Portfolio
 *
 * Principles:
 *  1. Smooth, intentional, editorial pacing — no jitter, no whole-page distortion.
 *  2. Cinematic scroll reveals for cards, videos, and narrative sections.
 *  3. Subtle depth parallax that enhances immersion without breaking layout.
 *  4. High performance: uses GPU-accelerated transforms & opacity only.
 *  5. Fully responsive and respects prefers-reduced-motion.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export function useScrollAnimationEngine() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // Small delay to ensure all DOM elements are mounted and styled
    const initTimer = setTimeout(() => {
      const mm = gsap.matchMedia();
      const ctx = gsap.context(() => {

        // ─── 1. HERO PARALLAX RECEDE ON SCROLL ─────────────────────────────
        mm.add('(min-width: 768px)', () => {
          const hero = document.querySelector<HTMLElement>('#home');
          if (!hero) return;

          const charImg = hero.querySelector<HTMLElement>('img[alt*="Afsar Ahmad"]');
          const blobShape = hero.querySelector<HTMLElement>('[class*="rounded-[48%"]');
          const leftContent = hero.querySelector<HTMLElement>('.lg\\:col-span-7');

          if (charImg) {
            gsap.to(charImg, {
              y: -50,
              ease: 'none',
              scrollTrigger: {
                trigger: hero,
                start: 'top top',
                end: 'bottom top',
                scrub: 1,
              },
            });
          }

          if (blobShape) {
            gsap.to(blobShape, {
              y: -30,
              scale: 0.96,
              ease: 'none',
              scrollTrigger: {
                trigger: hero,
                start: 'top top',
                end: 'bottom top',
                scrub: 1.2,
              },
            });
          }

          if (leftContent) {
            gsap.to(leftContent, {
              y: -35,
              opacity: 0.7,
              ease: 'none',
              scrollTrigger: {
                trigger: hero,
                start: 'top top',
                end: 'bottom top',
                scrub: 0.8,
              },
            });
          }
        });

        // ─── 2. SHOWREEL CINEMATIC EXPAND ──────────────────────────────────
        mm.add('(min-width: 768px)', () => {
          const showreel = document.querySelector<HTMLElement>('#showreel-section');
          if (!showreel) return;

          const videoPlayer = showreel.querySelector<HTMLElement>('.aspect-16-9');
          const specsGrid = showreel.querySelector<HTMLElement>('.grid.grid-cols-2, .grid.grid-cols-4');

          if (videoPlayer) {
            gsap.fromTo(
              videoPlayer,
              { scale: 0.94, opacity: 0.85 },
              {
                scale: 1,
                opacity: 1,
                duration: 1,
                ease: 'power2.out',
                scrollTrigger: {
                  trigger: showreel,
                  start: 'top 78%',
                  end: 'top 35%',
                  scrub: 1.2,
                },
              }
            );
          }

          if (specsGrid) {
            const specItems = specsGrid.querySelectorAll<HTMLElement>(':scope > div');
            gsap.fromTo(
              specItems,
              { y: 30, opacity: 0 },
              {
                y: 0,
                opacity: 1,
                duration: 0.65,
                stagger: 0.08,
                ease: 'power3.out',
                scrollTrigger: {
                  trigger: specsGrid,
                  start: 'top 88%',
                  once: true,
                },
              }
            );
          }
        });

        // ─── 3. REELS & SHORT-FORM WORK STAGGER REVEAL ────────────────────
        const reelsSection = document.querySelector<HTMLElement>('#reels');
        if (reelsSection) {
          const reelCards = reelsSection.querySelectorAll<HTMLElement>('.reel-card-animate');
          if (reelCards.length) {
            gsap.fromTo(
              reelCards,
              { y: 45, opacity: 0, scale: 0.96 },
              {
                y: 0,
                opacity: 1,
                scale: 1,
                duration: 0.8,
                stagger: 0.08,
                ease: 'power3.out',
                scrollTrigger: {
                  trigger: reelsSection,
                  start: 'top 80%',
                  once: true,
                },
              }
            );
          }
        }

        // ─── 4. HORIZONTAL WORK (16:9) EDITORIAL CARDS ─────────────────────
        const horizontalSection = document.querySelector<HTMLElement>('#horizontal-work');
        if (horizontalSection) {
          const cards = horizontalSection.querySelectorAll<HTMLElement>('.space-y-16 > div, .space-y-24 > div');
          cards.forEach((card) => {
            const videoSide = card.querySelector<HTMLElement>('.aspect-16-9');
            const textSide = card.querySelector<HTMLElement>('.flex.flex-col.justify-center');

            if (videoSide) {
              gsap.fromTo(
                videoSide,
                { opacity: 0, scale: 0.96 },
                {
                  opacity: 1,
                  scale: 1,
                  duration: 0.85,
                  ease: 'power3.out',
                  scrollTrigger: {
                    trigger: card,
                    start: 'top 85%',
                    once: true,
                  },
                }
              );
            }

            if (textSide) {
              gsap.fromTo(
                textSide,
                { opacity: 0, y: 30 },
                {
                  opacity: 1,
                  y: 0,
                  duration: 0.75,
                  delay: 0.1,
                  ease: 'power3.out',
                  scrollTrigger: {
                    trigger: card,
                    start: 'top 85%',
                    once: true,
                  },
                }
              );
            }
          });
        }

        // ─── 5. TESTIMONIALS (Handled directly with parallax scroll inside TestimonialsSection.tsx) ──────

        // ─── 6. SERVICES GRID STAGGER REVEAL ──────────────────────────────
        const servicesSection = document.querySelector<HTMLElement>('#services');
        if (servicesSection) {
          const serviceCards = servicesSection.querySelectorAll<HTMLElement>('.service-card');
          if (serviceCards.length) {
            gsap.fromTo(
              serviceCards,
              { y: 35, opacity: 0 },
              {
                y: 0,
                opacity: 1,
                duration: 0.65,
                stagger: 0.07,
                ease: 'power3.out',
                scrollTrigger: {
                  trigger: servicesSection,
                  start: 'top 82%',
                  once: true,
                },
              }
            );
          }
        }

        // ─── 7. PROCESS PIPELINE STAGGER ──────────────────────────────────
        const processCards = document.querySelectorAll<HTMLElement>('.process-step');
        if (processCards.length) {
          gsap.fromTo(
            processCards,
            { y: 35, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.7,
              stagger: 0.1,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: processCards[0].parentElement || processCards[0],
                start: 'top 82%',
                once: true,
              },
            }
          );
        }

        // ─── 8. CASE STUDIES / SELECTED PROJECTS REVEAL ───────────────────
        const caseStudiesSection = document.querySelector<HTMLElement>('#case-studies');
        if (caseStudiesSection) {
          const projectCards = caseStudiesSection.querySelectorAll<HTMLElement>('.space-y-24 > div, .space-y-36 > div');
          projectCards.forEach((card) => {
            gsap.fromTo(
              card,
              { y: 40, opacity: 0.8 },
              {
                y: 0,
                opacity: 1,
                duration: 0.8,
                ease: 'power3.out',
                scrollTrigger: {
                  trigger: card,
                  start: 'top 85%',
                  once: true,
                },
              }
            );
          });
        }

        // ─── 9. ABOUT SECTION PORTRAIT & STAT COUNTERS ────────────────────
        const aboutSection = document.querySelector<HTMLElement>('#about');
        if (aboutSection) {
          const portrait = aboutSection.querySelector<HTMLElement>('.aspect-4\\/5, [class*="aspect-4"]');
          if (portrait) {
            gsap.fromTo(
              portrait,
              { y: 25, opacity: 0.8 },
              {
                y: 0,
                opacity: 1,
                duration: 0.85,
                ease: 'power3.out',
                scrollTrigger: {
                  trigger: aboutSection,
                  start: 'top 75%',
                  once: true,
                },
              }
            );
          }

          // Stat metrics roll in
          const statNumbers = aboutSection.querySelectorAll<HTMLElement>('.font-pogonia.text-3xl, .font-pogonia.text-4xl');
          if (statNumbers.length) {
            gsap.fromTo(
              statNumbers,
              { y: 20, opacity: 0 },
              {
                y: 0,
                opacity: 1,
                duration: 0.6,
                stagger: 0.12,
                ease: 'power3.out',
                scrollTrigger: {
                  trigger: statNumbers[0],
                  start: 'top 88%',
                  once: true,
                },
              }
            );
          }
        }

        // ─── 10. CONTACT SECTION & FOOTER REVEAL ──────────────────────────
        const contactSection = document.querySelector<HTMLElement>('#contact');
        if (contactSection) {
          gsap.fromTo(
            contactSection,
            { y: 35, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.75,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: contactSection,
                start: 'top 85%',
                once: true,
              },
            }
          );
        }

        const footer = document.querySelector<HTMLElement>('footer');
        if (footer) {
          gsap.fromTo(
            footer,
            { y: 30, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.7,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: footer,
                start: 'top 95%',
                once: true,
              },
            }
          );
        }

      }); // end gsap.context

      // Refresh ScrollTrigger to ensure correct trigger positions
      ScrollTrigger.refresh();

      return () => {
        ctx.revert();
        mm.revert();
        ScrollTrigger.getAll().forEach((st) => st.kill());
      };
    }, 150);

    return () => {
      clearTimeout(initTimer);
      ScrollTrigger.getAll().forEach((st) => st.kill());
    };
  }, []);
}
