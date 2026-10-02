import React, { useRef, useEffect } from 'react';
import { isYouTubeUrl, getYouTubeThumbnail } from '../utils/videoUtils';

/**
 * VideoAutoThumbnail
 *
 * - If thumbnailUrl is provided  → renders a normal <img> (fast, no cost).
 * - If videoUrl is a YouTube URL → renders YouTube thumbnail (hqdefault.jpg).
 * - If neither and is MP4/video  → renders a <video> element with preload="metadata"
 *   and seeks to a random frame (10 %–80 % of duration) so visitors always see
 *   a real frame instead of a blank/black box.
 */
interface VideoAutoThumbnailProps {
  videoUrl: string;
  thumbnailUrl?: string | null;
  alt: string;
  className?: string;
  /** Extra inline styles applied to both the img and video */
  style?: React.CSSProperties;
}

export const VideoAutoThumbnail: React.FC<VideoAutoThumbnailProps> = ({
  videoUrl,
  thumbnailUrl,
  alt,
  className = '',
  style,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const isYt = isYouTubeUrl(videoUrl);
  const ytThumbnail = isYt ? getYouTubeThumbnail(videoUrl) : null;

  // Resolve the best thumbnail image source
  const effectiveThumbnail = thumbnailUrl || ytThumbnail;

  useEffect(() => {
    // Only relevant when we're in "auto-frame" mode for native videos (no thumbnail supplied and not YouTube)
    if (effectiveThumbnail || isYt || !videoRef.current) return;

    const video = videoRef.current;

    const seekToRandomFrame = () => {
      if (video.duration && isFinite(video.duration)) {
        // Pick a random moment between 10 % and 80 % of the video
        const min = video.duration * 0.1;
        const max = video.duration * 0.8;
        video.currentTime = min + Math.random() * (max - min);
      }
    };

    video.addEventListener('loadedmetadata', seekToRandomFrame);
    return () => video.removeEventListener('loadedmetadata', seekToRandomFrame);
  }, [videoUrl, effectiveThumbnail, isYt]);

  if (effectiveThumbnail) {
    return (
      <img
        src={effectiveThumbnail}
        alt={alt}
        loading="lazy"
        className={className}
        style={style}
      />
    );
  }

  // Native video fallback — stream just the metadata to grab a frame
  return (
    <video
      ref={videoRef}
      src={videoUrl}
      muted
      playsInline
      preload="metadata"
      className={className}
      style={style}
    />
  );
};

