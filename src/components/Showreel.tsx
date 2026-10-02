import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize2, Sparkles, Layers, Sliders, Disc } from 'lucide-react';
import { SettingsData } from '../types';
import { gsap } from 'gsap';
import { useRevealOnScroll, useFadeUpOnScroll } from '../hooks/useAnimations';
import { isYouTubeUrl, getYouTubeThumbnail } from '../utils/videoUtils';

interface ShowreelProps {
  settings?: SettingsData;
  onOpenLightbox: (videoUrl: string, title: string, client?: string) => void;
}

export const Showreel: React.FC<ShowreelProps> = ({ settings, onOpenLightbox }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState('0:00');
  const [duration, setDuration] = useState('0:00');
  const [showControls, setShowControls] = useState(true);
  const [autoThumbnail, setAutoThumbnail] = useState<string | null>(null);

  const headerRef = useFadeUpOnScroll<HTMLDivElement>(0);
  const playerRef = useRevealOnScroll<HTMLDivElement>('up', 0.1);
  const statsRef = useFadeUpOnScroll<HTMLDivElement>(0.15);
  const playBtnRef = useRef<HTMLButtonElement>(null);

  const videoUrl =
    settings?.featured_showreel_url ||
    'https://assets.mixkit.co/videos/preview/mixkit-cinematographer-filming-with-a-professional-camera-42861-large.mp4';
  const posterUrl = settings?.featured_showreel_poster || null;
  const isYt = isYouTubeUrl(videoUrl);
  const effectivePoster = posterUrl || (isYt ? getYouTubeThumbnail(videoUrl) : autoThumbnail);

  // Auto-capture a random frame from native video when no poster is set
  useEffect(() => {
    if (posterUrl || isYt) {
      setAutoThumbnail(null); // has a real poster or YouTube thumbnail, no need
      return;
    }
    const video = document.createElement('video');
    video.src = videoUrl;
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';
    video.preload = 'metadata';

    video.addEventListener('loadedmetadata', () => {
      const dur = video.duration;
      if (!dur || !isFinite(dur)) return;
      // Seek to a random frame between 10% and 80% of the video
      video.currentTime = dur * (0.1 + Math.random() * 0.7);
    });

    video.addEventListener('seeked', () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 1280;
        canvas.height = video.videoHeight || 720;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        // Only use if it's not a blank/empty frame
        if (dataUrl && dataUrl !== 'data:,') {
          setAutoThumbnail(dataUrl);
        }
      } catch {
        // CORS or other error — silently ignore, video will show normally
      }
    });
  }, [videoUrl, posterUrl]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const current = videoRef.current.currentTime;
    const dur = videoRef.current.duration || 1;
    setProgress((current / dur) * 100);
    setCurrentTime(formatTime(current));
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(formatTime(videoRef.current.duration));
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const newTime = (clickX / width) * videoRef.current.duration;
    videoRef.current.currentTime = newTime;
  };

  const handleTouchSeek = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!videoRef.current || !e.touches[0]) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.touches[0].clientX - rect.left;
    const width = rect.width;
    const newTime = (clickX / width) * videoRef.current.duration;
    videoRef.current.currentTime = newTime;
  };

  // Magnetic play button
  const handlePlayMagnetic = (e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = playBtnRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const dx = (e.clientX - (rect.left + rect.width / 2)) * 0.4;
    const dy = (e.clientY - (rect.top + rect.height / 2)) * 0.4;
    gsap.to(btn, { x: dx, y: dy, duration: 0.3, ease: 'power2.out' });
  };
  const handlePlayLeave = () => {
    if (!playBtnRef.current) return;
    gsap.to(playBtnRef.current, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1,0.4)' });
  };

  return (
    <section id="showreel-section" className="relative py-16 md:py-24 bg-[#FFF9F2] border-t border-b border-[#2B170F]/10 overflow-hidden font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div ref={headerRef} className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="relative inline-flex items-center px-4 py-1.5 rounded-full bg-white/75 backdrop-blur-md border border-white/85 shadow-[0_2px_10px_rgba(43,23,15,0.06),inset_0_1px_1px_rgba(255,255,255,0.95)] overflow-hidden mb-3">
              {/* Glass reflection highlights */}
              <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/80 via-white/20 to-transparent pointer-events-none" />
              <div className="absolute -top-3 -left-4 w-12 h-16 bg-gradient-to-r from-transparent via-white/60 to-transparent rotate-25 pointer-events-none" />
              <span className="relative z-10 text-xs font-sans font-bold uppercase text-[#C65D45] tracking-normal">
                Cinematic Portfolio Showreel
              </span>
            </div>
            <h2 className="font-pogonia text-3xl sm:text-5xl font-bold text-[#2B170F]">
              Selected Work / Master Reel
            </h2>
          </div>
          <p className="text-sm font-sans font-medium text-[#756A62] max-w-md">
            A continuous curation of rhythm, pacing, sound synthesis, and color science across commercial, short-form, and narrative productions.
          </p>
        </div>

        {/* 16:9 Video Player */}
        <div
          ref={playerRef}
          className="group relative w-full aspect-16-9 rounded-2xl overflow-hidden bg-black border border-[#2B170F]/15 shadow-xl transition-shadow duration-500 hover:shadow-2xl hover:shadow-[#C65D45]/10 hover:border-[#C65D45]/50"
          onMouseEnter={() => setShowControls(true)}
        >
          {isYt ? (
            <img
              src={effectivePoster || ''}
              alt="Featured Master Showreel"
              className="w-full h-full object-cover cursor-pointer group-hover:scale-105 transition-transform duration-700 ease-out"
              onClick={() => onOpenLightbox(videoUrl, 'Featured Master Showreel', 'Afsar Ahmad Films')}
            />
          ) : (
            <video
              ref={videoRef}
              src={videoUrl}
              poster={effectivePoster || undefined}
              playsInline
              muted={isMuted}
              loop
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              className="w-full h-full object-cover cursor-pointer"
              onClick={() => onOpenLightbox(videoUrl, 'Featured Master Showreel', 'Afsar Ahmad Films')}
            />
          )}

          {/* Central Play/Pause */}
          <div
            className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300 ${
              isPlaying && !isYt ? 'opacity-0 group-hover:opacity-100' : 'opacity-100 bg-black/40'
            }`}
          >
            <button
              ref={playBtnRef}
              onClick={(e) => {
                e.stopPropagation();
                onOpenLightbox(videoUrl, 'Featured Master Showreel', 'Afsar Ahmad Films');
              }}
              onMouseMove={handlePlayMagnetic}
              onMouseLeave={handlePlayLeave}
              data-cursor="play"
              className="pointer-events-auto w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white/20 backdrop-blur-xl border border-white/30 flex items-center justify-center text-[#FFF9F2] hover:scale-110 hover:bg-[#C65D45] hover:text-[#2B170F] hover:border-[#C65D45] transition-all duration-300 shadow-2xl cursor-pointer"
              aria-label="Play Fullscreen"
            >
              <Play className="w-8 h-8 fill-current ml-1" />
            </button>
          </div>

          {/* Cinema Controls Bar */}
          <div
            className={`absolute bottom-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-t from-black/95 via-black/60 to-transparent transition-opacity duration-300 ${
              showControls || !isPlaying || isYt ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {/* Scrubber (only for HTML5 videos) */}
            {!isYt && (
              <div
                className="relative w-full h-1.5 bg-white/30 rounded-full cursor-pointer overflow-hidden group/bar mb-3 hover:h-2.5 transition-all duration-200"
                onClick={handleSeek}
                onTouchStart={handleTouchSeek}
              >
                <div
                  className="h-full bg-gradient-to-r from-[#C65D45] to-[#ffba3b] rounded-full transition-all duration-75 relative"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-white">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onOpenLightbox(videoUrl, 'Featured Master Showreel', 'Afsar Ahmad Films')}
                  className="p-1 hover:text-[#C65D45] transition-colors cursor-pointer flex items-center gap-2"
                  aria-label="Play Fullscreen"
                >
                  <Play className="w-4 h-4 text-[#C65D45] fill-current" />
                  <span className="text-xs font-bold font-sans uppercase tracking-wider">
                    {isYt ? 'Watch Showreel' : 'Play'}
                  </span>
                </button>
                {!isYt && (
                  <>
                    <button
                      onClick={toggleMute}
                      className="p-1 hover:text-[#C65D45] transition-colors flex items-center gap-1 cursor-pointer"
                      aria-label={isMuted ? 'Unmute' : 'Mute'}
                    >
                      {isMuted ? <VolumeX className="w-4 h-4 text-white/60" /> : <Volume2 className="w-4 h-4 text-[#C65D45]" />}
                      <span className="text-[10px] font-sans uppercase hidden sm:inline">
                        {isMuted ? 'Muted' : 'Sound On'}
                      </span>
                    </button>
                    <div className="text-[11px] font-sans text-white/70">
                      <span>{currentTime}</span> / <span>{duration}</span>
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center gap-3">
                <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-white/20 text-[10px] font-sans font-medium uppercase tracking-wider text-white">
                  4K Master • 24fps
                </span>
                <button
                  onClick={() => onOpenLightbox(videoUrl, 'Featured Master Showreel', 'Afsar Ahmad Films')}
                  data-cursor="open"
                  className="p-1 hover:text-[#C65D45] transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Expand Fullscreen Lightbox"
                >
                  <Maximize2 className="w-4 h-4" />
                  <span className="hidden sm:inline text-[11px] font-sans uppercase">Theater Mode</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Specs Strip */}
        <div ref={statsRef} className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          {[
            { icon: Sparkles, label: 'Dynamic Rhythms', sub: 'Retention-tuned beats' },
            { icon: Layers, label: 'Custom Foley SFX', sub: 'Multi-track audio mix' },
            { icon: Sliders, label: 'AI Color Matching', sub: 'Smart scene-to-scene grade' },
            { icon: Disc, label: '4K ProRes Export', sub: 'Master broadcast grade' },
          ].map(({ icon: Icon, label, sub }, i) => (
            <div
              key={i}
              className="p-4 rounded-xl bg-[#F8F1E7] border border-[#2B170F]/10 flex items-center gap-3 shadow-sm hover:border-[#C65D45]/40 hover:shadow-md transition-all duration-300 group/stat"
            >
              <div className="w-8 h-8 rounded-lg bg-[#C65D45]/20 flex items-center justify-center group-hover/stat:bg-[#C65D45]/30 transition-colors">
                <Icon className="w-4 h-4 text-[#C65D45]" />
              </div>
              <div>
                <div className="text-xs font-semibold font-sans text-[#2B170F]">{label}</div>
                <div className="text-[11px] font-sans font-medium text-[#756A62]">{sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
