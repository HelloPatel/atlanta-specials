import { useEffect, useState } from 'react';
import { Play } from 'lucide-react';

/**
 * Reusable video component with autoplay, fallback image, and YouTube support
 * Supports: MP4 files, YouTube URLs, GIF placeholders
 */
export default function VideoEmbed({
  src,
  fallbackImage,
  title = 'Video',
  autoplay = true,
  muted = true,
  loop = true,
  controls = false,
  className = '',
  aspectRatio = 'video',
  playButtonOverlay = false,
}) {
  const [isYouTube, setIsYouTube] = useState(false);
  const [youtubeId, setYoutubeId] = useState(null);
  const [videoError, setVideoError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(autoplay);

  useEffect(() => {
    if (!src) return;

    // Check if it's a YouTube URL
    const youtubeRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/;
    const match = src.match(youtubeRegex);
    if (match) {
      setIsYouTube(true);
      setYoutubeId(match[1]);
    }
  }, [src]);

  if (!src && !fallbackImage) {
    return (
      <div className={`bg-gray-200 flex items-center justify-center ${className}`}>
        <p className="text-gray-500 text-sm">No media available</p>
      </div>
    );
  }

  const aspectRatioClass = {
    video: 'aspect-video',
    square: 'aspect-square',
    '3/2': 'aspect-[3/2]',
    '4/3': 'aspect-[4/3]',
  }[aspectRatio] || 'aspect-video';

  // YouTube embed
  if (isYouTube && youtubeId) {
    return (
      <div className={`${aspectRatioClass} rounded-lg overflow-hidden shadow-sm ${className}`}>
        <iframe
          title={title}
          width="100%"
          height="100%"
          src={`https://www.youtube.com/embed/${youtubeId}?autoplay=${autoplay ? 1 : 0}&mute=${muted ? 1 : 0}&loop=${loop ? 1 : 0}`}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        />
      </div>
    );
  }

  // Video file or fallback to image
  if (videoError || (!src && fallbackImage)) {
    return (
      <div
        className={`${aspectRatioClass} rounded-lg overflow-hidden shadow-sm bg-gray-100 ${className}`}
        style={{ backgroundImage: `url(${fallbackImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        {playButtonOverlay && (
          <div className="w-full h-full flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors cursor-pointer">
            <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
              <Play size={32} className="text-wine-700 ml-1" />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`${aspectRatioClass} rounded-lg overflow-hidden shadow-sm relative group ${className}`}>
      <video
        title={title}
        width="100%"
        height="100%"
        autoPlay={autoplay}
        muted={muted}
        loop={loop}
        controls={controls}
        onError={() => setVideoError(true)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        poster={fallbackImage}
        className="w-full h-full object-cover"
      >
        <source src={src} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {playButtonOverlay && !isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors pointer-events-none">
          <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Play size={32} className="text-wine-700 ml-1" />
          </div>
        </div>
      )}
    </div>
  );
}
