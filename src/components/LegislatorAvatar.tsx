'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

interface LegislatorAvatarProps {
  bioguide: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
}

const FALLBACK_SRC = '/placeholder-avatar.svg';

function buildCongressImageUrl(bioguide: string) {
  return `https://raw.githubusercontent.com/unitedstates/images/master/congress/225x275/${bioguide}.jpg`;
}

export default function LegislatorAvatar({ bioguide, alt, width, height, className }: LegislatorAvatarProps) {
  const primarySrc = buildCongressImageUrl(bioguide);
  const [src, setSrc] = useState(primarySrc);

  useEffect(() => {
    setSrc(primarySrc);
  }, [primarySrc]);

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={() => {
        if (src !== FALLBACK_SRC) {
          setSrc(FALLBACK_SRC);
        }
      }}
    />
  );
}
