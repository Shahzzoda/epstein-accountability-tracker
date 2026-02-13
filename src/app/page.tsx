'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

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
    <main className="startup-shell min-h-screen p-6 text-[var(--ink)]">
      <section className="mx-auto grid w-full max-w-6xl items-start gap-8 py-10 lg:grid-cols-[1.2fr_0.8fr] lg:py-14">
        <div className="fade-up space-y-5">
          <h1 className="text-4xl leading-tight sm:text-5xl lg:text-6xl">
            Accountability for the Epstein case: <span className="text-[var(--brand-blue)]">Find your rep.</span> Verify the record.
          </h1>
          <p className="max-w-3xl text-base leading-relaxed text-slate-800 sm:text-lg">
            We track public-record actions on Epstein files by lawmaker, including recorded votes, bill sponsorships, cosponsorships, and discharge petition signatures, and we link every claim to a source from the House Clerk, Congress.gov, and discharge petition records so people can verify the record, check their district, and share what they find.
          </p>

          <div id="find-lawmakers" className="max-w-xl space-y-3 pt-1">
            <button
              onClick={handleFindReps}
              disabled={loading}
              className="rounded-lg bg-[var(--brand-blue)] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#0d2f59] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Locating your district...' : 'Find my lawmakers'}
            </button>
            {error && (
              <p className="rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-700">{error}</p>
            )}
            <p className="pt-1 text-sm leading-relaxed text-slate-700">
              Location is used only to map your district for this session. We do not store precise coordinates.
            </p>
          </div>
        </div>

        <div className="fade-up space-y-4 lg:pt-3">
          <div className="rounded-xl border border-[var(--border)] bg-white p-5 shadow-sm">
            <div className="space-y-3">
              <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-slate-50">
                <Image
                  src="/transparency-docs.svg"
                  alt="Transparency records preview"
                  width={900}
                  height={900}
                  className="h-auto w-full object-cover"
                />
              </div>
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-[var(--brand-blue)]">
                  <Link href="/report/R000606" className="hover:underline">
                    View an example profile
                  </Link>
                  <span className="text-slate-400">•</span>
                  <Link href="/epstein-files" className="hover:underline">
                    Sources &amp; Method
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
