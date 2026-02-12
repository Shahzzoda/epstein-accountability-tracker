import Image from 'next/image';
import Link from 'next/link';
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

interface ScoreData {
  score?: number;
  status?: string;
  notes?: string;
  epstein_transparency_act?: {
    sponsored?: boolean;
    cosponsored?: boolean;
    cosponsored_date?: string | null;
    signed?: 'yes' | 'no' | boolean | string;
    discharge_petition?: {
      signed?: boolean;
      date?: string | null;
    };
  };
}

interface RepCardProps {
  legislator: Legislator;
  scoreData?: ScoreData;
  districtLabel?: string;
  stateFips?: string;
  district?: string;
}

export default function RepCard({ legislator, scoreData, districtLabel, stateFips, district }: RepCardProps) {
  const currentTerm = legislator.terms[legislator.terms.length - 1];
  const isSenator = currentTerm.type === 'sen';

  const calculated = calculateEpsteinScore(scoreData);
  const score = calculated.score;
  const status = calculated.status;
  const notes = calculated.notes;

  const scoreColor = score >= 4 ? 'text-emerald-700' : score >= 3 ? 'text-emerald-600' : score > 2 ? 'text-amber-700' : 'text-rose-700';

  const imageUrl = `https://raw.githubusercontent.com/unitedstates/images/master/congress/225x275/${legislator.id.bioguide}.jpg`;

  return (
    <article className="border-b border-[var(--border)] py-6">
      <div className="grid gap-4 sm:grid-cols-[auto_1fr_auto_auto] sm:items-center">
        <div className="h-14 w-14 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
          <Image
            src={imageUrl}
            alt={legislator.name.official_full}
            width={56}
            height={56}
            className="h-full w-full object-cover"
            onError={(event) => {
              event.currentTarget.src = '/placeholder-avatar.svg';
            }}
          />
        </div>

        <div className="min-w-0">
          <h2 className="truncate text-xl text-slate-900">{legislator.name.official_full}</h2>
          <p className="text-sm uppercase tracking-wide text-slate-500">
            {isSenator ? `United States Senator (${currentTerm.state})` : `U.S. Representative (${currentTerm.state}-${currentTerm.district})`} · {currentTerm.party}
          </p>
          <p className="mt-1 text-sm text-slate-600 line-clamp-2">{notes}</p>
        </div>

        <div className="text-left sm:text-right">
          <p className={`text-3xl font-black ${scoreColor}`}>{score.toFixed(1)}</p>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{status}</p>
        </div>

        <Link
          href={{
            pathname: `/report/${legislator.id.bioguide}`,
            query: {
              districtLabel: districtLabel || '',
              stateFips: stateFips || '',
              district: district || ''
            }
          }}
          className="inline-flex items-center justify-center rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
        >
          See report
        </Link>
      </div>
    </article>
  );
}
