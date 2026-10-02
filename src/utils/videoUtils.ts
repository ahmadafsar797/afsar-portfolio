/**
 * Utility functions for handling video URLs (YouTube, MP4, etc.)
 */

/**
 * Extracts YouTube video ID from various URL formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://m.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 */
export function getYouTubeId(url?: string | null): string | null {
  if (!url || typeof url !== 'string') return null;
  const cleanUrl = url.trim();
  const regExp = /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/;
  const match = cleanUrl.match(regExp);
  return match ? match[1] : null;
}

/**
 * Checks whether a given URL is a YouTube video link.
 */
export function isYouTubeUrl(url?: string | null): boolean {
  return Boolean(getYouTubeId(url));
}

/**
 * Returns a high quality thumbnail image URL for a YouTube video.
 * Uses hqdefault.jpg which is guaranteed to exist for all YouTube videos.
 */
export function getYouTubeThumbnail(url?: string | null): string | null {
  const id = getYouTubeId(url);
  if (!id) return null;
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
}

/**
 * Returns an embeddable YouTube player URL with customized playback parameters.
 */
export function getYouTubeEmbedUrl(url?: string | null, autoplay = true): string | null {
  const id = getYouTubeId(url);
  if (!id) return null;
  const params = new URLSearchParams({
    autoplay: autoplay ? '1' : '0',
    rel: '0',
    modestbranding: '1',
    playsinline: '1',
    enablejsapi: '1',
  });
  return `https://www.youtube-nocookie.com/embed/${id}?${params.toString()}`;
}
