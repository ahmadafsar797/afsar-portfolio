import React from 'react';
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
  ArrowRight,
  Clock,
} from 'lucide-react';
import { Service } from '../types';
import { useFadeUpOnScroll, useStaggerOnScroll } from '../hooks/useAnimations';
import { gsap } from 'gsap';

interface ServicesSectionProps {
  services: Service[];
  onSelectService?: (serviceTitle: string) => void;
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({ services, onSelectService }) => {
  const getIcon = (iconName?: string) => {
    const iconClass = "w-6 h-6 text-[#C65D45] group-hover:text-[#FFF9F2] group-active:text-[#FFF9F2] transition-colors duration-300";
    switch (iconName?.toLowerCase()) {
      case 'smartphone': return <Smartphone className={iconClass} />;
      case 'youtube': return <MonitorPlay className={iconClass} />;
      case 'flame': return <Flame className={iconClass} />;
      case 'film': return <Film className={iconClass} />;
      case 'package': return <Package className={iconClass} />;
      case 'sparkles': return <Sparkles className={iconClass} />;
      case 'palette': return <Palette className={iconClass} />;
      case 'volume2': return <Volume2 className={iconClass} />;
      case 'briefcase': return <Briefcase className={iconClass} />;
      default: return <Film className={iconClass} />;
    }
  };

  const headerRef = useFadeUpOnScroll<HTMLDivElement>(0);
  const gridRef = useStaggerOnScroll<HTMLDivElement>('.service-card', 0.07);

  // Magnetic arrow on service links
  const handleArrowMagnetic = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const arrow = e.currentTarget.querySelector('.service-arrow') as HTMLElement;
    if (!arrow) return;
    const rect = arrow.getBoundingClientRect();
    const dx = (e.clientX - (rect.left + rect.width / 2)) * 0.4;
    const dy = (e.clientY - (rect.top + rect.height / 2)) * 0.4;
    gsap.to(arrow, { x: dx, y: dy, duration: 0.25, ease: 'power2.out' });
  };
  const handleArrowLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const arrow = e.currentTarget.querySelector('.service-arrow') as HTMLElement;
    if (!arrow) return;
    gsap.to(arrow, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1,0.4)' });
  };

  return (
    <section id="services" className="py-24 md:py-36 bg-[#FFF9F2] relative overflow-hidden border-t border-[#2B170F]/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div ref={headerRef} className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <div className="relative inline-flex items-center px-4 py-1.5 rounded-full bg-white/75 backdrop-blur-md border border-white/85 shadow-[0_2px_10px_rgba(43,23,15,0.06),inset_0_1px_1px_rgba(255,255,255,0.95)] overflow-hidden mb-3">
              {/* Glass reflection highlights */}
              <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/80 via-white/20 to-transparent pointer-events-none" />
              <div className="absolute -top-3 -left-4 w-12 h-16 bg-gradient-to-r from-transparent via-white/60 to-transparent rotate-25 pointer-events-none" />
              <span className="relative z-10 text-xs font-montserrat font-bold uppercase text-[#C65D45] tracking-normal">
                Full-Stack Post-Production Capabilities
              </span>
            </div>
            <h2 className="font-pogonia text-4xl sm:text-6xl font-bold text-[#2B170F]">
              Specialized Services
            </h2>
          </div>
          <p className="text-sm font-montserrat font-medium text-[#756A62] max-w-md">
            From viral vertical reels engineered for the algorithm to broadcast-grade commercial color mastering and immersive audio soundscapes.
          </p>
        </div>

        {/* Services Grid */}
        <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {services.map((service, idx) => (
            <div
              key={service.id || idx}
              className="service-card group relative p-8 rounded-3xl bg-[#F8F1E7] border border-[#2B170F]/10 hover:border-[#C65D45] transition-all duration-500 shadow-sm hover:shadow-2xl hover:shadow-[#2B170F]/35 hover:-translate-y-2 flex flex-col justify-between overflow-hidden cursor-pointer active:scale-[0.98]"
              style={{ willChange: 'transform' }}
            >
              {/* Chocolate Background Layer — smoothly envelopes card on hover & active */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-[#2B170F] via-[#24130C] to-[#180D07] opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-500 pointer-events-none" />

              {/* Ambient Copper Lighting Effect inside card */}
              <div className="absolute -top-12 -right-12 w-40 h-40 bg-[#C65D45]/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-500 pointer-events-none" />

              <div className="relative z-10">
                {/* Icon & Turnaround */}
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-[#FFF9F2] border border-[#2B170F]/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-[#C65D45] group-hover:border-[#C65D45] group-active:bg-[#C65D45] transition-all duration-300 shadow-sm group-hover:shadow-[0_0_20px_rgba(198,93,69,0.5)]">
                    {getIcon(service.icon_name)}
                  </div>
                  {service.turnaround && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF9F2] border border-[#2B170F]/10 text-[11px] font-montserrat font-medium text-[#756A62] group-hover:bg-white/10 group-hover:border-white/15 group-hover:text-[#FFF9F2] group-active:bg-white/10 group-active:text-[#FFF9F2] transition-all duration-300">
                      <Clock className="w-3 h-3 text-[#C65D45] group-hover:text-[#FFA07A] transition-colors" />
                      <span>{service.turnaround}</span>
                    </span>
                  )}
                </div>

                <h3 className="font-pogonia text-2xl sm:text-3xl font-bold text-[#2B170F] group-hover:text-[#FFF9F2] group-active:text-[#FFF9F2] transition-colors duration-300 mb-3 leading-snug">
                  {service.title}
                </h3>
                <p className="text-xs sm:text-sm font-montserrat font-medium text-[#756A62] group-hover:text-[#FFF9F2]/80 group-active:text-[#FFF9F2]/80 transition-colors duration-300 leading-relaxed mb-6">
                  {service.short_description}
                </p>

                {service.deliverables && (
                  <div className="pt-4 border-t border-[#2B170F]/10 group-hover:border-white/15 group-active:border-white/15 transition-colors duration-300 mb-6">
                    <span className="text-[10px] font-montserrat font-bold uppercase tracking-wider text-[#756A62]/60 group-hover:text-[#C65D45] group-active:text-[#C65D45] transition-colors duration-300 block mb-2">
                      Key Deliverables
                    </span>
                    <p className="text-xs text-[#756A62] group-hover:text-[#FFF9F2]/80 group-active:text-[#FFF9F2]/80 font-montserrat font-medium leading-relaxed transition-colors duration-300">
                      {service.deliverables}
                    </p>
                  </div>
                )}
              </div>

              {/* Action Link */}
              <a
                href="#contact"
                onClick={() => onSelectService && onSelectService(service.title)}
                onMouseMove={handleArrowMagnetic}
                onMouseLeave={handleArrowLeave}
                data-cursor="open"
                className="relative z-10 inline-flex items-center justify-between text-xs font-montserrat uppercase font-bold tracking-wider text-[#2B170F] group-hover:text-[#FFF9F2] group-active:text-[#FFF9F2] transition-all duration-300 pt-3 border-t border-[#2B170F]/10 group-hover:border-white/15 group-active:border-white/15 mt-auto"
              >
                <span>Book This Service</span>
                <ArrowRight className="service-arrow w-3.5 h-3.5 text-[#C65D45] group-hover:text-[#FFA07A] group-hover:translate-x-1 transition-all" />
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
