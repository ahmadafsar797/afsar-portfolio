import React, { useEffect, useRef } from 'react';
import { Award, Cpu, Compass } from 'lucide-react';
import { AboutData } from '../types';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface AboutSectionProps {
  about?: AboutData;
  onOpenShowreel: () => void;
}

export const AboutSection: React.FC<AboutSectionProps> = ({ about, onOpenShowreel }) => {
  const toolsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const mm = gsap.matchMedia();

    mm.add('(max-width: 767px)', () => {
      const container = toolsContainerRef.current;
      if (!container) return;

      const cards = container.querySelectorAll<HTMLElement>('.tool-stack-card');
      if (cards.length < 2) return;

      cards.forEach((card, idx) => {
        if (idx === cards.length - 1) return; // Last card doesn't get covered
        const nextCard = cards[idx + 1];

        gsap.to(card, {
          scale: 0.94,
          opacity: 0.55,
          ease: 'power1.out',
          scrollTrigger: {
            trigger: nextCard,
            start: 'top 75%',
            end: 'top 25%',
            scrub: true,
          },
        });
      });
    });

    return () => mm.revert();
  }, []);

  const tools = [
    {
      name: 'Adobe Premiere Pro',
      category: 'Primary NLE Timeline',
      description: 'High-speed multi-cam trimming, custom keyboard macros, dynamic ripple edits, and seamless pancake timeline workflows.',
      badge: 'Expert Master',
    },
    {
      name: 'Adobe After Effects',
      category: 'Motion & Visual Effects',
      description: 'Complex 2D/3D kinetic typography, planar screen replacements, speed ramps, visual match-cuts, and custom MOGRT creation.',
      badge: 'Advanced FX',
    },
    {
      name: 'AI-Powered Editing Suite',
      category: 'AI Tools & Automation',
      description: 'Expert in AI-driven workflows — scene detection, auto-reframing, generative B-roll, AI upscaling, noise reduction, and smart color matching using tools like Adobe Firefly, Runway ML, and ElevenLabs.',
      badge: 'AI Expert',
    },
    {
      name: 'Adobe Photoshop & AI',
      category: 'Asset Prep & Textures',
      description: 'Matte painting, frame cleanup, custom graphic overlays, film halation textures, and thumbnail compositing.',
      badge: 'Design Suite',
    },
    {
      name: 'Adobe Audition & iZotope',
      category: 'Audio Mastering & SFX',
      description: 'Spectral de-noise, vocal compression, transient shaping, stereo widening, and bespoke Foley layering.',
      badge: 'Audio Sculpting',
    },
    {
      name: 'Frame.io & Pro Delivery',
      category: 'Client Collaboration',
      description: 'Frame-accurate timecoded review cycles, zero confusion revisions, and lossless master codec exports.',
      badge: 'Workflow Hub',
    },
  ];

  return (
    <section
      id="about"
      style={{ overflowX: 'clip' }}
      className="py-24 md:py-36 bg-[#F8F1E7] relative border-t border-[#2B170F]/10 font-montserrat"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Story Block: Editorial Portrait & Philosophy */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center mb-24">
          {/* Portrait Image Column */}
          <div className="lg:col-span-5 relative">
            <div className="relative aspect-4/5 rounded-3xl overflow-hidden border border-[#2B170F]/10 shadow-xl bg-[#FFF9F2] group">
              <img
                src={
                  about?.avatar_url ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80'
                }
                alt="Afsar Ahmad - Video Editor"
                className="w-full h-full object-cover filter grayscale contrast-110 group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#2B170F]/60 via-transparent to-transparent" />

              {/* Floating Award / Experience Badge */}
              <div className="absolute bottom-6 left-6 right-6 p-4 rounded-2xl bg-[#FFF9F2]/95 backdrop-blur-xl border border-[#2B170F]/10 shadow-lg flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#756A62] block">Experience</span>
                  <span className="font-pogonia text-2xl font-bold text-[#2B170F]">{about?.years_experience || '2+'} Years in Post-Production</span>
                </div>
                <div className="w-10 h-10 rounded-full bg-[#C65D45]/20 flex items-center justify-center text-[#2B170F]">
                  <Award className="w-5 h-5 text-[#C65D45]" />
                </div>
              </div>
            </div>
          </div>

          {/* Editorial Bio Column */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            <div className="relative inline-flex items-center px-4 py-1.5 rounded-full bg-white/75 backdrop-blur-md border border-white/85 shadow-[0_2px_10px_rgba(43,23,15,0.06),inset_0_1px_1px_rgba(255,255,255,0.95)] overflow-hidden mb-4 w-fit">
              {/* Glass reflection highlights */}
              <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/80 via-white/20 to-transparent pointer-events-none" />
              <div className="absolute -top-3 -left-4 w-12 h-16 bg-gradient-to-r from-transparent via-white/60 to-transparent rotate-25 pointer-events-none" />
              <span className="relative z-10 text-xs font-sans font-bold uppercase text-[#C65D45] tracking-normal">
                The Creative Philosophy
              </span>
            </div>

            <h2 className="font-pogonia text-4xl sm:text-5xl lg:text-6xl font-bold text-[#2B170F] leading-[1.12] mb-6">
              {about?.headline || 'Story first. Pacing second. Effects serve the narrative.'}
            </h2>

            <p className="text-base sm:text-lg font-medium text-[#756A62] leading-relaxed mb-6">
              {about?.bio ||
                "I'm Afsar Ahmad, a freelance video editor and motion designer with over 2 years of dedicated post-production experience. I partner with ambitious creators, modern brands, and growing channels worldwide to craft videos that capture attention within the first 1.5 seconds and retain it through emotional rhythm, dynamic soundscapes, and flawless pacing."}
            </p>

            <p className="text-sm sm:text-base font-medium text-[#756A62]/80 leading-relaxed mb-8">
              {about?.philosophy ||
                'In a feed saturated with derivative templates, true engagement comes from intentional narrative tension, hyper-calibrated audio design, and color grading that elevates raw footage into a cinematic world.'}
            </p>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-6 pt-6 border-t border-[#2B170F]/10 mb-8">
              <div>
                <div className="font-pogonia text-3xl sm:text-4xl text-[#2B170F] font-bold">
                  {about?.projects_delivered || '180+'}
                </div>
                <div className="text-[10px] font-montserrat uppercase font-semibold tracking-wider text-[#756A62] mt-1">
                  Projects Delivered
                </div>
              </div>
              <div>
                <div className="font-pogonia text-3xl sm:text-4xl text-[#2B170F] font-bold">
                  50+
                </div>
                <div className="text-[10px] font-montserrat uppercase font-semibold tracking-wider text-[#756A62] mt-1">
                  Brand Partners
                </div>
              </div>
              <div>
                <div className="font-pogonia text-3xl sm:text-4xl text-[#C65D45] font-bold">
                  {about?.client_satisfaction || '99.4%'}
                </div>
                <div className="text-[10px] font-montserrat uppercase font-semibold tracking-wider text-[#756A62] mt-1">
                  On-Time Handoff
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <a
                href="#contact"
                className="px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest text-[#2B170F] bg-[#C65D45] hover:bg-[#a84d38] transition-all shadow-md shadow-[#C65D45]/20 active:scale-95"
              >
                Inquire For Your Project
              </a>
              <button
                onClick={onOpenShowreel}
                className="px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest text-[#2B170F] bg-[#FFF9F2] hover:bg-[#2B170F]/5 border border-[#2B170F]/20 transition-all shadow-sm"
              >
                Watch Master Reel
              </button>
            </div>
          </div>
        </div>

        {/* Tools & Technical Expertise Block */}
        <div className="pt-16 border-t border-[#2B170F]/10">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <div className="relative inline-flex items-center px-4 py-1.5 rounded-full bg-white/75 backdrop-blur-md border border-white/85 shadow-[0_2px_10px_rgba(43,23,15,0.06),inset_0_1px_1px_rgba(255,255,255,0.95)] overflow-hidden mb-3">
                {/* Glass reflection highlights */}
                <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/80 via-white/20 to-transparent pointer-events-none" />
                <div className="absolute -top-3 -left-4 w-12 h-16 bg-gradient-to-r from-transparent via-white/60 to-transparent rotate-25 pointer-events-none" />
                <span className="relative z-10 text-xs font-sans font-bold uppercase text-[#C65D45] tracking-normal">
                  Production Environment
                </span>
              </div>
              <h3 className="font-pogonia text-3xl sm:text-4xl font-bold text-[#2B170F]">
                Tools & Technical Mastery
              </h3>
            </div>
            <p className="text-xs sm:text-sm font-medium text-[#756A62] max-w-md">
              Industry-standard software suites configured with custom control surfaces, calibrated Rec.709 displays, and high-throughput NVMe RAID storage.
            </p>
          </div>

          <div
            ref={toolsContainerRef}
            className="flex flex-col gap-5 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6 relative pb-8 md:pb-0"
          >
            {tools.map((tool, idx) => (
              <div
                key={tool.name}
                className="tool-stack-card sticky md:static p-6 rounded-2xl bg-[#FFF9F2] border border-[#2B170F]/15 shadow-xl md:shadow-none hover:border-[#C65D45] hover:shadow-lg transition-all duration-300 group will-change-transform"
                style={{
                  top: `calc(76px + ${idx * 12}px)`,
                  zIndex: idx + 1,
                  transformOrigin: 'top center',
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#756A62]">
                    {tool.category}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#C65D45]/20 border border-[#C65D45]/30 text-[10px] font-bold uppercase tracking-wider text-[#2B170F]">
                    {tool.badge}
                  </span>
                </div>

                <h4 className="font-pogonia text-2xl font-bold text-[#2B170F] group-hover:text-[#C65D45] transition-colors mb-2">
                  {tool.name}
                </h4>

                <p className="text-xs font-medium text-[#756A62] leading-relaxed">
                  {tool.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
