import React, { useRef, useEffect, useState } from 'react';
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
  ArrowUpRight,
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
  const sliderViewportRef = useRef<HTMLDivElement>(null);
  const sliderTrackRef = useRef<HTMLDivElement>(null);

  const [activeIndex, setActiveIndex] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Mouse / Touch Drag Refs
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragScrollYRef = useRef(0);

  const totalSlides = services.length;

  const getIcon = (iconName?: string) => {
    const iconClass =
      'w-6 h-6 text-[#C65D45] group-hover:text-[#FFF9F2] group-active:text-[#FFF9F2] transition-colors duration-300';
    switch (iconName?.toLowerCase()) {
      case 'smartphone':
        return <Smartphone className={iconClass} />;
      case 'youtube':
        return <MonitorPlay className={iconClass} />;
      case 'flame':
        return <Flame className={iconClass} />;
      case 'film':
        return <Film className={iconClass} />;
      case 'package':
        return <Package className={iconClass} />;
      case 'sparkles':
        return <Sparkles className={iconClass} />;
      case 'palette':
        return <Palette className={iconClass} />;
      case 'volume2':
        return <Volume2 className={iconClass} />;
      case 'briefcase':
        return <Briefcase className={iconClass} />;
      default:
        return <Film className={iconClass} />;
    }
  };

  /* ── Master Horizontal Pinned Scroll Engine ── */
  useEffect(() => {
    const section = sectionRef.current;
    const track = sliderTrackRef.current;
    const viewport = sliderViewportRef.current;
    if (!section || !track || !viewport || totalSlides === 0) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = gsap.context(() => {
      const getScrollDistance = () => {
        const isMobile = window.innerWidth < 768;
        return Math.max(track.scrollWidth - viewport.clientWidth + (isMobile ? 40 : 160), 300);
      };

      const isMobile = window.innerWidth < 768;

      const slideTween = gsap.to(track, {
        x: () => -getScrollDistance(),
        ease: 'none',
        scrollTrigger: {
          id: 'services-pin-slider',
          trigger: section,
          pin: true,
          start: 'top top',
          end: () => `+=${Math.max(getScrollDistance() * (isMobile ? 1.3 : 1.3), isMobile ? 1000 : 850)}`,
          scrub: isMobile ? 0.8 : 1.1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const p = self.progress;
            setScrollProgress(p);
            const idx = Math.min(Math.floor(p * totalSlides), totalSlides - 1);
            setActiveIndex(idx);
          },
        },
      });

      // Subtle slide-in stagger effect for individual cards
      const cards = track.querySelectorAll<HTMLElement>('.service-card');
      cards.forEach((card, idx) => {
        gsap.fromTo(
          card,
          { x: isMobile ? 25 : 35, opacity: idx === 0 ? 1 : 0.85 },
          {
            x: 0,
            opacity: 1,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: card,
              containerAnimation: slideTween,
              start: 'left 95%',
              end: 'left 65%',
              scrub: true,
            },
          }
        );
      });
    }, sectionRef);

    const refreshTimer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 200);

    return () => {
      clearTimeout(refreshTimer);
      ctx.revert();
    };
  }, [services, totalSlides]);

  /* ── Programmatic Next / Prev Navigation ── */
  const handlePrev = () => {
    const prevIdx = Math.max(0, activeIndex - 1);
    navigateToSlide(prevIdx);
  };

  const handleNext = () => {
    const nextIdx = Math.min(totalSlides - 1, activeIndex + 1);
    navigateToSlide(nextIdx);
  };

  const navigateToSlide = (targetIdx: number) => {
    const st = ScrollTrigger.getById('services-pin-slider');
    if (st) {
      const targetProgress = totalSlides > 1 ? targetIdx / (totalSlides - 1) : 0;
      const targetScroll = st.start + (st.end - st.start) * targetProgress;
      window.scrollTo({
        top: targetScroll,
        behavior: 'smooth',
      });
    }
  };

  /* ── Mouse Drag Navigation ── */
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    setIsDragging(true);
    dragStartXRef.current = e.clientX;
    dragScrollYRef.current = window.scrollY;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - dragStartXRef.current;
    const st = ScrollTrigger.getById('services-pin-slider');
    if (st && window.scrollY >= st.start && window.scrollY <= st.end) {
      const scrollDelta = -deltaX * 1.5;
      window.scrollTo({
        top: Math.max(st.start, Math.min(st.end, dragScrollYRef.current + scrollDelta)),
      });
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    setIsDragging(false);
  };

  /* ── Mobile Touch Drag ── */
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!e.touches[0]) return;
    isDraggingRef.current = true;
    dragStartXRef.current = e.touches[0].clientX;
    dragScrollYRef.current = window.scrollY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current || !e.touches[0]) return;
    const deltaX = e.touches[0].clientX - dragStartXRef.current;
    const st = ScrollTrigger.getById('services-pin-slider');
    if (st && window.scrollY >= st.start && window.scrollY <= st.end) {
      const scrollDelta = -deltaX * 1.5;
      window.scrollTo({
        top: Math.max(st.start, Math.min(st.end, dragScrollYRef.current + scrollDelta)),
      });
    }
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
  };

  const handleCardClick = (title: string) => {
    if (onSelectService) {
      onSelectService(title);
    }
    const contactEl = document.getElementById('contact');
    if (contactEl) {
      contactEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      ref={sectionRef}
      id="services"
      className="h-[100dvh] min-h-[580px] max-h-[1080px] md:min-h-[620px] md:max-h-[960px] bg-[#FFF9F2] relative overflow-hidden border-t border-[#2B170F]/10 font-sans flex flex-col justify-center py-4 md:py-0 select-none"
    >
      <div className="max-w-[1720px] 2xl:max-w-[1880px] w-full mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 mb-4 sm:mb-6 md:mb-8">
        {/* Header with Navigation Controls */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="relative inline-flex items-center px-4 py-1.5 rounded-full bg-white/75 backdrop-blur-md border border-white/85 shadow-[0_2px_10px_rgba(43,23,15,0.06),inset_0_1px_1px_rgba(255,255,255,0.95)] overflow-hidden mb-2 sm:mb-3">
              <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/80 via-white/20 to-transparent pointer-events-none" />
              <div className="absolute -top-3 -left-4 w-12 h-16 bg-gradient-to-r from-transparent via-white/60 to-transparent rotate-25 pointer-events-none" />
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

            {/* Slide Counter & Prev/Next Arrows */}
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

      {/* Horizontal Viewport Container */}
      <div
        ref={sliderViewportRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`w-full overflow-hidden select-none py-2 cursor-grab active:cursor-grabbing ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        data-cursor="drag"
      >
        <div
          ref={sliderTrackRef}
          className="flex items-stretch gap-4 sm:gap-6 md:gap-8 px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 w-max will-change-transform"
        >
          {services.map((service, idx) => (
            <div
              key={service.id || idx}
              onClick={() => handleCardClick(service.title)}
              className="service-card group relative flex-shrink-0 w-[84vw] max-w-[340px] sm:w-[350px] md:w-[380px] lg:w-[410px] xl:w-[430px] p-7 sm:p-9 rounded-3xl bg-[#F8F1E7] border border-[#2B170F]/10 hover:border-[#C65D45] transition-all duration-500 shadow-md hover:shadow-2xl hover:shadow-[#2B170F]/25 flex flex-col justify-between overflow-hidden cursor-pointer select-none will-change-transform active:scale-[0.98]"
            >
              {/* Background Glow & Hover Dark Layer */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-[#2B170F] via-[#24130C] to-[#180D07] opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <div className="absolute -top-12 -right-12 w-40 h-40 bg-[#C65D45]/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-500 pointer-events-none" />

              <div className="relative z-10 flex flex-col justify-between h-full">
                <div>
                  {/* Icon */}
                  <div className="mb-6 sm:mb-7">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#FFF9F2] border border-[#2B170F]/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-[#C65D45] group-hover:border-[#C65D45] group-active:bg-[#C65D45] transition-all duration-300 shadow-sm group-hover:shadow-[0_0_20px_rgba(198,93,69,0.5)]">
                      {getIcon(service.icon_name)}
                    </div>
                  </div>

                  <h3 className="font-pogonia text-2xl sm:text-3xl font-bold text-[#2B170F] group-hover:text-[#FFF9F2] group-active:text-[#FFF9F2] transition-colors duration-300 mb-3 leading-snug">
                    {service.title}
                  </h3>

                  <p className="text-xs sm:text-sm font-montserrat font-medium text-[#756A62] group-hover:text-[#FFF9F2]/80 group-active:text-[#FFF9F2]/80 transition-colors duration-300 leading-relaxed">
                    {service.short_description}
                  </p>
                </div>

                {/* Bottom Action CTA Pill (Deliverables removed) */}
                <div className="pt-6 sm:pt-8 mt-6 flex items-center justify-between border-t border-[#2B170F]/10 group-hover:border-white/15 transition-colors duration-300">
                  <span className="text-[11px] sm:text-xs font-montserrat uppercase font-bold tracking-wider text-[#C65D45] group-hover:text-[#FFF9F2] transition-colors duration-300">
                    Book Service
                  </span>
                  <div className="w-8 h-8 rounded-full bg-[#FFF9F2] group-hover:bg-[#C65D45] text-[#2B170F] group-hover:text-white flex items-center justify-center transition-all duration-300 shadow-sm group-hover:scale-110">
                    <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile Pagination Indicator */}
      <div className="mt-3 sm:mt-5 flex flex-col items-center justify-center gap-1.5 md:hidden">
        <div className="flex items-center gap-2">
          {Array.from({ length: totalSlides }).map((_, i) => (
            <button
              key={i}
              onClick={() => navigateToSlide(i)}
              aria-label={`Go to service ${i + 1}`}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                activeIndex === i ? 'w-7 bg-[#C65D45]' : 'w-2 bg-[#2B170F]/20'
              }`}
            />
          ))}
        </div>
        <p className="text-[11px] font-sans font-medium text-[#756A62]">
          Scroll down or swipe to explore services
        </p>
      </div>
    </section>
  );
};

