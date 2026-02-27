'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import InteractiveMap from '@/components/InteractiveMap';

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFindReps = () => {
    setLoading(true);
    setError('');

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          localStorage.setItem('userCoords', JSON.stringify({ lat: latitude, lon: longitude }));
        } catch {
          // localStorage may be unavailable in some contexts
        }

        try {
          const response = await fetch(`/api/locate?lat=${latitude}&lon=${longitude}`);
          if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || 'Failed to locate district');
          }

          const data = await response.json();
          const district = data.district || '00';
          const stateFips = data.state || '00';
          router.push(`/results?district=${district}&stateFips=${stateFips}`);
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'An error occurred while locating you.';
          setError(message);
        } finally {
          setLoading(false);
        }
      },
      () => {
        setError('Unable to retrieve your location. Please allow location access.');
        setLoading(false);
      }
    );
  };

  return (
    <main className="startup-shell h-[calc(100dvh-3.5rem)] overflow-hidden text-[var(--ink)]">
      <section className="mx-auto h-full w-full max-w-none">
        <div className="fade-up civic-stage relative h-full">
          <div className="map-zone h-full">
            <InteractiveMap />
          </div>

          <section
            className="pointer-events-none absolute left-1/2 top-2 z-20 w-[min(760px,92vw)] -translate-x-1/2 space-y-1.5 text-center text-slate-900 [text-shadow:0_1px_10px_rgba(255,255,255,0.9)] sm:top-4 sm:space-y-2"
          >
            <h1 className="text-2xl leading-tight sm:text-4xl lg:text-5xl">
              How&apos;s your district doing to push for Epstein Investigation?
            </h1>
            <p className="mx-auto max-w-2xl text-xs leading-relaxed sm:text-base">
              Click anywhere on the map to open the district record. Every profile links to sources. Start with an{' '}
              <Link href="/report/R000606" className="pointer-events-auto font-semibold text-[var(--brand-blue)] hover:underline">
                example
              </Link>{' '}
              or review{' '}
              <Link href="/epstein-files" className="pointer-events-auto font-semibold text-[var(--brand-blue)] hover:underline">
                methods
              </Link>
              .
            </p>
          </section>

          <section
            id="find-lawmakers"
            className="absolute bottom-2 left-1/2 z-20 flex w-[min(760px,92vw)] -translate-x-1/2 flex-col items-center gap-1.5 text-center text-slate-900 [text-shadow:0_1px_10px_rgba(255,255,255,0.9)] sm:bottom-5 sm:gap-2"
          >
            <button
              onClick={handleFindReps}
              disabled={loading}
              className="pointer-events-auto inline-flex items-center gap-2 rounded-md bg-[var(--brand-blue)] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0d2f59] disabled:cursor-not-allowed disabled:opacity-60 sm:px-7 sm:py-3"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 21s-6-5.2-6-10a6 6 0 1 1 12 0c0 4.8-6 10-6 10z" />
                <circle cx="12" cy="11" r="2.2" />
              </svg>
              {loading ? 'Locating your district...' : 'Use my location'}
            </button>
            {error && (
              <p className="text-sm font-semibold text-red-700">{error}</p>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
