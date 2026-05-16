import React, { useState } from 'react';
import { Music } from 'lucide-react';
import { coverUrl } from '../config';

function AlbumArt({ mediaRef, filename, size = 'md', className = '' }) {
  const ref = mediaRef || filename;
  const [failed, setFailed] = useState(false);

  const sizes = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-16 h-16',
    xl: 'w-48 h-48',
  };

  const iconSizes = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-7 h-7',
    xl: 'w-16 h-16',
  };

  const src = ref && !failed ? coverUrl(ref) : null;

  return (
    <div
      className={`${sizes[size]} flex-shrink-0 overflow-hidden bg-onyx-panel border border-onyx-border flex items-center justify-center ${className}`}
    >
      {src ? (
        <img
          key={ref}
          src={src}
          alt=""
          className="w-full h-full object-cover"
          onError={() => setFailed(true)}
          loading="lazy"
        />
      ) : (
        <Music className={`${iconSizes[size]} text-onyx-muted`} />
      )}
    </div>
  );
}

export default AlbumArt;
