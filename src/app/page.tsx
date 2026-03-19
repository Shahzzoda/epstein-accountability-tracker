'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import InteractiveMap from '@/components/InteractiveMap';
import RepsLeaderboard from '@/components/RepsLeaderboard';

interface AddressSuggestionProperties {
  name?: string;
  housenumber?: string;
  street?: string;
  city?: string;
  state?: string;
}

interface AddressSuggestion {
  properties: AddressSuggestionProperties;
}

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAddressInput, setShowAddressInput] = useState(false);
  const [address, setAddress] = useState('');
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Close suggestions if clicking outside could be added, but a simple implementation is enough.
  useEffect(() => {
    const handleClickOutside = () => setShowSuggestions(false);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

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

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setAddress(val);
    
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (!val.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    debounceTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(val)}&limit=5`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.features || []);
          setShowSuggestions(true);
        }
      } catch (err) {
        console.error('Error fetching suggestions:', err);
      }
    }, 300);
  };

  const getSuggestionLabel = (p: AddressSuggestionProperties) => {
    const parts = [];
    if (p.name) parts.push(p.name);
    const houseAndStreet = [p.housenumber, p.street].filter(Boolean).join(' ');
    if (houseAndStreet && houseAndStreet !== p.name) parts.push(houseAndStreet);
    if (p.city) parts.push(p.city);
    if (p.state) parts.push(p.state);
    return parts.join(', ');
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/locate?address=${encodeURIComponent(address)}`);
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to locate district from address');
      }

      const data = await response.json();
      const district = data.district || '00';
      const stateFips = data.state || '00';
      router.push(`/results?district=${district}&stateFips=${stateFips}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred while locating you by address.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="startup-shell min-h-screen text-[var(--ink)]">
      <section className="mx-auto w-full max-w-none">
        <div className="fade-up civic-stage relative h-[calc(100dvh-3.5rem)]">
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
              Click anywhere on the map to open the district record. Every profile links to sources. Review our{' '}
              <Link href="/epstein-files" className="pointer-events-auto font-semibold text-[var(--brand-blue)] hover:underline">
                methods
              </Link>{' '}
              and learn more{' '}
              <Link href="/about" className="pointer-events-auto font-semibold text-[var(--brand-blue)] hover:underline">
                about
              </Link>{' '}
              the project.
            </p>
          </section>

          <section
            id="find-lawmakers"
            className="absolute bottom-2 left-1/2 z-20 flex w-[min(760px,92vw)] -translate-x-1/2 flex-col items-center gap-1.5 text-center text-slate-900 [text-shadow:0_1px_10px_rgba(255,255,255,0.9)] sm:bottom-5 sm:gap-2"
          >
            {!showAddressInput ? (
              <>
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
                <div className="pointer-events-auto text-xs font-semibold text-slate-800 sm:text-sm">
                  or{' '}
                  <button
                    onClick={() => setShowAddressInput(true)}
                    className="text-[var(--brand-blue)] underline decoration-[var(--brand-blue)] underline-offset-2 hover:text-[#0d2f59] hover:decoration-[#0d2f59]"
                  >
                    enter an address
                  </button>
                </div>
              </>
            ) : (
              <div
                className="relative flex w-full max-w-sm flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                <form onSubmit={handleAddressSubmit} className="pointer-events-auto flex w-full items-center gap-2 bg-white/80 p-2 rounded-lg shadow-sm backdrop-blur-sm relative z-30">
                  <input
                    type="text"
                    placeholder="Enter your address..."
                    value={address}
                    onChange={handleAddressChange}
                    onFocus={() => {
                      if (suggestions.length > 0) setShowSuggestions(true);
                    }}
                    className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm shadow-inner outline-none focus:border-[var(--brand-blue)] focus:ring-1 focus:ring-[var(--brand-blue)] bg-white/90"
                    disabled={loading}
                    required
                  />
                  <button
                    type="submit"
                    disabled={loading || !address.trim()}
                    className="rounded-md bg-[var(--brand-blue)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0d2f59] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? 'Searching...' : 'Search'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddressInput(false);
                      setShowSuggestions(false);
                    }}
                    disabled={loading}
                    className="rounded-md px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200/80 disabled:opacity-50"
                    aria-label="Cancel address search"
                  >
                    Cancel
                  </button>
                </form>
                {showSuggestions && suggestions.length > 0 && (
                  <ul className="absolute bottom-full mb-1 w-full rounded-md bg-white py-1 shadow-[0_-4px_15px_-3px_rgba(0,0,0,0.1),0_-4px_6px_-4px_rgba(0,0,0,0.1)] pointer-events-auto max-h-60 overflow-y-auto z-[100] text-left border border-slate-200">
                    {suggestions.map((s, i) => {
                      const label = getSuggestionLabel(s.properties);
                      return (
                        <li 
                          key={i} 
                          className="cursor-pointer px-3 py-2 text-sm hover:bg-slate-100 text-slate-700 border-b border-slate-100 last:border-0"
                          onClick={() => {
                            setAddress(label);
                            setShowSuggestions(false);
                          }}
                        >
                          {label}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}
            {error && (
              <p className="text-sm font-semibold text-red-700">{error}</p>
            )}
          </section>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
        <div className="mb-6 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--brand-blue)]">Nationwide Ranking</p>
          <h2 className="text-3xl leading-tight text-slate-900 sm:text-4xl">Top-performing representatives</h2>
          <p className="max-w-3xl text-sm leading-relaxed text-[var(--ink-soft)] sm:text-base">
            This leaderboard ranks House representatives by calculated points from tracked public-record actions.
          </p>
        </div>

        <RepsLeaderboard />
      </section>
    </main>
  );
}
