import React, { useRef, useEffect, useState, useMemo } from 'react';
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
  CheckCircle2,
  Layers,
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
  const panelContainerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  const totalSlides = services.length;

  /* ──────────────────────────────────────────────────
     Icon resolver
  ────────────────────────────────────────────────── */
  const getIcon = (iconName?: string) => {
    const cls = 'w-6 h-6 sm:w-7 sm:h-7';
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
     Smart software tools per service
  ────────────────────────────────────────────────── */
  const getSoftwareTools = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes('reel') || t.includes('short')) return ['Premiere Pro', 'After Effects', 'CapCut Pro'];
    if (t.includes('youtube')) return ['Premiere Pro', 'DaVinci Resolve', 'Audition'];
    if (t.includes('color')) return ['DaVinci Resolve Studio', 'FilmConvert', 'Dehancer Pro'];
    if (t.includes('motion') || t.includes('graphic')) return ['After Effects', 'Cinema 4D', 'Illustrator'];
    if (t.includes('sound') || t.includes('audio')) return ['Logic Pro X', 'iZotope RX', 'Adobe Audition'];
    if (t.includes('commercial') || t.includes('brand')) return ['DaVinci Resolve Studio', 'After Effects', 'Frame.io'];
    if (t.includes('product')) return ['Blender 3D', 'After Effects', 'Premiere Pro'];
    if (t.includes('corporate')) return ['Premiere Pro', 'DaVinci Resolve', 'Frame.io'];
    return ['Premiere Pro', 'After Effects', 'DaVinci Resolve'];
  };

  /* ──────────────────────────────────────────────────
     Format deliverables into array
  ────────────────────────────────────────────────── */
  const getDeliverablesList = (service: Service): string[] => {
    if (service.deliverables && service.deliverables.trim().length > 0) {
      return service.deliverables
        .split(/[,•\n]/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
    }
    return ['Master 4K UHD Export', 'Broadcast Sound Mix', 'Commercial Color Grade', 'Unlimited Revisions'];
  };

  /* ──────────────────────────────────────────────────
     Master ScrollTrigger Pinned Cinematic Scrub
  ────────────────────────────────────────────────── */
  useEffect(() => {
    const section = sectionRef.current;
    if (!section || totalSlides === 0) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const isMobile = window.innerWidth < 768;
    const scrollDistance = totalSlides * (isMobile ? 700 : 900);

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        id: 'services-cinematic-pin',
        trigger: section,
        pin: true,
        start: 'top top',
        end: () => `+=${scrollDistance}`,
        scrub: 0.8,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const p = self.progress;
          setProgress(p);
          const rawIdx = p * totalSlides;
          const clampedIdx = Math.min(Math.floor(rawIdx), totalSlides - 1);
          setActiveIndex(clampedIdx);
        },
      });
    }, sectionRef);

    const refreshTimer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 250);

    return () => {
      clearTimeout(refreshTimer);
      ctx.revert();
    };
  }, [totalSlides]);

  /* ──────────────────────────────────────────────────
     Smooth Panel Transition on activeIndex change
  ────────────────────────────────────────────────── */
  useEffect(() => {
    const container = panelContainerRef.current;
    if (!container) return;

    const currentPanel = container.querySelector(`[data-panel-idx="${activeIndex}"]`);
    if (!currentPanel) return;

    const textElements = currentPanel.querySelectorAll('.animate-editorial-text');
    const visualElements = currentPanel.querySelectorAll('.animate-showcase-card');
    const badgeElements = currentPanel.querySelectorAll('.animate-badge');

    gsap.killTweensOf([textElements, visualElements, badgeElements]);

    // Apple-style staggered slide-up & fade-in
    gsap.fromTo(
      badgeElements,
      { opacity: 0, y: 15 },
      { opacity: 1, y: 0, duration: 0.45, ease: 'power3.out' }
    );

    gsap.fromTo(
      textElements,
      { opacity: 0, y: 28 },
      { opacity: 1, y: 0, duration: 0.55, stagger: 0.08, ease: 'power3.out' }
    );

    gsap.fromTo(
      visualElements,
      { opacity: 0, scale: 0.94, y: 35 },
      { opacity: 1, scale: 1, y: 0, duration: 0.65, ease: 'back.out(1.2)' }
    );
  }, [activeIndex]);

  /* ──────────────────────────────────────────────────
     Navigate by Index (smooth scroll to pin stage)
  ────────────────────────────────────────────────── */
  const navigateToSlide = (targetIdx: number) => {
    const st = ScrollTrigger.getById('services-cinematic-pin');
    if (!st) {
      setActiveIndex(targetIdx);
      return;
    }
    const safeIdx = Math.max(0, Math.min(totalSlides - 1, targetIdx));
    // Center inside the slide's scroll bracket
    const targetProgress = (safeIdx + 0.5) / totalSlides;
    const targetScroll = st.start + (st.end - st.start) * targetProgress;

    window.scrollTo({
      top: targetScroll,
      behavior: 'smooth',
    });
  };

  const handlePrev = () => navigateToSlide(activeIndex - 1);
  const handleNext = () => navigateToSlide(activeIndex + 1);

  /* ──────────────────────────────────────────────────
     Keyboard navigation
  ────────────────────────────────────────────────── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeIndex, totalSlides]);

  /* ──────────────────────────────────────────────────
     Handle CTA Inquire
  ────────────────────────────────────────────────── */
  const handleInquire = (title: string) => {
    if (onSelectService) {
      onSelectService(title);
    }
    const contactEl = document.getElementById('contact');
    if (contactEl) {
      contactEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const currentService = services[activeIndex] || services[0];
  const activeNumber = String(activeIndex + 1).padStart(2, '0');
  const deliverables = useMemo(() => {
    return currentService ? getDeliverablesList(currentService) : [];
  }, [currentService]);
  const softwareTools = useMemo(() => {
    return currentService ? getSoftwareTools(currentService.title) : [];
  }, [currentService]);

  return (
    <section
      ref={sectionRef}
      id="services"
      className="relative h-[100dvh] min-h-[640px] max-h-[1120px] w-full bg-[#FFF9F2] text-[#2B170F] overflow-hidden flex flex-col justify-between font-sans border-t border-[#2B170F]/10 select-none"
    >
      {/* ── Ambient Background Lighting ── */}
      <div className="absolute -top-32 -right-32 w-[520px] h-[520px] rounded-full bg-[#C65D45]/10 blur-[130px] pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-[460px] h-[460px] rounded-full bg-[#F2CBB8]/35 blur-[120px] pointer-events-none" />

      {/* ── Giant Editorial Watermark Number ── */}
      <div className="absolute right-4 sm:right-12 md:right-20 lg:right-32 bottom-12 sm:bottom-16 select-none pointer-events-none font-pogonia text-[22vw] font-black text-[#2B170F]/[0.032] leading-none transition-all duration-700 ease-out z-0">
        #{activeNumber}
      </div>

      {/* ──────────────────────────────────────────────
          TOP HEADER: Apple-Style Clean Luxury Bar
      ────────────────────────────────────────────── */}
      <header className="relative z-20 w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 pt-5 sm:pt-7 md:pt-9 shrink-0">
        <div className="flex items-center justify-between gap-4">
          {/* Section identity */}
          <div>
            <div className="relative inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/80 backdrop-blur-md border border-white/90 shadow-[0_2px_12px_rgba(43,23,15,0.05),inset_0_1px_1px_rgba(255,255,255,0.9)] overflow-hidden mb-1.5 sm:mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C65D45] animate-pulse" />
              <span className="text-[10px] sm:text-xs font-montserrat font-bold uppercase text-[#C65D45] tracking-wider">
                Full-Stack Post-Production
              </span>
            </div>
            <h2 className="font-pogonia text-2xl sm:text-4xl md:text-5xl font-bold text-[#2B170F] tracking-tight">
              Specialized Services
            </h2>
          </div>

          {/* Controls: Counter + Arrow Navigation */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            {/* Step Counter */}
            <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-white/70 backdrop-blur-md border border-[#2B170F]/10 shadow-sm">
              <span className="font-pogonia text-sm sm:text-base font-bold text-[#2B170F]">
                {activeNumber}
              </span>
              <span className="text-xs text-[#756A62]/60 font-mono">/</span>
              <span className="text-xs sm:text-sm font-mono text-[#756A62]">
                {String(totalSlides).padStart(2, '0')}
              </span>
            </div>

            {/* Prev & Next Buttons */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={handlePrev}
                disabled={activeIndex === 0}
                aria-label="Previous capability"
                className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full border flex items-center justify-center transition-all duration-300 cursor-pointer ${
                  activeIndex === 0
                    ? 'border-[#2B170F]/10 text-[#2B170F]/25 cursor-not-allowed bg-transparent'
                    : 'border-[#2B170F]/15 bg-white/80 text-[#2B170F] hover:bg-[#C65D45] hover:text-white hover:border-[#C65D45] active:scale-95 shadow-sm'
                }`}
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              <button
                onClick={handleNext}
                disabled={activeIndex === totalSlides - 1}
                aria-label="Next capability"
                className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full border flex items-center justify-center transition-all duration-300 cursor-pointer ${
                  activeIndex === totalSlides - 1
                    ? 'border-[#2B170F]/10 text-[#2B170F]/25 cursor-not-allowed bg-transparent'
                    : 'border-[#2B170F]/15 bg-white/80 text-[#2B170F] hover:bg-[#C65D45] hover:text-white hover:border-[#C65D45] active:scale-95 shadow-sm'
                }`}
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ──────────────────────────────────────────────
          MAIN STAGE: Cinematic Full-Screen Panel
      ────────────────────────────────────────────── */}
      <div
        ref={panelContainerRef}
        className="relative z-10 flex-1 w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 flex items-center justify-center py-4 sm:py-6 overflow-hidden"
      >
        {currentService && (
          <div
            data-panel-idx={activeIndex}
            key={currentService.id || currentService.title}
            className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 lg:gap-12 xl:gap-16 items-center"
          >
            {/* ── LEFT COLUMN: Editorial Narrative (7 Cols) ── */}
            <div className="lg:col-span-7 flex flex-col justify-center">
              {/* Category & Status pills */}
              <div className="animate-badge flex flex-wrap items-center gap-2 sm:gap-3 mb-3 sm:mb-5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C65D45]/10 text-[#C65D45] border border-[#C65D45]/20 text-[11px] sm:text-xs font-montserrat font-bold uppercase tracking-wider">
                  <Sparkle className="w-3 h-3 text-[#C65D45]" />
                  Capability #{activeNumber}
                </span>

                {currentService.turnaround && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 border border-[#2B170F]/10 text-[#2B170F] text-[11px] sm:text-xs font-montserrat font-semibold shadow-sm">
                    <Clock className="w-3 h-3 text-[#C65D45]" />
                    Turnaround: {currentService.turnaround}
                  </span>
                )}

                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-[11px] sm:text-xs font-montserrat font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Available for Commissions
                </span>
              </div>

              {/* Title */}
              <h3 className="animate-editorial-text font-pogonia text-3xl sm:text-5xl md:text-6xl xl:text-7xl font-bold text-[#2B170F] tracking-tight leading-[1.08] mb-4 sm:mb-6">
                {currentService.title}
              </h3>

              {/* Description */}
              <p className="animate-editorial-text font-montserrat text-sm sm:text-base md:text-lg xl:text-xl text-[#756A62] font-medium leading-relaxed max-w-2xl mb-6 sm:mb-8">
                {currentService.short_description}
              </p>

              {/* Deliverables Capsule Badges */}
              <div className="animate-editorial-text mb-6 sm:mb-8">
                <div className="flex items-center gap-2 text-xs font-montserrat font-bold uppercase tracking-wider text-[#2B170F]/60 mb-2.5 sm:mb-3">
                  <Layers className="w-3.5 h-3.5 text-[#C65D45]" />
                  Core Deliverables & Standards
                </div>
                <div className="flex flex-wrap gap-2 sm:gap-2.5">
                  {deliverables.map((item, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-full bg-white/85 backdrop-blur-md border border-[#2B170F]/10 text-xs sm:text-sm font-montserrat font-semibold text-[#2B170F] shadow-sm hover:border-[#C65D45]/40 transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#C65D45] shrink-0" />
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              {/* CTA Action Row */}
              <div className="animate-editorial-text flex flex-wrap items-center gap-4">
                <button
                  onClick={() => handleInquire(currentService.title)}
                  className="group relative inline-flex items-center gap-3 px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl bg-[#C65D45] text-white font-montserrat font-bold text-sm sm:text-base shadow-[0_10px_30px_rgba(198,93,69,0.35)] hover:shadow-[0_15px_40px_rgba(198,93,69,0.5)] hover:bg-[#b04c35] active:scale-[0.98] transition-all duration-300 cursor-pointer overflow-hidden"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Inquire This Capability
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform ease-out pointer-events-none" />
                </button>

                <button
                  onClick={handleNext}
                  disabled={activeIndex === totalSlides - 1}
                  className="inline-flex items-center gap-2 text-xs sm:text-sm font-montserrat font-bold text-[#756A62] hover:text-[#2B170F] transition-colors py-2 px-3 rounded-lg hover:bg-black/5"
                >
                  Next Service
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* ── RIGHT COLUMN: Obsidian Showcase Card (5 Cols) ── */}
            <div className="lg:col-span-5 flex justify-center">
              <div
                className="animate-showcase-card relative w-full max-w-[480px] lg:max-w-none rounded-3xl p-7 sm:p-9 xl:p-11 bg-gradient-to-br from-[#24130C] via-[#1C0F09] to-[#120804] text-[#FFF9F2] border border-[#C65D45]/30 shadow-[0_30px_90px_rgba(43,23,15,0.45)] overflow-hidden flex flex-col justify-between"
                style={{ minHeight: 'clamp(380px, 46vh, 520px)' }}
              >
                {/* Ambient glow in card */}
                <div className="absolute -top-20 -right-20 w-56 h-56 rounded-full bg-[#C65D45]/25 blur-3xl pointer-events-none" />
                <div className="absolute -bottom-16 -left-16 w-44 h-44 rounded-full bg-[#C65D45]/15 blur-2xl pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] to-transparent pointer-events-none rounded-3xl" />

                <div className="relative z-10">
                  {/* Top Header of Card */}
                  <div className="flex items-center justify-between mb-6 sm:mb-8">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#C65D45] flex items-center justify-center text-white shadow-[0_0_28px_rgba(198,93,69,0.55)]">
                      {getIcon(currentService.icon_name)}
                    </div>

                    <div className="text-right">
                      <span className="block text-xs font-mono uppercase tracking-widest text-white/40">
                        Capability
                      </span>
                      <span className="font-pogonia text-3xl sm:text-4xl font-bold text-white/90">
                        #{activeNumber}
                      </span>
                    </div>
                  </div>

                  {/* Service Name in card */}
                  <div className="mb-6">
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#C65D45]">
                      Commercial Grade
                    </span>
                    <h4 className="font-pogonia text-2xl sm:text-3xl font-bold text-white mt-1 leading-snug">
                      {currentService.title}
                    </h4>
                  </div>

                  {/* Production Pipeline Specs */}
                  <div className="space-y-3 mb-6 sm:mb-8 pt-4 border-t border-white/10">
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="text-white/60 font-montserrat">Turnaround Window</span>
                      <span className="font-semibold text-white font-mono">
                        {currentService.turnaround || '24-48 Hours'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="text-white/60 font-montserrat">Master Export</span>
                      <span className="font-semibold text-white">4K UHD / Rec.709 & DCI-P3</span>
                    </div>

                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="text-white/60 font-montserrat">Sound Mastering</span>
                      <span className="font-semibold text-white">Stereo & True Peak Norm.</span>
                    </div>
                  </div>

                  {/* Software Stack */}
                  <div>
                    <span className="block text-[11px] font-mono uppercase tracking-wider text-white/40 mb-2">
                      Tools & Engine
                    </span>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {softwareTools.map((tool, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/15 text-[11px] sm:text-xs font-mono font-medium text-white/90"
                        >
                          {tool}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bottom Quick-Select Bar */}
                <div className="relative z-10 pt-6 mt-6 border-t border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-[#C65D45]" />
                    <span className="text-xs font-montserrat font-medium text-white/70">
                      Tailored to your brief
                    </span>
                  </div>

                  <button
                    onClick={() => handleInquire(currentService.title)}
                    className="text-xs font-montserrat font-bold text-[#C65D45] hover:text-[#e47e68] flex items-center gap-1 transition-colors uppercase tracking-wider cursor-pointer"
                  >
                    Select
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ──────────────────────────────────────────────
          BOTTOM TIMELINE BAR: Apple Keynote Style
      ────────────────────────────────────────────── */}
      <footer className="relative z-20 w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 pb-5 sm:pb-7 shrink-0">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-6 pt-3 border-t border-[#2B170F]/10">
          {/* Scroll instruction indicator */}
          <div className="hidden sm:flex items-center gap-2 text-xs font-montserrat font-medium text-[#756A62]">
            <span className="inline-block w-2 h-2 rounded-full bg-[#C65D45] animate-ping" />
            <span>Scroll down or click any step to explore capabilities</span>
          </div>

          {/* Interactive Step Navigator */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto max-w-full py-1">
            {services.map((service, i) => {
              const isSelected = activeIndex === i;
              return (
                <button
                  key={service.id || service.title}
                  onClick={() => navigateToSlide(i)}
                  aria-label={`Jump to ${service.title}`}
                  className={`group relative transition-all duration-300 rounded-full flex items-center cursor-pointer ${
                    isSelected
                      ? 'bg-[#C65D45] text-white px-3.5 sm:px-4 py-1.5 shadow-[0_2px_12px_rgba(198,93,69,0.4)]'
                      : 'bg-white/80 hover:bg-white text-[#756A62] hover:text-[#2B170F] px-2.5 py-1.5 border border-[#2B170F]/10'
                  }`}
                >
                  <span className="font-mono text-xs font-bold">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {isSelected && (
                    <span className="ml-2 font-montserrat text-xs font-semibold max-w-[140px] truncate hidden md:inline">
                      {service.title}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Micro progress line */}
          <div className="w-24 sm:w-32 h-1.5 bg-[#2B170F]/10 rounded-full overflow-hidden shrink-0 hidden md:block">
            <div
              className="h-full bg-[#C65D45] rounded-full transition-all duration-150"
              style={{ width: `${Math.max(5, Math.min(100, progress * 100))}%` }}
            />
          </div>
        </div>
      </footer>
    </section>
  );
};
