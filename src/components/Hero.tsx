import React, { useRef, useEffect } from 'react';
import { Play, ArrowUpRight } from 'lucide-react';
import { SettingsData } from '../types';
import { gsap } from 'gsap';

interface HeroProps {
  settings?: SettingsData;
  onWatchShowreel: () => void;
}

export const Hero: React.FC<HeroProps> = ({ settings, onWatchShowreel }) => {
  const heroRef = useRef<HTMLElement>(null);
  const tagRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const shapeRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLAnchorElement>(null);
  const floatRef1 = useRef<HTMLDivElement>(null);
  const floatRef2 = useRef<HTMLDivElement>(null);
  const playBtnRef = useRef<HTMLButtonElement>(null);

  // Cinematic Hero entrance
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: 0.1 });

      // Initial clean hidden states
      gsap.set([tagRef.current, headlineRef.current, subtitleRef.current, ctaRef.current], {
        opacity: 0,
        y: 28,
      });
      if (shapeRef.current) gsap.set(shapeRef.current, { scale: 0.84, opacity: 0 });
      if (imageRef.current) gsap.set(imageRef.current, { y: 36, opacity: 0, scale: 1.05 });
      if (badgeRef.current) gsap.set(badgeRef.current, { scale: 0, rotate: -35, opacity: 0 });
      if (floatRef1.current) gsap.set(floatRef1.current, { x: -30, opacity: 0 });
      if (floatRef2.current) gsap.set(floatRef2.current, { x: 30, opacity: 0 });

      tl.to(shapeRef.current, { scale: 1, opacity: 1, duration: 0.85, ease: 'power3.out' }, 0)
        .to(imageRef.current, { y: 0, opacity: 1, scale: 1, duration: 0.95, ease: 'power3.out' }, 0.12)
        .to(tagRef.current, { y: 0, opacity: 1, duration: 0.55, ease: 'power3.out' }, 0.18)
        .to(headlineRef.current, { y: 0, opacity: 1, duration: 0.75, ease: 'power3.out' }, 0.26)
        .to(subtitleRef.current, { y: 0, opacity: 1, duration: 0.65, ease: 'power3.out' }, 0.42)
        .to(ctaRef.current, { y: 0, opacity: 1, duration: 0.55, ease: 'power3.out' }, 0.55)
        .to(badgeRef.current, { scale: 1, rotate: 0, opacity: 1, duration: 0.7, ease: 'back.out(2)' }, 0.62)
        .to(floatRef1.current, { x: 0, opacity: 1, duration: 0.55, ease: 'power3.out' }, 0.7)
        .to(floatRef2.current, { x: 0, opacity: 1, duration: 0.55, ease: 'power3.out' }, 0.76);

      // Continuous subtle floating tags loop
      [floatRef1, floatRef2].forEach((r, i) => {
        if (!r.current) return;
        gsap.to(r.current, {
          y: i === 0 ? -9 : 8,
          duration: 2.4 + i * 0.4,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: 1.2 + i * 0.3,
        });
      });
    }, heroRef);

    return () => ctx.revert();
  }, []);

  // Subtle 3D mouse depth parallax
  const handleHeroMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (window.innerWidth < 1024) return;
    const hero = heroRef.current;
    if (!hero) return;
    const rect = hero.getBoundingClientRect();
    const xPct = (e.clientX - rect.left) / rect.width - 0.5;
    const yPct = (e.clientY - rect.top) / rect.height - 0.5;

    if (imageRef.current) {
      gsap.to(imageRef.current, {
        x: xPct * 18,
        y: yPct * 12,
        duration: 0.6,
        ease: 'power2.out',
      });
    }
    if (shapeRef.current) {
      gsap.to(shapeRef.current, {
        x: -xPct * 14,
        y: -yPct * 10,
        duration: 0.8,
        ease: 'power2.out',
      });
    }
  };

  const handleHeroMouseLeave = () => {
    if (imageRef.current) {
      gsap.to(imageRef.current, { x: 0, y: 0, duration: 0.8, ease: 'power3.out' });
    }
    if (shapeRef.current) {
      gsap.to(shapeRef.current, { x: 0, y: 0, duration: 0.8, ease: 'power3.out' });
    }
  };

  // Magnetic play button
  const handlePlayMagnetic = (e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = playBtnRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) * 0.38;
    const dy = (e.clientY - cy) * 0.38;
    gsap.to(btn, { x: dx, y: dy, scale: 1.08, duration: 0.25, ease: 'power2.out' });
  };

  const handlePlayLeave = () => {
    if (!playBtnRef.current) return;
    gsap.to(playBtnRef.current, { x: 0, y: 0, scale: 1, duration: 0.55, ease: 'elastic.out(1, 0.4)' });
  };

  return (
    <section
      ref={heroRef}
      id="home"
      onMouseMove={handleHeroMouseMove}
      onMouseLeave={handleHeroMouseLeave}
      className="relative w-full min-h-[100dvh] lg:h-screen lg:max-h-[1080px] flex flex-col justify-between bg-[#F8F1E7] overflow-hidden font-sans select-none"
    >
      {/* Subtle Demo Background Grid & Geometric Rings */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute top-16 left-10 w-80 h-80 rounded-full border border-[#2B170F]/10" />
        <div className="absolute top-32 right-16 w-[440px] h-[440px] rounded-full border border-[#2B170F]/10" />
        <div
          className="w-full h-full"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(43, 23, 15, 0.06) 1px, transparent 0)',
            backgroundSize: '36px 36px',
          }}
        />
      </div>

      {/* Main Hero Body */}
      <div className="flex-1 flex items-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-28 sm:pt-32 lg:pt-20 pb-12 sm:pb-16 lg:pb-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center w-full">
          {/* Left Column */}
          <div className="lg:col-span-7 flex flex-col items-start text-left z-20">
            {/* Bounding-box tag */}
            <div
              ref={tagRef}
              className="relative inline-flex items-center px-3.5 py-1 border border-[#C65D45] bg-[#FFF9F2] rounded-sm text-xs font-sans font-semibold text-[#2B170F] shadow-sm mb-4 select-none"
            >
              <span className="absolute -top-1 -left-1 w-2 h-2 bg-[#C65D45] border border-[#FFF9F2]" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#C65D45] border border-[#FFF9F2]" />
              <span className="absolute -bottom-1 -left-1 w-2 h-2 bg-[#C65D45] border border-[#FFF9F2]" />
              <span className="absolute -bottom-1 -right-1 w-2 h-2 bg-[#C65D45] border border-[#FFF9F2]" />
              <span>Hello There!</span>
            </div>

            {/* Main Headline */}
            <h1
              ref={headlineRef}
              data-font="hero-title"
              className="font-hero-title font-pogonia text-3xl sm:text-5xl md:text-6xl lg:text-6xl xl:text-7xl font-bold leading-[1.24] sm:leading-[1.12] lg:leading-[1.08] text-[#2B170F] tracking-tight mb-4"
            >
              I'm{' '}
              <span className="text-[#C65D45] underline decoration-[#C65D45] decoration-2 sm:decoration-4 underline-offset-[3px] sm:underline-offset-6 lg:underline-offset-8">
                Afsar Ahmad,
              </span>
              <br />
              Video Editor
              <br />
              Based in Mumbai.
            </h1>

            {/* Subtitle */}
            <p
              ref={subtitleRef}
              className="font-sans text-xs sm:text-sm md:text-base text-[#756A62] max-w-md xl:max-w-lg leading-relaxed mb-6 font-medium"
            >
              {settings?.hero_subtitle ||
                "I'm a dedicated Video Editor with 2+ years of hands-on experience, collaborating with high-retention creators, commercial brands, and ambitious channels worldwide."}
            </p>

            {/* CTAs */}
            <div ref={ctaRef} className="flex flex-wrap items-center gap-3 sm:gap-5">
              {/* Luxury Tactile Switch Pill Button (from reference design) */}
              <div className="relative inline-flex items-center rounded-full p-1 sm:p-1.5 bg-[#180E09] border border-[#2B170F]/40 shadow-[inset_0_3px_8px_rgba(0,0,0,0.7),inset_0_-1px_2px_rgba(255,255,255,0.08),0_8px_24px_rgba(43,23,15,0.28)] group select-none transition-all duration-300 hover:shadow-[inset_0_3px_8px_rgba(0,0,0,0.7),0_8px_28px_rgba(198,93,69,0.35)]">
                {/* Active Colored Track (Left Side) */}
                <a
                  href="#reels"
                  data-cursor="open"
                  data-font="cta"
                  className="font-cta group/explore relative z-10 px-5 sm:px-6 py-2.5 sm:py-3 rounded-l-full bg-gradient-to-r from-[#C65D45] via-[#D8684F] to-[#E2725B] text-[#FFF9F2] font-sans font-black text-xs uppercase tracking-wide shadow-[inset_0_1px_2px_rgba(255,255,255,0.45),0_0_16px_rgba(198,93,69,0.35)] hover:brightness-110 active:scale-98 transition-all duration-200 flex items-center gap-2"
                >
                  <span className="absolute inset-0 rounded-l-full overflow-hidden pointer-events-none">
                    <span className="absolute inset-0 -translate-x-full group-hover/explore:translate-x-full group-active/explore:translate-x-full transition-transform duration-500 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
                  </span>
                  <span className="relative">Explore Portfolio</span>
                </a>

                {/* Tactile 3D Slider Knob with Glowing LED Indicator (Right Side) */}
                <button
                  ref={playBtnRef}
                  onClick={onWatchShowreel}
                  onMouseMove={handlePlayMagnetic}
                  onMouseLeave={handlePlayLeave}
                  data-cursor="play"
                  data-font="cta"
                  className="relative z-10 ml-1 px-4 sm:px-5 py-2.5 sm:py-3 rounded-full bg-gradient-to-b from-[#341C13] via-[#24130C] to-[#160B06] border border-white/20 text-[#FFF9F2] flex items-center gap-3 shadow-[-4px_0_12px_rgba(0,0,0,0.55),0_4px_10px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.25)] group-hover:shadow-[-6px_0_16px_rgba(0,0,0,0.65),0_6px_14px_rgba(0,0,0,0.7),0_0_20px_rgba(198,93,69,0.3)] group-hover:border-[#C65D45]/60 transition-all duration-300 cursor-pointer active:scale-95"
                  title="Watch Master Showreel"
                  aria-label="Watch Master Showreel"
                >
                  <Play className="w-3.5 h-3.5 fill-current text-white/95 ml-0.5" />
                </button>
              </div>

              {/* Hire Me Secondary Tactile Pill Button */}
              <a
                href="#contact"
                data-cursor="open"
                data-font="cta"
                className="font-cta group/hire relative px-6 sm:px-7 py-3.5 sm:py-4 rounded-full bg-gradient-to-b from-[#28150D] via-[#1E0F09] to-[#140A06] text-[#FFF9F2] font-sans font-black text-xs uppercase tracking-wide border border-[#2B170F]/50 shadow-[0_4px_14px_rgba(0,0,0,0.25),inset_0_1px_1px_rgba(255,255,255,0.15)] hover:border-[#C65D45] hover:shadow-[0_4px_22px_rgba(198,93,69,0.45)] hover:scale-105 active:scale-95 transition-all duration-300"
              >
                <span className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
                  <span className="absolute inset-0 -translate-x-full group-hover/hire:translate-x-full group-active/hire:translate-x-full transition-transform duration-500 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                </span>
                <span className="relative">Hire Me</span>
              </a>
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-5 relative flex items-end justify-center min-h-[300px] sm:min-h-[400px] lg:min-h-[580px] mt-4 lg:mt-0">
            {/* Ambient soft translucent glow behind circle */}
            <div
              className="absolute top-[40%] sm:top-[42%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[270px] sm:w-[370px] md:w-[430px] lg:w-[460px] h-[270px] sm:h-[370px] md:h-[430px] lg:h-[460px] bg-gradient-to-tr from-[#C65D45]/30 to-[#ffba3b]/25 rounded-full blur-2xl pointer-events-none"
              style={{
                maskImage: 'linear-gradient(to bottom, black 50%, transparent 95%)',
                WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent 95%)',
              }}
            />

            {/* Proper Circle Shape with Transparent Gradient */}
            <div
              ref={shapeRef}
              className="absolute top-[40%] sm:top-[42%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[240px] sm:w-[330px] md:w-[390px] lg:w-[420px] h-[240px] sm:h-[330px] md:h-[390px] lg:h-[420px] bg-gradient-to-tr from-[#C65D45] via-[#df674d] to-[#ffba3b] rounded-full shadow-2xl shadow-[#C65D45]/30 pointer-events-none will-change-transform"
              style={{
                maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 45%, rgba(0,0,0,0) 92%)',
                WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 45%, rgba(0,0,0,0) 92%)',
              }}
            />

            {/* Subtle contour ring framing the circle */}
            <div
              className="absolute top-[40%] sm:top-[42%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[270px] sm:w-[370px] md:w-[430px] lg:w-[460px] h-[270px] sm:h-[370px] md:h-[430px] lg:h-[460px] rounded-full border border-[#2B170F]/15 pointer-events-none"
              style={{
                maskImage: 'linear-gradient(to bottom, black 45%, transparent 92%)',
                WebkitMaskImage: 'linear-gradient(to bottom, black 45%, transparent 92%)',
              }}
            />

            {/* Character image (Original hash and file untouched) */}
            <div ref={imageRef} className="relative z-10 w-full flex items-end justify-center will-change-transform">
              <img
                src="/images/hero-character.png"
                alt="Afsar Ahmad - Professional Video Editor"
                className="max-h-[38vh] sm:max-h-[50vh] md:max-h-[60vh] lg:max-h-[64vh] xl:max-h-[68vh] w-auto object-contain filter drop-shadow-2xl select-none pointer-events-none transition-transform duration-500 hover:scale-[1.02]"
              />
            </div>

            {/* Hire Me badge */}
            <a
              ref={badgeRef}
              href="#contact"
              data-cursor="open"
              className="absolute top-2 sm:top-4 right-1 sm:-right-2 z-20 w-20 h-20 sm:w-24 sm:h-24 md:w-26 md:h-26 rounded-full bg-[#2B170F] border-2 border-[#FFF9F2] shadow-2xl flex items-center justify-center cursor-pointer group hover:scale-110 active:scale-95 transition-transform duration-300"
              title="Hire Me"
            >
              <svg className="absolute inset-0 w-full h-full animate-spin-slow pointer-events-none" viewBox="0 0 100 100">
                <path
                  id="hireCirclePath"
                  d="M 50, 50 m -37, 0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0"
                  fill="none"
                />
                <text className="text-[9.5px] font-sans font-bold fill-[#C65D45] uppercase tracking-[0.16em]">
                  <textPath href="#hireCirclePath" startOffset="0%">
                    • HIRE ME • HIRE ME • HIRE ME •
                  </textPath>
                </text>
              </svg>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#C65D45] text-[#2B170F] flex items-center justify-center shadow-inner group-hover:scale-110 group-hover:rotate-45 transition-transform duration-300">
                <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
              </div>
            </a>

            {/* Floating tag 1 */}
            <div ref={floatRef1} className="absolute bottom-10 -left-3 sm:left-1 z-20 flex items-start gap-1 drop-shadow-xl will-change-transform">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#2B170F] fill-current -rotate-12 drop-shadow" viewBox="0 0 24 24">
                <path d="M4 0l16 12.279-6.951 1.17 4.325 8.817-3.596 1.734-4.35-8.879-5.428 5.428z" />
              </svg>
              <div className="bg-[#2B170F] text-[#FFF9F2] px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-sans font-semibold border border-white/20 shadow-md">
                Video Editor
              </div>
            </div>

            {/* Floating tag 2 */}
            <div ref={floatRef2} className="absolute top-[48%] sm:top-[50%] -right-2 sm:right-0 z-20 flex items-start gap-1 drop-shadow-xl will-change-transform">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#C65D45] fill-current -rotate-12 drop-shadow" viewBox="0 0 24 24">
                <path d="M4 0l16 12.279-6.951 1.17 4.325 8.817-3.596 1.734-4.35-8.879-5.428 5.428z" />
              </svg>
              <div className="bg-[#C65D45] text-[#2B170F] px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-sans font-bold border border-white/40 shadow-md">
                Motion Designer
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};


