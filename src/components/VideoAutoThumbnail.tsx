import React, { useRef, useEffect } from 'react';

/**
 * VideoAutoThumbnail
 *
 * - If thumbnailUrl is provided  → renders a normal <img> (fast, no cost).
 * - If thumbnailUrl is missing   → renders a <video> element with preload="metadata"
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

  useEffect(() => {
    // Only relevant when we're in "auto-frame" mode (no thumbnail supplied)
    if (thumbnailUrl || !videoRef.current) return;

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
  }, [videoUrl, thumbnailUrl]);

  if (thumbnailUrl) {
    return (
      <img
        src={thumbnailUrl}
        alt={alt}
        loading="lazy"
        className={className}
        style={style}
      />
    );
  }

  // No thumbnail — stream just the metadata to grab a frame
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
