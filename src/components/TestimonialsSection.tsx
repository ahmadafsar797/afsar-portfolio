import React, { useRef, useEffect, useState } from 'react';
import { Play, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { Testimonial } from '../types';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface TestimonialsSectionProps {
  testimonials: Testimonial[];
  onOpenLightbox: (videoUrl: string, title: string, client?: string) => void;
}

export const TestimonialsSection: React.FC<TestimonialsSectionProps> = ({ testimonials, onOpenLightbox }) => {
  const sectionRef = useRef<HTMLElement>(null);
  const sliderViewportRef = useRef<HTMLDivElement>(null);
  const sliderTrackRef = useRef<HTMLDivElement>(null);

  const [activeIndex, setActiveIndex] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Exactly the original video testimonials from database
  const totalSlides = testimonials.length;

  /* ── Master Horizontal Card Slide on Scroll Engine (Mobile & Desktop) ── */
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
          id: 'testimonials-pin-slider',
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

      // Individual cards subtle slide-in from the side as they travel horizontally
      const cards = track.querySelectorAll<HTMLElement>('.testimonial-slide-card');
      cards.forEach((card, idx) => {
        gsap.fromTo(
          card,
          { x: isMobile ? 30 : 40, opacity: idx === 0 ? 1 : 0.85 },
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
  }, [testimonials, totalSlides]);

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
    const st = ScrollTrigger.getById('testimonials-pin-slider');
    if (st) {
      const targetProgress = totalSlides > 1 ? targetIdx / (totalSlides - 1) : 0;
      const targetScrollY = st.start + targetProgress * (st.end - st.start);
      window.scrollTo({ top: targetScrollY, behavior: 'smooth' });
    }
  };

  /* ── Interactive Cursor & Touch Drag to Slide Sideways ── */
  const dragStartXRef = useRef(0);
  const dragScrollYRef = useRef(0);
  const isDraggingRef = useRef(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    setIsDragging(true);
    dragStartXRef.current = e.clientX;
    dragScrollYRef.current = window.scrollY;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - dragStartXRef.current;
    const st = ScrollTrigger.getById('testimonials-pin-slider');
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

  /* ── Mobile Touch Drag (horizontal swipe maps to vertical scroll) ── */
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!e.touches[0]) return;
    isDraggingRef.current = true;
    dragStartXRef.current = e.touches[0].clientX;
    dragScrollYRef.current = window.scrollY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current || !e.touches[0]) return;
    const deltaX = e.touches[0].clientX - dragStartXRef.current;
    const st = ScrollTrigger.getById('testimonials-pin-slider');
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

  return (
    <section
      ref={sectionRef}
      id="testimonials"
      className="h-[100dvh] min-h-[580px] max-h-[1080px] md:min-h-[620px] md:max-h-[960px] bg-[#F8F1E7] relative overflow-hidden border-t border-[#2B170F]/10 font-sans flex flex-col justify-center py-4 md:py-0"
    >
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 mb-4 sm:mb-6 md:mb-8">
        {/* Header with Navigation Controls */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="relative inline-flex items-center px-4 py-1.5 rounded-full bg-white/75 backdrop-blur-md border border-white/85 shadow-[0_2px_10px_rgba(43,23,15,0.06),inset_0_1px_1px_rgba(255,255,255,0.95)] overflow-hidden mb-2 sm:mb-3">
              <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/80 via-white/20 to-transparent pointer-events-none" />
              <div className="absolute -top-3 -left-4 w-12 h-16 bg-gradient-to-r from-transparent via-white/60 to-transparent rotate-25 pointer-events-none" />
              <span className="relative z-10 text-xs font-sans font-bold uppercase text-[#C65D45] tracking-normal">
                Client Video Testimonials
              </span>
            </div>

            <h2 className="font-pogonia text-3xl sm:text-5xl md:text-6xl font-bold text-[#2B170F] leading-tight">
              "Don't Take My Word For It."
            </h2>
          </div>

          {/* Slider Controls & Counter */}
          <div className="flex items-center gap-4 sm:gap-6">
            {/* Progress line */}
            <div className="hidden lg:flex flex-col gap-1 w-28">
              <div className="flex justify-between text-[11px] font-sans font-bold text-[#756A62]">
                <span className="text-[#C65D45]">0{activeIndex + 1}</span>
                <span>0{totalSlides}</span>
              </div>
              <div className="h-1.5 w-full bg-[#2B170F]/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#C65D45] transition-all duration-300 rounded-full"
                  style={{ width: `${Math.max(25, ((activeIndex + 1) / totalSlides) * 100)}%` }}
                />
              </div>
            </div>

            <div className="text-xs font-sans font-medium text-[#756A62] hidden sm:block">
              <span className="text-[#C65D45] font-bold">0{activeIndex + 1}</span> / 0{totalSlides}
            </div>

            {/* Arrows */}
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrev}
                disabled={activeIndex === 0}
                aria-label="Previous story"
                data-cursor="pointer"
                className="w-10 h-10 rounded-full bg-[#FFF9F2] border border-[#2B170F]/15 flex items-center justify-center text-[#2B170F] hover:bg-[#C65D45] hover:text-[#2B170F] hover:border-[#C65D45] disabled:opacity-30 disabled:hover:bg-[#FFF9F2] disabled:hover:text-[#2B170F] transition-all duration-300 shadow-sm cursor-pointer disabled:cursor-not-allowed active:scale-95"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleNext}
                disabled={activeIndex >= totalSlides - 1}
                aria-label="Next story"
                data-cursor="pointer"
                className="w-10 h-10 rounded-full bg-[#FFF9F2] border border-[#2B170F]/15 flex items-center justify-center text-[#2B170F] hover:bg-[#C65D45] hover:text-[#2B170F] hover:border-[#C65D45] disabled:opacity-30 disabled:hover:bg-[#FFF9F2] disabled:hover:text-[#2B170F] transition-all duration-300 shadow-sm cursor-pointer disabled:cursor-not-allowed active:scale-95"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Horizontal Cards Slider Viewport & Track ── */}
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
          className="flex items-stretch gap-4 sm:gap-6 md:gap-8 px-4 sm:px-6 lg:px-12 w-max will-change-transform"
        >
          {/* ONLY the original Client Video Testimonial Cards */}
          {testimonials.map((item, idx) => (
            <HorizontalTestimonialCard
              key={item.id}
              item={item}
              index={idx}
              onOpenLightbox={onOpenLightbox}
            />
          ))}
        </div>
      </div>

      {/* Mobile Hint & Pagination Dots */}
      <div className="mt-4 sm:mt-6 flex flex-col items-center justify-center gap-2 md:hidden">
        <div className="flex items-center gap-2">
          {Array.from({ length: totalSlides }).map((_, i) => (
            <button
              key={i}
              onClick={() => navigateToSlide(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                activeIndex === i ? 'w-7 bg-[#C65D45]' : 'w-2 bg-[#2B170F]/20'
              }`}
            />
          ))}
        </div>
        <p className="text-[11px] font-sans font-medium text-[#756A62]">
          Scroll down or swipe to explore client stories
        </p>
      </div>
    </section>
  );
};

/* ── Individual 9:16 Testimonial Video Card in Horizontal Track ────────────── */
interface HorizontalTestimonialCardProps {
  item: Testimonial;
  index: number;
  onOpenLightbox: (videoUrl: string, title: string, client?: string) => void;
}

const HorizontalTestimonialCard: React.FC<HorizontalTestimonialCardProps> = ({
  item,
  onOpenLightbox,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const playBtnRef = useRef<HTMLDivElement>(null);

  // Magnetic Play Button on Mouse Movement
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!playBtnRef.current || window.innerWidth < 768) return;
    const rect = playBtnRef.current.getBoundingClientRect();
    const dx = (e.clientX - (rect.left + rect.width / 2)) * 0.35;
    const dy = (e.clientY - (rect.top + rect.height / 2)) * 0.35;
    gsap.to(playBtnRef.current, { x: dx, y: dy, duration: 0.3, ease: 'power2.out' });
  };

  const handleMouseLeave = () => {
    if (!playBtnRef.current) return;
    gsap.to(playBtnRef.current, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.4)' });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="testimonial-slide-card flex-shrink-0 w-[82vw] max-w-[320px] sm:w-[310px] md:w-[340px] lg:w-[355px] rounded-3xl bg-[#FFF9F2] border border-[#2B170F]/10 hover:border-[#C65D45]/50 transition-all duration-400 overflow-hidden shadow-md hover:shadow-2xl flex flex-col justify-between group will-change-transform"
    >
      {/* 9:16 Video Container (Proportionally sized to fit inside screen height without clipping) */}
      <div
        onClick={() =>
          onOpenLightbox(item.video_url, `${item.client_name} - ${item.company}`, 'Video Testimonial')
        }
        data-cursor="play"
        className="relative w-full h-[240px] sm:h-[285px] md:h-[315px] overflow-hidden bg-black cursor-pointer group/video rounded-t-3xl"
      >
        <img
          src={
            item.thumbnail_url ||
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80'
          }
          alt={item.client_name}
          loading="lazy"
          className="w-full h-full object-cover group-hover/video:scale-105 transition-transform duration-700 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-black/50 transition-opacity duration-300 group-hover/video:opacity-90" />

        {/* Top Badge & Rating */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10 pointer-events-none">
          <span className="px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md border border-white/10 text-[10px] font-sans uppercase font-bold tracking-wider text-[#C65D45] flex items-center gap-1.5 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C65D45] animate-ping" />
            <span>Video Testimonial</span>
          </span>
          <div className="flex items-center gap-0.5 bg-black/75 px-2 py-1 rounded-full backdrop-blur-md border border-white/10 shadow-sm">
            {[...Array(item.rating || 5)].map((_, i) => (
              <Star key={i} className="w-3 h-3 text-[#C65D45] fill-current" />
            ))}
          </div>
        </div>

        {/* Magnetic Play Button */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            ref={playBtnRef}
            className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-xl border border-white/30 flex items-center justify-center text-[#FFF9F2] group-hover/video:scale-110 group-hover/video:bg-[#C65D45] group-hover/video:text-[#2B170F] group-hover/video:border-[#C65D45] transition-all duration-300 shadow-2xl"
          >
            <Play className="w-5 h-5 fill-current ml-1" />
          </div>
        </div>

        {/* Bottom Overlay with Client Details */}
        <div className="absolute bottom-0 left-0 right-0 p-4 z-10 bg-gradient-to-t from-black/95 via-black/60 to-transparent">
          <div className="text-[11px] text-[#C65D45] font-sans font-bold tracking-wider uppercase mb-0.5">
            {item.client_title || 'Client'} • {item.company}
          </div>
          <h3 className="font-pogonia text-xl sm:text-2xl font-bold text-white leading-tight">
            {item.client_name}
          </h3>
        </div>
      </div>

      {/* Written Quote & CTA Button */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <blockquote className="text-xs sm:text-sm font-sans font-medium text-[#756A62] italic leading-relaxed line-clamp-3 mb-4">
          "{item.quote || 'Afsar completely transformed our video retention and overall brand perception.'}"
        </blockquote>

        <button
          onClick={() =>
            onOpenLightbox(item.video_url, `${item.client_name} - ${item.company}`, 'Video Testimonial')
          }
          data-cursor="play"
          className="w-full py-2.5 rounded-full text-xs font-sans uppercase font-bold tracking-wider text-[#2B170F] bg-[#F8F1E7] hover:bg-[#C65D45] hover:text-[#2B170F] transition-all duration-300 flex items-center justify-center gap-2 border border-[#2B170F]/10 cursor-pointer shadow-sm hover:scale-[1.02] active:scale-95"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Watch Client Story</span>
        </button>
      </div>
    </div>
  );
};
