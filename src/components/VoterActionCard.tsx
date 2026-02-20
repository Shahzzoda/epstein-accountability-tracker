'use client';

import { useEffect, useState } from 'react';

interface PollingAddress {
  locationName?: string;
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  zip?: string;
}

interface PollingLocation {
  address?: PollingAddress;
  name?: string;
  pollingHours?: string;
}

interface CivicElection {
  id: string;
  name: string;
  electionDay: string;
}

interface CivicData {
  election?: CivicElection | null;
  upcomingElections?: CivicElection[];
  pollingLocations?: PollingLocation[];
  earlyVoteSites?: PollingLocation[];
  registrationUrl?: string | null;
  votingLocationFinderUrl?: string | null;
  state?: string | null;
}

interface VoterActionCardProps {
  stateCode: string;
}

function formatElectionDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatSiteAddress(loc: PollingLocation): string {
  const a = loc.address;
  if (!a) return loc.name ?? 'Unknown location';
  const parts: string[] = [];
  if (a.locationName) parts.push(a.locationName);
  if (a.line1) parts.push(a.line1);
  const cityLine = [a.city, a.state, a.zip].filter(Boolean).join(', ');
  if (cityLine) parts.push(cityLine);
  return parts.join(' · ');
}

export default function VoterActionCard({ stateCode }: VoterActionCardProps) {
  const [civicData, setCivicData] = useState<CivicData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      // Read coords saved by the "Find my lawmakers" button on the home page
      let coords: { lat: number; lon: number } | null = null;
      try {
        const saved = localStorage.getItem('userCoords');
        if (saved) coords = JSON.parse(saved) as { lat: number; lon: number };
      } catch {
        // ignore
      }

      // Fall back to requesting geolocation if not cached
      if (!coords && typeof navigator !== 'undefined' && navigator.geolocation) {
        coords = await new Promise<{ lat: number; lon: number } | null>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
            () => resolve(null),
            { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
          );
        });
      }

      try {
        const params = new URLSearchParams({ state: stateCode });
        if (coords) {
          params.set('lat', String(coords.lat));
          params.set('lon', String(coords.lon));
        } else {
          // No coords but we still want the registration URL; pass a dummy lat/lon
          // The API gracefully handles this by returning static state data
          setLoading(false);
          setCivicData({ registrationUrl: null }); // will use static fallback in render
          return;
        }
        const res = await fetch(`/api/civic?${params}`);
        if (res.ok) {
          setCivicData(await res.json() as CivicData);
        }
      } catch {
        // non-fatal — show static links below
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [stateCode]);

  const allSites: PollingLocation[] = [
    ...(civicData?.pollingLocations ?? []),
    ...(civicData?.earlyVoteSites ?? []),
  ].slice(0, 5);

  const registrationUrl = civicData?.registrationUrl ?? `https://www.vote.org/register-to-vote/`;
  const pollingFinderUrl = civicData?.votingLocationFinderUrl ?? 'https://www.vote.org/polling-place-locator/';

  // All upcoming elections to display (deduplicate primary vs list)
  const primaryElection = civicData?.election ?? null;
  const otherElections = (civicData?.upcomingElections ?? []).filter(
    (e) => e.id !== primaryElection?.id
  );

  return (
    <section className="rounded-xl border border-[var(--border)] bg-white p-5 sm:p-6 space-y-5">
      <div>
        <h2 className="text-2xl font-semibold leading-tight text-slate-900 sm:text-3xl">
          Vote Them Out — Start with the Primary
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-700">
          Primary elections are often the most effective way to replace a lawmaker you disagree with.
          Turnout is far lower than general elections — which means each vote carries more weight.
          A challenger backed by engaged constituents can unseat an incumbent even in a district that
          usually leans the other way. But only if voters show up.
        </p>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-b-2 border-[var(--brand-blue)]" />
          Loading election info for {stateCode}&hellip;
        </div>
      )}

      {/* Election dates */}
      {!loading && primaryElection && (
        <div className="rounded-lg border border-[var(--border)] bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Next Election</p>
          <p className="mt-1 text-base font-bold text-slate-900">{primaryElection.name}</p>
          <p className="mt-0.5 text-sm font-semibold text-[var(--brand-blue)]">
            {formatElectionDate(primaryElection.electionDay)}
          </p>
        </div>
      )}

      {!loading && otherElections.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Also Upcoming</p>
          <ul className="space-y-1">
            {otherElections.map((e) => (
              <li key={e.id} className="flex items-baseline gap-2 text-sm text-slate-700">
                <span className="shrink-0 font-bold text-[var(--brand-blue)]">→</span>
                <span>
                  <span className="font-semibold">{e.name}</span>
                  {' '}
                  <span className="text-slate-500">{formatElectionDate(e.electionDay)}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Polling sites — only shown when the Civic API has loaded them (near election day) */}
      {!loading && allSites.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
            Your Nearest Polling Sites
          </p>
          <ul className="space-y-2">
            {allSites.map((site, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                <span className="mt-0.5 shrink-0 font-bold text-[var(--brand-blue)]">→</span>
                <span>
                  {formatSiteAddress(site)}
                  {site.pollingHours ? (
                    <span className="ml-1 text-slate-500">· {site.pollingHours}</span>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action links — always shown */}
      <div className="grid gap-3 sm:grid-cols-2">
        <a
          href={registrationUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg border border-[var(--border)] bg-slate-50 p-3 text-sm font-semibold text-[var(--brand-blue)] hover:underline"
        >
          Register to vote in {stateCode} →
        </a>
        <a
          href={pollingFinderUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg border border-[var(--border)] bg-slate-50 p-3 text-sm font-semibold text-[var(--brand-blue)] hover:underline"
        >
          Find your polling place →
        </a>
      </div>
    </section>
  );
}
