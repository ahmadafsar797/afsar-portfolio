import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Smartphone,
  MonitorPlay,
  Flame,
  Film,
  Package,
  Sparkles,
  Palette,
  Volume2,
  Briefcase,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Service } from '../types';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface ServicesSectionProps {
  services: Service[];
  onSelectService?: (serviceTitle: string) => void;
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({ services, onSelectService }) => {
  const sectionRef    = useRef<HTMLElement>(null);
  const carouselRef   = useRef<HTMLDivElement>(null);
  const progressRef   = useRef(0); // 0–1 scroll progress

  const [activeIndex, setActiveIndex] = useState(0);
  const totalSlides = services.length;

  /* ──────────────────────────────────────────────────
     Icon resolver
  ────────────────────────────────────────────────── */
  const getIcon = (iconName?: string) => {
    const cls = 'w-6 h-6';
    switch (iconName?.toLowerCase()) {
      case 'smartphone': return <Smartphone className={cls} />;
      case 'youtube':    return <MonitorPlay className={cls} />;
      case 'flame':      return <Flame       className={cls} />;
      case 'film':       return <Film        className={cls} />;
      case 'package':    return <Package     className={cls} />;
      case 'sparkles':   return <Sparkles    className={cls} />;
      case 'palette':    return <Palette     className={cls} />;
      case 'volume2':    return <Volume2     className={cls} />;
      case 'briefcase':  return <Briefcase   className={cls} />;
      default:           return <Film        className={cls} />;
    }
  };

  /* ──────────────────────────────────────────────────
     Position all cards based on a floating activeIdx
     (can be fractional for smooth scrub tweening)
  ────────────────────────────────────────────────── */
  const positionCards = useCallback((centerIdx: number, animate = true) => {
    const cards = carouselRef.current?.querySelectorAll<HTMLElement>('.cf-card');
    if (!cards) return;

    const vw = window.innerWidth;
    const xStep =
      vw < 480  ? 72 :
      vw < 768  ? 95 :
      vw < 1280 ? 160 :
      vw < 1600 ? 210 : 260;

    cards.forEach((card, i) => {
      const offset    = i - centerIdx;
      const absOffset = Math.abs(offset);

      const x          = offset * xStep;
      const scale      = Math.max(0.62, 1 - absOffset * 0.12);
      const rotateY    = offset * 24;
      const z          = absOffset === 0 ? 0 : -absOffset * 100;
      const opacity    = absOffset > 3.5 ? 0 : Math.max(0.2, 1 - absOffset * 0.22);
      const brightness = Math.max(0.45, 1 - absOffset * 0.2);

      gsap.to(card, {
        x, scale, rotateY, z,
        opacity,
        filter: `brightness(${brightness})`,
        duration: animate ? 0.6 : 0,
        ease: 'power3.out',
        overwrite: 'auto',
        zIndex: Math.round(100 - absOffset * 10),
      });
    });
  }, []);

  /* ──────────────────────────────────────────────────
     GSAP Pinned-scroll drives the coverflow
  ────────────────────────────────────────────────── */
  useEffect(() => {
    if (!sectionRef.current || totalSlides === 0) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // Set initial positions instantly before ScrollTrigger fires
    positionCards(0, false);

    const ctx = gsap.context(() => {
      // Proxy object that GSAP tweens from 0 → (totalSlides-1)
      const proxy = { index: 0 };

      ScrollTrigger.create({
        id: 'services-coverflow',
        trigger: sectionRef.current,
        pin: true,
        start: 'top top',
        // Give ~700px of scroll per card
        end: () => `+=${Math.max((totalSlides - 1) * 720, 600)}`,
        scrub: 1.2,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate(self) {
          progressRef.current = self.progress;
          const rawIdx = self.progress * (totalSlides - 1);
          positionCards(rawIdx, false); // position is scrubbed, so no extra animation
          const snappedIdx = Math.min(Math.round(rawIdx), totalSlides - 1);
          setActiveIndex(snappedIdx);
        },
      });
    }, sectionRef);

    const t = setTimeout(() => ScrollTrigger.refresh(), 200);
    return () => { clearTimeout(t); ctx.revert(); };
  }, [services, totalSlides, positionCards]);

  /* ──────────────────────────────────────────────────
     Card fan-in entrance on first scroll into view
  ────────────────────────────────────────────────── */
  useEffect(() => {
    if (!carouselRef.current || totalSlides === 0) return;
    const cards = carouselRef.current.querySelectorAll<HTMLElement>('.cf-card');
    gsap.set(cards, { opacity: 0, scale: 0.55, y: 80, rotateY: 0 });

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: carouselRef.current,
        start: 'top 90%',
        once: true,
        onEnter() {
          gsap.to(cards, {
            opacity: (i) => Math.max(0.2, 1 - Math.abs(i) * 0.22),
            scale: (i) => Math.max(0.62, 1 - Math.abs(i) * 0.12),
            y: 0,
            duration: 0.65,
            stagger: 0.06,
            ease: 'back.out(1.4)',
            onComplete: () => positionCards(0, false),
          });
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [services, totalSlides]);

  /* ──────────────────────────────────────────────────
     Arrow / dot navigation — scroll to that card
  ────────────────────────────────────────────────── */
  const navigateToSlide = (targetIdx: number) => {
    const st = ScrollTrigger.getById('services-coverflow');
    if (!st) return;
    const p = totalSlides > 1 ? targetIdx / (totalSlides - 1) : 0;
    const targetScroll = st.start + (st.end - st.start) * p;
    window.scrollTo({ top: targetScroll, behavior: 'smooth' });
  };

  const handlePrev = () => navigateToSlide(Math.max(0, activeIndex - 1));
  const handleNext = () => navigateToSlide(Math.min(totalSlides - 1, activeIndex + 1));

  /* ──────────────────────────────────────────────────
     Keyboard navigation
  ────────────────────────────────────────────────── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft')  handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, totalSlides]);

  /* ──────────────────────────────────────────────────
     Click-on-side-card shortcut
  ────────────────────────────────────────────────── */
  const handleCardClick = (service: Service, idx: number) => {
    if (idx !== activeIndex) { navigateToSlide(idx); return; }
    if (onSelectService) onSelectService(service.title);
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
  };

  /* ──────────────────────────────────────────────────
     RENDER
  ────────────────────────────────────────────────── */
  return (
    <section
      ref={sectionRef}
      id="services"
      className="h-[100dvh] min-h-[600px] bg-[#FFF9F2] relative overflow-hidden border-t border-[#2B170F]/10 font-sans flex flex-col select-none"
    >
      {/* ── Top Header ── */}
      <div className="max-w-[1720px] w-full mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 pt-10 md:pt-14 pb-6 md:pb-8 shrink-0">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            {/* pill */}
            <div className="relative inline-flex items-center px-4 py-1.5 rounded-full bg-white/75 backdrop-blur-md border border-white/85 shadow-[0_2px_10px_rgba(43,23,15,0.06),inset_0_1px_1px_rgba(255,255,255,0.95)] overflow-hidden mb-2 sm:mb-3">
              <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/80 via-white/20 to-transparent pointer-events-none" />
              <span className="relative z-10 text-xs font-montserrat font-bold uppercase text-[#C65D45] tracking-normal">
                Full-Stack Post-Production Capabilities
              </span>
            </div>

            <h2 className="font-pogonia text-3xl sm:text-5xl md:text-6xl font-bold text-[#2B170F] leading-tight">
              Specialized Services
            </h2>
          </div>

          <div className="flex items-center justify-between md:justify-end gap-4 sm:gap-6">
            <p className="text-xs sm:text-sm font-montserrat font-medium text-[#756A62] max-w-md hidden lg:block">
              From viral vertical reels engineered for the algorithm to broadcast-grade commercial color mastering and immersive audio soundscapes.
            </p>

            {/* Counter + Arrows */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <span className="text-xs sm:text-sm font-mono font-bold text-[#756A62] px-2.5 py-1 rounded-full bg-[#2B170F]/5 border border-[#2B170F]/10">
                {String(activeIndex + 1).padStart(2, '0')} / {String(totalSlides).padStart(2, '0')}
              </span>

              <button
                onClick={handlePrev}
                disabled={activeIndex === 0}
                aria-label="Previous service"
                className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full border flex items-center justify-center transition-all duration-300 cursor-pointer ${
                  activeIndex === 0
                    ? 'border-[#2B170F]/10 text-[#2B170F]/30 cursor-not-allowed'
                    : 'border-[#2B170F]/20 text-[#2B170F] hover:bg-[#C65D45] hover:text-white hover:border-[#C65D45] active:scale-90 shadow-sm'
                }`}
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              <button
                onClick={handleNext}
                disabled={activeIndex === totalSlides - 1}
                aria-label="Next service"
                className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full border flex items-center justify-center transition-all duration-300 cursor-pointer ${
                  activeIndex === totalSlides - 1
                    ? 'border-[#2B170F]/10 text-[#2B170F]/30 cursor-not-allowed'
                    : 'border-[#2B170F]/20 text-[#2B170F] hover:bg-[#C65D45] hover:text-white hover:border-[#C65D45] active:scale-90 shadow-sm'
                }`}
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Scroll-hint label ── */}
      <p className="text-center text-[11px] sm:text-xs font-montserrat font-medium text-[#756A62]/70 shrink-0 -mt-2 mb-1">
        Scroll to explore · Click side cards to jump · Click center to inquire
      </p>

      {/* ── Coverflow Stage — fills remaining height ── */}
      <div
        ref={carouselRef}
        className="relative flex-1 flex items-center justify-center overflow-visible"
        style={{ perspective: '1400px', perspectiveOrigin: '50% 50%' }}
      >
        {services.map((service, i) => {
          const cardNum  = String(i + 1).padStart(2, '0');
          const isActive = i === activeIndex;

          return (
            <div
              key={service.id || service.title}
              className="cf-card absolute"
              style={{
                width: 'clamp(240px, 32vw, 520px)',
                transformStyle: 'preserve-3d',
                willChange: 'transform, opacity, filter',
                cursor: isActive ? 'pointer' : 'default',
              }}
              onClick={() => handleCardClick(service, i)}
            >
              {/* Card face */}
              <div
                className={`relative w-full p-6 sm:p-8 xl:p-11 rounded-3xl flex flex-col overflow-hidden transition-shadow duration-500
                  ${isActive
                    ? 'bg-[#2B170F] border border-[#C65D45]/40 shadow-[0_30px_80px_rgba(43,23,15,0.5)] ring-1 ring-[#C65D45]/30'
                    : 'bg-[#F8F1E7] border border-[#2B170F]/10 shadow-md'
                  }`}
                style={{ minHeight: 'clamp(300px, 48vh, 540px)' }}
              >
                {/* warm glow behind active card */}
                {isActive && (
                  <>
                    <div className="absolute -top-16 -right-16 w-48 h-48 bg-[#C65D45]/20 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-[#C65D45]/10 rounded-full blur-2xl pointer-events-none" />
                  </>
                )}

                <div className="relative z-10 flex flex-col h-full">
                  {/* Icon + number */}
                  <div className="flex items-center justify-between mb-5 sm:mb-6 xl:mb-8">
                    <div
                      className={`w-12 h-12 sm:w-14 sm:h-14 xl:w-16 xl:h-16 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm
                        ${isActive
                          ? 'bg-[#C65D45] shadow-[0_0_24px_rgba(198,93,69,0.55)]'
                          : 'bg-[#FFF9F2] border border-[#2B170F]/10'
                        }`}
                    >
                      <span className={`[&_svg]:w-7 [&_svg]:h-7 ${isActive ? 'text-white [&_svg]:text-white' : 'text-[#C65D45] [&_svg]:text-[#C65D45]'}`}>
                        {getIcon(service.icon_name)}
                      </span>
                    </div>

                    <span className={`text-xl sm:text-2xl xl:text-3xl font-mono font-bold ${isActive ? 'text-white/25' : 'text-[#2B170F]/20'}`}>
                      #{cardNum}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className={`font-pogonia text-2xl sm:text-3xl xl:text-4xl font-bold mb-3 xl:mb-4 leading-snug ${isActive ? 'text-[#FFF9F2]' : 'text-[#2B170F]'}`}>
                    {service.title}
                  </h3>

                  {/* Description */}
                  <p className={`text-xs sm:text-sm xl:text-base font-montserrat font-medium leading-relaxed ${isActive ? 'text-[#FFF9F2]/72' : 'text-[#756A62]'}`}>
                    {service.short_description}
                  </p>

                  {/* CTA — only on active */}
                  {isActive && (
                    <div className="mt-auto pt-5 xl:pt-8">
                      <span className="inline-flex items-center gap-1.5 text-xs xl:text-sm font-montserrat font-bold text-[#C65D45] uppercase tracking-wider">
                        Get in touch <ChevronRight className="w-3.5 h-3.5 xl:w-4 xl:h-4" />
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Dot indicators ── */}
      <div className="shrink-0 pb-6 sm:pb-8 pt-3 flex flex-col items-center gap-2">
        <div className="flex items-center gap-2">
          {services.map((_, i) => (
            <button
              key={i}
              onClick={() => navigateToSlide(i)}
              aria-label={`Go to service ${i + 1}`}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                activeIndex === i ? 'w-7 bg-[#C65D45]' : 'w-2 bg-[#2B170F]/20 hover:bg-[#2B170F]/40'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
