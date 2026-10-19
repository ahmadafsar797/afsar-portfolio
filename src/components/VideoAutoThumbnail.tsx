import React, { useState, useRef, useEffect } from 'react';
import { isYouTubeUrl, getYouTubeThumbnail } from '../utils/videoUtils';

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
  const resolveThumbnail = () => {
    if (thumbnailUrl && thumbnailUrl.trim()) {
      return thumbnailUrl.trim();
    }
    if (isYouTubeUrl(videoUrl)) {
      return getYouTubeThumbnail(videoUrl);
    }
    if (videoUrl && videoUrl.includes('cloudinary.com')) {
      return videoUrl.replace(/\.[a-zA-Z0-9]+$/i, '.jpg');
    }
    if (videoUrl && videoUrl.startsWith('/uploads/') && videoUrl.endsWith('.mp4')) {
      return videoUrl.replace(/\.mp4$/i, '-cover.jpg');
    }
    return null;
  };

  const [imageSrc, setImageSrc] = useState<string | null>(resolveThumbnail());
  const [imageFailed, setImageFailed] = useState<boolean>(false);
  const [hasTriedFallback, setHasTriedFallback] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const nextThumb = resolveThumbnail();
    setImageSrc(nextThumb);
    setImageFailed(false);
    setHasTriedFallback(false);
  }, [thumbnailUrl, videoUrl]);

  const handleImageError = () => {
    if (videoUrl && videoUrl.includes('cloudinary.com') && !hasTriedFallback) {
      const directPoster = videoUrl.replace(/\.[a-zA-Z0-9]+$/i, '.jpg');
      if (directPoster !== imageSrc) {
        setHasTriedFallback(true);
        setImageSrc(directPoster);
        return;
      }
    }
    setImageFailed(true);
  };

  return (
    <div className={`relative w-full h-full overflow-hidden bg-black ${className}`} style={style}>
      {/* Primary Image View: Direct rendering without opacity-0 hiding */}
      {imageSrc && !imageFailed ? (
        <img
          ref={imgRef}
          src={imageSrc}
          alt={alt}
          loading="eager"
          decoding="async"
          fetchPriority="high"
          onError={handleImageError}
          className="w-full h-full object-cover object-center block"
        />
      ) : (
        /* Video Fallback with Media Fragment for instant Frame 0 */
        <video
          ref={videoRef}
          src={videoUrl ? `${videoUrl}#t=0.001` : undefined}
          muted
          playsInline
          preload="auto"
          className="w-full h-full object-cover object-center block"
        />
      )}
    </div>
  );
};
