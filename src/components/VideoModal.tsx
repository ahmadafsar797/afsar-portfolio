import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Volume1,
  RotateCcw,
  RotateCw,
  Maximize,
  Minimize,
  Sliders,
} from 'lucide-react';

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  title: string;
  client?: string;
  category?: string;
}

export const VideoModal: React.FC<VideoModalProps> = ({
  isOpen,
  onClose,
  videoUrl,
  title,
  client,
  category,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState('0:00');
  const [currentTime, setCurrentTime] = useState('0:00');
  const [remainingTime, setRemainingTime] = useState('-0:00');
  const [rawDuration, setRawDuration] = useState(0);
  const [rawCurrentTime, setRawCurrentTime] = useState(0);
  const [isVertical, setIsVertical] = useState(false);
  const [isNativeFullscreen, setIsNativeFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [hoverTime, setHoverTime] = useState<string | null>(null);
  const [hoverPosition, setHoverPosition] = useState<number>(0);
  const [feedback, setFeedback] = useState<{ text: string; id: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Trigger brief visual feedback (e.g. "+10s", "-10s", "Paused")
  const triggerFeedback = useCallback((text: string) => {
    setFeedback({ text, id: Date.now() });
    setTimeout(() => {
      setFeedback((prev) => (prev?.text === text ? null : prev));
    }, 800);
  }, []);

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Play / Pause
  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      triggerFeedback('Play');
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
      triggerFeedback('Paused');
    }
  }, [triggerFeedback]);

  // Duration Backward (-10 seconds)
  const handleBackward = useCallback(() => {
    if (!videoRef.current) return;
    const newTime = Math.max(0, videoRef.current.currentTime - 10);
    videoRef.current.currentTime = newTime;
    triggerFeedback('-10s');
    resetControlsTimeout();
  }, [triggerFeedback]);

  // Duration Forward (+10 seconds)
  const handleForward = useCallback(() => {
    if (!videoRef.current) return;
    const dur = videoRef.current.duration || 0;
    const newTime = Math.min(dur, videoRef.current.currentTime + 10);
    videoRef.current.currentTime = newTime;
    triggerFeedback('+10s');
    resetControlsTimeout();
  }, [triggerFeedback]);

  // Toggle Mute
  const toggleMute = useCallback(() => {
    if (!videoRef.current) return;
    const newMuted = !videoRef.current.muted;
    videoRef.current.muted = newMuted;
    setIsMuted(newMuted);
    triggerFeedback(newMuted ? 'Muted' : 'Unmuted');
  }, [triggerFeedback]);

  // Adjust Volume
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  // Playback Speed
  const handleSpeedChange = (speed: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
      setPlaybackSpeed(speed);
      setShowSpeedMenu(false);
      triggerFeedback(`${speed}x Speed`);
    }
  };

  // Toggle Native Fullscreen
  const toggleNativeFullscreen = async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsNativeFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsNativeFullscreen(false);
      }
    } catch {
      // Fallback if browser blocks requestFullscreen
    }
  };

  // Auto-hide controls timer
  const resetControlsTimeout = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) {
        setShowControls(false);
      }
    }, 3200);
  }, []);

  const handleMouseMove = () => {
    resetControlsTimeout();
  };

  // Keyboard controls
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing into an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
        case ' ':
        case 'k':
        case 'K':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
        case 'j':
        case 'J':
          e.preventDefault();
          handleBackward();
          break;
        case 'ArrowRight':
        case 'l':
        case 'L':
          e.preventDefault();
          handleForward();
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          toggleMute();
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          toggleNativeFullscreen();
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (videoRef.current) {
            const nextVol = Math.min(1, (videoRef.current.volume || 0) + 0.1);
            videoRef.current.volume = nextVol;
            setVolume(nextVol);
            setIsMuted(false);
            videoRef.current.muted = false;
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (videoRef.current) {
            const nextVol = Math.max(0, (videoRef.current.volume || 0) - 0.1);
            videoRef.current.volume = nextVol;
            setVolume(nextVol);
            if (nextVol === 0) {
              setIsMuted(true);
              videoRef.current.muted = true;
            }
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, togglePlay, handleBackward, handleForward, toggleMute, onClose]);

  // Reset video state when modal opens with a new URL
  useEffect(() => {
    if (isOpen && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.playbackRate = playbackSpeed;
      videoRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {
          setIsPlaying(false);
        });
      resetControlsTimeout();
    }

    const handleFullscreenChange = () => {
      setIsNativeFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [isOpen, videoUrl, playbackSpeed, resetControlsTimeout]);

  // Video time updates
  const handleTimeUpdate = () => {
    if (!videoRef.current || isDragging) return;
    const cur = videoRef.current.currentTime;
    const dur = videoRef.current.duration || 1;
    setRawCurrentTime(cur);
    setProgress((cur / dur) * 100);
    setCurrentTime(formatTime(cur));
    setRemainingTime(`-${formatTime(Math.max(0, dur - cur))}`);
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    const dur = videoRef.current.duration || 0;
    setRawDuration(dur);
    setDuration(formatTime(dur));
    setRemainingTime(`-${formatTime(dur)}`);

    // Detect aspect ratio
    const videoWidth = videoRef.current.videoWidth;
    const videoHeight = videoRef.current.videoHeight;
    setIsVertical(videoHeight > videoWidth);
  };

  // Progress Bar Seek
  const seekToPosition = (clientX: number) => {
    if (!progressBarRef.current || !videoRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percentage = clickX / rect.width;
    const newTime = percentage * (videoRef.current.duration || 0);

    videoRef.current.currentTime = newTime;
    setProgress(percentage * 100);
    setCurrentTime(formatTime(newTime));
  };

  const handleSeekMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    seekToPosition(e.clientX);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      seekToPosition(moveEvent.clientX);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleSeekTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!e.touches[0]) return;
    setIsDragging(true);
    seekToPosition(e.touches[0].clientX);

    const handleTouchMove = (moveEvent: TouchEvent) => {
      if (moveEvent.touches[0]) {
        seekToPosition(moveEvent.touches[0].clientX);
      }
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };

    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchcancel', handleTouchEnd);
  };

  // Hover Time Preview over progress bar
  const handleProgressMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !videoRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const hoverX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const pct = hoverX / rect.width;
    const previewTime = pct * (videoRef.current.duration || 0);
    setHoverTime(formatTime(previewTime));
    setHoverPosition(hoverX);
  };

  const handleProgressMouseLeave = () => {
    setHoverTime(null);
  };

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onClick={resetControlsTimeout}
      className="fixed inset-0 z-[99999] w-screen h-screen bg-black/98 backdrop-blur-2xl flex flex-col justify-between overflow-hidden select-none font-montserrat animate-in fade-in duration-200"
    >
      {/* Ambient background glow matching the video */}
      <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden blur-3xl scale-125">
        <video
          src={videoUrl}
          muted
          loop
          playsInline
          className="w-full h-full object-cover"
        />
      </div>

      {/* ── TOP HEADER BAR: TITLE, METADATA & CUT / CLOSE BUTTON ────────────── */}
      <header
        className={`relative z-50 w-full px-5 sm:px-8 py-4 sm:py-6 flex items-center justify-between bg-gradient-to-b from-black/95 via-black/70 to-transparent transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Left: Video Details */}
        <div className="flex items-center gap-3 sm:gap-4 max-w-[70%]">
          {category && (
            <span className="hidden sm:inline-flex px-3 py-1 rounded-full bg-[#C65D45]/20 border border-[#C65D45]/40 text-[#C65D45] text-[10px] uppercase font-bold tracking-wider">
              {category}
            </span>
          )}
          <div>
            <div className="flex items-center gap-2">
              {client && (
                <span className="text-xs font-bold text-[#C65D45] uppercase tracking-wider">
                  {client} •
                </span>
              )}
              <h2 className="font-pogonia text-lg sm:text-2xl text-white font-bold truncate">
                {title || 'Cinematic Video'}
              </h2>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-white/50 mt-0.5">
              <span>{isVertical ? '9:16 Vertical Reel' : '16:9 Cinema 4K'}</span>
              <span>•</span>
              <span>{duration}</span>
            </div>
          </div>
        </div>

        {/* Right: BACK OPTION (Prominent Close / Back Button) */}
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="group/cut flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-[#C65D45] border border-white/20 hover:border-[#C65D45] text-white hover:text-[#2B170F] transition-all duration-300 shadow-xl cursor-pointer active:scale-95"
            title="Back / Close Video (Esc)"
            aria-label="Back / Close Video"
          >
            <span className="text-xs font-bold uppercase tracking-wider group-hover/cut:text-[#2B170F] transition-colors">
              Back
            </span>
            <X className="w-5 h-5 text-[#C65D45] group-hover/cut:text-[#2B170F] group-hover/cut:rotate-90 transition-all duration-300" />
          </button>
        </div>
      </header>

      {/* ── CENTRAL FULLSCREEN VIDEO STAGE ─────────────────────────────────── */}
      <main className="relative flex-1 w-full h-full flex items-center justify-center overflow-hidden">
        {/* True Fullscreen Video Canvas */}
        <video
          ref={videoRef}
          src={videoUrl}
          playsInline
          loop
          muted={isMuted}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onClick={togglePlay}
          className={`cursor-pointer transition-all duration-300 ${
            isVertical
              ? 'h-full max-h-screen w-auto aspect-9-16 shadow-2xl rounded-lg sm:rounded-2xl border border-white/10'
              : 'w-full h-full max-w-full max-h-full object-contain'
          }`}
        />

        {/* Transient Central Ripple Feedback (+10s, -10s, Play, Paused) */}
        {feedback && (
          <div
            key={feedback.id}
            className="absolute z-40 pointer-events-none px-6 py-3 rounded-2xl bg-black/80 backdrop-blur-xl border border-white/20 text-[#FFF9F2] text-sm sm:text-base font-bold shadow-2xl animate-in zoom-in-75 fade-in duration-150 flex items-center gap-2"
          >
            {feedback.text.includes('+') ? (
              <RotateCw className="w-5 h-5 text-[#C65D45]" />
            ) : feedback.text.includes('-') ? (
              <RotateCcw className="w-5 h-5 text-[#C65D45]" />
            ) : null}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* Center Hover Action Controls: -10s, Play/Pause, +10s */}
        <div
          className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300 ${
            showControls || !isPlaying
              ? 'opacity-100'
              : 'opacity-0'
          }`}
        >
          <div className="flex items-center gap-6 sm:gap-10 pointer-events-auto">
            {/* Center Backward -10s Button */}
            <button
              onClick={handleBackward}
              className="group/back flex flex-col items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-black/60 hover:bg-[#C65D45] border border-white/20 hover:border-[#C65D45] text-white hover:text-[#2B170F] backdrop-blur-xl transition-all duration-200 active:scale-90 shadow-xl cursor-pointer"
              title="Duration Backward 10s (← Left Arrow)"
              aria-label="Backward 10 seconds"
            >
              <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2] group-hover/back:-rotate-45 transition-transform duration-300" />
              <span className="text-[10px] font-bold mt-0.5 tracking-tight">-10s</span>
            </button>

            {/* Big Central Play / Pause Button */}
            <button
              onClick={togglePlay}
              className="flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#C65D45] hover:bg-[#a84d38] text-[#2B170F] transition-all duration-300 transform hover:scale-110 active:scale-95 shadow-2xl cursor-pointer"
              title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="w-9 h-9 sm:w-10 sm:h-10 fill-current" />
              ) : (
                <Play className="w-9 h-9 sm:w-10 sm:h-10 fill-current ml-1" />
              )}
            </button>

            {/* Center Forward +10s Button */}
            <button
              onClick={handleForward}
              className="group/fwd flex flex-col items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-black/60 hover:bg-[#C65D45] border border-white/20 hover:border-[#C65D45] text-white hover:text-[#2B170F] backdrop-blur-xl transition-all duration-200 active:scale-90 shadow-xl cursor-pointer"
              title="Duration Forward 10s (→ Right Arrow)"
              aria-label="Forward 10 seconds"
            >
              <RotateCw className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2] group-hover/fwd:rotate-45 transition-transform duration-300" />
              <span className="text-[10px] font-bold mt-0.5 tracking-tight">+10s</span>
            </button>
          </div>
        </div>
      </main>

      {/* ── BOTTOM DURATION & CONTROL DECK ──────────────────────────────────── */}
      <footer
        className={`relative z-50 w-full px-4 sm:px-8 pb-5 pt-10 sm:pb-6 bg-gradient-to-t from-black via-black/85 to-transparent transition-opacity duration-300 ${
          showControls || !isPlaying
            ? 'opacity-100'
            : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="max-w-6xl mx-auto space-y-3">
          {/* Interactive Duration Timeline / Scrubber */}
          <div
            ref={progressBarRef}
            onMouseDown={handleSeekMouseDown}
            onTouchStart={handleSeekTouchStart}
            onMouseMove={handleProgressMouseMove}
            onMouseLeave={handleProgressMouseLeave}
            className="group/bar relative w-full h-2.5 hover:h-4 bg-white/20 hover:bg-white/30 rounded-full cursor-pointer transition-all duration-150 py-1 touch-none"
          >
            {/* Timestamp hover tooltip */}
            {hoverTime && (
              <div
                className="absolute -top-8 px-2.5 py-1 rounded-md bg-[#2B170F] text-[#FFF9F2] text-[11px] font-bold border border-white/20 shadow-xl pointer-events-none transform -translate-x-1/2 whitespace-nowrap"
                style={{ left: `${hoverPosition}px` }}
              >
                {hoverTime}
              </div>
            )}

            {/* Filled Progress Bar */}
            <div
              className="h-full bg-gradient-to-r from-[#C65D45] to-[#ffba3b] rounded-full relative transition-[width] duration-75 shadow-lg shadow-[#C65D45]/40"
              style={{ width: `${progress}%` }}
            >
              {/* Seeker Thumb */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-[#C65D45] shadow-md scale-100 sm:scale-0 sm:group-hover/bar:scale-100 transition-transform duration-150" />
            </div>
          </div>

          {/* Lower Control Bar: Forward/Backward, Play/Pause, Duration, Volume, Speed, Fullscreen */}
          <div className="flex items-center justify-between text-white text-xs pt-1">
            {/* Left Cluster: Transport Controls */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Play / Pause Toggle */}
              <button
                onClick={togglePlay}
                className="p-2 rounded-full hover:bg-white/10 text-white hover:text-[#C65D45] transition-colors cursor-pointer"
                title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
              </button>

              {/* DURATION BACKWARD BUTTON */}
              <button
                onClick={handleBackward}
                className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/10 hover:bg-[#C65D45] hover:text-[#2B170F] transition-all text-xs font-bold cursor-pointer group"
                title="Duration Backward 10s (← Arrow)"
              >
                <RotateCcw className="w-3.5 h-3.5 group-hover:-rotate-45 transition-transform" />
                <span>-10s</span>
              </button>

              {/* DURATION FORWARD BUTTON */}
              <button
                onClick={handleForward}
                className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/10 hover:bg-[#C65D45] hover:text-[#2B170F] transition-all text-xs font-bold cursor-pointer group"
                title="Duration Forward 10s (→ Arrow)"
              >
                <span>+10s</span>
                <RotateCw className="w-3.5 h-3.5 group-hover:rotate-45 transition-transform" />
              </button>

              {/* Duration Display */}
              <div className="flex items-center gap-1.5 text-xs text-white/80 font-mono pl-1">
                <span className="font-bold text-white">{currentTime}</span>
                <span className="text-white/40">/</span>
                <span>{duration}</span>
                <span className="hidden md:inline text-white/40 text-[11px] ml-1">
                  ({remainingTime})
                </span>
              </div>
            </div>

            {/* Right Cluster: Volume, Speed, Fullscreen, Cut */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Volume & Slider */}
              <div className="group/vol flex items-center gap-2">
                <button
                  onClick={toggleMute}
                  className="p-1.5 rounded-full hover:bg-white/10 hover:text-[#C65D45] transition-colors cursor-pointer"
                  title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4 text-white/50" />
                  ) : volume < 0.5 ? (
                    <Volume1 className="w-4 h-4 text-[#C65D45]" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-[#C65D45]" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-16 sm:w-20 h-1 accent-[#C65D45] cursor-pointer hidden sm:inline-block"
                  title={`Volume: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
                />
              </div>

              {/* Playback Speed Picker */}
              <div className="relative">
                <button
                  onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                  className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-[11px] font-bold transition-colors cursor-pointer"
                  title="Playback Speed"
                >
                  {playbackSpeed}x
                </button>

                {showSpeedMenu && (
                  <div className="absolute bottom-full right-0 mb-2 py-1 w-24 bg-[#2B170F] border border-white/20 rounded-xl shadow-2xl text-xs overflow-hidden z-50">
                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map((s) => (
                      <button
                        key={s}
                        onClick={() => handleSpeedChange(s)}
                        className={`w-full text-left px-3 py-1.5 transition-colors cursor-pointer ${
                          playbackSpeed === s
                            ? 'bg-[#C65D45] text-[#2B170F] font-bold'
                            : 'text-white/80 hover:bg-white/10'
                        }`}
                      >
                        {s}x
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Toggle Native Fullscreen Button */}
              <button
                onClick={toggleNativeFullscreen}
                className="p-2 rounded-full hover:bg-white/10 text-white hover:text-[#C65D45] transition-colors cursor-pointer"
                title={isNativeFullscreen ? 'Exit Fullscreen (F)' : 'Full Screen (F)'}
              >
                {isNativeFullscreen ? (
                  <Minimize className="w-4 h-4" />
                ) : (
                  <Maximize className="w-4 h-4" />
                )}
              </button>

              {/* Bottom Back Button for Quick Access */}
              <button
                onClick={onClose}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 hover:bg-red-500 text-red-200 hover:text-white transition-all text-xs font-bold cursor-pointer border border-red-500/30"
                title="Back / Exit Video (Esc)"
              >
                <X className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
