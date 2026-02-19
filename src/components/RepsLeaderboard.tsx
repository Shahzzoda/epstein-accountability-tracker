'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import LegislatorAvatar from '@/components/LegislatorAvatar';
import { calculateEpsteinScore } from '@/lib/scoring';

interface Term {
  type: string;
  state: string;
  district?: number;
  party: string;
}

interface Legislator {
  id: {
    bioguide: string;
  };
  name: {
    official_full: string;
  };
  terms: Term[];
}

interface ScoreEntry {
  score?: number;
  status?: string;
  summary?: string;
  epstein_transparency_act?: {
    sponsored?: boolean;
    cosponsored?: boolean;
    cosponsored_date?: string | null;
    signed?: 'yes' | 'no' | boolean | string;
    discharge_petition?: {
      signed?: boolean;
      date?: string | null;
    } | 'NOT_APPLICABLE';
  };
}

interface ScoreFile {
  scores?: Record<string, ScoreEntry>;
  default?: ScoreEntry;
}

interface LeaderboardRow {
  bioguide: string;
  name: string;
  party: string;
  state: string;
  points: number;
}

const STATE_NAMES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California', CO: 'Colorado', CT: 'Connecticut',
  DE: 'Delaware', FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana',
  IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts',
  MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada',
  NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota',
  OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
  SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia', WA: 'Washington',
  WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming', DC: 'District of Columbia'
};

const SORT_STORAGE_KEY = 'leaderboard_sort_ascending';

export default function RepsLeaderboard() {
  const router = useRouter();
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortAscending, setSortAscending] = useState(false);
  const [searchDraft, setSearchDraft] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const savedSort = window.localStorage.getItem(SORT_STORAGE_KEY);
    if (savedSort === 'true') {
      setSortAscending(true);
    } else if (savedSort === 'false') {
      setSortAscending(false);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(SORT_STORAGE_KEY, String(sortAscending));
  }, [sortAscending]);

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        const [legRes, scoreRes] = await Promise.all([
          fetch('/data/legislators/current_legislators.json'),
          fetch('/data/epstein_scores.json')
        ]);

        if (!legRes.ok) {
          throw new Error('Failed to load legislator data');
        }

        const legislators = (await legRes.json()) as Legislator[];
        const scoreFile = (scoreRes.ok ? await scoreRes.json() : null) as ScoreFile | null;

        const leaderboard = legislators
          .map((legislator) => {
            const currentTerm = legislator.terms[legislator.terms.length - 1];
            if (!currentTerm || (currentTerm.type !== 'rep' && currentTerm.type !== 'sen')) return null;

            const scoreData = scoreFile?.scores?.[legislator.id.bioguide] || scoreFile?.default;
            const calculated = calculateEpsteinScore(scoreData);

            return {
              bioguide: legislator.id.bioguide,
              name: legislator.name?.official_full?.trim() || `Unknown (${legislator.id.bioguide})`,
              party: currentTerm.party,
              state: currentTerm.state,
              points: calculated.score
            } satisfies LeaderboardRow;
          })
          .filter((entry): entry is LeaderboardRow => entry !== null);

        setRows(leaderboard);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to load leaderboard';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    loadLeaderboard();
  }, []);

  const sortedRows = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const filtered = normalizedSearch
      ? rows.filter((row) => {
          return (
            row.name.toLowerCase().includes(normalizedSearch) ||
            row.party.toLowerCase().includes(normalizedSearch) ||
            row.state.toLowerCase().includes(normalizedSearch)
          );
        })
      : rows;

    return [...filtered].sort((a, b) => {
      if (sortAscending) {
        return a.points - b.points || a.name.localeCompare(b.name);
      }
      return b.points - a.points || a.name.localeCompare(b.name);
    });
  }, [rows, sortAscending, searchTerm]);

  return (
    <section className="fade-up" aria-label="Representatives leaderboard">
      <div className="mb-4 flex items-center justify-between gap-3">
        <form
          className="flex min-w-0 flex-1 items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            setSearchTerm(searchDraft);
          }}
        >
          <input
            type="text"
            value={searchDraft}
            onChange={(event) => setSearchDraft(event.target.value)}
            placeholder="Search name, party, state"
            className="w-full max-w-sm rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[var(--brand-blue)]"
          />
          <button
            type="submit"
            aria-label="Search leaderboard"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-slate-300 text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
          >
            <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 fill-current">
              <path d="M8.5 2a6.5 6.5 0 015.14 10.48l3.94 3.95a1 1 0 01-1.42 1.41l-3.94-3.94A6.5 6.5 0 118.5 2zm0 2a4.5 4.5 0 100 9 4.5 4.5 0 000-9z" />
            </svg>
          </button>
        </form>

        <div className="flex shrink-0 items-center gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Showing {sortedRows.length} of {rows.length}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-8">
          <div className="h-9 w-9 animate-spin rounded-full border-b-2 border-[var(--brand-blue)]" />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[var(--border)] bg-white">
          <table className="w-full min-w-[700px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left uppercase tracking-wide text-slate-500">
                <th className="px-3 py-2 font-semibold">Name</th>
                <th className="px-3 py-2 font-semibold">Party</th>
                <th className="px-3 py-2 font-semibold">State</th>
                <th className="px-3 py-2 font-semibold">
                  <button
                    type="button"
                    onClick={() => setSortAscending((current) => !current)}
                    className="inline-flex items-center gap-1 text-slate-500 transition hover:text-slate-700"
                    aria-label={sortAscending ? 'Sort points high to low' : 'Sort points low to high'}
                  >
                    <span>Points</span>
                    <svg viewBox="0 0 10 10" aria-hidden="true" className={`h-2.5 w-2.5 fill-current transition-transform ${sortAscending ? 'rotate-180' : ''}`}>
                      <path d="M5 1l4 6H1l4-6z" />
                    </svg>
                  </button>
                </th>
                <th className="px-3 py-2 font-semibold">Report</th>
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((row) => {
                const scoreColor = row.points > 3.0 ? 'text-emerald-700' : row.points > 2.0 ? 'text-amber-700' : 'text-rose-700';
                return (
                <tr
                  key={row.bioguide}
                  className="cursor-pointer border-b border-slate-200 last:border-b-0 hover:bg-slate-50 focus-within:bg-slate-50"
                  role="link"
                  tabIndex={0}
                  aria-label={`Open report for ${row.name}`}
                  onClick={() => router.push(`/report/${row.bioguide}`)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      router.push(`/report/${row.bioguide}`);
                    }
                  }}
                >
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                        <LegislatorAvatar
                          bioguide={row.bioguide}
                          alt={row.name}
                          width={40}
                          height={40}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <span className="font-medium text-slate-900">{row.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-slate-700">{row.party}</td>
                  <td className="px-3 py-3 text-slate-700" title={STATE_NAMES[row.state] || row.state}>
                    {row.state}
                  </td>
                  <td className="px-3 py-3">
                    <span className={`text-lg font-black ${scoreColor}`}>{row.points.toFixed(1)}</span>
                    <span className="ml-0.5 text-xs font-semibold text-slate-400">/5</span>
                  </td>
                  <td className="px-3 py-3">
                    <Link
                      href={`/report/${row.bioguide}`}
                      className="inline-flex items-center justify-center rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
                    >
                      View report
                    </Link>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
