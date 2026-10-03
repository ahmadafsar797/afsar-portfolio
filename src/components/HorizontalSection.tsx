import React, { useRef } from 'react';
import { Play, Clock, Calendar } from 'lucide-react';
import { HorizontalVideo } from '../types';
import { gsap } from 'gsap';
import { useFadeUpOnScroll, useRevealOnScroll } from '../hooks/useAnimations';
import { VideoAutoThumbnail } from './VideoAutoThumbnail';

interface HorizontalSectionProps {
  videos: HorizontalVideo[];
  onOpenLightbox: (videoUrl: string, title: string, client?: string, category?: string) => void;
}

export const HorizontalSection: React.FC<HorizontalSectionProps> = ({ videos, onOpenLightbox }) => {
  const headerRef = useFadeUpOnScroll<HTMLDivElement>(0);

  return (
    <section id="horizontal-work" className="py-24 md:py-36 bg-[#FFF9F2] relative overflow-hidden border-t border-[#2B170F]/10 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div ref={headerRef} className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <div className="relative inline-flex items-center px-4 py-1.5 rounded-full bg-white/75 backdrop-blur-md border border-white/85 shadow-[0_2px_10px_rgba(43,23,15,0.06),inset_0_1px_1px_rgba(255,255,255,0.95)] overflow-hidden mb-3">
              {/* Glass reflection highlights */}
              <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/80 via-white/20 to-transparent pointer-events-none" />
              <div className="absolute -top-3 -left-4 w-12 h-16 bg-gradient-to-r from-transparent via-white/60 to-transparent rotate-25 pointer-events-none" />
              <span className="relative z-10 text-xs font-sans font-bold uppercase text-[#C65D45] tracking-normal">
                Cinematic 16:9 Productions
              </span>
            </div>
            <h2 className="font-pogonia text-4xl sm:text-6xl font-bold text-[#2B170F]">
              Horizontal & Long-Form Work
            </h2>
          </div>
          <p className="text-sm font-sans font-medium text-[#756A62] max-w-md">
            Commercial campaigns, YouTube documentaries, and narrative brand films calibrated for widescreen visual storytelling and sustained audience immersion.
          </p>
        </div>

        {/* Editorial Cards */}
        <div className="space-y-16 lg:space-y-24">
          {videos.map((video, index) => (
            <HorizontalVideoCard
              key={video.id}
              video={video}
              index={index}
              onOpenLightbox={onOpenLightbox}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

interface HorizontalVideoCardProps {
  video: HorizontalVideo;
  index: number;
  onOpenLightbox: (videoUrl: string, title: string, client?: string, category?: string) => void;
}

const directions = ['left', 'up', 'right', 'up'] as const;

const HorizontalVideoCard: React.FC<HorizontalVideoCardProps> = ({ video, index, onOpenLightbox }) => {
  const isEven = index % 2 === 0;
  const direction = directions[index % directions.length];
  const videoBoxRef = useRevealOnScroll<HTMLDivElement>(direction, 0);
  const contentRef = useFadeUpOnScroll<HTMLDivElement>(0.15);
  const cardRef = useRef<HTMLDivElement>(null);
  const playBtnRef = useRef<HTMLDivElement>(null);

  // Magnetic play button
  const handlePlayMagnetic = (e: React.MouseEvent) => {
    if (!playBtnRef.current) return;
    const rect = playBtnRef.current.getBoundingClientRect();
    const dx = (e.clientX - (rect.left + rect.width / 2)) * 0.35;
    const dy = (e.clientY - (rect.top + rect.height / 2)) * 0.35;
    gsap.to(playBtnRef.current, { x: dx, y: dy, duration: 0.3, ease: 'power2.out' });
  };
  const handlePlayLeave = () => {
    if (!playBtnRef.current) return;
    gsap.to(playBtnRef.current, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1,0.4)' });
  };

  return (
    <div
      ref={cardRef}
      className={`grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center p-6 sm:p-10 rounded-3xl bg-[#F8F1E7] border border-[#2B170F]/10 hover:border-[#C65D45]/50 transition-all duration-500 shadow-md hover:shadow-xl group`}
    >
      {/* 16:9 Video Canvas */}
      <div
        ref={videoBoxRef}
        onClick={() => onOpenLightbox(video.video_url, video.title, undefined, video.category)}
        onMouseMove={handlePlayMagnetic}
        onMouseLeave={handlePlayLeave}
        data-cursor="play"
        className={`lg:col-span-7 relative w-full aspect-16-9 rounded-2xl overflow-hidden cursor-pointer bg-black border border-[#2B170F]/10 group-hover:border-[#C65D45]/60 transition-all duration-500 shadow-sm ${
          isEven ? 'lg:order-1' : 'lg:order-2'
        }`}
      >
        <VideoAutoThumbnail
          videoUrl={video.video_url}
          thumbnailUrl={video.thumbnail_url}
          alt={video.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30 group-hover:opacity-60 transition-opacity duration-500" />

        {/* Magnetic Play Button */}
        <div ref={playBtnRef} className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/20 backdrop-blur-xl border border-white/30 flex items-center justify-center text-[#FFF9F2] group-hover:scale-110 group-hover:bg-[#C65D45] group-hover:text-[#2B170F] group-hover:border-[#C65D45] transition-all duration-300 shadow-2xl">
            <Play className="w-7 h-7 fill-current ml-1" />
          </div>
        </div>

        {video.duration && (
          <div className="absolute bottom-4 right-4 px-3 py-1 rounded-full bg-black/75 backdrop-blur-md border border-white/10 text-xs font-sans text-white flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-[#C65D45]" />
            <span>{video.duration}</span>
          </div>
        )}
        <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-black/75 backdrop-blur-md border border-white/10 text-[11px] font-sans uppercase font-bold tracking-wider text-[#C65D45]">
          {video.category}
        </div>
      </div>

      {/* Editorial Content */}
      <div ref={contentRef} className={`lg:col-span-5 flex flex-col justify-center ${isEven ? 'lg:order-2' : 'lg:order-1'}`}>
        <div className="flex items-center gap-2 text-xs font-sans tracking-wider text-[#756A62] uppercase mb-3">
          <div className="flex items-center gap-1.5 font-bold text-[#C65D45]">
            <Calendar className="w-3.5 h-3.5 text-[#C65D45]" />
            <span>{video.year || '2025'}</span>
          </div>
        </div>

        <h3
          onClick={() => onOpenLightbox(video.video_url, video.title, undefined, video.category)}
          className="font-pogonia text-3xl sm:text-4xl lg:text-5xl font-bold text-[#2B170F] group-hover:text-[#C65D45] transition-colors leading-[1.15] cursor-pointer mb-4"
        >
          {video.title}
        </h3>

        <p className="text-sm sm:text-base font-sans font-medium text-[#756A62] leading-relaxed">
          {video.description ||
            'Editorial post-production featuring 4K multi-cam rhythm cutting, high-fidelity sound synthesis, and calibrated film color grading.'}
        </p>
      </div>
    </div>
  );
};
