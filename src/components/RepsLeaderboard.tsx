'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
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

const MAX_ROWS = 15;

export default function RepsLeaderboard() {
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
            if (!currentTerm || currentTerm.type !== 'rep') return null;

            const scoreData = scoreFile?.scores?.[legislator.id.bioguide] || scoreFile?.default;
            const calculated = calculateEpsteinScore(scoreData);

            return {
              bioguide: legislator.id.bioguide,
              name: legislator.name.official_full,
              party: currentTerm.party,
              state: currentTerm.state,
              points: calculated.score
            } satisfies LeaderboardRow;
          })
          .filter((entry): entry is LeaderboardRow => entry !== null)
          .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name))
          .slice(0, MAX_ROWS);

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

  return (
    <section className="section-card fade-up rounded-xl p-5 sm:p-6" aria-labelledby="reps-leaderboard-heading">
      <div className="mb-4 flex items-center justify-between">
        <h2 id="reps-leaderboard-heading" className="text-2xl text-slate-900">
          Top reps leaderboard
        </h2>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Nationwide</p>
      </div>

      {loading ? (
        <div className="flex justify-center p-8">
          <div className="h-9 w-9 animate-spin rounded-full border-b-2 border-[var(--brand-blue)]" />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left uppercase tracking-wide text-slate-500">
                <th className="px-3 py-2 font-semibold">Name</th>
                <th className="px-3 py-2 font-semibold">Party</th>
                <th className="px-3 py-2 font-semibold">State</th>
                <th className="px-3 py-2 font-semibold">Points</th>
                <th className="px-3 py-2 font-semibold">Report</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.bioguide} className="border-b border-slate-200 last:border-b-0">
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
                  <td className="px-3 py-3 text-slate-700">{row.state}</td>
                  <td className="px-3 py-3 text-slate-900">{row.points.toFixed(1)}</td>
                  <td className="px-3 py-3">
                    <Link
                      href={`/report/${row.bioguide}`}
                      className="inline-flex items-center justify-center rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
                    >
                      View report
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
