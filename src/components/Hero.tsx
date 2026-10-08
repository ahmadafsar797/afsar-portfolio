import React, { useRef, useEffect } from 'react';
import { ArrowUpRight, Play } from 'lucide-react';
import { SettingsData, AboutData } from '../types';
import { gsap } from 'gsap';

interface HeroProps {
  settings?: SettingsData;
  about?: AboutData | null;
  onWatchShowreel?: () => void;
}

export const Hero: React.FC<HeroProps> = ({ settings, about, onWatchShowreel }) => {
  const heroRef = useRef<HTMLElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const leftColRef = useRef<HTMLDivElement>(null);
  const centerColRef = useRef<HTMLDivElement>(null);
  const rightColRef = useRef<HTMLDivElement>(null);
  const archRef = useRef<HTMLDivElement>(null);
  const portraitRef = useRef<HTMLImageElement>(null);
  const ctaPillRef = useRef<HTMLDivElement>(null);
  const arrowRef = useRef<HTMLDivElement>(null);

  // Content configuration with defaults matching reference layout
  const greeting = settings?.hero_greeting || 'Hello!';
  const heroName = settings?.hero_name || 'Afsar';
  const heroRole = settings?.hero_role || 'Video Editor';
  const quoteText =
    settings?.hero_quote ||
    "Afsar's exceptional video editing ensured our website's success. Highly recommended!";
  const clientsCount =
    settings?.hero_clients_count || about?.projects_delivered || '450+';
  const clientsLabel = settings?.hero_clients_label || 'Client Served';
  const experienceYears =
    settings?.hero_experience_years ||
    (about?.years_experience ? `${about.years_experience} Years` : '10 Years');
  const experienceLabel = settings?.hero_experience_label || 'Experts';
  const characterImg =
    settings?.hero_character_image_url ||
    '/images/hero-character.png';
  const archColor = settings?.hero_arch_color || '#FF5023';

  // Background Video Support (preserved from settings)
  const hasBgVideo = Boolean(
    settings?.hero_bg_video_url && settings?.hero_bg_video_enabled !== '0'
  );
  const videoOpacity = Number(settings?.hero_bg_video_opacity ?? '75') / 100;
  const overlayStyle = settings?.hero_bg_video_overlay || 'warm';
  const overlayOpacity = Number(settings?.hero_bg_video_overlay_opacity ?? '65') / 100;
  const videoBlur = Number(settings?.hero_bg_video_blur ?? '0');

  // Entrance animations
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: 0.15 });

      // Initial positions
      gsap.set([badgeRef.current, titleRef.current], { opacity: 0, y: 24 });
      if (archRef.current) gsap.set(archRef.current, { scale: 0.85, opacity: 0, transformOrigin: 'bottom center' });
      if (portraitRef.current) gsap.set(portraitRef.current, { y: 40, opacity: 0 });
      if (ctaPillRef.current) gsap.set(ctaPillRef.current, { scale: 0.8, opacity: 0 });
      if (arrowRef.current) gsap.set(arrowRef.current, { scale: 0, opacity: 0, rotate: -20 });
      if (leftColRef.current) gsap.set(leftColRef.current, { x: -35, opacity: 0 });
      if (rightColRef.current) gsap.set(rightColRef.current, { x: 35, opacity: 0 });

      tl.to(badgeRef.current, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }, 0)
        .to(titleRef.current, { opacity: 1, y: 0, duration: 0.65, ease: 'power3.out' }, 0.12)
        .to(archRef.current, { opacity: 1, scale: 1, duration: 0.75, ease: 'back.out(1.4)' }, 0.22)
        .to(portraitRef.current, { opacity: 1, y: 0, duration: 0.85, ease: 'power3.out' }, 0.3)
        .to(leftColRef.current, { opacity: 1, x: 0, duration: 0.65, ease: 'power3.out' }, 0.45)
        .to(rightColRef.current, { opacity: 1, x: 0, duration: 0.65, ease: 'power3.out' }, 0.45)
        .to(ctaPillRef.current, { opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(2)' }, 0.55)
        .to(arrowRef.current, { opacity: 1, scale: 1, rotate: 0, duration: 0.5, ease: 'back.out(2.5)' }, 0.68);
    }, heroRef);

    return () => ctx.revert();
  }, []);

  // Subtle 3D mouse parallax on desktop
  const handleHeroMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (window.innerWidth < 1024) return;
    const hero = heroRef.current;
    if (!hero) return;
    const rect = hero.getBoundingClientRect();
    const xPct = (e.clientX - rect.left) / rect.width - 0.5;
    const yPct = (e.clientY - rect.top) / rect.height - 0.5;

    if (portraitRef.current) {
      gsap.to(portraitRef.current, {
        x: xPct * 16,
        y: yPct * 10,
        duration: 0.5,
        ease: 'power2.out',
      });
    }
    if (archRef.current) {
      gsap.to(archRef.current, {
        x: -xPct * 8,
        y: -yPct * 6,
        duration: 0.7,
        ease: 'power2.out',
      });
    }
  };

  const handleHeroMouseLeave = () => {
    if (portraitRef.current) {
      gsap.to(portraitRef.current, { x: 0, y: 0, duration: 0.7, ease: 'power3.out' });
    }
    if (archRef.current) {
      gsap.to(archRef.current, { x: 0, y: 0, duration: 0.7, ease: 'power3.out' });
    }
  };

  return (
    <section
      ref={heroRef}
      id="home"
      onMouseMove={handleHeroMouseMove}
      onMouseLeave={handleHeroMouseLeave}
      className="relative w-full min-h-screen bg-white text-[#1A1A1A] flex flex-col justify-between overflow-hidden font-sans select-none transition-colors duration-500 pt-24 sm:pt-28 md:pt-32 pb-12 sm:pb-16"
    >
      {/* Optional Fullscreen Video Background if configured in settings */}
      {hasBgVideo && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover transition-opacity duration-700"
            style={{
              opacity: videoOpacity,
              filter: videoBlur > 0 ? `blur(${videoBlur}px)` : undefined,
            }}
            src={settings?.hero_bg_video_url}
          />
          {overlayStyle === 'dark' ? (
            <div
              className="absolute inset-0 bg-black/80 pointer-events-none"
              style={{ opacity: overlayOpacity }}
            />
          ) : overlayStyle === 'none' ? null : (
            <div
              className="absolute inset-0 bg-white/85 pointer-events-none"
              style={{ opacity: overlayOpacity }}
            />
          )}
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10 flex-1 flex flex-col justify-center">
        
        {/* 1. TOP HEADER: "Hello!" pill + Centered Large Title */}
        <div className="flex flex-col items-center text-center mb-6 sm:mb-8 md:mb-10">
          
          {/* Hello! Badge with 3 Orange Sparkle Rays */}
          <div ref={badgeRef} className="relative inline-flex items-center mb-3 sm:mb-4">
            <div className="px-4 sm:px-5 py-1 sm:py-1.5 rounded-full border border-neutral-300 bg-white/95 shadow-sm text-xs sm:text-sm font-semibold text-[#1A1A1A] tracking-wide">
              {greeting}
            </div>

            {/* Sparkle rays (matching reference image) */}
            <svg
              className="absolute -top-3 sm:-top-3.5 -right-3 sm:-right-3.5 w-5 h-5 sm:w-6 sm:h-6 text-[#FF5023]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
            >
              <line x1="12" y1="3" x2="12" y2="7" />
              <line x1="4" y1="6" x2="8" y2="9" />
              <line x1="20" y1="6" x2="16" y2="9" />
            </svg>
          </div>

          {/* Main Headline */}
          <h1
            ref={titleRef}
            data-font="hero-title"
            className="text-4xl sm:text-6xl md:text-7xl lg:text-[76px] font-bold text-[#1A1A1A] tracking-[-0.03em] leading-[1.1] sm:leading-[1.08]"
          >
            I'm <span style={{ color: archColor }}>{heroName},</span>
            <br />
            <span>{heroRole}</span>
          </h1>
        </div>

        {/* 2. THREE-COLUMN HERO BODY */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-4 items-center w-full max-w-6xl mx-auto">
          
          {/* LEFT COLUMN: Testimonial Quote & Client Served */}
          <div
            ref={leftColRef}
            className="order-2 lg:order-1 lg:col-span-3 flex flex-col items-start justify-center text-left"
          >
            {/* Big Elegant Quotation Mark */}
            <div className="text-5xl sm:text-6xl font-serif text-[#1A1A1A] font-bold leading-none mb-2 select-none">
              “
            </div>

            {/* Testimonial Quote Snippet */}
            <p className="text-xs sm:text-sm text-[#4A4A4A] font-medium leading-relaxed max-w-[240px] mb-6 sm:mb-8">
              {quoteText}
            </p>

            {/* 450+ Client Served */}
            <div>
              <div className="text-3xl sm:text-4xl font-extrabold text-[#1A1A1A] tracking-tight">
                {clientsCount}
              </div>
              <div className="text-xs sm:text-sm font-medium text-[#71717A] mt-1">
                {clientsLabel}
              </div>
            </div>
          </div>

          {/* CENTER COLUMN: Orange Arch + Portrait + Dual Pill Button + Arrow */}
          <div
            ref={centerColRef}
            className="order-1 lg:order-2 lg:col-span-6 flex flex-col items-center justify-end relative pb-6 sm:pb-8"
          >
            <div className="relative w-full max-w-[360px] sm:max-w-[440px] md:max-w-[480px] flex flex-col items-center justify-end">
              
              {/* Vibrant Orange Arch Dome Backdrop */}
              <div
                ref={archRef}
                className="w-[260px] sm:w-[340px] md:w-[390px] h-[260px] sm:h-[330px] md:h-[380px] rounded-t-full shadow-2xl relative overflow-hidden"
                style={{
                  backgroundColor: archColor,
                  boxShadow: `0 24px 60px ${archColor}40`,
                }}
              />

              {/* Person Cutout Portrait Image */}
              <div className="absolute inset-0 flex items-end justify-center pointer-events-none">
                <img
                  ref={portraitRef}
                  src={characterImg}
                  alt={`${heroName} - ${heroRole}`}
                  className="w-auto max-h-[380px] sm:max-h-[460px] md:max-h-[510px] object-contain drop-shadow-2xl select-none"
                  style={{
                    filter: 'drop-shadow(0 16px 24px rgba(0, 0, 0, 0.18))',
                  }}
                />
              </div>

              {/* Decorative Hand-Drawn Doodle Stars on Character Shoulder */}
              <div className="absolute top-[42%] right-[14%] sm:right-[16%] z-15 pointer-events-none text-[#1A1A1A]">
                <svg className="w-5 h-5 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2.2">
                  <path d="M12 2 L14 9 L21 11 L15 15 L17 22 L12 18 L7 22 L9 15 L3 11 L10 9 Z" />
                </svg>
              </div>
              <div className="absolute top-[48%] right-[10%] sm:right-[12%] z-15 pointer-events-none text-[#1A1A1A]">
                <svg className="w-3.5 h-3.5 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2.2">
                  <path d="M12 2 L14 9 L21 11 L15 15 L17 22 L12 18 L7 22 L9 15 L3 11 L10 9 Z" />
                </svg>
              </div>

              {/* Floating Dual Pill CTA Button Group */}
              <div
                ref={ctaPillRef}
                className="relative z-30 mt-[-24px] sm:mt-[-28px] inline-flex items-center"
              >
                {/* Curved Arrow Doodle pointing to Portfolio Button */}
                <div
                  ref={arrowRef}
                  className="absolute -left-12 sm:-left-16 bottom-1 sm:bottom-2 pointer-events-none"
                >
                  <svg
                    className="w-11 sm:w-14 h-8 sm:h-10 text-[#1A1A1A] fill-none stroke-current -rotate-6"
                    viewBox="0 0 60 45"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M 8,4 C 6,24 16,36 46,34" />
                    <path d="M 37,27 L 47,34 L 38,41" />
                  </svg>
                </div>

                {/* Pill Container */}
                <div className="inline-flex items-center p-1.5 rounded-full bg-white border border-neutral-300 shadow-[0_14px_36px_rgba(0,0,0,0.14)] gap-1.5">
                  {/* Portfolio ↗ Button */}
                  <a
                    href="#reels"
                    data-cursor="open"
                    className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-full text-white font-bold text-xs sm:text-sm tracking-wide flex items-center gap-1.5 shadow-md hover:brightness-110 active:scale-95 transition-all duration-200"
                    style={{ backgroundColor: archColor }}
                  >
                    <span>Portfolio</span>
                    <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                  </a>

                  {/* Hire Me Button */}
                  <a
                    href="#contact"
                    data-cursor="open"
                    className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-full bg-white text-[#1A1A1A] hover:text-black font-bold text-xs sm:text-sm tracking-wide border border-neutral-300 hover:border-neutral-900 active:scale-95 transition-all duration-200"
                  >
                    Hire Me
                  </a>

                  {/* Subtle Showreel Play trigger if configured */}
                  {onWatchShowreel && (
                    <button
                      type="button"
                      onClick={onWatchShowreel}
                      className="p-2.5 rounded-full bg-neutral-100 hover:bg-neutral-200 text-[#1A1A1A] transition-colors"
                      title="Watch Showreel"
                    >
                      <Play className="w-3.5 h-3.5 fill-current text-[#1A1A1A]" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: 5 Stars, 10 Years Experts & Underline */}
          <div
            ref={rightColRef}
            className="order-3 lg:col-span-3 flex flex-col items-start lg:items-end justify-center text-left lg:text-right"
          >
            {/* 5 Orange Stars */}
            <div className="flex items-center gap-1 mb-2 sm:mb-3">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className="w-5 h-5 fill-current"
                  style={{ color: archColor }}
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>

            {/* 10 Years */}
            <div className="text-3xl sm:text-4xl font-extrabold text-[#1A1A1A] tracking-tight">
              {experienceYears}
            </div>

            {/* Experts */}
            <div className="text-xs sm:text-sm font-medium text-[#71717A] mt-1">
              {experienceLabel}
            </div>

            {/* Solid Horizontal Accent Line (matching reference) */}
            <div className="w-24 sm:w-28 h-0.5 bg-[#1A1A1A] mt-4" />
          </div>

        </div>
      </div>
    </section>
  );
};
