import React, { useState, useRef, useEffect } from 'react';
import { isYouTubeUrl, getYouTubeThumbnail } from '../utils/videoUtils';

/**
 * VideoAutoThumbnail
 *
 * Super-fast thumbnail renderer for video cards:
 * 1. If thumbnailUrl is provided → renders an optimized <img> tag (loads in <50ms).
 * 2. If YouTube URL → renders official high-quality YouTube thumbnail image.
 * 3. If uploaded MP4 (/uploads/...) → automatically falls back to /uploads/xxx-thumb.jpg.
 * 4. In-memory & sessionStorage caching: Once a frame/thumbnail is resolved, subsequent
 *    views load in 0ms directly from cache.
 * 5. Native video fallback with instant frame-0 (#t=0.001) decode & auto-canvas caching.
 * 6. Includes a sleek dark shimmer skeleton so users never see an empty black box.
 */
interface VideoAutoThumbnailProps {
  videoUrl: string;
  thumbnailUrl?: string | null;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
}

// In-memory cache for the entire session
const inMemoryCache = new Map<string, string>();

function getCachedThumb(url: string): string | null {
  if (!url) return null;
  if (inMemoryCache.has(url)) return inMemoryCache.get(url)!;
  try {
    const stored = sessionStorage.getItem(`thumb_${url}`);
    if (stored) {
      inMemoryCache.set(url, stored);
      return stored;
    }
  } catch {
    // Ignore storage errors in private browsing
  }
  return null;
}

function setCachedThumb(url: string, thumbUrl: string) {
  if (!url || !thumbUrl) return;
  inMemoryCache.set(url, thumbUrl);
  try {
    sessionStorage.setItem(`thumb_${url}`, thumbUrl);
  } catch {
    // Ignore storage quota errors
  }
}

export const VideoAutoThumbnail: React.FC<VideoAutoThumbnailProps> = ({
  videoUrl,
  thumbnailUrl,
  alt,
  className = '',
  style,
}) => {
  const isYt = isYouTubeUrl(videoUrl);
  const ytThumbnail = isYt ? getYouTubeThumbnail(videoUrl) : null;

  // Derive static thumb if uploaded MP4
  const derivedUploadThumb =
    !thumbnailUrl && !isYt && videoUrl.startsWith('/uploads/') && videoUrl.endsWith('.mp4')
      ? videoUrl.replace(/\.mp4$/i, '-thumb.jpg')
      : null;

  const cached = getCachedThumb(videoUrl);

  const initialThumb = thumbnailUrl || ytThumbnail || derivedUploadThumb || cached;
  const [imageSrc, setImageSrc] = useState<string | null>(initialThumb);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [imageFailed, setImageFailed] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Sync when props change
  useEffect(() => {
    const freshThumb = thumbnailUrl || ytThumbnail || derivedUploadThumb || getCachedThumb(videoUrl);
    setImageSrc(freshThumb);
    setImageFailed(false);
  }, [thumbnailUrl, videoUrl, ytThumbnail, derivedUploadThumb]);

  // Video frame extraction fallback if no static image is available or image failed
  useEffect(() => {
    if (imageSrc && !imageFailed) return;
    if (isYt || !videoRef.current) return;

    const video = videoRef.current;
    let isCancelled = false;

    const captureFrame = () => {
      if (isCancelled) return;
      try {
        if (video.videoWidth > 0 && video.videoHeight > 0) {
          const canvas = document.createElement('canvas');
          canvas.width = Math.min(video.videoWidth, 640);
          canvas.height = Math.round((canvas.width * video.videoHeight) / video.videoWidth);
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
            setCachedThumb(videoUrl, dataUrl);
            setImageSrc(dataUrl);
            setImageFailed(false);
          }
        }
      } catch {
        // Fallback silently
      }
    };

    video.addEventListener('loadeddata', captureFrame);
    video.addEventListener('seeked', captureFrame);

    return () => {
      isCancelled = true;
      video.removeEventListener('loadeddata', captureFrame);
      video.removeEventListener('seeked', captureFrame);
    };
  }, [imageSrc, imageFailed, isYt, videoUrl]);

  return (
    <div className={`relative w-full h-full overflow-hidden bg-[#111118] ${className}`} style={style}>
      {/* Sleek Skeleton Pulse until loaded */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-neutral-900/80 animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border border-white/10 bg-white/5 flex items-center justify-center opacity-40">
            <div className="w-0 h-0 border-y-[5px] border-y-transparent border-l-[8px] border-l-white/60 ml-0.5" />
          </div>
        </div>
      )}

      {/* Primary Image View */}
      {imageSrc && !imageFailed ? (
        <img
          src={imageSrc}
          alt={alt}
          loading="eager"
          decoding="async"
          fetchPriority="high"
          onLoad={() => setIsLoaded(true)}
          onError={() => {
            // If derived thumbnail failed to load, fall back to native video frame
            setImageFailed(true);
          }}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ) : (
        /* Video Frame Fallback with Media Fragment for instant Frame 0 seek */
        <video
          ref={videoRef}
          src={videoUrl ? `${videoUrl}#t=0.001` : undefined}
          muted
          playsInline
          preload="metadata"
          onLoadedData={() => setIsLoaded(true)}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
    </div>
  );
};
