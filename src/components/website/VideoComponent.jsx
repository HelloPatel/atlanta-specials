import { useState } from 'react';
import { Play, AlertCircle } from 'lucide-react';

export function VideoPlayer({ 
  src, 
  poster, 
  autoplay = false, 
  loop = true, 
  muted = true, 
  controls = true,
  className = 'w-full rounded-lg',
}) {
  const [hasError, setHasError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(autoplay);

  if (hasError) {
    return (
      <div className={`${className} bg-gray-100 flex items-center justify-center min-h-[300px]`}>
        <div className="text-center">
          <AlertCircle className="mx-auto mb-2 text-gray-400" size={32} />
          <p className="text-sm text-gray-500">Video could not be loaded</p>
          {poster && <p className="text-xs text-gray-400 mt-1">Showing fallback image</p>}
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} relative bg-black overflow-hidden`}>
      <video
        src={src}
        poster={poster}
        autoPlay={autoplay}
        loop={loop}
        muted={muted}
        controls={controls}
        onError={() => setHasError(true)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        className="w-full h-full object-cover"
      />
      {!isPlaying && !controls && (
        <button
          onClick={() => setIsPlaying(true)}
          className="absolute inset-0 flex items-center justify-center hover:bg-black/40 transition-colors"
        >
          <Play size={48} className="text-white drop-shadow-lg" />
        </button>
      )}
    </div>
  );
}

export function YouTubeEmbed({ videoId, title = 'Video', className = 'w-full' }) {
  return (
    <div className={`${className} aspect-video`}>
      <iframe
        width="100%"
        height="100%"
        src={`https://www.youtube.com/embed/${videoId}?autoplay=0&controls=1`}
        title={title}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="rounded-lg"
      />
    </div>
  );
}

export function GIFPlaceholder({ src, alt = 'Demo GIF', className = 'w-full rounded-lg' }) {
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
    />
  );
}

export default VideoPlayer;
