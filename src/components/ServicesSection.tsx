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
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  const [activeIndex, setActiveIndex] = useState(0);

  // Touch / drag refs
  const dragStartXRef = useRef(0);
  const isDraggingRef = useRef(false);

  const totalSlides = services.length;

  const getIcon = (iconName?: string) => {
    const iconClass =
      'service-icon w-6 h-6 text-[#C65D45] group-hover:text-white group-active:text-white transition-colors duration-300';
    switch (iconName?.toLowerCase()) {
      case 'smartphone':  return <Smartphone className={iconClass} />;
      case 'youtube':     return <MonitorPlay className={iconClass} />;
      case 'flame':       return <Flame className={iconClass} />;
      case 'film':        return <Film className={iconClass} />;
      case 'package':     return <Package className={iconClass} />;
      case 'sparkles':    return <Sparkles className={iconClass} />;
      case 'palette':     return <Palette className={iconClass} />;
      case 'volume2':     return <Volume2 className={iconClass} />;
      case 'briefcase':   return <Briefcase className={iconClass} />;
      default:            return <Film className={iconClass} />;
    }
  };

  /* ── Animate each card based on distance from active center ── */
  const positionCards = useCallback(
    (idx: number, animate = true) => {
      const cards = carouselRef.current?.querySelectorAll<HTMLElement>('.coverflow-card');
      if (!cards) return;

      cards.forEach((card, i) => {
        const offset = i - idx; // -ve = left, 0 = center, +ve = right
        const absOffset = Math.abs(offset);

        // How much each step shifts, scales, and tilts
        const xStep        = window.innerWidth < 640 ? 68  : window.innerWidth < 1024 ? 90  : 110; // px per step
        const scaleFactor  = Math.max(0.68, 1 - absOffset * 0.11);
        const rotateY      = offset * 22; // degrees
        const zDepth       = absOffset === 0 ? 0 : -absOffset * 80;
        const opacity      = absOffset > 3 ? 0 : Math.max(0.25, 1 - absOffset * 0.22);
        const brightness   = absOffset === 0 ? 1 : Math.max(0.55, 1 - absOffset * 0.18);

        const duration = animate ? 0.55 : 0;
        const ease     = 'power3.out';

        gsap.to(card, {
          x: offset * xStep,
          scale: scaleFactor,
          rotateY,
          z: zDepth,
          opacity,
          filter: `brightness(${brightness})`,
          duration,
          ease,
          overwrite: 'auto',
          zIndex: 100 - absOffset,
        });
      });
    },
    []
  );

  /* ── Reposition whenever activeIndex changes ── */
  useEffect(() => {
    positionCards(activeIndex);
  }, [activeIndex, positionCards, services]);

  /* ── Header scroll-in animation ── */
  useEffect(() => {
    if (!headerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        headerRef.current!.children,
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.75,
          stagger: 0.12,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: headerRef.current,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  /* ── Initial card fan-in on first scroll into view ── */
  useEffect(() => {
    if (!carouselRef.current || totalSlides === 0) return;

    const cards = carouselRef.current.querySelectorAll<HTMLElement>('.coverflow-card');

    // Set initial hidden state
    gsap.set(cards, { opacity: 0, scale: 0.6, y: 60, rotateY: 0 });

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: carouselRef.current,
        start: 'top 80%',
        once: true,
        onEnter: () => {
          gsap.to(cards, {
            opacity: (i) => {
              const absOffset = Math.abs(i - activeIndex);
              return absOffset > 3 ? 0 : Math.max(0.25, 1 - absOffset * 0.22);
            },
            scale: (i) => Math.max(0.68, 1 - Math.abs(i - activeIndex) * 0.11),
            y: 0,
            duration: 0.6,
            stagger: 0.07,
            ease: 'back.out(1.3)',
            onComplete: () => positionCards(activeIndex, false),
          });
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [services, totalSlides]);

  /* ── Navigation helpers ── */
  const handlePrev = () => setActiveIndex((i) => Math.max(0, i - 1));
  const handleNext = () => setActiveIndex((i) => Math.min(totalSlides - 1, i + 1));

  const handleCardClick = (service: Service, idx: number) => {
    if (idx !== activeIndex) {
      setActiveIndex(idx);
      return;
    }
    if (onSelectService) onSelectService(service.title);
    const contactEl = document.getElementById('contact');
    if (contactEl) contactEl.scrollIntoView({ behavior: 'smooth' });
  };

  /* ── Keyboard navigation ── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft')  setActiveIndex((i) => Math.max(0, i - 1));
      if (e.key === 'ArrowRight') setActiveIndex((i) => Math.min(totalSlides - 1, i + 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [totalSlides]);

  /* ── Touch / mouse drag ── */
  const handleDragStart = (clientX: number) => {
    isDraggingRef.current = true;
    dragStartXRef.current = clientX;
  };
  const handleDragEnd = (clientX: number) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    const delta = dragStartXRef.current - clientX;
    if (Math.abs(delta) > 40) {
      delta > 0 ? handleNext() : handlePrev();
    }
  };

  return (
    <section
      ref={sectionRef}
      id="services"
      className="min-h-[100dvh] bg-[#FFF9F2] relative overflow-hidden border-t border-[#2B170F]/10 font-sans flex flex-col justify-center py-12 md:py-16 select-none"
    >
      {/* ── Header ── */}
      <div ref={headerRef} className="max-w-[1720px] w-full mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 mb-10 md:mb-14">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            {/* pill badge */}
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

      {/* ── Coverflow Carousel Stage ── */}
      <div
        ref={carouselRef}
        className="relative w-full flex items-center justify-center"
        style={{ perspective: '1200px', perspectiveOrigin: '50% 50%', height: '420px' }}
        onMouseDown={(e) => handleDragStart(e.clientX)}
        onMouseUp={(e) => handleDragEnd(e.clientX)}
        onMouseLeave={() => { isDraggingRef.current = false; }}
        onTouchStart={(e) => handleDragStart(e.touches[0].clientX)}
        onTouchEnd={(e) => handleDragEnd(e.changedTouches[0].clientX)}
        data-cursor="drag"
      >
        {services.map((service, i) => {
          const cardNum = String(i + 1).padStart(2, '0');
          const isActive = i === activeIndex;

          return (
            <div
              key={service.id || service.title}
              className="coverflow-card absolute"
              style={{
                width: 'clamp(260px, 30vw, 390px)',
                transformStyle: 'preserve-3d',
                willChange: 'transform, opacity',
                cursor: isActive ? 'pointer' : 'default',
              }}
              onClick={() => handleCardClick(service, i)}
            >
              <div
                className={`group relative w-full p-7 sm:p-9 rounded-3xl flex flex-col justify-start overflow-hidden transition-all duration-500 shadow-md
                  ${isActive
                    ? 'bg-[#2B170F] border border-[#C65D45]/40 shadow-2xl shadow-[#2B170F]/40 ring-1 ring-[#C65D45]/30'
                    : 'bg-[#F8F1E7] border border-[#2B170F]/10'
                  }`}
                style={{ minHeight: '340px' }}
              >
                {/* Glow on active */}
                {isActive && (
                  <div className="absolute -top-12 -right-12 w-40 h-40 bg-[#C65D45]/25 rounded-full blur-2xl pointer-events-none" />
                )}

                <div className="relative z-10 flex flex-col justify-start h-full">
                  {/* Icon + Number row */}
                  <div className="flex items-center justify-between mb-6 sm:mb-7">
                    <div
                      className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm
                        ${isActive
                          ? 'bg-[#C65D45] border border-[#C65D45] shadow-[0_0_20px_rgba(198,93,69,0.5)]'
                          : 'bg-[#FFF9F2] border border-[#2B170F]/10 group-hover:bg-[#C65D45] group-hover:border-[#C65D45]'
                        }`}
                    >
                      {/* Render icon, forcing white when active */}
                      <span className={isActive ? '[&_svg]:text-white' : ''}>
                        {getIcon(service.icon_name)}
                      </span>
                    </div>
                    <span
                      className={`text-xl sm:text-2xl font-mono font-bold transition-colors duration-300
                        ${isActive ? 'text-white/30' : 'text-[#2B170F]/20'}`}
                    >
                      #{cardNum}
                    </span>
                  </div>

                  <h3
                    className={`font-pogonia text-2xl sm:text-3xl font-bold mb-3 leading-snug transition-colors duration-300
                      ${isActive ? 'text-[#FFF9F2]' : 'text-[#2B170F]'}`}
                  >
                    {service.title}
                  </h3>

                  <p
                    className={`text-xs sm:text-sm font-montserrat font-medium leading-relaxed transition-colors duration-300
                      ${isActive ? 'text-[#FFF9F2]/75' : 'text-[#756A62]'}`}
                  >
                    {service.short_description}
                  </p>

                  {/* CTA hint on active */}
                  {isActive && (
                    <div className="mt-auto pt-6">
                      <span className="inline-flex items-center gap-1.5 text-xs font-montserrat font-bold text-[#C65D45] uppercase tracking-wider">
                        Get in touch
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Dot Indicators ── */}
      <div className="mt-8 sm:mt-10 flex flex-col items-center justify-center gap-2">
        <div className="flex items-center gap-2">
          {services.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              aria-label={`Go to service ${i + 1}`}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                activeIndex === i ? 'w-7 bg-[#C65D45]' : 'w-2 bg-[#2B170F]/20'
              }`}
            />
          ))}
        </div>
        <p className="text-[11px] font-sans font-medium text-[#756A62]">
          Click a card or use arrows to explore · Click center card to inquire
        </p>
      </div>
    </section>
  );
};
