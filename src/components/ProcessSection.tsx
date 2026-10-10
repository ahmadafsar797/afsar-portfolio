import React from 'react';
import { Sparkles, MessageSquare, Scissors, RefreshCw, CheckCheck } from 'lucide-react';
import { useFadeUpOnScroll, useStaggerOnScroll } from '../hooks/useAnimations';

export const ProcessSection: React.FC = () => {
  const steps = [
    {
      number: '01',
      title: 'Brief & Story Architecture',
      subtitle: 'Aligning on rhythm, target viewer, and core emotion',
      icon: MessageSquare,
      description:
        'We review raw footage, target audience retention metrics, and creative references. I construct the timeline script, storyboard beats, and select high-energy music stems before making a single cut.',
      deliverables: ['Pacing outline', 'Music selection', 'Hook strategy'],
    },
    {
      number: '02',
      title: 'Assembly & Retention Edit',
      subtitle: 'Sculpting the narrative and kinetic transitions',
      icon: Scissors,
      description:
        'The rough cut is built with relentless attention to the first 3 seconds. Match cuts, J/L audio overlaps, kinetic speed ramps, and intentional rhythm guide the viewer through the narrative arch.',
      deliverables: ['First rough cut', 'Pacing review', 'A/B hook variants'],
    },
    {
      number: '03',
      title: 'Sound, Color & Motion',
      subtitle: 'Infusing cinematic prestige and visual polish',
      icon: RefreshCw,
      description:
        'Audio is 50% of the film. I design immersive multi-layer Foley, dialogue compression, and sub-bass risers. Using AI-powered color tools and Premiere Pro Lumetri, I grade skin tones and apply cinematic LUTs with precision.',
      deliverables: ['AI-enhanced color grade', 'Custom Foley & SFX', 'Motion graphics & MOGRTs'],
    },
    {
      number: '04',
      title: 'Feedback & Final Delivery',
      subtitle: 'Frame-accurate revisions and master ProRes delivery',
      icon: CheckCheck,
      description:
        'Using Frame.io, we review frame-by-frame notes for swift turnarounds. Once approved, you receive pristine 4K master ProRes exports, web-optimized MP4s, and localized social ratios.',
      deliverables: ['4K Master ProRes', '9:16, 1:1 & 16:9 exports', 'Clean clean-feed stems'],
    },
  ];

  const headerRef = useFadeUpOnScroll<HTMLDivElement>(0);
  const stepsRef = useStaggerOnScroll<HTMLDivElement>('.process-step', 0.1);

  return (
    <section className="py-24 md:py-36 bg-[#FFF9F2] relative overflow-hidden border-t border-[#2B170F]/10 font-montserrat">
      <div className="max-w-[1720px] 2xl:max-w-[1880px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20">
        {/* Header */}
        <div ref={headerRef} className="text-center max-w-3xl lg:max-w-4xl mx-auto mb-20">
          <div className="relative inline-flex items-center px-4 py-1.5 rounded-full bg-white/75 backdrop-blur-md border border-white/85 shadow-[0_2px_10px_rgba(43,23,15,0.06),inset_0_1px_1px_rgba(255,255,255,0.95)] overflow-hidden mb-4">
            {/* Glass reflection highlights */}
            <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/80 via-white/20 to-transparent pointer-events-none" />
            <div className="absolute -top-3 -left-4 w-12 h-16 bg-gradient-to-r from-transparent via-white/60 to-transparent rotate-25 pointer-events-none" />
            <span className="relative z-10 text-xs font-sans font-bold uppercase text-[#C65D45] tracking-normal">
              Methodical Workflow
            </span>
          </div>
          <h2 className="font-pogonia text-4xl sm:text-6xl font-bold text-[#2B170F] leading-tight mb-4">
            From Raw Footage To Viral Masterpiece
          </h2>
          <p className="text-sm sm:text-base font-medium text-[#756A62]">
            A battle-tested 4-stage post-production pipeline built for lightning turnaround, zero guesswork, and uncompromising cinematic standards.
          </p>
        </div>

        {/* 4 Process Cards */}
        <div ref={stepsRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-8 xl:gap-10 relative">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                className="process-step group relative p-8 rounded-3xl bg-[#F8F1E7] border border-[#2B170F]/10 hover:border-[#C65D45] hover:shadow-xl hover:-translate-y-2 transition-all duration-400 flex flex-col justify-between"
                style={{ willChange: 'transform' }}
              >
                <div>
                  {/* Step Number & Icon */}
                  <div className="flex items-center justify-between mb-8">
                    <span className="font-pogonia text-4xl sm:text-5xl font-bold text-[#2B170F]/20 group-hover:text-[#C65D45] transition-colors duration-300">
                      {step.number}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-[#FFF9F2] border border-[#2B170F]/10 flex items-center justify-center text-[#2B170F] group-hover:bg-[#C65D45] group-hover:text-[#2B170F] group-hover:border-[#C65D45] group-hover:scale-110 transition-all duration-300">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <h3 className="font-pogonia text-2xl font-bold text-[#2B170F] group-hover:text-[#C65D45] transition-colors mb-2">
                    {step.title}
                  </h3>
                  <p className="text-xs text-[#C65D45] font-bold uppercase tracking-wider mb-4">
                    {step.subtitle}
                  </p>
                  <p className="text-xs sm:text-sm font-medium text-[#756A62] leading-relaxed mb-6">
                    {step.description}
                  </p>
                </div>

                {/* Deliverables */}
                <div className="pt-4 border-t border-[#2B170F]/10 space-y-1.5 mt-auto">
                  {step.deliverables.map((item, dIdx) => (
                    <div key={dIdx} className="flex items-center gap-2 text-[11px] text-[#756A62] font-montserrat font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C65D45] shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
