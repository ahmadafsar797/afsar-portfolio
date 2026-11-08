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
  ArrowRight,
  Clock,
  Sparkle,
  Zap,
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
  const row1Ref = useRef<HTMLDivElement>(null);
  const row2Ref = useRef<HTMLDivElement>(null);

  const [isHovered, setIsHovered] = useState(false);

  // Split services into 2 balanced rows
  const midPoint = Math.ceil(services.length / 2);
  const row1Services = services.slice(0, midPoint);
  const row2Services = services.slice(midPoint);

  /* ──────────────────────────────────────────────────
     Icon resolver
  ────────────────────────────────────────────────── */
  const getIcon = (iconName?: string) => {
    const cls = 'w-5 h-5 sm:w-6 sm:h-6';
    switch (iconName?.toLowerCase()) {
      case 'smartphone': return <Smartphone className={cls} />;
      case 'youtube':    return <MonitorPlay className={cls} />;
      case 'flame':      return <Flame className={cls} />;
      case 'film':       return <Film className={cls} />;
      case 'package':    return <Package className={cls} />;
      case 'sparkles':   return <Sparkles className={cls} />;
      case 'palette':    return <Palette className={cls} />;
      case 'volume2':    return <Volume2 className={cls} />;
      case 'briefcase':  return <Briefcase className={cls} />;
      default:           return <Film className={cls} />;
    }
  };

  /* ──────────────────────────────────────────────────
     Subtle Parallax Drift on Page Scroll (No Pinning!)
  ────────────────────────────────────────────────── */
  useEffect(() => {
    const section = sectionRef.current;
    const r1 = row1Ref.current;
    const r2 = row2Ref.current;
    if (!section || !r1 || !r2) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = gsap.context(() => {
      // Row 1 drifts smoothly leftwards as you scroll naturally down
      gsap.to(r1, {
        x: '-=120',
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1.2,
        },
      });

      // Row 2 drifts smoothly rightwards as you scroll naturally down
      gsap.fromTo(
        r2,
        { x: -100 },
        {
          x: 40,
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1.2,
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, [services]);

  /* ──────────────────────────────────────────────────
     Row Dragging Logic (Smooth Mouse & Touch Grab)
  ────────────────────────────────────────────────── */
  const setupDrag = (container: HTMLDivElement | null) => {
    if (!container) return;
    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDown = true;
      container.classList.add('cursor-grabbing');
      startX = e.pageX - container.offsetLeft;
      scrollLeft = container.scrollLeft;
    };

    const onMouseLeave = () => {
      isDown = false;
      container.classList.remove('cursor-grabbing');
    };

    const onMouseUp = () => {
      isDown = false;
      container.classList.remove('cursor-grabbing');
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - container.offsetLeft;
      const walk = (x - startX) * 1.5;
      container.scrollLeft = scrollLeft - walk;
    };

    container.addEventListener('mousedown', onMouseDown);
    container.addEventListener('mouseleave', onMouseLeave);
    container.addEventListener('mouseup', onMouseUp);
    container.addEventListener('mousemove', onMouseMove);

    return () => {
      container.removeEventListener('mousedown', onMouseDown);
      container.removeEventListener('mouseleave', onMouseLeave);
      container.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('mousemove', onMouseMove);
    };
  };

  useEffect(() => {
    const clean1 = setupDrag(row1Ref.current);
    const clean2 = setupDrag(row2Ref.current);
    return () => {
      if (clean1) clean1();
      if (clean2) clean2();
    };
  }, []);

  /* ──────────────────────────────────────────────────
     Header Button Controls (Slide Both Rows)
  ────────────────────────────────────────────────── */
  const scrollRows = (direction: 'left' | 'right') => {
    const distance = 420;
    const r1 = row1Ref.current;
    const r2 = row2Ref.current;

    if (r1) {
      r1.scrollBy({
        left: direction === 'right' ? distance : -distance,
        behavior: 'smooth',
      });
    }
    if (r2) {
      r2.scrollBy({
        left: direction === 'right' ? -distance : distance,
        behavior: 'smooth',
      });
    }
  };

  /* ──────────────────────────────────────────────────
     Card Click: Inquire Service
  ────────────────────────────────────────────────── */
  const handleCardClick = (serviceTitle: string) => {
    if (onSelectService) {
      onSelectService(serviceTitle);
    }
    const contactEl = document.getElementById('contact');
    if (contactEl) {
      contactEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  /* ──────────────────────────────────────────────────
     Single Service Card Component
  ────────────────────────────────────────────────── */
  const renderCard = (service: Service, globalIdx: number) => {
    const cardNum = String(globalIdx + 1).padStart(2, '0');

    return (
      <div
        key={service.id || service.title}
        onClick={() => handleCardClick(service.title)}
        className="group relative flex-shrink-0 w-[300px] sm:w-[360px] md:w-[410px] lg:w-[440px] p-6 sm:p-7 rounded-3xl bg-[#F8F1E7] border border-[#2B170F]/10 hover:border-[#C65D45] transition-all duration-500 shadow-sm hover:shadow-2xl hover:shadow-[#2B170F]/25 flex flex-col justify-between overflow-hidden cursor-pointer select-none active:scale-[0.98] will-change-transform"
      >
        {/* Dark Obsidian Gradient on Hover */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#24130C] via-[#1A0D07] to-[#120804] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

        {/* Ambient Terracotta Glow on Hover */}
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-[#C65D45]/30 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

        <div className="relative z-10 flex flex-col justify-between h-full">
          {/* Top Row: Icon + Number + Turnaround */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-[#FFF9F2] border border-[#2B170F]/10 flex items-center justify-center text-[#C65D45] group-hover:bg-[#C65D45] group-hover:text-white group-hover:border-[#C65D45] group-hover:scale-105 transition-all duration-300 shadow-sm group-hover:shadow-[0_0_20px_rgba(198,93,69,0.5)]">
                {getIcon(service.icon_name)}
              </div>

              <div className="flex items-center gap-2">
                {service.turnaround && (
                  <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/70 group-hover:bg-white/10 group-hover:text-white/80 border border-[#2B170F]/10 group-hover:border-white/10 text-[10px] font-mono text-[#756A62] transition-colors">
                    <Clock className="w-3 h-3 text-[#C65D45]" />
                    {service.turnaround}
                  </span>
                )}

                <span className="font-mono text-xl sm:text-2xl font-bold text-[#2B170F]/20 group-hover:text-white/30 transition-colors duration-300">
                  #{cardNum}
                </span>
              </div>
            </div>

            {/* Title */}
            <h3 className="font-pogonia text-xl sm:text-2xl font-bold text-[#2B170F] group-hover:text-white transition-colors duration-300 mb-2 leading-snug">
              {service.title}
            </h3>

            {/* Short Description */}
            <p className="font-montserrat text-xs sm:text-sm text-[#756A62] group-hover:text-white/75 transition-colors duration-300 line-clamp-2 leading-relaxed">
              {service.short_description}
            </p>
          </div>

          {/* Bottom Row: Micro Deliverable Tag & Inquire Link */}
          <div className="pt-4 mt-4 border-t border-[#2B170F]/10 group-hover:border-white/10 flex items-center justify-between transition-colors">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-montserrat font-semibold text-[#2B170F]/60 group-hover:text-white/60">
              <Sparkle className="w-3 h-3 text-[#C65D45]" />
              Commercial Quality
            </span>

            <span className="inline-flex items-center gap-1 text-xs font-montserrat font-bold text-[#C65D45] group-hover:text-[#e8816c] uppercase tracking-wider transition-colors">
              Inquire
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <section
      ref={sectionRef}
      id="services"
      className="w-full bg-[#FFF9F2] text-[#2B170F] py-16 sm:py-20 lg:py-24 border-t border-[#2B170F]/10 font-sans relative overflow-hidden select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Ambient background blur blobs */}
      <div className="absolute top-1/4 -right-40 w-[500px] h-[500px] rounded-full bg-[#C65D45]/10 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 -left-40 w-[450px] h-[450px] rounded-full bg-[#F2CBB8]/35 blur-[120px] pointer-events-none" />

      {/* ── Section Header ── */}
      <div className="max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 mb-8 sm:mb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-5">
          <div>
            <div className="relative inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/80 backdrop-blur-md border border-white/90 shadow-[0_2px_12px_rgba(43,23,15,0.05),inset_0_1px_1px_rgba(255,255,255,0.9)] overflow-hidden mb-2.5 sm:mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C65D45] animate-pulse" />
              <span className="text-[10px] sm:text-xs font-montserrat font-bold uppercase text-[#C65D45] tracking-wider">
                Full-Stack Post-Production Capabilities
              </span>
            </div>

            <h2 className="font-pogonia text-3xl sm:text-5xl md:text-6xl font-bold text-[#2B170F] tracking-tight leading-tight">
              Specialized Services
            </h2>
          </div>

          <div className="flex items-center justify-between md:justify-end gap-6">
            <p className="text-xs sm:text-sm font-montserrat font-medium text-[#756A62] max-w-md hidden lg:block">
              All 9 specialized editing, color mastering, and sound disciplines at a glance. Drag or swipe horizontally to explore.
            </p>

            {/* Slider Navigation Arrows */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => scrollRows('left')}
                aria-label="Slide left"
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border border-[#2B170F]/15 bg-white/80 text-[#2B170F] hover:bg-[#C65D45] hover:text-white hover:border-[#C65D45] active:scale-95 transition-all duration-300 flex items-center justify-center cursor-pointer shadow-sm"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                onClick={() => scrollRows('right')}
                aria-label="Slide right"
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border border-[#2B170F]/15 bg-white/80 text-[#2B170F] hover:bg-[#C65D45] hover:text-white hover:border-[#C65D45] active:scale-95 transition-all duration-300 flex items-center justify-center cursor-pointer shadow-sm"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2-Row Interactive Horizontal Reel ── */}
      <div className="space-y-4 sm:space-y-6">
        {/* Row 1: Top Services */}
        <div
          ref={row1Ref}
          className="flex items-stretch gap-4 sm:gap-6 px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 overflow-x-auto scrollbar-none cursor-grab active:cursor-grabbing will-change-transform"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {row1Services.map((service, idx) => renderCard(service, idx))}
        </div>

        {/* Row 2: Bottom Services */}
        <div
          ref={row2Ref}
          className="flex items-stretch gap-4 sm:gap-6 px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 overflow-x-auto scrollbar-none cursor-grab active:cursor-grabbing will-change-transform"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {row2Services.map((service, idx) => renderCard(service, midPoint + idx))}
        </div>
      </div>

      {/* ── Bottom Micro Hint ── */}
      <div className="mt-8 text-center">
        <p className="inline-flex items-center gap-2 text-xs font-montserrat font-medium text-[#756A62]">
          <Zap className="w-3.5 h-3.5 text-[#C65D45]" />
          Drag horizontally or click any capability to start a project
        </p>
      </div>
    </section>
  );
};
