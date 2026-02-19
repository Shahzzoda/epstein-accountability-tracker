import Link from 'next/link';
import type { Metadata } from 'next';
import RepsLeaderboard from '@/components/RepsLeaderboard';

export const metadata: Metadata = {
  title: 'Top Reps Leaderboard | Accountability Record',
  description: 'Compare representatives by their tracked Epstein-file disclosure actions and points.'
};

export default function LeaderboardPage() {
  return (
    <main className="startup-shell min-h-screen p-6">
      <section className="mx-auto w-full max-w-6xl py-8 sm:py-10">
        <div className="fade-up mb-6 space-y-2">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-3xl leading-tight text-slate-900 sm:text-4xl">Top-performing representatives</h1>
            <Link
              href="/#find-lawmakers"
              className="inline-flex shrink-0 items-center justify-center rounded-lg bg-[var(--brand-blue)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0d2f59]"
            >
              Find your rep
            </Link>
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--brand-blue)]">Nationwide Ranking</p>
          <p className="max-w-3xl text-sm leading-relaxed text-[var(--ink-soft)] sm:text-base">
            This leaderboard ranks House representatives by calculated points from tracked public-record actions.
          </p>
        </div>

        <RepsLeaderboard />
      </section>
    </main>
  );
}
