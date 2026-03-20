'use client';

import { useEffect, useState } from 'react';
import NextImage from 'next/image';

interface LegislatorAvatarProps {
  bioguide: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
}

const FALLBACK_SRC = '/placeholder-avatar.svg';
const loadedImageCache = new Set<string>();
const missingImageCache = new Set<string>();

function buildCongressImageUrl(bioguide: string) {
  return `https://raw.githubusercontent.com/unitedstates/images/master/congress/225x275/${bioguide}.jpg`;
}

export default function LegislatorAvatar({ bioguide, alt, width, height, className }: LegislatorAvatarProps) {
  const primarySrc = buildCongressImageUrl(bioguide);
  const [loadedSrc, setLoadedSrc] = useState<string | null>(() => (loadedImageCache.has(primarySrc) ? primarySrc : null));
  const src = loadedImageCache.has(primarySrc) || loadedSrc === primarySrc ? primarySrc : FALLBACK_SRC;

  useEffect(() => {
    if (loadedImageCache.has(primarySrc) || missingImageCache.has(primarySrc)) {
      return;
    }

    let cancelled = false;
    const probe = new window.Image();
    probe.decoding = 'async';
    probe.referrerPolicy = 'no-referrer';

    probe.onload = () => {
      if (cancelled) {
        return;
      }

      loadedImageCache.add(primarySrc);
      missingImageCache.delete(primarySrc);
      setLoadedSrc(primarySrc);
    };

    probe.onerror = () => {
      if (cancelled) {
        return;
      }

      missingImageCache.add(primarySrc);
      loadedImageCache.delete(primarySrc);
      setLoadedSrc(current => (current === primarySrc ? null : current));
    };

    probe.src = primarySrc;

    return () => {
      cancelled = true;
      probe.onload = null;
      probe.onerror = null;
    };
  }, [primarySrc]);

  return (
    <NextImage
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={() => {
        missingImageCache.add(primarySrc);
        loadedImageCache.delete(primarySrc);
        setLoadedSrc(current => (current === primarySrc ? null : current));
      }}
    />
  );
}
