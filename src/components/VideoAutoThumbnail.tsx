import React, { useState, useRef, useEffect } from 'react';
import { isYouTubeUrl, getYouTubeThumbnail } from '../utils/videoUtils';

/**
 * VideoAutoThumbnail
 *
 * Ultra-fast, unzoomed thumbnail renderer:
 * 1. Renders high-quality static thumbnail with exact aspect ratio (0ms delay).
 * 2. If uploaded MP4 without thumbnail → automatically uses /uploads/xxx-cover.jpg.
 * 3. Never zooms or stretches: uses object-cover with centered alignment.
 * 4. Fallback video element loads frame-0 (#t=0.001) smoothly with dark skeleton shimmer.
 */
interface VideoAutoThumbnailProps {
  videoUrl: string;
  thumbnailUrl?: string | null;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
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

  // Derive static cover if uploaded MP4
  const derivedUploadCover =
    !thumbnailUrl && !isYt && videoUrl.startsWith('/uploads/') && videoUrl.endsWith('.mp4')
      ? videoUrl.replace(/\.mp4$/i, '-cover.jpg')
      : null;

  const resolvedThumb = thumbnailUrl || ytThumbnail || derivedUploadCover || null;

  const [imageSrc, setImageSrc] = useState<string | null>(resolvedThumb);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [imageFailed, setImageFailed] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Sync when props change
  useEffect(() => {
    const nextThumb = thumbnailUrl || ytThumbnail || derivedUploadCover || null;
    setImageSrc(nextThumb);
    setImageFailed(false);
    setIsLoaded(false);
  }, [thumbnailUrl, videoUrl, ytThumbnail, derivedUploadCover]);

  // Video fallback when no static image exists or image failed to load
  useEffect(() => {
    if (imageSrc && !imageFailed) return;
    if (isYt || !videoRef.current) return;

    const video = videoRef.current;
    let isCancelled = false;

    const onData = () => {
      if (!isCancelled) {
        setIsLoaded(true);
      }
    };

    video.addEventListener('loadeddata', onData);
    video.addEventListener('seeked', onData);

    return () => {
      isCancelled = true;
      video.removeEventListener('loadeddata', onData);
      video.removeEventListener('seeked', onData);
    };
  }, [imageSrc, imageFailed, isYt, videoUrl]);

  return (
    <div className={`relative w-full h-full overflow-hidden bg-black ${className}`} style={style}>
      {/* Sleek Skeleton Pulse while loading */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-[#121216] animate-pulse flex items-center justify-center pointer-events-none z-0">
          <div className="w-8 h-8 rounded-full border border-white/10 bg-white/5 flex items-center justify-center opacity-30">
            <div className="w-0 h-0 border-y-[5px] border-y-transparent border-l-[8px] border-l-white/60 ml-0.5" />
          </div>
        </div>
      )}

      {/* Primary Image View: Unzoomed, perfectly centered */}
      {imageSrc && !imageFailed ? (
        <img
          src={imageSrc}
          alt={alt}
          loading="eager"
          decoding="async"
          fetchPriority="high"
          onLoad={() => setIsLoaded(true)}
          onError={() => setImageFailed(true)}
          className={`w-full h-full object-cover object-center transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ) : (
        /* Video Fallback with Media Fragment for instant Frame 0 */
        <video
          ref={videoRef}
          src={videoUrl ? `${videoUrl}#t=0.001` : undefined}
          muted
          playsInline
          preload="metadata"
          onLoadedData={() => setIsLoaded(true)}
          className={`w-full h-full object-cover object-center transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
    </div>
  );
};
