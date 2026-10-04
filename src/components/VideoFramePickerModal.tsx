import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Check,
  Camera,
  RefreshCw,
  Sparkles,
  Sliders,
  ChevronLeft,
  ChevronRight,
  Upload,
  Film,
} from 'lucide-react';
import { api } from '../services/api';
import { isYouTubeUrl, getYouTubeThumbnail } from '../utils/videoUtils';

interface CandidateFrame {
  time: number;
  formattedTime: string;
  dataUrl: string;
}

interface VideoFramePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  currentPoster?: string | null;
  onSavePoster: (posterUrl: string) => Promise<void> | void;
  title?: string;
  aspectRatio?: '16:9' | '9:16';
}

export const VideoFramePickerModal: React.FC<VideoFramePickerModalProps> = ({
  isOpen,
  onClose,
  videoUrl,
  currentPoster,
  onSavePoster,
  title = 'Master Showreel',
  aspectRatio = '16:9',
}) => {
  const [candidateFrames, setCandidateFrames] = useState<CandidateFrame[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedFrame, setSelectedFrame] = useState<string | null>(currentPoster || null);
  const [scrubberTime, setScrubberTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isYt = isYouTubeUrl(videoUrl);

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Extract 8 candidate frames evenly spaced across the video
  useEffect(() => {
    if (!isOpen || isYt || !videoUrl) return;

    let isMounted = true;
    setIsGenerating(true);
    setCandidateFrames([]);
    setErrorMessage(null);

    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.src = videoUrl;
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const sampleFractions = [0.08, 0.18, 0.30, 0.42, 0.55, 0.68, 0.80, 0.92];
    let currentIndex = 0;
    const extracted: CandidateFrame[] = [];

    const captureNextFrame = () => {
      if (!isMounted) return;
      if (currentIndex >= sampleFractions.length) {
        setIsGenerating(false);
        // Default select the 3rd frame (around 30%) if no poster set yet
        if (!selectedFrame && extracted.length > 2) {
          setSelectedFrame(extracted[2].dataUrl);
          setScrubberTime(extracted[2].time);
        }
        return;
      }

      const fraction = sampleFractions[currentIndex];
      const targetTime = (video.duration || 10) * fraction;
      video.currentTime = targetTime;
    };

    const handleLoadedMetadata = () => {
      if (!isMounted) return;
      setDuration(video.duration || 0);
      setScrubberTime(Math.min(3, (video.duration || 0) * 0.25));
      captureNextFrame();
    };

    const handleSeeked = () => {
      if (!isMounted) return;
      try {
        const isVertical = aspectRatio === '9:16';
        canvas.width = video.videoWidth || (isVertical ? 540 : 1280);
        canvas.height = video.videoHeight || (isVertical ? 960 : 720);
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          if (dataUrl && dataUrl !== 'data:,') {
            const frame: CandidateFrame = {
              time: video.currentTime,
              formattedTime: formatTime(video.currentTime),
              dataUrl,
            };
            extracted.push(frame);
            setCandidateFrames([...extracted]);
          }
        }
      } catch (err: any) {
        console.warn('Frame capture notice:', err);
      }

      currentIndex++;
      captureNextFrame();
    };

    const handleError = () => {
      if (!isMounted) return;
      setIsGenerating(false);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('seeked', handleSeeked);
    video.addEventListener('error', handleError);

    return () => {
      isMounted = false;
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('seeked', handleSeeked);
      video.removeEventListener('error', handleError);
    };
  }, [isOpen, videoUrl, isYt]);

  // Sync preview video element when scrubber changes
  const handleScrubberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setScrubberTime(val);
    if (previewVideoRef.current) {
      previewVideoRef.current.currentTime = val;
    }
  };

  // Step backward / forward by 0.5s for micro-control
  const stepTime = (delta: number) => {
    if (!previewVideoRef.current) return;
    const nextTime = Math.max(0, Math.min(duration, scrubberTime + delta));
    setScrubberTime(nextTime);
    previewVideoRef.current.currentTime = nextTime;
  };

  // Capture the current frame from the interactive scrubber
  const handleCaptureFromScrubber = () => {
    if (!previewVideoRef.current) return;
    const video = previewVideoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
      setSelectedFrame(dataUrl);

      // Add to candidates list if not already there
      const newFrame: CandidateFrame = {
        time: video.currentTime,
        formattedTime: formatTime(video.currentTime),
        dataUrl,
      };
      setCandidateFrames((prev) => [newFrame, ...prev.slice(0, 7)]);
      setSaveSuccess(false);
    } catch (err: any) {
      setErrorMessage('Could not capture frame directly. Try selecting one of the generated frames above.');
    }
  };

  // Save selected thumbnail frame
  const handleSave = async () => {
    if (!selectedFrame) return;

    setIsSaving(true);
    setErrorMessage(null);

    try {
      let finalUrl = selectedFrame;

      // If selectedFrame is a base64 data URL, upload as a JPEG file so it becomes a fast, permanent static URL
      if (selectedFrame.startsWith('data:image/')) {
        try {
          const res = await fetch(selectedFrame);
          const blob = await res.blob();
          const file = new File([blob], `master-showreel-thumb-${Date.now()}.jpg`, {
            type: 'image/jpeg',
          });
          const uploadRes = await api.uploadFile(file);
          if (uploadRes && uploadRes.url) {
            finalUrl = uploadRes.url;
          }
        } catch (uploadErr) {
          // If upload fails (e.g. unauthenticated or offline), fallback to the data URL or continue
          console.warn('Direct upload failed, using dataUrl fallback:', uploadErr);
        }
      }

      await onSavePoster(finalUrl);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 700);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save thumbnail');
    } finally {
      setIsSaving(false);
    }
  };

  // Custom Image Upload fallback
  const handleCustomImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsSaving(true);
      const res = await api.uploadFile(file);
      setSelectedFrame(res.url);
      await onSavePoster(res.url);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 700);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to upload custom image');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/85 backdrop-blur-xl p-3 sm:p-6 select-none font-sans animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-[#140D09] border border-white/15 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white">
        {/* Hidden Canvas for Frame Captures */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Modal Header */}
        <div className="px-5 sm:px-7 py-4 border-b border-white/10 flex items-center justify-between bg-[#1B110B]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#C65D45]/20 border border-[#C65D45]/40 flex items-center justify-center text-[#C65D45]">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-pogonia text-xl sm:text-2xl font-bold text-white">
                Choose Showreel Thumbnail
              </h2>
              <p className="text-[11px] font-sans text-white/60">
                Select from auto-captured video frames or scrub to capture your favorite frame
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6 scrollbar-thin scrollbar-thumb-white/20">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs">
              {errorMessage}
            </div>
          )}

          {isYt ? (
            /* YouTube notice */
            <div className="p-5 rounded-2xl bg-[#2B170F]/60 border border-[#C65D45]/30 space-y-3">
              <div className="flex items-center gap-2 text-[#C65D45] font-bold text-sm">
                <Sparkles className="w-4 h-4" />
                <span>YouTube Video Detected</span>
              </div>
              <p className="text-xs text-white/70">
                YouTube automatically supplies high-definition thumbnail frames. You can also upload a custom poster image below.
              </p>
              <div className="w-full aspect-16-9 max-w-sm rounded-xl overflow-hidden border border-white/20">
                <img
                  src={getYouTubeThumbnail(videoUrl) || ''}
                  alt="YouTube Thumbnail"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          ) : (
            <>
              {/* ── SECTION 1: AUTO-EXTRACTED CANDIDATE FRAMES ────────────── */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#C65D45]" />
                    <span className="text-xs font-bold uppercase tracking-wider text-white">
                      Auto-Captured Video Frames (Choices)
                    </span>
                    {isGenerating && (
                      <span className="inline-flex items-center gap-1.5 text-[10px] text-[#C65D45] animate-pulse">
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        Extracting frames...
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-white/50">Click any frame to select</span>
                </div>

                {/* Candidate Frames Grid */}
                {(() => {
                  const isVertical = aspectRatio === '9:16';
                  return (
                    <div className={`grid ${isVertical ? 'grid-cols-2 sm:grid-cols-4 md:grid-cols-8' : 'grid-cols-2 sm:grid-cols-4'} gap-2.5 sm:gap-3.5`}>
                      {candidateFrames.map((frame, idx) => {
                        const isSelected = selectedFrame === frame.dataUrl;
                        return (
                          <div
                            key={idx}
                            onClick={() => {
                              setSelectedFrame(frame.dataUrl);
                              setScrubberTime(frame.time);
                              if (previewVideoRef.current) {
                                previewVideoRef.current.currentTime = frame.time;
                              }
                            }}
                            className={`group relative ${isVertical ? 'aspect-[9/16]' : 'aspect-16-9'} rounded-xl overflow-hidden cursor-pointer border-2 transition-all duration-200 bg-black ${
                              isSelected
                                ? 'border-[#C65D45] shadow-[0_0_16px_rgba(198,93,69,0.5)] scale-[1.02]'
                                : 'border-white/15 hover:border-white/40 opacity-75 hover:opacity-100'
                            }`}
                          >
                            <img
                              src={frame.dataUrl}
                              alt={`Frame at ${frame.formattedTime}`}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />

                            {/* Timestamp Pill */}
                            <div className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-sm text-[10px] font-mono font-bold text-white/90">
                              {frame.formattedTime}
                            </div>

                            {/* Selected Indicator */}
                            {isSelected && (
                              <div className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-[#C65D45] text-white flex items-center justify-center shadow-lg">
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {candidateFrames.length === 0 && isGenerating && (
                        <div className="col-span-2 sm:col-span-4 h-28 flex items-center justify-center gap-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white/50">
                          <RefreshCw className="w-4 h-4 animate-spin text-[#C65D45]" />
                          <span>Scanning video for optimal frames...</span>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* ── SECTION 2: INTERACTIVE FRAME SCRUBBER & LIVE PREVIEW ────────────── */}
              <div className="pt-2 border-t border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white">
                    <Sliders className="w-4 h-4 text-[#C65D45]" />
                    <span>Scrub to Capture Exact Frame</span>
                  </div>
                  <span className="text-[11px] font-mono text-[#C65D45] font-bold">
                    {formatTime(scrubberTime)} / {formatTime(duration)}
                  </span>
                </div>

                {/* Scrubber Video Preview Box */}
                <div className={`relative w-full ${aspectRatio === '9:16' ? 'aspect-[9/16] max-h-80 max-w-xs' : 'aspect-16-9 max-h-64 sm:max-h-72'} rounded-xl overflow-hidden bg-black border border-white/20 mx-auto flex items-center justify-center`}>
                  <video
                    ref={previewVideoRef}
                    src={videoUrl}
                    crossOrigin="anonymous"
                    muted
                    playsInline
                    preload="auto"
                    onLoadedMetadata={(e) => {
                      const v = e.currentTarget;
                      setDuration(v.duration || 0);
                      v.currentTime = scrubberTime || Math.min(2.5, v.duration * 0.25);
                    }}
                    className="w-full h-full object-contain bg-black"
                  />

                  {/* Capture Button Overlay */}
                  <div className="absolute bottom-3 right-3 z-20">
                    <button
                      type="button"
                      onClick={handleCaptureFromScrubber}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#C65D45] hover:bg-[#D8684F] text-[#FFF9F2] text-xs font-bold transition-all shadow-lg active:scale-95 cursor-pointer"
                      title="Capture this video frame"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Capture This Moment</span>
                    </button>
                  </div>
                </div>

                {/* Scrubber Slider Controls */}
                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => stepTime(-0.5)}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                    title="-0.5s backward"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <input
                    type="range"
                    min="0"
                    max={duration || 10}
                    step="0.05"
                    value={scrubberTime}
                    onChange={handleScrubberChange}
                    className="w-full h-2 accent-[#C65D45] bg-white/20 rounded-lg cursor-pointer"
                  />

                  <button
                    type="button"
                    onClick={() => stepTime(0.5)}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                    title="+0.5s forward"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ── SECTION 3: UPLOAD ALTERNATIVE POSTER IMAGE ────────────── */}
          <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-white/60">
              <span>Or upload your own designed poster image (JPG, PNG):</span>
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-white/90 cursor-pointer border border-white/15 transition-colors"
            >
              <Upload className="w-3.5 h-3.5 text-[#C65D45]" />
              <span>Upload Custom Image</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCustomImageUpload}
            />
          </div>
        </div>

        {/* Modal Footer Bar */}
        <div className="px-5 sm:px-7 py-4 border-t border-white/10 bg-[#1B110B] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center gap-3">
            {saveSuccess && (
              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-bold animate-in fade-in">
                <Check className="w-4 h-4" />
                Thumbnail Saved!
              </span>
            )}

            <button
              type="button"
              disabled={!selectedFrame || isSaving}
              onClick={handleSave}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-xl ${
                selectedFrame && !isSaving
                  ? 'bg-gradient-to-r from-[#C65D45] to-[#E2725B] text-[#FFF9F2] hover:brightness-110 active:scale-95'
                  : 'bg-white/10 text-white/40 cursor-not-allowed'
              }`}
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>Set as Active Thumbnail</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
