import React, { useState, useRef, useEffect } from 'react';
import { Play, Volume2, VolumeX, Maximize2 } from 'lucide-react';
import { Reel } from '../types';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useStaggerOnScroll, useFadeUpOnScroll } from '../hooks/useAnimations';
import { VideoAutoThumbnail } from './VideoAutoThumbnail';
import { isYouTubeUrl } from '../utils/videoUtils';

gsap.registerPlugin(ScrollTrigger);

interface ReelsSectionProps {
  reels: Reel[];
  onOpenLightbox: (videoUrl: string, title: string, client?: string, category?: string) => void;
}

export const ReelsSection: React.FC<ReelsSectionProps> = ({ reels, onOpenLightbox }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [hoveredReelId, setHoveredReelId] = useState<number | null>(null);
  const [unmutedReelId, setUnmutedReelId] = useState<number | null>(null);

  const headerRef = useFadeUpOnScroll<HTMLDivElement>(0);
  const filtersRef = useFadeUpOnScroll<HTMLDivElement>(0.1);
  const gridRef = useStaggerOnScroll<HTMLDivElement>('.reel-card-animate', 0.08);

  const categories = [
    'All',
    'Instagram Reels',
    'YouTube Shorts',
    'Social Media Ads',
    'Talking Head Edits',
    'Product Reels',
    'Cinematic Social Content',
  ];

  const filteredReels =
    selectedCategory === 'All'
      ? reels
      : reels.filter(
          (r) => r.category && r.category.toLowerCase() === selectedCategory.toLowerCase()
        );

  return (
    <section id="reels" className="py-20 md:py-32 bg-[#F8F1E7] relative overflow-hidden font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div ref={headerRef} className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <div className="relative inline-flex items-center px-4 py-1.5 rounded-full bg-white/75 backdrop-blur-md border border-white/85 shadow-[0_2px_10px_rgba(43,23,15,0.06),inset_0_1px_1px_rgba(255,255,255,0.95)] overflow-hidden mb-3">
              {/* Glass reflection highlights */}
              <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/80 via-white/20 to-transparent pointer-events-none" />
              <div className="absolute -top-3 -left-4 w-12 h-16 bg-gradient-to-r from-transparent via-white/60 to-transparent rotate-25 pointer-events-none" />
              <span className="relative z-10 text-xs font-sans font-bold uppercase text-[#C65D45] tracking-normal">
                Engineered For Scroll Retention
              </span>
            </div>
            <h2 className="font-pogonia text-4xl sm:text-6xl font-bold text-[#2B170F]">
              Reels & Short-Form Work
            </h2>
          </div>
          <p className="text-sm font-sans font-medium text-[#756A62] max-w-md">
            High-converting 9:16 vertical edits crafted for immediate viewer hook, micro-pacing, and relentless watch time.
          </p>
        </div>

        {/* Category Filters */}
        <div ref={filtersRef} className="flex items-center gap-2 overflow-x-auto pb-4 mb-10 scrollbar-none">
          <div className="flex items-center gap-2 pr-4">
            {categories.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-xs font-sans uppercase tracking-wider px-4 py-2 rounded-full whitespace-nowrap transition-all duration-300 cursor-pointer ${
                    active
                      ? 'bg-gradient-to-r from-[#C65D45] via-[#D8684F] to-[#E2725B] text-[#FFF9F2] font-bold shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_4px_14px_rgba(198,93,69,0.35)] scale-105 border border-white/20'
                      : 'bg-[#180E09]/5 hover:bg-[#180E09]/10 text-[#756A62] hover:text-[#2B170F] border border-[#2B170F]/15 font-medium'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* 9:16 Reels Grid - Compact 2-column mobile feed, 3 columns on desktop */}
        <div ref={gridRef} className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 lg:gap-8">
          {filteredReels.map((reel, idx) => (
            <div key={reel.id} className="reel-card-animate">
              <ReelCard
                reel={reel}
                index={idx}
                isHovered={hoveredReelId === reel.id}
                isUnmuted={unmutedReelId === reel.id}
                onMouseEnter={() => setHoveredReelId(reel.id)}
                onMouseLeave={() => {
                  setHoveredReelId(null);
                  setUnmutedReelId(null);
                }}
                onToggleMute={(e) => {
                  e.stopPropagation();
                  setUnmutedReelId(unmutedReelId === reel.id ? null : reel.id);
                }}
                onClick={() => onOpenLightbox(reel.video_url, reel.title, reel.client, reel.category)}
              />
            </div>
          ))}
        </div>

        {filteredReels.length === 0 && (
          <div className="text-center py-16 bg-[#FFF9F2] rounded-2xl border border-[#2B170F]/10">
            <p className="text-[#756A62] text-sm font-sans">No reels found in category "{selectedCategory}".</p>
          </div>
        )}
      </div>
    </section>
  );
};

interface ReelCardProps {
  reel: Reel;
  index: number;
  isHovered: boolean;
  isUnmuted: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onToggleMute: (e: React.MouseEvent) => void;
  onClick: () => void;
}

const ReelCard: React.FC<ReelCardProps> = ({
  reel,
  index,
  isHovered,
  isUnmuted,
  onMouseEnter,
  onMouseLeave,
  onToggleMute,
  onClick,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const playBtnRef = useRef<HTMLDivElement>(null);
  const isYt = isYouTubeUrl(reel.video_url);

  useEffect(() => {
    if (!isYt && videoRef.current) {
      if (isHovered) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
  }, [isHovered, isYt]);

  // Magnetic play button
  const handleMagnetic = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!playBtnRef.current) return;
    const rect = playBtnRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) * 0.3;
    const dy = (e.clientY - cy) * 0.3;
    gsap.to(playBtnRef.current, { x: dx, y: dy, duration: 0.25, ease: 'power2.out' });
  };

  const handleMagneticLeave = () => {
    if (!playBtnRef.current) return;
    gsap.to(playBtnRef.current, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1,0.4)' });
  };

  // Card hover: subtle 3D tilt
  const handleCardMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    gsap.to(cardRef.current, {
      rotateY: x * 4,
      rotateX: -y * 4,
      duration: 0.4,
      ease: 'power2.out',
      transformPerspective: 800,
    });
  };

  const handleCardLeave = () => {
    if (!cardRef.current) return;
    gsap.to(cardRef.current, {
      rotateY: 0,
      rotateX: 0,
      duration: 0.5,
      ease: 'power3.out',
    });
  };

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={(e) => { onMouseLeave(); handleCardLeave(); }}
      onMouseMove={(e) => { handleMagnetic(e); handleCardMove(e); }}
      data-cursor="play"
      className="group relative cursor-pointer rounded-xl sm:rounded-2xl overflow-hidden bg-black border border-[#2B170F]/15 hover:border-[#C65D45] transition-all duration-300 shadow-md hover:shadow-xl hover:shadow-[#C65D45]/15 flex flex-col active:scale-95"
      style={{ willChange: 'transform' }}
    >
      {/* 9:16 Vertical Video Frame */}
      <div className="relative w-full aspect-9-16 overflow-hidden bg-black">
        {/* Poster / Auto-thumbnail */}
        <VideoAutoThumbnail
          videoUrl={reel.video_url}
          thumbnailUrl={reel.thumbnail_url}
          alt={reel.title}
          className={`w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-105 ${
            isHovered && !isYt ? 'opacity-0' : 'opacity-100'
          }`}
        />

        {/* Video Preview (for HTML5 MP4s) */}
        {!isYt && (
          <video
            ref={videoRef}
            src={reel.video_url}
            muted={!isUnmuted}
            loop
            playsInline
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}
          />
        )}

        {/* Vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-black/40 pointer-events-none transition-opacity duration-300 group-hover:opacity-90" />

        {/* Top Chips */}
        <div className="absolute top-2 sm:top-4 left-2 sm:left-4 right-2 sm:right-4 flex items-center justify-between z-10">
          <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-black/75 backdrop-blur-md border border-white/10 text-[8.5px] sm:text-[10px] font-sans uppercase font-bold tracking-wider text-[#C65D45] truncate max-w-[68%]">
            {reel.category}
          </span>
          <div className="flex items-center gap-1.5 sm:gap-2">
            {reel.duration && (
              <span className="px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded-full bg-black/75 backdrop-blur-md text-[8.5px] sm:text-[10px] font-sans text-white/80 shrink-0">
                {reel.duration}
              </span>
            )}
            {isHovered && (
              <button
                onClick={onToggleMute}
                className="p-1 sm:p-1.5 rounded-full bg-black/75 backdrop-blur-md border border-white/20 text-white hover:text-[#C65D45] transition-all cursor-pointer"
                title={isUnmuted ? 'Mute' : 'Unmute preview'}
              >
                {isUnmuted ? <Volume2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#C65D45]" /> : <VolumeX className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
              </button>
            )}
          </div>
        </div>

        {/* Magnetic Play Button */}
        <div
          ref={playBtnRef}
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <div className="w-9 h-9 sm:w-14 sm:h-14 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white group-hover:scale-110 group-hover:bg-[#C65D45] group-hover:text-[#2B170F] group-hover:border-[#C65D45] transition-all duration-300 shadow-xl">
            <Play className="w-3.5 h-3.5 sm:w-6 sm:h-6 fill-current ml-0.5" />
          </div>
        </div>

        {/* Bottom Details */}
        <div className="absolute bottom-0 left-0 right-0 p-2.5 sm:p-5 z-10 flex flex-col gap-0.5 sm:gap-1 translate-y-1 group-hover:translate-y-0 transition-transform duration-300">
          <div className="text-[8.5px] sm:text-[11px] font-sans uppercase tracking-wider text-[#C65D45] font-semibold truncate">
            {reel.client || 'Client Project'}
          </div>
          <h3 className="font-pogonia text-xs sm:text-xl lg:text-2xl font-bold text-white group-hover:text-[#C65D45] transition-colors line-clamp-2 leading-snug">
            {reel.title}
          </h3>
          <div className="flex items-center justify-between mt-1 sm:mt-2 pt-1 sm:pt-2 border-t border-white/15 text-[8.5px] sm:text-[11px] text-white/70">
            <div className="flex items-center gap-1 sm:gap-1.5">
              <span className="px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded-md bg-white/10 backdrop-blur-sm text-[7.5px] sm:text-[10px] font-sans font-medium text-white/85 border border-white/10 truncate max-w-[65px] sm:max-w-none">
                {reel.category || '9:16 Video'}
              </span>
            </div>
            <span className="text-[#C65D45] flex items-center gap-0.5 sm:gap-1 group-hover:translate-x-1 transition-transform font-sans uppercase text-[7.5px] sm:text-[10px] font-bold shrink-0">
              <span>Watch</span>
              <Maximize2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
